''' The Main MetaSteam Program
@module MetaSteam

For Reference see:
http://timgolden.me.uk/python/win32_how_do_i.html
http://www.logix4u.net/component/content/article/27-tutorials/44-how-to-create-windows-executable-exe-from-python-script
'''

#System imports:
import sys
import os
import platform
import subprocess
import threading
import time
import webbrowser
import logging
import datetime
import glob
import codecs
import json
import re

'''
@block
@purpose detects if the platform is windows, and uses the win api if it is, otherwise mocks up the win api method that is used
'''
if platform.system() == 'Windows':
    import win32api
    skipWin = False
#    if os.path.exists("C:\\Program F~\\Mozilla Firefox\\firefox.exe"):
#        webbrowser.get("open -a C:\\Program F~\\Mozilla Firefox\\firefox.exe %s")
#    else:
#        print "Could Not find firefox"
else:
    skipWin = True
    class win32api:
        @staticmethod
        def GetLogicalDriveStrings():
            return "/"

#MetaSteam imports:
from MetaSteamException import MetaSteamException
from SteamStoreScraper import SteamStoreScraper
from SteamProfileScraper import SteamProfileScraper
import MetaSteamHTTPServer


waitTime = 10

'''
@method isFrozen
@purpose checks to see if this is the py2exe version of metasteam or not
'''
def isFrozen():
    return hasattr(sys,"frozen")



'''
@class MetaSteam
@purpose The main class of metaSteam, holds information, starts web scrapers and server
'''
class MetaSteam:

    '''
    @class MetaSteam
    @method __init__
    @purpose constructor
    @param globalNum The max number of games to scrape in a session
    '''
    def __init__(self,globalNum):

        logging.info("Initialising MetaSteam");
        #Locks:
        #The lock for reading and writing the output json of game data
        self.jsonLock = threading.Lock()
        #the lock for the runtime objects of game data
        self.internalDataLock = threading.Lock()

        #Data:
        self.userName = "unknown"
        self.globalNumberOfGamesToSearch = int(globalNum)
        #Steam Executable Location:
        self.steamLocation = None
        #Steam Libraries:
        self.libraryLocations =[]

        #Location of meta steam program:
        if isFrozen():
            self.programLocation = os.path.dirname(unicode(sys.executable,sys.getfilesystemencoding()))
        else:
            self.programLocation = os.path.dirname(unicode(__file__,sys.getfilesystemencoding()))
        logging.info("programLocation="+self.programLocation)

        
        #The location of the settings json data:
        self.settingsFile = os.path.join(self.programLocation,"data","settings.json")
        
        
        #Game information:
        self.installedGames = {} #key = appid 
        self.profileGames = {} #key = appid
        
        
        #Web Scrapers:
        self.scraper = SteamStoreScraper()
        self.profileScraper = SteamProfileScraper(self.userName)
        
        #initialisation:
        self.loadSettingsFromJson()
        self.findLibraries()
        self.findSteam()

        #TODO: verify locations
        self.verifyLocations()
        
        #import already scraped gameData
        self.importFromJson()

        if not self.profileGames:
            self.getProfileGames()
        else:
            logging.info("Skipping Profile Scrape")
            
        self.loadGamesFromManifests()
        self.exportToJson()
        
        #By this point, all previously found games
        #should be loaded. Now just find new games,
        #and get info for them

        logging.info("Setting up web info extraction thread")
        getInfoThread = threading.Thread(target=MetaSteam.getInfoForAllGames,args=(self,))
        logging.info("Starting web info extraction thread")
        getInfoThread.start()

    '''
    @class MetaSteam
    @method findLibraries
    @purpose To find, across all drives, steam directories for search later
    @modifies MetaSteam.libraryLocations
    '''
    def findLibraries(self):
        if skipWin: return

        try:
            logging.info("finding libraries")        
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
                    if os.path.exists(folder):
                        logging.info( "Found: " + folder)
                        self.libraryLocations.append(folder)
                    else:
                        logging.warn("Steam Location Doesnt Exist: " + folder)
                        #raise MetaSteamException("Steam Location doesnt exist: " + folder)
        except Exception as e:
            logging.error("Exception: findLibraries: " + str(e))

    '''
    @class MetaSteam
    @method findSteam
    @purpose finds the steam executable
    @modifies MetaSteam.steamLocation
    @modifies MetaSteam.libraryLocations
    '''
    def findSteam(self):
        if skipWin: return

        try:
            logging.info("Finding Steam")
            #if a steam location was loaded from settings:
            if self.steamLocation and os.path.exists(self.steamLocation):
                self.libraryLocations.append(os.path.join(self.steamLocation,"steamapps"))
                return
            else:
                logging.warn("Steam Location unknown: " + self.steamLocation)
                logging.warn("Attempting hard coded location")
                steamLocation = os.path.join("C:\\","Program Files (x86)","Steam")
                logging.info("Steam Location: " + steamLocation)
                
            if os.path.exists(steamLocation):
                logging.info("Steam Location Exists")
                self.steamLocation = steamLocation
                self.libraryLocations.append(os.path.join(steamLocation,"steamapps"))
                return
            else:
                logging.warn("Couldn't find Steam")
                #raise MetaSteamException("Default Steam Location doesnt exist")
            #final fallback:
            self.steamLocation = None
        except Exception as e:
            self.steamLocation = None
            logging.error("Exception: findSteam: " + str(e))
        

    '''
    @class MetaSteam
    @method verifyLocations
    @purpose verifies that steamlocation and steamLibraries exist
    '''
    def verifyLocations(self):
        for location in self.libraryLocations:
            if not os.path.exists(location):
                logging.warn("Removing non-existent location: " + location)
                self.libraryLocations.remove(location)
        if self.steamLocation is not None and not os.path.exists(self.steamLocation):
            logging.warn("steamLocation doesnt exist: " + self.steamLocation)
            self.steamLocation = None
        #check the steamLocation points to the exe:
        if self.steamLocation is not None and ".exe" not in self.steamLocation:
            logging.warn("steamLocation isnt an exe: " + self.steamLocation)
            self.steamLocation = None

        
    '''
    @class MetaSteam
    @method exportToJson
    @purpose Exports the found game data, on drive and web scraped, to a file
    @threadSafe
    '''
    def exportToJson(self):
        try:
            logging.info("Exporting to Json")
            if not os.path.exists(os.path.join(self.programLocation,"data")):
                raise MetaSteamException("No Data Directory Exists")
            
            self.jsonLock.acquire()
            self.internalDataLock.acquire()
            outputFile = open(os.path.join(self.programLocation,"data","gameData.json"),'w')
            combinedData = {}
            combinedData['installed'] = self.installedGames
            combinedData['profile'] = self.profileGames
            outputJson = json.dump(combinedData,outputFile,sort_keys=True, indent=4, separators=(','':'),ensure_ascii=True, skipkeys=True)
        except Exception as e:
            logging.error("Exception: exportToJson: " + str(e))
        finally:
            outputFile.close()
            self.internalDataLock.release()
            self.jsonLock.release()
            
            

    '''
    @class MetaSteam
    @method importFromJson
    @purpose Loads a json file that has information about games
    @modifies MetaSteam.installedGames
    @modifies MetaSteam.profileGames
    @threadSafe
    '''
    def importFromJson(self):
        inputFile = None
        try:
            self.jsonLock.acquire()
            self.internalDataLock.acquire()
            logging.info("Loading Game Data Json")
            inputFile = codecs.open(os.path.join(self.programLocation, "data","gameData.json"))
            importedJson = json.load(inputFile)
            #
            for game in importedJson['installed'].values():
                self.installedGames[game['appid']] = game
            #
            for game in importedJson['profile'].values():
                self.profileGames[game['appid']] = game

        except Exception as e:
            logging.error("Exception: importFromJson: " + str(e))
        finally:
            if inputFile:
                inputFile.close()
            self.jsonLock.release()
            self.internalDataLock.release()


    '''
    @class MetaSteam
    @method loadSettingsFromJson
    @purpose To load external settings for username,steamlocation,librarylocations
    @modifies MetaSteam.userName
    @modifies MetaSteam.steamLocation
    @modifies MetaSteam.libraryLocations
    '''
    def loadSettingsFromJson(self):
        try:
            logging.info("Loading settings from json")
            inputFile = codecs.open(self.settingsFile)
            importedJson = json.load(inputFile)
            self.userName = importedJson['steamProfileName']
            logging.info("Loaded username:" + self.userName)
            self.steamLocation = importedJson['steamExecutableLocation']
            logging.info("Loaded steam location:" + self.steamLocation)
            self.libraryLocations = importedJson['steamLibraryLocations']
            logging.info("Loaded libraryLocations:" + str(self.libraryLocations))
            #todo: deal with web browser
        except Exception as e:
            logging.exception("Exception: loadSettingsFromJson: " + str(e))
        finally:
            inputFile.close()
        
            
    '''
    @class MetaSteam
    @method loadGamesFromManifest
    @purpose find all installed manifests in libraryLocations, parse each manifest
    '''
    def loadGamesFromManifests(self):
        try:
            logging.info("Loading Games")
            for folder in self.libraryLocations:
                manifests = glob.glob(os.path.join(folder,"*.acf"))
                logging.info(str(folder) + " : Number of found manifests: " + str(len(manifests)))
                for manifest in manifests:
                    self.parseManifest(manifest)
        except Exception as e:
            logging.error("Exception: loadGamesFromManifest: " + str(e))

    '''
    @class MetaSteam
    @method parseManifest
    @purpose To take an installed game manifest and extract info from it
    @modifies MetaSteam.installedGames[gameid]
    @threadSafe
    '''                
    def parseManifest(self,manifest):
        try:
            logging.info("Parsing a manifest")
            f = open(manifest,'r')
            regex = re.compile('"(.+?)"\s+"(.+?)"')
            data = {}
            for line in f:
                line = unicode(line,errors="ignore")
                #logging.info("Line type: " + str(type(line)))
                match = regex.search(line)
                if match:
                    data[match.group(1)] = match.group(2)
            gameid = data['appid']
            logging.info("Found: " + data['name'])
            logging.info("TYPE: " + str(type(gameid)))
            data['__Installed'] = True
            #if it doesnt exist yet:
            if not gameid in self.installedGames.keys():
                self.internalDataLock.acquire()
                self.installedGames[gameid] = data
                self.internalDataLock.release()
            else:
                #if it exists already copy over information
                self.internalDataLock.acquire()
                for field in data.keys():
                    self.installedGames[gameid][field] = data[field]
                self.internalDataLock.release()
        except Exception as e:
            logging.error("Exception: parseManifest: " + str(e))
        finally:
            f.close()


    '''
    @class MetaSteam
    @method combineData
    @todo
    @purpose To fold the two forms of stored data together
    '''
    def combineData(self):
        print("TODO:combine data from store scraping and profile scraping")
        logging.warn("Combine Data not implemented")
                

    '''
    @class MetaSteam
    @method getProfileGames
    @purpose Call the profile scraper, to extract all information about a users games, not just installed games
    @modifies MetaSteam.profileGames
    @threadSafe
    '''
    def getProfileGames(self):
        try:
            logging.info( "Getting Profile Games")
            extractedInfo = self.profileScraper.scrape()
            self.internalDataLock.acquire()
            self.profileGames = extractedInfo
        except Exception as e:
            logging.error("Exception: getProfileGames: " + str(e))
        finally:
            self.internalDataLock.release()
        

    '''
    @class MetaSteam
    @method getInfoForGame
    @purpose To store scrape a specific game, and update the passed in game's data
    @para game A Game dictionary, likely built from a parsed manifest
    '''
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
        except Exception as e:
            logging.warn("Exception: getInfoForGame: " + str(e))
        finally:
            return game
            
    '''
    @class MetaSteam
    @method getInfoForAllGames
    @purpose for all games installed, scrape information about them
    @todo be able to reset __scraped
    @threadSafe
    '''        
    def getInfoForAllGames(self):
        try:
            logging.info("Getting web information for all games")
            scrapedGames = []
            for game in self.installedGames.values():
                if self.globalNumberOfGamesToSearch < 1: break
                if '__scraped' in game:
                    continue
                try:
                    self.internalDataLock.acquire()
                    self.installedGames[game['appid']] = self.getInfoForGame(game)
                except Exception as e:
                    logging.error("Exception: getInfoForAllGames: " + game['appid'] + str(e))
                finally:
                    self.internalDataLock.release()
            
                if 'name' in game.keys():
                    logging.info("Game: " + game['name'] + " parsed")
                    game['__scraped'] = True
                self.exportToJson()
                self.globalNumberOfGamesToSearch -= 1
                scrapedGames.append(game['name'])
                time.sleep(waitTime)
                
            logging.info( "Have scanned all games for this run: " + " ".join(len(scrapedGames)))
        except Exception as e:
            logging.error("Exception: getInfoForAllGames: " + str(e))
        finally:
            self.exportToJson()

            


    '''
    @class MetaSteam
    @method loadVisualisation
    @purpose Starts the http server and opens the web browser to the metaSteam page
    '''
    def loadVisualisation(self):
        try:
            #Start the web server in a separate thread
            logging.info( "Sending to RunLocalServer: " + str(self))
            serverThread = threading.Thread(target=MetaSteamHTTPServer.runLocalServer,args=(self,))
            serverThread.start()
            logging.info( "\nOPENING WEBBROWSER:\n\n")

            webbrowser.open("http:\\localhost:8000\web\MetaSteam.html")
        except Exception as e:
            logging.error("Exception: loadVisualisation: " + str(e))
            
    '''
    @class MetaSteam
    @method startGame
    @purpose Calls the steam executable to start the specified game
    @param appid the steam appid of the game you want to start
    '''
    def startGame(self,appid):
        try:
            if self.steamLocation is None:
                logging.warn("Tried to start game, but there is no registered steam executable")
                return False
        
            logging.info( "Starting game: " + str(appid))
            if appid == None:
                appid = 440
                logging.warn( "No Appid, defaulting to TF2")
            logging.info("Opening using: " + self.steamLocation)
            subprocess.call([self.steamLocation,"-applaunch",str(appid)])
            return True
        except Exception as e:
            logging.error("Exception: startGame: " + str(e))
        finally:
            return False
            
        

'''
@main
@purpose sets up logging and creates the metasteam object. Once created, starts up the visualisation
'''
if __name__ == "__main__":
    #setup the logging to a file
    logName = "metaSteam_" + str(datetime.date.today()) + ".log"
    logging.basicConfig(filename=os.path.join("logs",logName),level=logging.DEBUG)
    #number of games to scrape in a session
    maxGamesToScrape = 10000
    if len(sys.argv) >= 2:
        maxGamesToScrape = sys.argv[1]
    logging.info("maxGamesToScrape=" + str(maxGamesToScrape))
    metaSteam = MetaSteam(maxGamesToScrape)
    metaSteam.loadVisualisation()
    #metaSteam.startGame(440)
