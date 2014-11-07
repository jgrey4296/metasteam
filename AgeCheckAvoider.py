#!/usr/bin/python

from jgUtility import *
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

## ageCheckParse
# @class ageCheck workaround steam page parser
# 
#
class AgeCheckAvoider(RequestSuper):


    ## constructor
    def __init__(self):
        RequestSuper.__init__(self)
        self.appid = ""
        self.url = "http://google.com"
        self.finVal = ""
        self.values = {
            'ageDay' : '3',
            'ageMonth' : 'March',
            'ageYear' : '1980',
            'snr' : 'finVal',
        }
        
    ## general scrape override method
    def scrape(self,appid):
        try:
            print "Scraping: " + appid
            self.appid = getInt(appid)
            self.tags = []
            self.url = "http://store.steampowered.com/app/" + str(self.appid)
            #request
            self.request()
            #soupify
            self.first_soup()
            #request
            #modify for the agechck
            self.url = "http://store.steampowered.com/agecheck/app/" + str(self.appid) + "/"
            self.values = {
                'ageDay' : '3',
                'ageMonth' : 'March',
                'ageYear' : '1980',
                'snr' : self.finVal,
            }
            self.data = urllib.urlencode(self.values)
            self.request()
            #soupify
            self.second_soup()
            #the found tags
            return (self.tags, self.releaseDate)
        except:
            PrintException()
            
    ## soupify to detect the agecheck
    def first_soup(self):
        print "Soup extraction for: " + str(self.appid)
        soup = BeautifulSoup(self.html)

        agecheckform = soup.find_all(id="agecheck_form")
        if agecheckform:
            print "theres an agecheck"
            print soup.title
            forminput = soup.find_all('input',type="hidden")
            self.finVal =  forminput[1]['value']


    ##  Soupify to generally extract
    def second_soup(self):
        try:
            soup = BeautifulSoup(self.html)
            extractedTags = []
            #print soup.title.string
            agecheckform = soup.find_all(id="agecheck_form")
            if agecheckform:
                print "theres an agecheck"
                raise Exception("Unexpected Agecheck found")
                
            allTags = soup.find_all('a',class_="app_tag")

            #all tags for a game
            for tag in allTags:
                #print "Tag: ", tag.string.strip()
                extractedTags.append(get_unicode(tag.string.strip()))
                    
            #all categories fora game
            categoryBlock = soup.find(id='category_block')
            categories = categoryBlock.find_all(class_='name')
            for category in categories:
                if category.string:
                #print "Category:", category.string.strip()
                    extractedTags.append(get_unicode(category.string.strip()))
                
            releaseDate = get_unicode(soup.find("div",class_="release_date").span.string.strip())
            self.releaseDate = releaseDate
            self.tags = list(set([tag for tag in extractedTags]))
        except:
            PrintException()    

        

        
