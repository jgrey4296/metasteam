import sys
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import threading

HandlerClass = SimpleHTTPRequestHandler
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"

#TODO: make this 
def runLocalServer():
    self.port = 8000
    self.server_address = ('127.0.0.1', self.port)

    HandlerClass.protocol_version = Protocol
    httpd = ServerClass(self.server_address, HandlerClass)
    
    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."
    httpd.serve_forever()
