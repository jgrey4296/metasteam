import os
import re
import string, cgi, time
from os import curdir, sep
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

testReg = re.compile('test')

allowedFiles = os.listdir(os.getcwd())

shouldRun = True

class MyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            print "Got a request"
            print "Path: " + self.path
            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()

            if len(self.path) > 2 and self.path[1] == '_':
                print "GOT AN ACTION"
                self.wfile.write("hello");
                if self.path[2:] == "exit":
                    global shouldRun
                    shouldRun = False
            else:
                #if a file path:
                match = [s for s in allowedFiles if self.path[1:] in s]
                if len(match) == 1:
                    f = open(match[0])
                    for line in f:
                        self.wfile.write(testReg.sub('blah',line))
                    f.close()
                else:
                    print "Non-allowed file"
                    f = open(allowedFiles[0])
                    for line in f:
                        self.wfile.write(testReg.sub('blah',line))
                    f.close()
                    
                
            return
        except IOError:
            self.send_error(404,"File was not found")

    def do_POST(self):
        print "This is a post request"
        try:
            ctype, pdict = cgi.parse_header(self.headers.getheader('content-type'))
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD':'POST',
                         'CONTENT_TYPE':self.headers['Content-Type'],
                })

            for key in form:
                print key + ": " + form[key].value
            
            self.send_response(200)
        except Exception as e:
            print "Something went wrong"
            print e
            pass

        

def main():
    server = HTTPServer(('',8888),MyHandler)
    print "Starting test server"
    while shouldRun:
        server.handle_request()
    server.socket.close()
    print "Closing Server"

if __name__ == '__main__':
    main()
