'''
The Automated scaper to extract tags from steam store pages
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
logger = logging.getLogger('MetaSteam.SteamStoreScraper')
'''
@class SteamStoreScraper
@purpose Scrape a page from the steam store for information about a game
'''
class SteamStoreScraper:

    html = ""
    
    '''
    @class SteamStoreScraper
    @method __init__
    '''
    def __init__(self):
        logger.info("Creating SteamStoreScraper")
        self.storeUrl = "http://store.steampowered.com/app/"
        logger.info("StoreUrl: " + self.storeUrl)
        self.ageUrl = "http://store.steampowered.com/agecheck/app/"
        logger.info("AgeUrl: " + self.ageUrl)
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))

        self.ageCheckValues = {
            'ageDay' : '3',
            'ageMonth' : 'March',
            'ageYear' : '1980',
            'snr' : 'finVal',
        }

    '''
    @class SteamStoreScraper
    @method scrape
    @param appid
    @purpose scrape the page for the specified game, by appid
    @returns extracted information as a dictionary
    '''
    def scrape(self,appid):
        logger.info("Scraping: " + str(appid))
        gameUrl = self.storeUrl + str(appid)
        extractedInfo = [[],[]]
        
        while len(extractedInfo[0]) == 0 or len(extractedInfo[1]) == 1:
            storeHtml = self.webRequest(gameUrl,{})
            if(self.avoidAgeCheck(storeHtml)):
                #logger.info("Avoiding Age Check")
                ageCheckUrl = self.ageUrl + appid + "/"
                storeHtml = self.webRequest(ageCheckUrl,self.ageCheckValues)
            extractedInfo = self.storeExtraction(storeHtml)    
        
        #["tags","releaseDate"]
        return extractedInfo

    '''
    @class SteamStoreScraper
    @method webRequest
    @purpose request the html
    '''
    def webRequest(self,url,inValues):
        #logger.info("sending a web request")
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html

    '''
    @class SteamStoreScraper
    @method avoidAgeCheck
    '''
    def avoidAgeCheck(self,html):
        logger.info("avoiding Age Check")
        soup = BeautifulSoup(html,"html.parser")
        agecheckform = soup.find_all(id="agecheck_form")
        if agecheckform:
            forminput = soup.find_all('input',type="hidden")
            self.ageCheckValues['snr'] = forminput[1]['value']
            return True
        else:
            return False

    '''
    @class SteamStoreScraper
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
        allTags = soup.find_all('a',class_="app_tag")

        tempTags = []
        for tag in allTags:
            #todo: re.replace(r"[\\n\\t, ]","",tag.string.strip())
            tempTags.append(get_unicode(tag.string.strip()))
            #logger.info( "	Found Tag: " + tag.string.strip())

        extractedTags = list(set([tag for tag in tempTags]))
            
        #Categories
        categoryBlock = soup.find(id='category_block')
        categories = categoryBlock.find_all(class_='name')
        for category in categories:
            if category.string:
                extractedTags.append(get_unicode(category.string.strip()))

        #Release Date:
        dates = soup.find_all(class_="date")
        for date in dates:
            releaseDateString = get_unicode(date.string.strip())
            dateMatches = steamReleaseDateRegex.match(releaseDateString)
            if(dateMatches):
                releaseDate['original'] = releaseDateString
                releaseDate['month'] = dateMatches.group(1)
                releaseDate['day'] = dateMatches.group(2)
                releaseDate['year'] = dateMatches.group(3)

        #game description:
        snippets = soup.find_all(class_="game_description_snippet")
        if len(snippets) > 0:
            text = get_unicode(snippets[0].string.strip())
            description += text

        #review status:
        reviews = soup.find_all(class_="game_review_summary")
        if len(reviews) > 0:
            review = get_unicode(reviews[0].string.strip())

        #Publisher, developer extraction:
        publisher = ""
        developer = ""
        try:
            tags = soup.find('div',class_="details_block").find_all('b')
            for x in tags:
                if x == u'Publisher:':
                    publisher = x.next_sibling.next_sibling.get_text()
                if curr == u'Developer:':
                    developer = x.next_sibling.next_sibling.get_text()
        except Exception as e:
            logger.warn( "Failure in pub/dev detection: " + str(e))
            
            
        return [extractedTags,releaseDate,description,review,developer,publisher]
