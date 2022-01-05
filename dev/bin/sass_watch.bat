@echo off

@REM Usage:
@REM
@REM Adjust input:output paths first.
@REM
@REM $ cd musicaddict2/dev/
@REM $ bin/sass_watch.bat

sass ^
    --watch ^
    --style expanded ^
    --charset ^
    --source-map ^
    ./scss/:../dist/web/res/css/
