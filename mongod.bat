set CWD=%cd%
cd /d C:\"Program Files"\MongoDB\Server\3.2\bin\
mongod.exe
rem --config="%CWD%\mongod.cfg"
pause
