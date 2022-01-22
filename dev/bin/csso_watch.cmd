@ECHO OFF

SET inputFile="./dist/web/res/css/app.css"
SET outputFile="./dist/web/res/css/app.min.css"

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/csso_watch.cmd
::
:: Note: Will fail if sass_watch.cmd has not yet generated output.

csso ^
    --watch ^
    --stat ^
    --comments none ^
    --input-source-map auto ^
    --source-map file ^
    --input %inputFile% ^
    --output %outputFile%
