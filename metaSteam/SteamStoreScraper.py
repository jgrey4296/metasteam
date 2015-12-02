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
import logging

steamReleaseDateRegex = re.compile(r"(\w{2,4})\s(\d{2,2}),\s(\d{4,4})")


class SteamStoreScraper:

    def __init__(self):
        logging.info("Creating SteamStoreScraper")
        self.storeUrl = "http://store.steampowered.com/app/"
        logging.info("StoreUrl: " + self.storeUrl)
        self.ageUrl = "http://store.steampowered.com/agecheck/app/"
        logging.info("AgeUrl: " + self.ageUrl)
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))

        self.ageCheckValues = {
            'ageDay' : '3',
            'ageMonth' : 'March',
            'ageYear' : '1980',
            'snr' : 'finVal',
        }

    html = ""    
    def scrape(self,appid):
        logging.info("Scraping: " + str(appid))
        gameUrl = self.storeUrl + str(appid)
        extractedInfo = [[],[]]
        
        while len(extractedInfo[0]) == 0 or len(extractedInfo[1]) == 1:
            storeHtml = self.webRequest(gameUrl,{})
            if(self.avoidAgeCheck(storeHtml)):
                logging.info("Avoiding Age Check")
                ageCheckUrl = self.ageUrl + appid + "/"
                storeHtml = self.webRequest(ageCheckUrl,self.ageCheckValues)
            extractedInfo = self.storeExtraction(storeHtml)    
        
        #["tags","releaseDate"]
        return extractedInfo
        
    def webRequest(self,url,inValues):
        logging.info("sending a web request")
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html

    def avoidAgeCheck(self,html):
        logging.info("avoiding Age Check")
        soup = BeautifulSoup(html,"html.parser")
        agecheckform = soup.find_all(id="agecheck_form")
        if agecheckform:
            forminput = soup.find_all('input',type="hidden")
            self.ageCheckValues['snr'] = forminput[1]['value']
            return True
        else:
            logging.warn("Avoiding an Age check, but theres no check")
            return False


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
            tempTags.append(get_unicode(tag.string.strip()))
            logging.info( "	Found Tag: " + tag.string.strip())

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
            block = soup.find_all(class_="block_content_inner")[0].findAll(text=True)
            for x in block:
                curr = block[x]
                if curr == u'Publisher:':
                    publisher = block[x+2]
                if curr == u'Developer:':
                    developer = block[x+2]
        except Exception:
            logging.warn( "Failure in pub/dev detection")
            
            
        return [extractedTags,releaseDate,description,review,developer,publisher]
