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
import glob
import os
from subprocess import call
import urllib2
from JGMetaSteam import JGMetaSteam
#from BeautifulSoup import BeautifulSoup
import time
 

##
# @brief user input -> function 
#
def printallGames(ms):
    try:
        allTheGames = ms.allGames()
        allTheGames.sort()
        for gameTuple in allTheGames:
            print gameTuple[0],  " : ", gameTuple[1]
        print len(allTheGames)
    except Exception as e:
        print "Something went wrong"
        print e

##
# @brief prints all the info on a single game
# @param gameid Numeric representation of a game.
#
def printInfoForGame(ms):
    response = raw_input("What game id?")
    gameinfo = ms.game_info(response)
    if gameinfo:
        print "Keys"
        for field in gameinfo.keys():
            print field, " : ", gameinfo[field]
                
##
# @brief get all games, and scrape them slowly
#
#
def scrapeAllGames(ms):
    count = 0;
    allTheGames = ms.allGames()
    allTheGames.sort()
    for gameTuple in allTheGames:
        try:
            ms.scrape_info(gameTuple[1])
        except:
            print "Bugger"
        time.sleep(60)
        count += 1
        if(count % 10 == 0):
            ms.exportJson()

##
# @brief scrape a single game
#
#
def scrapeAndPrintGame(ms):
    response = raw_input("What game id?\n")
    gameinfo = ms.scrape_info(response)
    if gameinfo:
        for field in gameinfo.keys():
            print "Field: ", field
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

#Comands:

commands = {
    "help":printHelp,
    "printall":printallGames,
    "info":printInfoForGame,
    "exit":exit,
    "infoX":scrapeAndPrintGame,
    "start":startGame,
    "export":exportJson,
    "import":importJson,
    "scrapeAll":scrapeAllGames,
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
finally:
    raw_input("....")
