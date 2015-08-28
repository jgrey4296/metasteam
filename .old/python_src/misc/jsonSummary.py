#!/usr/bin/python

import json
import os
import sys
import codecs

#total fields for inner objects:
fields = []

cwd = os.getcwd()

print "Arg: " + sys.argv[1]
loadPath = cwd + "/" + sys.argv[1]
print "Load path: " + loadPath
file = codecs.open(loadPath)
loadedJson = json.load(file)

appids = loadedJson.keys()

keys = set()
subkeys = set()

for steamid in appids:    
    game = loadedJson[steamid]
    for key in game.keys():
        keys.add(key)
        if(type(game[key]) is dict):
            subkeys.add(game[key],keys())
        
print "\n\nFields:"
for key in sorted(keys):
    print key

print "\n\n Subkeys:"
for key in sorted(subkeys):
    print key    
