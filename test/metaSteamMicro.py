
import sys
import os
import platform
import subprocess
import threading
import time
if platform.system() == 'Windows':
    import win32api
    skipWin = False
else:
    skipWin = True
    class win32api:
        @staticmethod
        def GetLogicalDriveStrings():
            return "/"
    
import glob
import codecs
import json
import re
from MetaSteamException import MetaSteamException
from SteamStoreScraper import SteamStoreScraper

globalNumberOfGamesToSearch = 10000


#Main MetaSteam class
class MetaSteam:

    #ctor
    def __init__(self,userName):

        #Data:
        self.userName = userName
        #Found Game Information
        self.installedGames = {} #key = appid 
        self.profileGames = {} #key = appid
        #Location of meta steam program:
        self.programLocation = os.path.dirname(os.path.abspath(__file__))
        #Steam Libraries:
        self.libraryLocations =[]
        #Steam Executable Location:
        self.steamLocation = ""
        print "TODO: initialise"

        #steam store scraper:
        self.scraper = SteamStoreScraper()
        
        #initialisation:
        self.findLibraries()
        self.findSteam()
        self.importFromJson()
        self.loadGames()
        
        #By this point, all previously found games
        #should be loaded. Now just find new games,
        #and get info for them
        self.getInfoForAllGames()

        
    #foreach drive that has a directory with 'steam'
    #in the name, add it to the list as 'dive\steam\steamapps'
    def findLibraries(self):
        if skipWin: return
        
        drives = win32api.GetLogicalDriveStrings()
        print "Drives:" + str(drives)
        drives = drives.split('\000')[:-1]
        for drive in drives:
            print "Checking Drive: " + drive
            loc = drive + "\*"
            result = glob.glob(loc)
            if any("Steam" in s for s in result):
                folder = drive + "Steam\\steamapps\\"
                print "Found: " + folder
                if os.path.exists(folder):
                    self.libraryLocations.append(folder)
                else:
                    raise MetaSteamException("Steam Location doesnt exist: " + folder)

    #====================
    def findSteam(self):
        if skipWin: return
        
        print "Hard coding Steam Location"
        steamLocation = "C:\\Program Files (x86)\\Steam\\"
        if os.path.exists(steamLocation):
            self.steamLocation = steamLocation
            self.libraryLocations.append(steamLocation + "steamapps")
        else:
            raise MetaSteamException("Default Steam Location doesnt exist")

    #--------------------
    def exportToJson(self):
        #if not os.path.exists(self.programLocation +"\\data\\gameData.json"): return
        
        outputFile = open(self.programLocation + "\\data\\gameData.json",'w')
        combinedData = {}
        combinedData['installed'] = self.installedGames
        combinedData['profile'] = self.profileGames
        outputJson = json.dump(combinedData,outputFile,sort_keys=True, indent=4, separators=(','':'),ensure_ascii=True, skipkeys=True)
        outputFile.close()

                          
    #--------------------
    def importFromJson(self):
        try:
            inputFile = codecs.open(self.programLocation + "/data/gameData.json")
            importedJson = json.load(inputFile)
            #
            for key in importedJson['installedGames'].keys():
                game = importedJson['installedGames'][key]
                print "Installed Game Key: " + game['name']
                self.installedGames[game['appid']] = game
            #
            for key in importedJson['profileGames'].keys():
                game = importedJson['profileGames'][key]
                print "Profile Game: " + game['name']
                self.profileGames[game['appid']] = game
        except Exception as e:
            print e

    #--------------------
    def loadGames(self):
        for folder in self.libraryLocations:
            manifests = glob.glob(folder + "*.acf")
            for manifest in manifests:
                self.parseManifest(manifest)

    #--------------------
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
        #print "Found: " + data['name']
        #print "TYPE: ",type(gameid)
        data['__Installed'] = True
        if not gameid in self.installedGames.keys():
            self.installedGames[gameid] = data
        else:
            for field in data.keys():
                self.installedGames[gameid][field] = data[field]
        
    #--------------------
    def profileGames(self):
        print "TODO: load games from profile"
        

    #--------------------
    
    #get steam page tags and release date
    def getInfoForGame(self,game):
        try:
            if globalNumberOfGamesToSearch < 1: return game
            extractedInfo = self.scraper.scrape(game['appid'])
            game['__tags'] = extractedInfo[0]
            game['releaseDate'] = extractedInfo[1]
            game['__scraped'] = True
            globalNumberOfGamesToSearch -= 1
            return game
        except Exception as e:
            print e
            
    #automate
    #@TODO: be able to reset __scraped
    def getInfoForAllGames(self):
        for game in self.installedGames:
            if '__scraped' in self.installedGames[game].keys(): continue
            self.installedGames[game] = self.getInfoForGame(self.installedGames[game])
            print "Game: " + game['name'] + " parsed"
            self.exportToJson()
            time.sleep(60)
        self.exportToJson()
        
    def loadVisualisation(self,visName):
        print "TODO: open web visualisation"

    def startGame(self,game):
        print "TODO: start a game"

    def startRandomGame(self):
        print "TODO: start random game"

    
if __name__ == "__main__":
    print "Default MetaSteam"
    if len(sys.argv) > 1:
        print "Setting no of games to search to " + str(sys.argv[1])
        globalNumberOfGamestoSearch = sys.argv[1]
    metaSteam = MetaSteam("belial4296")
