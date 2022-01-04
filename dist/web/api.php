<?php
error_reporting(E_ALL | E_STRICT);


$query = array_merge($_GET, $_POST);


$response = array(
    '_errors' => array(),
    '_query'  => $query,
);


header('Content-type: application/json; charset=utf-8');
print(json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
exit(0);
