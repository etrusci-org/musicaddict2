<?php
require 'lib/api.php';


$API = new MusicAddictAPI(
    $querySrc='both',
    $databaseFile='../data/db.sqlite3'
);
