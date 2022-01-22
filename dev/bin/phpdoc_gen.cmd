@ECHO OFF

SET phpBin="C:/xampp/php/php.exe"
SET phpdocPhar="dev/bin/phpDocumentor.phar"
SET inputDir="./dist/web/"
SET outputDir="./dev/phpdoc/"

:: Usage:
::
:: $ cd musicaddict2/
:: $ dev/bin/phpdoc_gen.cmd

%phpBin% %phpdocPhar% -d %inputDir% -t %outputDir%
