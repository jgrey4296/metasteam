

all :
	echo todo

testMetaSteam :
	python -m unittest metaSteam.tests.test_metaSteam

testServer :
	python -m unittest metaSteam.tests.test_metaSteamHTTPServer

testAll :
	python -m unittest discover

build :
	- rm -r metaSteam/build
	cp -r metaSteam/web metaSteam/dist/
	cp -r metaSteam/data metaSteam/dist/
	mkdir metaSteam/dist/logs
	cp -r metaSteam/dist dist

clean :
	- rm -r metaSteam/build
	- rm -r metaSteam/dist
	- rm -r dist
