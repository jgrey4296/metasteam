## The Automated scaper to extract tags from steam store pages
# @module MetaSteamScraper
#
#
#
from cookielib import CookieJar
import re
import urllib2
import urllib
from bs4 import BeautifulSoup
from jgUtility import *
import json
import logging

gamePattern = re.compile(r"^\s*var rgGames\s=(.*);")


class SteamProfileScraper:

    def __init__(self,profileName):
        logging.info("Initialising SteamProfileScraper")
        self.profileUrl = "http://steamcommunity.com/id/" + profileName + "/games/"
        logging.info("Profile Url:" + self.profileUrl)
        
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))


    html = ""    

    def scrape(self):
        url = self.profileUrl
        extractedInfo = []
        
        profileHtml = self.webRequest(url,{'tab' : 'all'})
        extractedInfo = self.profileExtraction(profileHtml)

        logging.info( "Extracted Profile Info")#,extractedInfo
        return extractedInfo
        
    def webRequest(self,url,inValues):
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html

    def profileExtraction(self,html):
        logging.info("Extracting from Profile")
        soup = BeautifulSoup(html)
        extractedTags = []
        releaseDate = {}
        
        allScripts = soup.find_all("script")
        for script in allScripts:
            if 'language' in script.attrs and script['language'] == 'javascript':
                try:
                    matched =  re.search(gamePattern,script.string)
                    if matched:
                        logging.info( "found")
                        jsonline = get_unicode(matched.group(1))
                        logging.info( "Converting from Json:")
                        gameDict = json.loads(jsonline)
                        return gameDict
                except Exception as e:
                    logging.warn( e)
                    return {}
            else:
                logging.warn("No Javascript suitable found")
