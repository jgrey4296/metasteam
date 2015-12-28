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
logger = logging.getLogger('MetaSteam.SteamProfileScraper')

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
        logger.info("Initialising SteamProfileScraper: " + profileName)
        self.profileName = profileName
        self.profileUrl = "http://steamcommunity.com/id/" + profileName + "/games/"
        logger.info("Profile Url:" + self.profileUrl)
        
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

        logger.info( "Extracted Profile Info")#,extractedInfo
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
        logger.info("Extracting from Profile")
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
                        logger.info( "found profile information")
                        jsonline = get_unicode(matched.group(1))
                        gameDict = json.loads(jsonline)
                        return gameDict
                except Exception as e:
                    logger.warn( e)
                    return {}

        if not foundSuitable:
            logger.warn("No suitable javascript found for profile extraction")
