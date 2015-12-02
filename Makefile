

all :
	echo todo

testMetaSteam :
	python -m unittest metaSteam.tests.test_metaSteam

testServer :
	python -m unittest metaSteam.tests.test_metaSteamHTTPServer

testAll :
	python -m unittest discover

build : test
	python setup.py py2exe
	rm -r build
	cp -r metaSteam/web dist/
	cp -r metaSteam/data dist/
	mkdir dist/logs
