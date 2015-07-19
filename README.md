# MetaSteam
=========

A Python Information Scraper combined with d3 visualisation to improve browsing steam games in a users library

# Dependencies:
A Variety of typical python modules, particularly:
platform, subprocess, threading, webbrowser, json

Less Typical:
win32api (pywin32)
BeautifulSoup
urllib and urllib2
cookielib
BaseHTTPServer and SimpleHTTPServer
cgi


#JS Dependencies:
d3,
require



#Project Structure:
The MetaSteamMicro.py program loads and saves json data (saved in src/data), comprised of
information extracted from each steam library found on all harddrives.
The program reads the manifest files for games that are installed, and
then scrapes the steam store page of each game to get store page tags.

When instructed, MetaSteam threads a simple localhost server and opens
a webbrowser to display the web portion of the project (src/web). This
is a set of d3 visualisations that display the scraped tag data. User
interaction enables the sending of POST messages to the python server,
which start the selected game, or a random game, through steam. 


#Building
TODO: add makefile to use py2exe to make this a standalone program
