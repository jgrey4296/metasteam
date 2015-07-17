
import os
import platform

if platform.system() == 'Windows':
    import win32api
else:
    #dummy class if not on windows
    class win32api:
        def __init__(self):
            print "USING DUMMY API"

        @staticmethod
        def GetLogicalDriveStrings(self):
            return "/"
    
import glob
import codecs
import json
from MetaSteamException import MetaSteamException
from SteamStoreScraper import SteamStoreScraper

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

        #By this point, all previously found games
        #should be loaded. Now just find new games,
        #and get info for them

    #foreach drive that has a directory with 'steam'
    #in the name, add it to the list as 'dive\steam\steamapps'
    def findLibraries(self):
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
        print "Hard coding Steam Location"
        steamLocation = "C:\\Program Files (x86)\\Steam\\"
        if os.path.exists(steamLocation):
            self.steamLocation = steamLocation
            self.libraryLocations.append(steamLocation + "steamapps")
        else:
            raise MetaSteamException("Default Steam Location doesnt exist")

    #--------------------
    def exportToJson(self):
        print "TODO: export data to json"

    #--------------------
    def importFromJson(self):
        print "TODO: import data from json"
        try:
            inputFile = codecs.open(self.programLocation + "/data/gameData.json")
            importedJson = json.load(inputFile)
            for key in importedJson.keys():
                game = importedJson[key]
                print "Imported Json Key: " + key
        except Exception as e:
            print e

    #--------------------
    def loadGames(self):
        print "TODO: load installed game manifests"
        for folder in self.libraryLocations:
            manifests = glob.glob(folder + "*.acf")
            for manifest in manifests:
                self.parseManifest(manifest)

    #--------------------
    def parseManifest(self,manifest):
        print "TODO: parse manifest"
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
        data['__Installed'] = True
        self.installedGames[gameid] = data
        
    #--------------------
    def profileGames(self):
        print "TODO: load games from profile"
        

    #--------------------
    def getInfoForGame(self,game):
        try:
            extractedInfo = self.scraper.scrape(game['appid'])
            game['__tags'] = extractedInfo[0]
            game['releaseDate'] = scrapedInfo[1]
            game['__scraped'] = True
            return game
        except Exception as e:
            print e
            

    def getInfoForAllGames(self):
        print "TODO: get all games info from steam"
        for game in self.installedGames:
            self.installedGames[game.appid] = self.getInfoForGame(game)
            
        
    def loadVisualisation(self,visName):
        print "TODO: open web visualisation"

    def startGame(self,game):
        print "TODO: start a game"

    def startRandomGame(self):
        print "TODO: start random game"

    
if __name__ == "__main__":
    metaSteam = MetaSteam("belial4296")
