@ECHO OFF

SET sqlite3Bin="dev/bin/sqlite3.exe"
SET dbPath="dist/data/db.sqlite3"

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/db_admin.cmd

%sqlite3Bin% %dbPath%
