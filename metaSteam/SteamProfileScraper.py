'''The Automated scaper to extract tags from steam store pages
@module MetaSteamScraper
'''

from cookielib import CookieJar
import re
import urllib2
import urllib
from bs4 import BeautifulSoup
from jgUtility import *
import json
import logging

gamePattern = re.compile(r"^\s*var rgGames\s=(.*);")

'''
@class SteamProfileScraper
@purpose To Extract information about games played from a specified steam profile
'''
class SteamProfileScraper:

    html = ""    
    
    '''
    @class SteamProfileScraper
    @method __init__
    @purpose constructor
    @param profileName the profile name to be used in the url
    '''
    def __init__(self,profileName):
        logging.info("Initialising SteamProfileScraper")
        self.profileName = profileName
        self.profileUrl = "http://steamcommunity.com/id/" + profileName + "/games/"
        logging.info("Profile Url:" + self.profileUrl)
        
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))

    '''
    @class SteamProfileScraper
    @method scrape
    @purpose Triggers a web request and then extracts information from received html
    @returns extracted information as a dictionary
    '''
    def scrape(self):
        url = self.profileUrl
        extractedInfo = []
        
        profileHtml = self.webRequest(url,{'tab' : 'all'})
        extractedInfo = self.profileExtraction(profileHtml)

        logging.info( "Extracted Profile Info")#,extractedInfo
        return extractedInfo

    '''
    @class SteamProfileScraper
    @method webRequest
    @purpose to retrieve some html
    @param url the url to request
    @param inValues values to encode into the url
    @returns html data
    '''
    def webRequest(self,url,inValues):
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html


    '''
    @class SteamProfileScraper
    @method profileExtraction
    @purpose extracts json information from the html provided
    '''
    def profileExtraction(self,html):
        logging.info("Extracting from Profile")
        soup = BeautifulSoup(html, "html.parser")
        extractedTags = []
        releaseDate = {}
        
        allScripts = soup.find_all("script")
        foundSuitable = False
        
        for script in allScripts:
            if 'language' in script.attrs and script['language'] == 'javascript':
                try:
                    matched =  re.search(gamePattern,script.string)
                    if matched:
                        foundSuitable = True
                        logging.info( "found profile information")
                        jsonline = get_unicode(matched.group(1))
                        gameDict = json.loads(jsonline)
                        return gameDict
                except Exception as e:
                    logging.warn( e)
                    return {}

        if not foundSuitable:
            logging.warn("No suitable javascript found for profile extraction")
