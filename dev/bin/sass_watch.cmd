@ECHO OFF

SET inputDir=./dev/scss/
SET outputDir=./dist/web/res/css/

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/sass_watch.cmd

sass ^
    --watch ^
    --style expanded ^
    --charset ^
    --source-map ^
    %inputDir%:%outputDir%
