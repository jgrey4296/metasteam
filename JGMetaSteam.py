##
# @file JGMetaSteam.py
# @brief The metaSteam class that does the heavy lifting

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
        self.__value = 0
        self.__games = {} # gameid ->{game}
        self.__allGames = [] # all acount games.  with name inside
        self.__folders = [] #of steam installation directories
        self.steamLocation = "" # of the steam executable
        # self.find_steam()
        self.ageCheckAvoider = AgeCheckAvoider()
        self.find_steam_folders()
        self.find_installed_games()
        self.profileName = "belial4296"
        try:
            self.scrapeProfile()
        except Exception as e:
            print type(e)
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
            line = unicode(line,errors='ignore')
            #print line
            match = regex.search(line)
            if match:
                data[match.group(1)] = match.group(2)
        gameid = data['appid']

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
    # 
    # 
    # @todo implement
    def allGames(self):
        gameList = []
        for game in self.__games.values():
            gameList.append((game['name'],game['appid']))
        return gameList


    ## Scrapes the steam store for a games information
    # @brief Takes a gameid, looks up its steam page, filters and adds to
    # the games datastructure
    # 
    # @param gameid The numeric representation of a game
    # @todo replace with improved external script
    def scrape_info(self,gameid):
        #exit out if the game has already been parsed.
        if(hasattr(self.__games[gameid],'parsed')):
            return self.__games[gameid]
        print "getting url for: ", gameid
        #setup the url request
        tags = self.ageCheckAvoider.request(gameid)
        
        self.__games[gameid]['tags'] = tags

    ##Parses html assuming its a steam store page
    #
    #
    #
    def parseStore(self,soup,gameid):
        print "parsing"
        game = self.game_info(gameid)
        game['tags'] = []
        game['description'] = []

        #name
        try:
            title = soup.find(class_="apphub_AppName")
            game['name'] = unicode(title.string)
        except:
            print "Name Missing Error"
        
        #tags:
        try:
            tags = soup.find_all(class_="app_tag")
            
            for tag in tags:
                game['tags'].append(unicode(tag.string.strip()))
        
            #other tags:
            tags = soup.find_all(class_="game_area_details_specs")
                
            for tag in tags:
                link = tag.a;
                game['tags'].append(unicode(link.string.strip()))
        except:
            print "Tag Error"

        #description:
        print "DESCRIPTION"
        gameDescription = soup.find_all(id="game_area_description")

        for element in gameDescription:
            for strings in element.stripped_strings:
                game['description'].append(strings)

        print "Finished parsing"
        game['parsed'] = 1
        return game

    ##
    # @brief call and scrape user profile page
    #
    #
    def scrapeProfile(self):
        print "Scraping Profile"
        scraper = SteamProfileScraper(self.profileName)
        gameDict = scraper.request()

        self.__allGames = gameDict
        print type(self.__allGames)

        try:

            for game in gameDict:
                appid = get_unicode(str(game['appid'])) 
                if(appid in self.__games):
                    existingGame = self.__games[appid]
                    for key in game.keys():
                        if(not key in existingGame):
                            existingGame[key] = game[key]

                        

                    
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
        #game info -> array of objects
        #allGames = [self.__games[game] for game in self.__games]
        outputFile = open("D:/Dropbox/steamGames.json",'w')
        outJson = json.dump(self.__games,outputFile,sort_keys=True, indent=4, separators=(',',': '), ensure_ascii=True,)
        outputFile.close()
        
    ##
    # @brief import saved and parsed data
    #
    #
    def importJson(self):
        try:
            inputFile = codecs.open("D:/Dropbox/steamGames.json","r")
            self.__games = json.load(inputFile)
            print "Games Loaded"
        except:
            print "No json to load"

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
def __if_number_get_string(number):
    converted_str = number
    if isinstance(number, int) or \
       isinstance(number, float):
        converted_str = str(number)
    return converted_str
        
        
def get_unicode(strOrUnicode, encoding='utf-8'):
    strOrUnicode = __if_number_get_string(strOrUnicode)
    if isinstance(strOrUnicode, unicode):
        return strOrUnicode
    return unicode(strOrUnicode, encoding, errors='ignore')
        
def get_string(strOrUnicode, encoding='utf-8'):
    strOrUnicode = __if_number_get_string(strOrUnicode)
    if isinstance(strOrUnicode, unicode):
        return strOrUnicode.encode(encoding)
    return strOrUnicode
        

#             for key in gameDict[0].keys():
#                 print "key: ",key, "type: ",type(key),
#                 print "value: ",gameDict[0][key],"type: ", type(gameDict[0][key])
#                 if(key == 'appid'):
# #                    print "Appid: ",gameDict[0][key]
#  #                   print "Appid: ",(gameDict[0][key] + 1)
#   #                  print "Appid: ", str(gameDict[0][key])
#    #                 print "Type: ", type(get_unicode(str(gameDict[0][key])))
#                     if(get_unicode(str(gameDict[0][key])) in self.__games):
