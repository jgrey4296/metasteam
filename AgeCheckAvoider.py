#!/usr/bin/python

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
        self.gameid = ""
        url = "http://store.steampowered.com/app/" + gameid

    ## soupify
    def soupify(self,html):
    findalDataToReturn = []
    soup = BeautifulSoup(html)

    agecheckform = soup.find_all(id="agecheck_form")
    if agecheckform:
        print "theres an agecheck"
        print soup.title

        forminput = soup.find_all('input',type="hidden")
        finVal =  forminput[1]['value']


    self.values = {
        'ageDay' : '3',
        'ageMonth' : 'March',
        'ageYear' : '1980',
        'snr' : finVal
    }

    self.url = "http://store.steampowered.com/agecheck/app/" + gameid + "/"

    data = urllib.urlencode(self.values)
    print data
    req = urllib2.Request(self.url,data)
    #    fullurl = url + '?' + data
    #    print fullurl
    response = opener.open(req)
    html = response.read()

    soup = BeautifulSoup(html)
    print soup.title
    agecheckform = soup.find_all(id="agecheck_form")
    if agecheckform:
        print "theres an agecheck"

    allTags = soup.find_all('a',class_="app_tag")

    #all tags for a game
    for tag in allTags:
        print tag.string.strip()
        findalDataToReturn.append(tag.string.strip())

    print "Additional Categories:"

    #all categories for a game
    categoryBlock = soup.find(id='category_block')
    categories = categoryBlock.find_all(class_='name')
    for category in categories:
        if category.string:
            print category.string.strip()
            finalDataToReturn.append(tag.string.strip())

    return finalDataToReturn
