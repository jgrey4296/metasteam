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

allowedFiles = []

continueRunning = True
#turn off with 'global continueRunning, continueRunning = False'

#close server
def close_server(self):
    print "Triggering Server Shutdown"
    global continueRunning
    continueRunning = False

#start game
def start_game(self,appid):
    print "Triggering Game Start"
    MetaSteamHandler.metaSteamInstance.startGame(appid)

        #...save modifed json?
def save_json(self):
    print "Triggering Json Save"
    MetaSteamHandler.metaSteamInstance.exportToJson()
            
#Command map for POST:
postCommands = {
    'closeServer':close_server,
    'startGame': start_game,
    'saveJson':save_json
    }

class MetaSteamHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    metaSteamInstance = None

    @staticmethod
    def registerInstance(metaSteam):
        print "Registering MetaSteam Instance"
        metaSteamInstance = metaSteam

    #Main GET handler
    #used for basic web serving of files
    def do_GET(self):
        print "do_GET"

        #search the allowed files for a match with the input path
        #open that file and return it
        for fileName, filePath in allowedFiles:
            if fileName in self.path[1:]:
                print "Found file: " + fileName + " for " + self.path
                self.send_response(200)
                if fileName[-3:] == ".js":
                    self.send_header('Content-type','application/javascript')

                elif fileName[-5:] == ".json":
                    self.send_header('Content-type','application/json')
                else:
                    self.send_header('Content-type','text/html')

                self.end_headers()
                theFile = open(filePath)
                self.wfile.write(theFile.read())
                theFile.close()
                return
        #otherwise send error:
        print "Could Not Find: " + self.path
        self.send_error(404,'File not found')

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
        command = form['command']

        if 'command' == 'startGame' and form['appid']:
            postCommands[command](form['appid'].value)
        else:
            postCommands[command]()

        self.send_response(200)
        self.send_header('Content-type','text-html')
        self.end_headers()
        self.wfile.write("Command Complete")
        

            
def runLocalServer(metaSteamInstance):
    #Setup:
    port = 8000
    server_address = ('127.0.0.1', port)
    MetaSteamHandler.protocol_version = Protocol
    if metaSteamInstance != None:
        MetaSteamHandler.registerInstance(metaSteamInstance)

    setupAllowedFiles()

    print "--------------------"
    print "Allowed Files:"
    for aFile,path in allowedFiles:
        print aFile + " : " + path
    print "--------------------"
    
    #Create and Run the actual server:
    server = ServerClass(server_address, MetaSteamHandler)
    
    sa = server.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    while continueRunning:
        server.handle_request()
    server.socket.close()
    print "Shutting Down Server"

def setupAllowedFiles():
    for root, subdirs, files in os.walk(os.getcwd()):
        for aFile in files:
            allowedFiles.append((aFile,os.path.join(root,aFile)))

if __name__ == "__main__":
    runLocalServer(None)    
