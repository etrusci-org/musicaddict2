@echo off

@REM Usage:
@REM
@REM Adjust input:output paths first.
@REM
@REM $ cd musicaddict2/dev/
@REM $ bin/csso_watch.bat

csso ^
    --watch ^
    --stat ^
    --comments none ^
    --input-source-map auto ^
    --source-map file ^
    --input ../dist/web/res/css/app.css ^
    --output ../dist/web/res/css/app.min.css
