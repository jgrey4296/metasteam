'''
The MetaSteam python->js->python communication server
@module MetaSteamServer

For Reference see:
http://fragments.turtlemeat.com/pythonwebserver.php
https://docs.python.org/2/library/basehttpserver.html#BaseHTTPServer.HTTPServer
''' 

import sys
import os
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
from SteamProfileScraper import SteamProfileScraper
import threading
import cgi
import logging

ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
allowedFiles = {}
continueRunning = True
#note: turn off with 'global continueRunning, continueRunning = False'

'''
@function close_server
@purpose changes the global loop condition to stop the servers infinite loop
'''
def close_server(self):
    logging.info( "Triggering Server Shutdown")
    global continueRunning
    continueRunning = False

'''
@function start_game
@purpose calls metasteam to start a game
@param appid the game id to start
'''
def start_game(self,appid):
    logging.info( "Triggering Game Start")
    if MetaSteamHandler.cmsi():
        MetaSteamHandler.metaSteamInstance.startGame(appid)

'''
@function save_json
@purpose calls metasteam to save modified json data about games
'''
def save_json(self):
    logging.info( "Triggering Json Save")
    if MetaSteamHandler.cmsi():
        MetaSteamHandler.metaSteamInstance.exportToJson()

'''
@function compare_to_user
@param username compare the operator of metasteam to the specified user
@todo
'''
def compare_to_user(self,username):
    logging.info( "TODO: allow comparison of user profiles")
    profileScraper = SteamProfileScraper(username)
    extractedInfo = profileScraper.scrape()
    #now what? return the information to the web visualisation
    
    
'''
@object postCommands
@purpose stores functions for easy lookup from the server's handler
'''
postCommands = {
    'closeServer':close_server,
    'startGame': start_game,
    'saveJson':save_json,
    'compare' :compare_to_user,
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
        SimpleHTTPRequestHandler.do_GET(self)
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
            logging.log(key + ": " + form[key].value)

        if 'command' not in form:
            logging.warn("POST request recieved with no command")
            return
            
        #switch on command:
        command = form['command'].value

        if command == 'startGame' and form['appid']:
            postCommands[command](form['appid'].value)
        if command == 'compareUser' and form['username']:
            info = postCommands[command](form['username'].value)
            #TODO: return the information as json
        else:
            postCommands[command]()

        self.send_response(200)
        self.send_header('Content-type','text-html')
        self.end_headers()
        self.wfile.write("Command Complete")
        

'''
@class runLocalServer
@purpose Start a metasteam http server
@param metaSteamInstance a reference to the python metasteam object for callbacks
@param port the port to operate on
'''            
def runLocalServer(metaSteamInstance,port=8000):
    logging.info( "Run Local Server recieved: " + str(metaSteamInstance))
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
        
    server.socket.close()
    print "Shutting Down Server"
    logging.info("Shutting Down Server")

'''
@main
@purpose run the server without an accompanying meta steam instance
'''
if __name__ == "__main__":
    runLocalServer(None,port=8888)    
