REM move into the metasteam directory
CD metaSteam

REM run the python build
python setup.py py2exe

REM make additional dirs
CD dist
MD data
MD logs
MD web
CD ..


REM copy data in
COPY data dist\data
XCOPY web dist\web /s

REM CLEANUP
RD build /S /Q

REM MOVE the dist directory up:
move dist ../

CD ..


