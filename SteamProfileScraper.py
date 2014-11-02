#!/usr/bin/python

import os
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
from RequestSuper import RequestSuper

##
# @class allGamesParsing
# @brief steam profile page scraper
#
class SteamProfileScraper(RequestSuper):

    ## Constructor
    #
    #
    def __init__(self,profilename):
        RequestSuper.__init__(self)
        self.values = {
            'tab' : 'all',
        }
        self.url = "http://steamcommunity.com/id/" + profilename + "/games/"
        self.data = urllib.urlencode(self.values)
        print "Profile Scraper Created"

    ## soupify
    def soupify(self,html):
        print "Soupifying"
        soup = BeautifulSoup(html)
        allScripts = soup.find_all("script")
        jsonline = ""
        gamePattern = re.compile(r"^\s*var rgGames\s=(.*);")

        #only care about the one script though. the one with the data.
        for script in allScripts:
            if 'language' in script.attrs and script['language'] == 'javascript':
                try:
                    matched =  re.search(gamePattern,script.string)
                    if matched:
                        print "found"
                        jsonline = matched.group(1)
                        print "Converting from Json:"
                        gameDict = json.loads(jsonline)
                        return gameDict
                except Exception as e:
                    print e
                    return {}


    ## The following from:
    #https://stackoverflow.com/questions/7219361/python-and-beautifulsoup-encoding-issues
def __if_number_get_string(number):
    converted_str = number
    if isinstance(number, int) or \
       isinstance(number, float):
        converted_str = str(number)
    return converted_str
        
        
def get_unicode(strOrUnicode, encoding='utf-8'):
    strOrUnicode = __if_number_get_string(strOrUnicode)
    if isinstance(strOrUnicode, unicode):
        return strOrUnicode
    return unicode(strOrUnicode, encoding, errors='ignore')
        
def get_string(strOrUnicode, encoding='utf-8'):
    strOrUnicode = __if_number_get_string(strOrUnicode)
    if isinstance(strOrUnicode, unicode):
        return strOrUnicode.encode(encoding)
    return strOrUnicode
        
