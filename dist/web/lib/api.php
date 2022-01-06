<?php
require 'shared.php';


class MusicAddictAPI {
    protected $querySrc;
    protected $query;
    protected $response;
    protected $Database;


    public function __construct($querySrc='post') {
        switch ($querySrc) {
            case 'post':
                $this->querySrc = $querySrc;
                $this->query = $_POST;
                break;

            case 'get':
                $this->querySrc = $querySrc;
                $this->query = $_GET;
                break;

            case 'both':
                $this->querySrc = $querySrc;
                $this->query = array_merge($_GET, $_POST);
                break;

            default:
                $this->querySrc = 'post';
                $this->query = $_POST;
        }

        // Check if action is in query and stop if it is not.
        if (!isset($this->query['action']) || !array_key_exists('action', $this->query) || empty(trim($this->query['action']))) {
            $this->response['_errors'][] = 'missing query action.';
            $this->output();
        }

        // Set the default response.
        $this->response = array(
            '_time'    => microtime(TRUE),
            '_request' => $this->query,
            '_errors'  => array(),
        );

        // Initialize Database.
        $databaseFile = realpath('../data/db.sqlite3');
        if (!$databaseFile) {
            $this->response['_errors'][] = 'databaseFile does not exist.';
            $this->output();
        }
        $this->Database = new DatabaseSQLite3($databaseFile);

        // Parse request.
        $this->parseQuery();

        // Final output.
        $this->output();
    }


    // Parse and process query.
    protected function parseQuery() {
        // Process query action
        switch ($this->query['action']) {
            case 'register':
                $this->Database->open();

                // Return new token but make sure it does not already exist.
                $q = 'SELECT token FROM sd WHERE token = :token LIMIT 1;';
                while (TRUE) {
                    $token = newToken();
                    $r = $this->Database->query($q, array(
                        array('token', ripemdHash($token), SQLITE3_TEXT),
                    ));
                    if (!$r) {
                        $this->response['token'] = $token;
                        break;
                    }
                }

                $this->Database->close();
                break;

            case 'continue':
                if (!isset($this->query['token']) || !array_key_exists('token', $this->query) || empty(trim($this->query['token']))) {
                    $this->response['_errors'][] = 'missing query token.';
                    break;
                }

                $this->Database->open();

                $validCols = array_keys(array(
                    'token'      => SQLITE3_TEXT,
                    'playerName' => SQLITE3_TEXT,
                    'cash'       => SQLITE3_INTEGER,
                    'records'    => SQLITE3_TEXT,
                ));
                $validCols = implode(', ', $validCols);

                $q = sprintf('SELECT %s FROM sd WHERE token = :token;', $validCols);
                $r = $this->Database->querySingle($q, array(
                    array('token', ripemdHash($this->query['token']), SQLITE3_TEXT),
                ));

                $this->Database->close();

                if (!$r) {
                    $this->response['_errors'][] = 'Unknown token.';
                    break;
                }

                $r['token'] = $this->query['token'];
                $r['records'] = jdec($r['records']);

                $this->response['saveData'] = $r;
                break;

            case 'save':
                if (!isset($this->query['saveData']) || !array_key_exists('saveData', $this->query) || empty(trim($this->query['saveData']))) {
                    $this->response['_errors'][] = 'missing query saveData.';
                    break;
                }

                $saveData = jdec($this->query['saveData']);

                if (!$saveData) {
                    $this->response['_errors'][] = 'invalid query saveData.';
                    break;
                }

                $this->Database->open(TRUE);

                $validCols = array(
                    'token'      => SQLITE3_TEXT,
                    'playerName' => SQLITE3_TEXT,
                    'cash'       => SQLITE3_INTEGER,
                    'records'    => SQLITE3_TEXT,
                );
                // unset($saveData['playerName']); // sim error

                $colDiff = array_diff_key($validCols, $saveData);
                if ($colDiff) {
                    $this->response['_errors'][] = 'Missing saveData keys: '.implode(', ', array_keys($colDiff));
                    return;
                }

                $saveData['playerName'] = substr(trim($saveData['playerName']), 0, 30);
                if (empty($saveData['playerName'])) {
                    $saveData['playerName'] = 'Anonymous';
                }
                $saveData['records'] = jenc($saveData['records']);

                $q = 'SELECT token FROM sd WHERE token = :token;';
                $v = array(
                    array('token', ripemdHash($saveData['token']), SQLITE3_TEXT),
                );
                $r = $this->Database->query($q, $v);
                if (!$r) {
                    $q = 'INSERT INTO sd (token) VALUES (:token);';
                    if (!$this->Database->write($q, $v)) {
                        $this->response['_errors'][] = 'Could not create database row.';
                        return;
                    }
                }

                $c = array(
                    'lastSaved = :lastSaved',
                );
                $v = array(
                    array('lastSaved', time(), SQLITE3_INTEGER),
                );
                foreach ($validCols as $colName => $colType) {
                    if ($colName != 'token') {
                        $c[] = sprintf('%1$s = :%1$s', $colName);
                        $v[] = array($colName, $saveData[$colName], $colType);
                    }
                    else {
                        $v[] = array($colName, ripemdHash($saveData[$colName]), $colType);
                    }
                }
                $c = implode(', ', $c);
                $q = sprintf('UPDATE sd SET %s WHERE token = :token;', $c);

                if (!$this->Database->write($q, $v)) {
                    $this->response['_errors'][] = 'Could not save to database.';
                    return;
                }

                $this->Database->close();

                $this->response['saved'] = TRUE;
                break;

            default:
                $this->response['_errors'][] = 'Unknown query action: '.$this->query['action'];
        }
    }


    // Output response and exit.
    protected function output() {
        header('Content-type: application/json; charset=utf-8');
        print(jenc($this->response));
        exit(count($this->response['_errors']));
    }

}
