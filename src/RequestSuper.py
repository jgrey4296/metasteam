#!/usr/bin/python

from cookielib import CookieJar
import codecs
import glob
import re
import urllib2
import urllib
from bs4 import BeautifulSoup
from subprocess import call
import random
import json

## ageCheckParse
# @class ageCheck workaround steam page parser
# 
#
class RequestSuper:


    ## constructor
    def __init__(self):
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
        self.values = {}
        self.url = "http://google.com"

## request setup
    def request(self):
        print "Requesting Profile"
        try:
            self.data = urllib.urlencode(self.values)
            self.req = urllib2.Request(self.url,self.data)
            self.response = self.opener.open(self.req)
            self.html = self.response.read()
        except Exception as e:
            print e
            

