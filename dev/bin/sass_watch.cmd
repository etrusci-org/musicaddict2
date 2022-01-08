@ECHO OFF

SET input=./dev/scss/app.scss
SET output=./dist/web/res/css/app.css

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/sass_watch.cmd

sass ^
    --watch ^
    --update ^
    --style expanded ^
    --charset ^
    --source-map ^
    %input%:%output%
