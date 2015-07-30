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

gamePattern = re.compile(r"^\s*var rgGames\s=(.*);")


class SteamStoreScraper:

    def __init__(self,profileName):
        self.storeUrl = "http://steamcommunity.com/id/" + profileName + "/games/"

        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))


    html = ""    

    def scrape(self,appid):
        gameUrl = self.storeUrl + str(appid)
        extractedInfo = [[],[]]
        
        while len(extractedInfo[0]) == 0 or len(extractedInfo[1]) == 1:
            profileHtml = self.webRequest(gameUrl,{'tab' : 'all'})
            extractedInfo = self.profileExtraction(profileHtml)

        return extractedInfo
        
    def webRequest(self,url,inValues):
        data = urllib.urlencode(inValues)
        request = urllib2.Request(url,data)
        self.response = self.opener.open(request)
        html = self.response.read()
        return html

    def profileExtraction(self,html):
        soup = BeautifulSoup(html)
        extractedTags = []
        releaseDate = {}
        
        allScripts = soup.find_all("script")
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

