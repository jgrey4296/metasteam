
import os
import win32api
import glob
import codecs
import json


class MetaSteam:

    def __init__(self,userName):
        self.userName = userName
        self.installedGames = []
        self.profileGames = []
        self.programLocation = os.path.dirname(os.path.abspath(__file__))
        self.libraryLocations =[]
        self.steamLocation = ""
        print "TODO: initialise"

        #initialisation:
        self.findLibraries()
        self.findSteam()
        self.importFromJson()
        

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
                folder = drive + "\\Steam\steamapps\\"
                print "Found: " + folder
                if os.path.exists(folder):
                    self.libraryLocations.append(folder)

    def findSteam(self):
        print "Hard coding Steam Location"
        self.steamLocation = "C:\\Program Files (x86)\\Steam\\"

    def exportToJson(self):
        print "TODO: export data to json"

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

            
    def loadGames(self):
        print "TODO: load installed game list"
        for folder in self.libraryLocations:
            manifests = glob.glob(folder + "*.acf")
            for manifest in manifests:
                self.parseManifest(manifest)

    def parseManifest(self,manifest):
        print "TODO: parse manifest"
        

                
    def profileGames(self):
        print "TODO: load games from profile"
        
    def getInfoForGame(self,game):
        print "TODO: get info for a game from the steam store"

    def getInfoForAllGames(self):
        print "TODO: get all games info from steam"

    def loadVisualisation(self,visName):
        print "TODO: open web visualisation"

    def startGame(self,game):
        print "TODO: start a game"

    def startRandomGame(self):
        print "TODO: start random game"

    
if __name__ == "__main__":
    metaSteam = MetaSteam("belial4296")
