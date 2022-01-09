@ECHO OFF

SET readmeFile=./README.md
SET inputDir=./dist/web/lib/
SET outoutDir=./dev/jsdoc/

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/jsdoc_gen.cmd

jsdoc ^
    %inputDir% ^
    -r ^
    -R %readmeFile% ^
    -d %outoutDir%
