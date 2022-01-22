@ECHO OFF

SET jsdocConfigFile="./jsdoc.json"

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/jsdoc_gen.cmd

jsdoc -c %jsdocConfigFile%
