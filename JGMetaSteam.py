##
# @file JGMetaSteam.py
# @brief The metaSteam class that does the heavy lifting

from jgUtility import *
import os
import codecs
import glob
import win32api
import re
import urllib2
import urllib
from bs4 import BeautifulSoup
from subprocess import call
import random
import json
from SteamProfileScraper import SteamProfileScraper
from AgeCheckAvoider import AgeCheckAvoider

##
#@class JGMetaSteam
#@todo sort the globbing
#@todo sort the web calling and parsing
#@todo sort json import and e3xport
#@todo sort the random game execution
class JGMetaSteam:

    ## Constructor
    #  
    #
    def __init__(self):
        cwd = os.getcwd()
        print "CWD: ", cwd, "\n\n\n\n"
        self.exportedJsonLocation = cwd + "\\metaSteamGameList.json"
        self.__value = 0
        self.__games = {} # gameid ->{game}
        self.__allGames = [] # all acount games.  with name inside
        self.__folders = [] #of steam installation directories
        self.steamLocation = "" # of the steam executable
        self.profileName = "belial4296"
        # self.find_steam()
        self.ageCheckAvoider = AgeCheckAvoider()
        self.find_steam_folders()
        try:
            self.importJson()
            print "imported json"
        except:
            print "scraping"
            self.find_installed_games()
            #self.scrapeProfile()
        finally:
            raw_input(".........")

    ## Find Steam
    # @brief Searches the filesystem for where steam is
    # 
    # This allows command line calling of games
    # @todo implement
    def find_steam(self):
        print "Checking for Steam:"
        results = glob.glob("C:\\Program Files (x86)\\Steam\\*")
        if("Steam.exe" in results):
            print "Found Steam"
        self.__folders.append("C:\\Program Files (x86)\\Steam\\steamapps\\")

    ## Find Steam folders
    # @brief Searches the filesystem for where steam games are
    # 
    # This enables searching for installed games
    # @todo implement
    def find_steam_folders(self):
        print "Steam Folders:"
        #drives = ["C:/","D:/"]
        drives = win32api.GetLogicalDriveStrings()
        drives = drives.split('\000')[:-1]
        for drive in drives:
            print "Checking Drive:" + drive
            loc = drive + "\*"
            result = glob.glob(loc)
            if any("Steam" in s for s in result):
               print "found..." 
               folder = drive + "\\Steam\\steamapps\\"
               self.__folders.append(folder)
        
    ## Find Installed games
    # @brief the steam folders for steamapps and their acfmanifest    
    # calls parseManifest on each manifest found,
    # 
    # @todo implement
    def find_installed_games(self):
        print "Finding Games"
        #foreach steamfolder
        for folder in self.__folders:
            #glob the acf manifests
            print "Globbing: " + folder
            manifests = glob.glob(folder + "*.acf")
            print "Found Games: ",len(manifests)
            for manifest in manifests:
               self.parseManifest(manifest)

    ## Open and parse a manifest to extract starting information
    #
    #
    def parseManifest(self,manifest):
        
        f = file(manifest,'r')
        regex = re.compile('"(.+?)"\s+"(.+?)"')
        data = {}
        for line in f:
            line = unicode(line,errors="ignore")
            #print "Line type:",type(line)
            match = regex.search(line)
            if match:
                data[match.group(1)] = match.group(2)
        
        gameid = data['appid']
        #print "TYPE: ",type(gameid)
        data['jgInstalled'] = True
        self.__games[gameid] = data
               
 

    ## Outputs information on a game
    # @brief Takes a gameid, searches the found games, returns all information
    # 
    # @param gameid The numeric representation of a game
    # @todo implement
    def game_info(self, gameid):
        print "Looking for: ",gameid
        if(gameid in self.__games):
            return self.__games[gameid]
        print "Game Not Found"
        return {}
  
    ## Outputs names all games found
    # @brief get all the installed games names
    # @deprecated
    # 
    # @todo implement
    def allGames(self):
        gameList = []
        for game in self.__games:
            gameList.append((self.__games[game]['name'],game))
        return gameList

    ## Outputs names all games found
    # @brief get all the installed games names
    # 
    # 
    # @todo implement
    def allKeywordGames(self,keyword):
        gameList = []
        for game in self.__games.values():
            if(keyword in game and 
               (game[keyword] != False)):
                gameList.append(game)
        return gameList


    ## Scrapes the steam store for a games information
    # @brief Takes a gameid, looks up its steam page, filters and adds to
    # the games datastructure
    # 
    # @param gameid The numeric representation of a game
    # @todo replace with improved external script
    def scrape_info(self,gameid,override):
        #exit out if the game has already been parsed.
        #if(hasattr(self.__games[gameid],'parsed')):
        try:
            if("jgParsed" in self.__games[gameid]
               and override is 0):
                print "\n\n\n\nAlready Scraped\n\n"
                return self.__games[gameid]
            print "getting url for: ", gameid
            #setup the url request
            scrapedInfo = self.ageCheckAvoider.scrape(gameid)
            self.__games[gameid]['jgTags'] = scrapedInfo[0]
            self.__games[gameid]['releaseDate'] = scrapedInfo[1]
            self.__games[gameid]['jgParsed'] = True
            return self.__games[gameid]
        except:
            PrintException()
        
    ##
    # @brief call and scrape user profile page
    #
    #
    def scrapeProfile(self):
#        print "Scraping Profile"
        scraper = SteamProfileScraper(self.profileName)
        gameDict = scraper.scrape()

        self.__allGames = gameDict
#        print type(self.__allGames)

        try:
            for game in gameDict:
                appid = get_unicode(game['appid'])
                #print "Scraping Profile Appid type:", type(appid)
                if(appid in self.__games):
                    existingGame = self.__games[appid]
                    #foreach profile game key
                    for key in game.keys():
                        #print "Game Type for Key:",key,type(game[key])
                        if(not key in existingGame):
                            # add the value to the existing game
                            existingGame[key] = game[key]
                            
                else:
                    #game isnt installed, add and flag
                    game['jgInstalled'] = False
                    self.__games[appid] = game
        except Exception as e:
            print e
        
    #====================
    #Various functions:

    ##
    # @brief start a user defined game, based on gameid
    # or choose a random one if none defined
    #
    def startGame(self,gameid):
        #request gameid to start:
        if(self.__games[gameid]):
            print "Starting Game: " + self.__games[gameid]['name']
            #perform system call to steam
            call(["C:\Program Files (x86)\Steam\Steam.exe", "-applaunch", gameid])
        
        
    ##
    # @brief
    #
    #
    def randomGame(self):
        #select randomly
        allGameIds = [gameid for gameid in self.__games.keys()]
        randGame = random.choice(allGameIds)
        #call Start game
        self.startGame(randGame)

    ##
    # @brief export information to json format
    # for import into d3
    #
    def exportJson(self):
        print "\n\n EXPORTING JSON"
        #game info -> array of objects
        #allGames = [self.__games[game] for game in self.__games]
        
        outputFile = open(self.exportedJsonLocation,'w')
        outJson = json.dump(self.__games,outputFile,sort_keys=True, indent=4, separators=(',',': '), ensure_ascii=True, skipkeys=True, )
        outputFile.close()
        print "Exporting finished"
        
    ##
    # @brief import saved and parsed data
    #
    #
    def importJson(self):
            inputFile = codecs.open(self.exportedJsonLocation,"r")
            importedGames = json.load(inputFile)
            for key in importedGames.keys():
                game = importedGames[key]
                appid = get_unicode(_if_number_get_string(game['appid']))
                #print "Adding: ", game['name']
                self.__games[appid] = game
            print "Games Loaded"

    ##
    # @brief system call to visualisation d3 html page
    #
    #
    def openVisualisation(self):
        #export json
        print "todo"
        #system call to open web page


    ## The following from:
    #https://stackoverflow.com/questions/7219361/python-and-beautifulsoup-encoding-issues
        

#             for key in gameDict[0].keys():
#                 print "key: ",key, "type: ",type(key),
#                 print "value: ",gameDict[0][key],"type: ", type(gameDict[0][key])
#                 if(key == 'appid'):
# #                    print "Appid: ",gameDict[0][key]
#  #                   print "Appid: ",(gameDict[0][key] + 1)
#   #                  print "Appid: ", str(gameDict[0][key])
#    #                 print "Type: ", type(get_unicode(str(gameDict[0][key])))
#                     if(get_unicode(str(gameDict[0][key])) in self.__games):
