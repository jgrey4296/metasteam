## The MetaSteam python->js->python communication server
# @module MetaSteamServer
#
# For Reference see:
# http://fragments.turtlemeat.com/pythonwebserver.php
# https://docs.python.org/2/library/basehttpserver.html#BaseHTTPServer.HTTPServer
# 

import sys
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import threading
import cgi

ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"

#allowedFiles = []

continueRunning = True
#turn off with 'global continueRunning, continueRunning = False'

class MetaSteamHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    metaSteamInstance = None

    @staticmethod
    def registerInstance(metaSteam):
        print "Registering MetaSteam Instance"
        metaSteamInstance = metaSteam

    def do_GET(self):
        print "do_GET"
        #self.send_response(200)
        #self.send_header('Content-type','text/html')

        #self.wfile.write("something")

        #self.send_error(404,'File not found')

        
    def do_POST(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],
            })

        for key in form:
            print key + ": " + form[key].value


            
def runLocalServer(metaSteamInstance):
    #Setup:
    port = 8000
    server_address = ('127.0.0.1', port)
    MetaSteamHandler.protocol_version = Protocol
    MetaSteamHandler.registerInstance(metaSteamInstance)
    
    #Create and Run the actual server:
    server = ServerClass(server_address, MetaSteamHandler)
    
    sa = server.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    while continueRunning:
        server.handle_request()
    server.socket.close()
    print "Shutting Down Server"
