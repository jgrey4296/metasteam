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


#Main MetaSteam class
class MetaSteam:

    #ctor
    def __init__(self,userName,globalNum):

        #Locks: (TODO)
        self.jsonLock = threading.Lock()
        self.internalDataLock = threading.Lock()
        
        #Data:
        self.userName = userName
        self.globalNumberOfGamesToSearch = int(globalNum)

        #Found Game Information
        self.installedGames = {} #key = appid 
        self.profileGames = {} #key = appid
        #Location of meta steam program:
        self.programLocation = os.path.dirname(os.path.abspath(__file__))
        #Steam Libraries:
        self.libraryLocations =[]
        #Steam Executable Location:

        self.steamLocation = ""

        #steam store scraper:
        self.scraper = SteamStoreScraper()
        self.profileScraper = SteamProfileScraper(self.userName)
        
        #initialisation:
        self.findLibraries()
        self.findSteam()
        self.importFromJson()
        self.loadGames()
        
        #By this point, all previously found games
        #should be loaded. Now just find new games,
        #and get info for them

        getInfoThread = threading.Thread(target=MetaSteam.getInfoForAllGames,args=(self,))
        getInfoThread.start()
        
    #foreach drive that has a directory with 'steam'
    #in the name, add it to the list as 'drive\steam\steamapps'
    def findLibraries(self):
        if skipWin: return
        
        drives = win32api.GetLogicalDriveStrings()
        print "Drives:" + str(drives)
        drives = drives.split('\000')[:-1]
        for drive in drives:
            print "Checking Drive: " + drive
            loc = os.path.join(drive,"*")
            result = glob.glob(loc)
            if any("Steam" in s for s in result):
                folder = os.path.join(drive,"Steam","steamapps")
                print "Found: " + folder
                if os.path.exists(folder):
                    self.libraryLocations.append(folder)
                else:
                    raise MetaSteamException("Steam Location doesnt exist: " + folder)

    #====================
    def findSteam(self):
        if skipWin: return
        
        print "Hard coding Steam Location"
        steamLocation = os.path.join("C:\\","Program Files (x86)","Steam")
        if os.path.exists(steamLocation):
            self.steamLocation = steamLocation
            self.libraryLocations.append(os.path.join(steamLocation,"steamapps"))
        else:
            raise MetaSteamException("Default Steam Location doesnt exist")

    #--------------------
    def exportToJson(self):
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
            print "Loading Json"
            inputFile = codecs.open(os.path.join(self.programLocation, "data","gameData.json"))
            importedJson = json.load(inputFile)
            #
            for game in importedJson['installed'].values():
                self.installedGames[game['appid']] = game
            #
            for game in importedJson['profile'].values():
                self.profileGames[game['appid']] = game
        except Exception as e:
            print e
        finally:
            self.jsonLock.release()
            self.internalDataLock.release()
            
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

    #----------
    def combineData(self):
        print("TODO:combine data from store scraping and profile scraping")
                
    #--------------------
    def getProfileGames(self):
        extractedInfo = self.profileScraper.scrape(self.userName)
        self.profileGames = extractedInfo
        

    #--------------------
    
    #get steam page tags and release date
    def getInfoForGame(self,game):
        try:

            extractedInfo = self.scraper.scrape(game['appid'])
            game['__tags'] = extractedInfo[0]
            game['releaseDate'] = extractedInfo[1]
            game['__scraped'] = True
            return game
        except Exception as e:
            print e
            
    #automate
    #@TODO: be able to reset __scraped
    def getInfoForAllGames(self):
        for game in self.installedGames.values():
            if self.globalNumberOfGamesToSearch < 1: continue
            if '__scraped' in game:
                continue
            self.internalDataLock.acquire()
            self.installedGames[game['appid']] = self.getInfoForGame(game)
            self.internalDataLock.release()
            if 'name' in game.keys():
                print "Game: " + game['name'] + " parsed"
                game['__scraped'] = True
            self.exportToJson()
            self.globalNumberOfGamesToSearch -= 1
            time.sleep(waitTime)
        self.exportToJson()
        
    def loadVisualisation(self):
        #Start the web server in a separate thread
        print "Sending to RunLocalServer: " + str(self)
        serverThread = threading.Thread(target=MetaSteamHTTPServer.runLocalServer,args=(self,))

        serverThread.start()
        print "\nOPENING WEBBROWSER:\n\n"


        #webbrowser.open("http:\\google.com")
        webbrowser.open("http:\\localhost:8000\web\MetaSteam.html")
        #webbrowser.open(self.programLocation +"\web\MetaSteam.html")

    #called from the web interface, through the server
    def startGame(self,appid):
        print "Starting game: " + str(appid)
        if appid == None:
            appid = 440
            print "No Appid, defaulting to TF2"
        subprocess.call([os.path.join(self.steamLocation,"Steam.exe"),"-applaunch",str(appid)])
        

        
if __name__ == "__main__":
    print "Default MetaSteam"
    globalNumToSearch = 10000
    if len(sys.argv) > 1:
        print "Setting no of games to search to " + str(sys.argv[1])
        globalNumToSearch = sys.argv[1]
    metaSteam = MetaSteam("belial4296",globalNumToSearch)
    metaSteam.loadVisualisation()
    #metaSteam.startGame(440)
