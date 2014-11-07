#!/usr/bin/python

from jgUtility import *
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

    def scrape(self):
        self.request()
        allGames =  self.soupify(self.html)
        for game in allGames:
            game['jgProfiled'] = True
        return allGames
        

        

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
                        jsonline = get_unicode(matched.group(1))
                        print "Converting from Json:"
                        gameDict = json.loads(jsonline)
                        return gameDict
                except Exception as e:
                    print e
                    return {}


    ## The following from:
    #https://stackoverflow.com/questions/7219361/python-and-beautifulsoup-encoding-issues
