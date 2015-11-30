## The Main MetaSteam Program
# @module MetaSteam
#
# For Reference see:
# http://timgolden.me.uk/python/win32_how_do_i.html
# http://www.logix4u.net/component/content/article/27-tutorials/44-how-to-create-windows-executable-exe-from-python-script

import sys
import os
import platform
import subprocess
import threading
import time
import webbrowser
import logging
import datetime
#Register Firefox:

#print "TRY ORDER:"
#print webbrowser._tryorder


if platform.system() == 'Windows':
    import win32api
#    if os.path.exists("C:\\Program F~\\Mozilla Firefox\\firefox.exe"):
#        webbrowser.get("open -a C:\\Program F~\\Mozilla Firefox\\firefox.exe %s")
#    else:
#        print "Could Not find firefox"
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
from SteamProfileScraper import SteamProfileScraper
import MetaSteamHTTPServer


waitTime = 10

#utility for py2exe:
def isFrozen():
    return hasattr(sys,"frozen")



#Main MetaSteam class
class MetaSteam:

    #ctor
    def __init__(self,userName,globalNum):

        logging.info("Initialising MetaSteam");
        #Locks: (TODO)
        self.jsonLock = threading.Lock()
        self.internalDataLock = threading.Lock()

        #Data:
        self.userName = None
        self.globalNumberOfGamesToSearch = int(globalNum)
        #Steam Executable Location:
        self.steamLocation = None
        #Steam Libraries:
        self.libraryLocations =[]

        #Load settings
        self.loadSettingsFromJson()
        
        
        #Found Game Information
        self.installedGames = {} #key = appid 
        self.profileGames = {} #key = appid
        
        #Location of meta steam program:
        if isFrozen():
            self.programLocation = os.path.dirname(unicode(sys.executable,sys.getfilesystemencoding()))
        else:
            self.programLocation = os.path.dirname(unicode(__file__,sys.getfilesystemencoding()))
        logging.info("programLocation="+self.programLocation)
        

        #steam store scraper:
        self.scraper = SteamStoreScraper()
        self.profileScraper = SteamProfileScraper(self.userName)
        
        #initialisation:
        self.findLibraries()
        self.findSteam()
        #import already scraped gameData
        self.importFromJson()

        if not self.profileGames:
            self.getProfileGames()
        else:
            logging.info("Skipping Profile Scrape")
            
        self.loadGames()
        
        #By this point, all previously found games
        #should be loaded. Now just find new games,
        #and get info for them

        getInfoThread = threading.Thread(target=MetaSteam.getInfoForAllGames,args=(self,))
        getInfoThread.start()
        
    #foreach drive that has a directory with 'steam'
    #in the name, add it to the list as 'drive\steam\steamapps'
    def findLibraries(self):
        logging.info("finding libraries")
        if skipWin: return
        
        drives = win32api.GetLogicalDriveStrings()
        logging.info("Drives:" + str(drives))
        drives = drives.split('\000')[:-1]
        for drive in drives:
            logging.info( "Checking Drive: " + drive)
            loc = os.path.join(drive,"*")
            result = glob.glob(loc)
            #TODO: check lower case behaviour for windows
            potentials = [s for s in result if "steam" in s.lower()]
            #if any("steam" in s.lower() for s in result):
            for potential in potentials:
                folder = os.path.join(potential,"steamapps")
                logging.info( "Found: " + folder)
                if os.path.exists(folder):
                    self.libraryLocations.append(folder)
                else:
                    logging.warn("Steam Location Doesnt Exist: " + folder)
                    raise MetaSteamException("Steam Location doesnt exist: " + folder)

    #====================
    def findSteam(self):
        logging.info("Finding Steam")
        if skipWin: return
        
        logging.info("Hard coding Steam Location")
        steamLocation = os.path.join("C:\\","Program Files (x86)","Steam")
        logging.info("Steam Location: " + steamLocation)
        if os.path.exists(steamLocation):
            logging.info("Steam Location Exists")
            self.steamLocation = steamLocation
            self.libraryLocations.append(os.path.join(steamLocation,"steamapps"))
        else:
            logging.warn("Couldn't find Steam")
            raise MetaSteamException("Default Steam Location doesnt exist")

    #--------------------
    def exportToJson(self):
        logging.info("Exporting to Json")
        #if not os.path.exists(os.path.join(self.programLocation,"data","gameData.json")): return
        self.jsonLock.acquire()
        self.internalDataLock.acquire()
        outputFile = open(os.path.join(self.programLocation,"data","gameData.json"),'w')
        combinedData = {}
        combinedData['installed'] = self.installedGames
        combinedData['profile'] = self.profileGames
        outputJson = json.dump(combinedData,outputFile,sort_keys=True, indent=4, separators=(','':'),ensure_ascii=True, skipkeys=True)
        outputFile.close()
        self.internalDataLock.release()
        self.jsonLock.release()

                          
    #--------------------
    def importFromJson(self):
        try:
            self.jsonLock.acquire()
            self.internalDataLock.acquire()
            logging.info("Loading Json")
            inputFile = codecs.open(os.path.join(self.programLocation, "data","gameData.json"))
            importedJson = json.load(inputFile)
            #
            for game in importedJson['installed'].values():
                self.installedGames[game['appid']] = game
            #
            for game in importedJson['profile'].values():
                self.profileGames[game['appid']] = game
        except Exception as e:
            logging.warn(str(e))
        finally:
            self.jsonLock.release()
            self.internalDataLock.release()

    #----------
    #Loads the settings.json file from the data dir,
    #and populates relevant variables with it
    def loadSettingsFromJson(self):
        try:
            inputFile = codecs.open(os.path.join(self.programLocation,"data","settings.json"))
            importedJson = json.load(inputFile)

            self.userName = importedJson['steamProfileName']
            self.steamLocation = importedJson['steamExecutableLocation']
            self.libraryLocations = importedJson['steamLibraryLocations']
            #todo: deal with web browser
            
        except Exception as e:
            logging.warn(str(e))
        
            
    #--------------------
    def loadGames(self):
        for folder in self.libraryLocations:
            manifests = glob.glob(os.path.join(folder,"*.acf"))
            for manifest in manifests:
                self.parseManifest(manifest)

    #--------------------
    def parseManifest(self,manifest):
        f = file(manifest,'r')
        regex = re.compile('"(.+?)"\s+"(.+?)"')
        data = {}
        for line in f:
            line = unicode(line,errors="ignore")
            logging.info("Line type: " + str(type(line)))
            match = regex.search(line)
            if match:
                data[match.group(1)] = match.group(2)
        
        gameid = data['appid']
        logging.info("Found: " + data['name'])
        logging.info("TYPE: " + str(type(gameid)))
        data['__Installed'] = True
        if not gameid in self.installedGames.keys():
            self.installedGames[gameid] = data
        else:
            for field in data.keys():
                self.installedGames[gameid][field] = data[field]

    #----------
    def combineData(self):
        print("TODO:combine data from store scraping and profile scraping")
        logging.warn("Combine Data not implemented")
                
    #--------------------
    def getProfileGames(self):
        logging.info( "Getting Profile Games")
        extractedInfo = self.profileScraper.scrape()
        self.profileGames = extractedInfo
        

    #--------------------
    
    #get steam page tags and release date
    def getInfoForGame(self,game):
        logging.info("Getting Info for Game: " + str(game['appid']))
        try:

            extractedInfo = self.scraper.scrape(game['appid'])
            game['__tags'] = extractedInfo[0]
            game['releaseDate'] = extractedInfo[1]
            game['__description'] = extractedInfo[2]
            game['__review'] = extractedInfo[3]
            game['__developer'] = extractedInfo[4]
            game['__publisher'] = extractedInfo[5]
            game['__scraped'] = True

            return game
        except Exception as e:
            logging.warn(str(e))
            return game
            
    #automate
    #@TODO: be able to reset __scraped
    def getInfoForAllGames(self):
        scrapedGames = []
        for game in self.installedGames.values():
            if self.globalNumberOfGamesToSearch < 1: continue
            if '__scraped' in game:
                continue
            self.internalDataLock.acquire()
            self.installedGames[game['appid']] = self.getInfoForGame(game)
            self.internalDataLock.release()
            if 'name' in game.keys():
                logging.info("Game: " + game['name'] + " parsed")
                game['__scraped'] = True
            self.exportToJson()
            self.globalNumberOfGamesToSearch -= 1
            scrapedGames.append(game['name'])
            time.sleep(waitTime)
        logging.info( "Have scanned all games for this run: " + " ".join(scrapedGames))
        self.exportToJson()
        
    def loadVisualisation(self):
        #Start the web server in a separate thread
        logging.info( "Sending to RunLocalServer: " + str(self))
        serverThread = threading.Thread(target=MetaSteamHTTPServer.runLocalServer,args=(self,))

        serverThread.start()
        logging.info( "\nOPENING WEBBROWSER:\n\n")


        #webbrowser.open("http:\\google.com")
        webbrowser.open("http:\\localhost:8000\web\MetaSteam.html")
        #webbrowser.open(self.programLocation +"\web\MetaSteam.html")

    #called from the web interface, through the server
    def startGame(self,appid):
        logging.info( "Starting game: " + str(appid))
        if appid == None:
            appid = 440
            logging.warn( "No Appid, defaulting to TF2")
        logging.info("Opening using: " + self.steamLocation)
        subprocess.call([os.path.join(self.steamLocation,"Steam.exe"),"-applaunch",str(appid)])
        

        
if __name__ == "__main__":
    #setup the logging to a file
    logging.basicConfig(filename=
                        str(datetime.date.today())
                        + "_metaSteam.log")
    #number of games to scrape in a session
    globalNumToSearch = 10000
    if len(sys.argv) >= 2:
        globalNumToSearch = sys.argv[1]
    logging.info("globalNumToSearch=" + str(globalNumToSearch))
    metaSteam = MetaSteam(globalNumToSearch)
    metaSteam.loadVisualisation()
    #metaSteam.startGame(440)
