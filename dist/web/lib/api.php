<?php
require 'shared.php';


class MusicAddictAPI {
    protected $query;
    protected $response;
    protected $Database;


    public function __construct() {
        // Bake query from both GET and POST. Post wins if same keys.
        $this->query = array_merge($_GET, $_POST);

        // Check if action is in query and stop if it is not.
        if (!isset($this->query['action']) || empty(trim($this->query['action']))) {
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
                        array('token', $token, SQLITE3_TEXT),
                    ));
                    if (!$r) {
                        $this->response['token'] = $token;
                        break;
                    }
                }

                $this->Database->close();
                break;

            case 'continue':
                if (!isset($this->query['token']) || empty(trim($this->query['token']))) {
                    $this->response['_errors'][] = 'missing query token.';
                    break;
                }

                $this->Database->open();

                $q = 'SELECT * FROM sd WHERE token = :token;';
                $r = $this->Database->querySingle($q, array(
                    array('token', $this->query['token'], SQLITE3_TEXT),
                ));

                $this->Database->close();

                if (!$r) {
                    $this->response['_errors'][] = 'Unknown token.';
                    break;
                }

                $this->response['saveData'] = $r;
                break;

            case 'save':
                if (!isset($this->query['saveData']) || empty(trim($this->query['saveData']))) {
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
                    array('playerName', SQLITE3_TEXT),
                    array('playerHash', SQLITE3_TEXT),
                    array('cash',       SQLITE3_INTEGER),
                    array('records',    SQLITE3_TEXT),
                );

                $c = array();
                $v = array();
                foreach ($validCols as $col) {
                    $c[] = sprintf('%1$s = :%1$s', $col[0]);
                    $v[] = array($col[0], $saveData[$col[0]], $col[1]);
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
