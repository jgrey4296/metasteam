#!/usr/bin/python
# -*- coding: utf-8 -*-

## 
# @file metaSteam.py
# @brief Python reimplementation of perl metasteam
#
# @author John Grey <jgrey@ucsc.soe.edu>
# @version 0.1
# @date
#

# Notes: 
# urlf = urllib2.urlopen("url")
# page = urlf.read()
# beautiful soup?
# Constants:
# $self->{'storePage'} = "http://store.steampowered.com/app/!!!";
# $self->{'rssPage'} = "http://steamcommunity.com/games/!!!/rss/";
# $self->{'ownSteamPage'} = "http://steamcommunity.com/!!!";
# $self->{'gamecards'} = "http://steamcommunity.com/my/gamecards/!!!/";
# 
#Imports:
import sys
import glob
import os
from subprocess import call
import urllib2
from JGMetaSteam import JGMetaSteam
#from BeautifulSoup import BeautifulSoup
import time
import webbrowser
import random 
from jgUtility import *

##
# @brief user input -> function 
#
def printallGames(ms):
    try:
        allTheGames = ms.allGames()
        allTheGames.sort()
        for gameTuple in allTheGames:
            #print "Type: ", type(gameTuple[0]),type(gameTuple[1])
            print gameTuple[0],  " : ", gameTuple[1]
        print len(allTheGames)
    except Exception as e:
        print "Something went wrong"
        print e

##
# @brief print statistics of:
#  installed, total games
#  which are scraped, which arent
def printStats(ms):
    print "Getting Statistics"
    #Get Total and installed Games
    print "Total Installed Games:", len(ms.allKeywordGames("jgInstalled"))
    print "Total Profiled Games:", len(ms.allKeywordGames("jgProfiled"))
    print "Total Games with Tags:", len(ms.allKeywordGames("jgTags"))
    print "Total Games Parsed:",len(ms.allKeywordGames("jgParsed"))




##
# @brief prints all the info on a single game
# @param gameid Numeric representation of a game.
#
def printInfoForGame(ms):
    try:
        response = raw_input("What game id?")
        gameinfo = ms.scrape_info(response,1)
        if gameinfo:
            print "Keys"
            for field in gameinfo.keys():
                print field, " : ", gameinfo[field]
            else:
                print "No returned info"
    except:
        PrintException()
##
# @brief get all games, and scrape them slowly
#
#
def scrapeAllGames(ms):
    print "Scraping All Games"
    count = 0;
    allTheGames = ms.allKeywordGames("jgProfiled")
    #if len(allTheGames) > 10:
        #allTheGames = random.sample(ms.allKeywordGames("jgProfiled"), 10)

        
    allTheGames.sort()
    for game in allTheGames:
        print type(game)
        try:
            appid = game['appid']

            print "Appid: ", appid, type(appid)

            if isinstance(appid, int) or isinstance(appid, float):
                appid = str(appid)

            print "Appid: ", appid, type(appid)

            ms.scrape_info(appid,0)
            print "Count: ",count, " of : ", len(allTheGames)

        except Exception as e:
            print "Something went wrong"
            print e
        time.sleep(3)
        count += 1
        if(count % 10 == 0):
            ms.exportJson()


##
# @brief scrape a single game
# deprecated
#
def scrapeAndPrintGame(ms):
    response = raw_input("What game id is needed?\n")
    gameinfo = ms.scrape_info(response, 0)
    if gameinfo:
        print "Keys"
        for field in gameinfo.keys():
            print field, " : ", gameinfo[field]
            # print gameinfo[field]
            # if(isinstance(gameinfo[field], list) and len(gameinfo[field]) > 0):
            #     print field + " : " " ".join(gameinfo[field])
            # else:
            #print field, " : ",(gameinfo[field])

##
# @brief start a specific or random game
# (for later: playlists)
#
def startGame(ms):
    print "----"    
    response = raw_input("Start what Gameid? 'none' for random\n")
    if(response == "none"):
        ms.randomGame()
    else:
        ms.startGame(response)

def openWebPage(ms):
    #open the web page index.html
    print "Visualising"
    cwd = os.getcwd()
    cwd = cwd + "\\timeline.html"
    print "Expecting file to be: " + cwd
    os.startfile(cwd)

        
##
# @brief print the help documentation
#
#
def printHelp(ms):
    print "----"
    for key in commands.keys():

        print key
    print "----"
    

##
# @brief export game information to json
#
#
def exportJson(ms):
    print "Exporting JSON:"
    ms.exportJson()

##
# @brief import json into database
#
#
def importJson(ms):
    print "Importing Json:"
    ms.importJson()

def exportAndExit(ms):
    exportJson(ms)
    exit()

#Comands:

commands = {
    "help":printHelp,
    "printall":printallGames,
    "stats":printStats,
    "info":printInfoForGame,
    "exit":exportAndExit,
    "infoX":scrapeAndPrintGame,
    "start":startGame,
    "export":exportJson,
    "import":importJson,
    "scrapeAll":scrapeAllGames,
    "visualise":openWebPage,
}

##
# @brief The user interaction loop
#
def main():
    # Initialisation:
    metaSteam = JGMetaSteam()
    
    # Main program loop:
    response = raw_input("%:")
    while(response):
        if(response in commands):
            print commands[response](metaSteam)
        else:
            print "not found"
                    
        response = raw_input("%:")

try:
    main()
except Exception as e:
    print "Main Error"
    print type(e)
    print e
    PrintException()
finally:
    raw_input("....")
