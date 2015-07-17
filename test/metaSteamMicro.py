
import os

class MetaSteam:

    def __init__(self,userName):
        self.userName = userName
        self.installedGames = []
        self.profileGames = []
        self.programLocation = os.path.dirname(os.path.abspath(__file__))
        self.libraryLocations =[]
        print "TODO: initialise"


    def findLibraries(self):
        print "TODO: find libraries"
        drives = win43api.GetLogicalDriveStrings()
        print "Drives:" + str(drives)
        drives = drives.split('\000')[:-1]
        

    def findSteam(self):
        print "TODO: find steam executable"
        

    def exportToJson(self):
        print "TODO: export data to json"

    def importFromJson(self):
        print "TODO: import data from json"
        
    def loadGames(self):
        print "TODO: load installed game list"

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
    metaSteam.findLibraries()
