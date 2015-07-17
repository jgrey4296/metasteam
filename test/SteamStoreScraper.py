from cookielib import CookieJar
import re
import urllib2
import urllib
from bs4 import BeautifulSoup
from jgUtility import *

steamReleaseDateRegex = re.compile(r"(\w{2,4})\s(\d{2,2}),\s(\d{4,4})")


class SteamStoreScraper:

    def __init__(self):
        self.storeUrl = "http://store.steampowered.com/app/"
        self.ageUrl = "http://store.steampowered.com/agecheck/app/"
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
        gameUrl = self.storeUrl + str(appid)
        storeHtml = self.webRequest(gameUrl,{})

        if(self.avoidAgeCheck(storeHtml)):
            ageCheckUrl = self.ageUrl + appid + "/"
            storeHtml = self.webRequest(ageCheckUrl,self.ageCheckValues)

        
        extractedInfo = self.storeExtraction(storeHtml)    
        
        #["tags","releaseDate"]
        return extractedInfo
        
    def webRequest(self,url,inValues):
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html

    def avoidAgeCheck(self,html):
        soup = BeautifulSoup(html)
        agecheckform = soup.find_all(id="agecheck_form")
        if agecheckform:
            forminput = soup.find_all('input',type="hidden")
            self.ageCheckValues['snr'] = forminput[1]['value']
            return True
        else:
            return False


    def storeExtraction(self,html):
        soup = BeautifulSoup(html)
        extractedTags = []
        releaseDate = {}
        
        #General Tags
        allTags = soup.find_all('a',class_="app_tag")

        tempTags = []
        for tag in allTags:
            tempTags.append(get_unicode(tag.string.strip()))

        extractedTags = list(set([tag for tag in extractedTags]))
            
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

        return [extractedTags,releaseDate]
