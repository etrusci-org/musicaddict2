@ECHO OFF

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/phpdoc_gen.cmd

C:\xampp\php\php.exe dev/bin/phpDocumentor.phar -d ./dist/web/ -t ./dev/phpdoc/
