'''
The MetaSteam python->js->python communication server
@module MetaSteamServer

For Reference see:
http://fragments.turtlemeat.com/pythonwebserver.php
https://docs.python.org/2/library/basehttpserver.html#BaseHTTPServer.HTTPServer
''' 

import sys
import os
import datetime
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
from SteamProfileScraper import SteamProfileScraper
from MultiplayerScraper import MultiplayerScraper
import threading
import cgi
import logging
import json


ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
allowedFiles = {}
continueRunning = True
#note: turn off with 'global continueRunning, continueRunning = False'

'''
@function close_server
@purpose changes the global loop condition to stop the servers infinite loop
'''
def close_server():
    logging.info( "Triggering Server Shutdown")
    global continueRunning
    continueRunning = False

'''
@function start_game
@purpose calls metasteam to start a game
@param appid the game id to start
'''
def start_game(appid):
    logging.info( "Triggering Game Start")
    if MetaSteamHandler.cmsi():
        MetaSteamHandler.metaSteamInstance.startGame(appid)
    else:
        logging.info("Instanceless call: StartGame: " + str(appid))
    return []
'''
@function save_json
@purpose calls metasteam to save modified json data about games
'''
def save_json():
    logging.info( "Triggering Json Save")
    if MetaSteamHandler.cmsi():
        MetaSteamHandler.metaSteamInstance.exportToJson()
    else:
        logging.info("Instanceless call: save_json")
    return []
'''
@function compare_to_user
@param username compare the operator of metasteam to the specified user
@todo
'''
def compare_to_user(username):
    logging.info( "TODO: allow comparison of user profiles")
    profileScraper = SteamProfileScraper(username)
    extractedInfo = profileScraper.scrape()
    return extractedInfo
    

def howManyPlaying(appidArrayString):
    extractedInfo = []
    try:
        appidArray = json.loads(appidArrayString)
        mps = MultiplayerScraper()
        extractedInfo = mps.scrape(appidArray)
    except Exception as e:
        logging.warn("Something went wrong with finding how many playing: " + str(e))
    finally:
        return extractedInfo

    
'''
@object postCommands
@purpose stores functions for easy lookup from the server's handler
'''
postCommands = {
    'closeServer':close_server,
    'startGame': start_game,
    'saveJson':save_json,
    'compare' :compare_to_user,
    'howManyPlaying' : howManyPlaying
    }

'''
@class MetaSteamHandler
@superclass SimpleHTTPRequestHandler
@purpose The custom handler for the HTTP server
'''
class MetaSteamHandler(SimpleHTTPRequestHandler):#BaseHTTPServer.BaseHTTPRequestHandler):
    metaSteamInstance = None

    '''
    @class MetaSteamHandler
    @static
    @method registerInstance
    @purpose stores a reference to the main metasteam object for use within the server
    '''
    @staticmethod
    def registerInstance(metaSteam):
        logging.info( "Registering MetaSteam Instance")
        MetaSteamHandler.metaSteamInstance = metaSteam

    '''
    @class MetaSteamHandler
    @static
    @method cmsi (Check for MetaSteam Instance)
    @purpose check for a linked meta steam object
    @returns boolean
    '''
    @staticmethod
    def cmsi():
        if not MetaSteamHandler.metaSteamInstance is None:
            return True
        else:
            return False
        
    '''
    @class MetaSteamHandler
    @method do_GET
    @purpose Deals with GET requests, serves basic files
    @threadSafe
    '''
    def do_GET(self):
        logging.info( "Getting path: " + self.path)
        #if file is the json:
        #acquire  the lock
        if self.path[-3:] == ".js" and MetaSteamHandler.cmsi():
            MetaSteamHandler.metaSteamInstance.jsonLock.acquire()
        #perform the request
        try:
            SimpleHTTPRequestHandler.do_GET(self)
        except Exception as e:
            logging.error("Exception: do_GET: " + str(e))
        finally:
            #Release the lock
            if self.path[-3:] == ".js" and MetaSteamHandler.cmsi():
                MetaSteamHandler.metaSteamInstance.jsonLock.release()


    '''
    @class MetaSteamHandler
    @method do_POST
    @purpose Deals with POST requests, performing commands from the web interface
    '''
    def do_POST(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],
            })

        for key in form:
            logging.info(key + ": " + form[key].value)

        if 'command' not in form:
            logging.warn("POST request recieved with no command")
            return
            
        #switch on command:
        command = form['command'].value

        #lookup the command and perform it
        returnedData = []

        if 'value' in form and command in postCommands:
            returnedData = postCommands[command](form['value'].value)
        elif command in postCommands:
            returnedData = postCommands[command]()
        else:
            logging.warn("no suitable command found for: " + command)

        #send the response (as json):
        self.send_response(200)
        self.send_header('Content-type','application/json')
        self.end_headers()
        jsonString = json.dumps(returnedData)
        self.wfile.write(jsonString)
        

'''
@class runLocalServer
@purpose Start a metasteam http server
@param metaSteamInstance a reference to the python metasteam object for callbacks
@param port the port to operate on
'''            
def runLocalServer(metaSteamInstance,port=8000):
    try:
        if(metaSteamInstance):
            logging.info( "Run Local Server recieved: " + str(metaSteamInstance))
        else:
            logging.info("Running local server without MetaSteam Instance")
        #server_address = ('127.0.0.1', port)
        server_address = ('localhost',port)
        MetaSteamHandler.protocol_version = Protocol
        if metaSteamInstance != None:
            MetaSteamHandler.registerInstance(metaSteamInstance)
            
        #Create and Run the actual server:
        server = ServerClass(server_address, MetaSteamHandler)
    
        sa = server.socket.getsockname()
        print "Serving HTTP on", sa[0], "port", sa[1], "..."
        logging.info("Serving HTTP On: " + str(sa[0]) + " port: " + str(sa[1]) + "...")

        while continueRunning:
            server.handle_request()
    except Exception as e:
        logging.error("Exception: runLocalServer: " + str(e))
    finally:
        server.socket.close()
        print "Shutting Down Server"
        logging.info("Shutting Down Server")

'''
@main
@purpose run the server without an accompanying meta steam instance
'''
if __name__ == "__main__":
    logName = "metaSteamHTTPServer_" + str(datetime.date.today()) + ".log"
    logging.basicConfig(filename=os.path.join("logs",logName),level=logging.DEBUG)
    logging.info("------------------------------")
    logging.info("Starting Separate HTTPServer")
    runLocalServer(None,port=8888)    
