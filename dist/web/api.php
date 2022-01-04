<?php
$response = array(
    'yo' => 'api dummy response',
    'microtime' => microtime(),
);


header('Content-type: application/json; charset=utf-8');
print(json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
exit(0);
