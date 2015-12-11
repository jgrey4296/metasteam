'''
@purpose Class to scrape the number of players for a game
@module MetaSteamScraper
'''

from cookielib import CookieJar
import re
import urllib2
import urllib
from bs4 import BeautifulSoup
from jgUtility import *
import logging


steamReleaseDateRegex = re.compile(r"(\w{2,4})\s(\d{2,2}),\s(\d{4,4})")

'''
@class MultiplayerScraper
@purpose Scrapes the steam community page for number of players for a game
'''
class MultiplayerScaper:

    html = ""
    
    '''
    @class MultiplayerScraper
    @method __init__
    '''
    def __init__(self):
        logging.info("Creating MultiplayerScraper")
        self.baseUrl = "http://steamcommunity.com/app/"
        logging.info("Base Url: " + self.baseUrl)
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))



    '''
    @class MultiplayerScraper
    @method scrape
    @param appid
    @purpose scrape the page for the specified game, by appid
    @returns extracted information as a dictionary
    '''
    def scrape(self,appid):
        logging.info("Scraping: " + str(appid))
        gameUrl = self.baseUrl + str(appid)
        extractedInfo = [[],[]]
        
            storeHtml = self.webRequest(gameUrl,{})
            extractedInfo = self.storeExtraction(storeHtml)    
        
        #["tags","releaseDate"]
        return [appid,extractedInfo]

    '''
    @class MultiplayerScraper
    @method webRequest
    @purpose request the html
    '''
    def webRequest(self,url,inValues):
        logging.info("sending a web request")
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html


    '''
    @class MultiplayerScraper
    @method storeExtraction
    @purpose extract information from the store page html
    @returns array of tags,releasedate,description,review,dev,publisher
    '''
    def storeExtraction(self,html):
        soup = BeautifulSoup(html,"html.parser")
        extractedTags = []
        releaseDate = {}
        description = ""
        review = ""
        
        #General Tags
        numInAppSpan = soup.find('span',class_="apphub_NumInApp")

        if numInAppSpan is None:
            return []
        
        number = numInAppSpan.get_text().split(" ")[0]

        formattedNumber = number.replace(",","")
        
        return formattedNumber
