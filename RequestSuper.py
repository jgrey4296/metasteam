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

## ageCheckParse
# @class ageCheck workaround steam page parser
# 
#
class RequestSuper:


    ## constructor
    def __init__(self,profilename):
        cj = CookieJar()
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
        self.values = {}
        self.url = "http://google.com"

## request setup
    def request(self):
        print "Requesting Profile"
        self.req = urllib2.Request(self.url,self.data)
        self.response = self.opener.open(self.req)
        self.html = self.response.read()


## web request and agecheck avoidance


## send request for a specific gameid

## soup usage


cj = CookieJar()
gameid = str(91310)
url = "http://store.steampowered.com/app/" + gameid
opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))


response = urllib2.urlopen(url)

html = response.read()

soup = BeautifulSoup(html)


agecheckform = soup.find_all(id="agecheck_form")
if agecheckform:
    print "theres an agecheck"
    print soup.title

    forminput = soup.find_all('input',type="hidden")
    finVal =  forminput[1]['value']


    values = {
        'ageDay' : '3',
        'ageMonth' : 'March',
        'ageYear' : '1980',
        'snr' : finVal
    }

    url = "http://store.steampowered.com/agecheck/app/" + gameid + "/"

    data = urllib.urlencode(values)
    print data
    req = urllib2.Request(url,data)
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
    
    for tag in allTags:
        print tag.string.strip()

    print "Additional Categories:"

    categoryBlock = soup.find(id='category_block')
    categories = categoryBlock.find_all(class_='name')
    for category in categories:
        if category.string:
            print category.string.strip()
