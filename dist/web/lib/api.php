<?php
require 'shared.php';


/**
 * MusicAddictAPI
 */
class MusicAddictAPI {
    protected $querySrc;
    protected $query;
    protected $response;
    protected $Database;


    /**
     * Init class, on success parse request, and output.
     *
     * @param string $querySrc  From where to read the query. Can be post, get or both.
     * @return void
     */
    public function __construct($querySrc='post') {
        // Decide where to read the query from.
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

    /**
     * Parse and process query.
     *
     * @return void
     */
    protected function parseQuery() {
        // Process query action
        switch ($this->query['action']) {
            case 'register':
                // Open database for reading
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

                // Close database.
                $this->Database->close();
                break;

            case 'continue':
                // Stop if no valid token in query.
                if (!isset($this->query['token']) || !array_key_exists('token', $this->query) || !isValidToken($this->query['token'])) {
                    $this->response['_errors'][] = 'missing query token.';
                    break;
                }

                // Open database for reading.
                $this->Database->open();

                // Define valid database table columns.
                $validCols = array(
                    'token'         => SQLITE3_TEXT,
                    'firstPlayedOn' => SQLITE3_INTEGER,
                    'playerName'    => SQLITE3_TEXT,
                    'cash'          => SQLITE3_INTEGER,
                    'records'       => SQLITE3_TEXT,
                );

                // Query database for data.
                $q = sprintf('SELECT %s FROM sd WHERE token = :token;', implode(', ', array_keys($validCols)));
                $r = $this->Database->querySingle($q, array(
                    array('token', ripemdHash($this->query['token']), SQLITE3_TEXT),
                ));

                // Close database.
                $this->Database->close();

                // Stop if no result.
                if (!$r) {
                    $this->response['_errors'][] = 'Unknown token.';
                    break;
                }

                // Always re-set result token to what's in the database.
                $r['token'] = $this->query['token'];

                // Decode result records JSON.
                $r['records'] = jdec($r['records']);

                // Set response saveData to result.
                $this->response['saveData'] = $r;
                break;

            case 'save':
                // Stop if no saveData in query.
                if (!isset($this->query['saveData']) || !array_key_exists('saveData', $this->query) || empty(trim($this->query['saveData']))) {
                    $this->response['_errors'][] = 'missing query saveData.';
                    break;
                }

                // Decode JSON saveData and stop on failure.
                $saveData = jdec($this->query['saveData']);
                if (!$saveData) {
                    $this->response['_errors'][] = 'invalid query saveData.';
                    break;
                }

                // Check for valid token in saveData.
                if (!isset($saveData['token']) || !array_key_exists('token', $saveData) || !isValidToken($saveData['token'])) {
                    $this->response['_errors'][] = 'missing query token.';
                    break;
                }

                // Open database for reading and writing.
                $this->Database->open(TRUE);

                // Define valid database table columns.
                $validCols = array(
                    'token'         => SQLITE3_TEXT,
                    'firstPlayedOn' => SQLITE3_INTEGER,
                    'playerName'    => SQLITE3_TEXT,
                    'cash'          => SQLITE3_INTEGER,
                    'records'       => SQLITE3_TEXT,
                );
                // unset($saveData['playerName']); // simulate error

                // Make sure we got all the data we need.
                $colDiff = array_diff_key($validCols, $saveData);
                if ($colDiff) {
                    $this->response['_errors'][] = 'Missing saveData keys: '.implode(', ', array_keys($colDiff));
                    return;
                }

                // Sanitize playerName and set to default if empty.
                $saveData['playerName'] = substr(trim($saveData['playerName']), 0, 30);
                $saveData['playerName'] = preg_replace('/[^A-Za-z0-9_-]/', '', $saveData['playerName']);
                if (empty($saveData['playerName'])) {
                    $saveData['playerName'] = 'Anonymous';
                }

                // Encode records to JSON.
                $saveData['records'] = jenc($saveData['records']);

                // Create initial row if it does not exist yet.
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

                // Update database data.
                $c = array(
                    'lastSavedOn = :lastSavedOn',
                );
                $v = array(
                    array('lastSavedOn', time(), SQLITE3_INTEGER),
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

                // Stop on update error.
                if (!$this->Database->write($q, $v)) {
                    $this->response['_errors'][] = 'Could not save to database.';
                    return;
                }

                // Close database.
                $this->Database->close();

                // All good if we reach this line.
                $this->response['saved'] = TRUE;
                break;

            default:
                $this->response['_errors'][] = 'Unknown query action: '.$this->query['action'];
        }
    }

    /**
     * Output response as JSON and exit.
     *
     * @return void
     */
    protected function output() {
        header('Content-type: application/json; charset=utf-8');
        print(jenc($this->response));
        exit(count($this->response['_errors']));
    }

}
