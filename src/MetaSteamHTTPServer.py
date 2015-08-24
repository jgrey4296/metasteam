## The MetaSteam python->js->python communication server
# @module MetaSteamServer
#
# For Reference see:
# http://fragments.turtlemeat.com/pythonwebserver.php
# https://docs.python.org/2/library/basehttpserver.html#BaseHTTPServer.HTTPServer
# 

import sys
import os
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import threading
import cgi

ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"

allowedFiles = {}

continueRunning = True
#turn off with 'global continueRunning, continueRunning = False'

#commands to call from post request
#close server
def close_server(self):
    print "Triggering Server Shutdown"
    global continueRunning
    continueRunning = False

#start game
def start_game(self,appid):
    print "Triggering Game Start"
    if MetaSteamHandler.cmsi():
        MetaSteamHandler.metaSteamInstance.startGame(appid)

#...save modifed json?
def save_json(self):
    print "Triggering Json Save"
    if MetaSteamHandler.cmsi():
        MetaSteamHandler.metaSteamInstance.exportToJson()

def compare_to_user(self):
    print "TODO: allow comparison of user profiles"
        
#Command map for POST:
postCommands = {
    'closeServer':close_server,
    'startGame': start_game,
    'saveJson':save_json,
    'compare' :compare_to_user,
    }

class MetaSteamHandler(SimpleHTTPRequestHandler):#BaseHTTPServer.BaseHTTPRequestHandler):
    metaSteamInstance = None

    @staticmethod
    def registerInstance(metaSteam):
        print "Registering MetaSteam Instance"
        MetaSteamHandler.metaSteamInstance = metaSteam

    #check for meta steam instance
    @staticmethod
    def cmsi():
        if not MetaSteamHandler.metaSteamInstance is None:
            return True
        else:
            return False
        
    # #Main GET handler
    # #used for basic web serving of files
    def do_GET(self):
        print "Getting path: " + self.path
        #if file is the json:
        #acquire  the lock
        if self.path[-3:] == ".js" and MetaSteamHandler.cmsi():
            MeetaSteamHandler.metaSteamInstance.jsonLock.acquire()
        #perform the request
        SimpleHTTPRequestHandler.do_GET(self)
        #Release the lock
        if self.path[-3:] == ".js" and MetaSteamHandler.cmsi():
            MeetaSteamHandler.metaSteamInstance.jsonLock.release()

        
    #Main POST handler
    #Used for starting games, and exiting
    def do_POST(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],
            })

        for key in form:
            print key + ": " + form[key].value

        if 'command' not in form: return
            
        #switch on command:
        command = form['command'].value

        if command == 'startGame' and form['appid']:
            postCommands[command](form['appid'].value)
        else:
            postCommands[command]()

        self.send_response(200)
        self.send_header('Content-type','text-html')
        self.end_headers()
        self.wfile.write("Command Complete")
        

            
def runLocalServer(metaSteamInstance,port=8000):
    print "Run Local Server recieved: " + str(metaSteamInstance)
    #server_address = ('127.0.0.1', port)
    server_address = ('localhost',port)
    MetaSteamHandler.protocol_version = Protocol
    if metaSteamInstance != None:
        MetaSteamHandler.registerInstance(metaSteamInstance)
    

    #Create and Run the actual server:
    server = ServerClass(server_address, MetaSteamHandler)
    
    sa = server.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    while continueRunning:
        server.handle_request()
    server.socket.close()
    print "Shutting Down Server"


if __name__ == "__main__":
    runLocalServer(None,port=8888)    
