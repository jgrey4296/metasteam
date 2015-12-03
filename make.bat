REM move into the metasteam directory
CD metaSteam

REM run the python build
python setup.py py2exe

REM make the data directory
MD dist/data
REM copy data in
COPY data dist/data

REM make the logs directory
MD dist/logs

REM copy recursively the web directory
MD dist/web
XCOPY web dist/web /s /e

REM CLEANUP
RD build

REM MOVE the dist directory up:
move dist ../

CD ..


