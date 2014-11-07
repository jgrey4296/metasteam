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
    for key in game:
        if type(game[key]) is dict:
            keys.append((key, game[key].keys()))
        else:
            keys.append((key, 0))



keys = set(k for k in keys)        
keys = sorted(keys)

print "\n\nFields:"
for key in keys:
    print key


