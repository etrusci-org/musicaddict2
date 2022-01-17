<?php
/**
 * Generate a new token.
 * @return string  Unique secret token.
 */
function newToken() {
    return hash('ripemd160', bin2hex(openssl_random_pseudo_bytes(4096)));
}

/**
 * Check if a token is valid.
 * @param string $token  Input to check.
 * @return boolean  Whether the token is valid.
 */
function isValidToken($token) {
    return ctype_alnum($token) && strlen($token) == 40;
}

/**
 * Get the ripemd160 hash of data.
 * @param mixed $data  Input to compute the hash from.
 * @return string  Computed hash.
 */
function ripemdHash($data) {
    return hash('ripemd160', $data);
}

/**
 * Encode data to JSON.
 * @param mixed $data  Input to encode.
 * @param  mixed $flags  JSON flags to apply.
 * @return string  Data encoded to JSON.
 */
function jenc($data, $flags=JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) {
    return json_encode($data, $flags);
}

/**
 * Decode JSON data.
 * @param mixed $data  JSON data to decode.
 * @return array  Decoded JSON data.
 */
function jdec($data) {
    return json_decode($data, TRUE);
}

/**
 * SQLite3 Database class
 */
class DatabaseSQLite3 {
    protected $db_file;
    protected $db;
    protected $encryption_key;
    protected $sqlite_version;

    /**
     * Class constructor.
     * @param string $db_file  Database file path.
     * @param string $encryption_key  Optional encryption key.
     * @return void
     */
    public function __construct($db_file, $encryption_key='') {
        $this->db_file = $db_file;
        $this->encryption_key = $encryption_key;
        $this->sqlite_version = SQLite3::version();
    }

    /**
     * Open database for usage.
     * @param boolean $rw  Whether to open the database in READWRITE mode.
     * @return void
     */
    public function open($rw=FALSE) {
        if (is_object($this->db)) return $this->db;

        $flag = (!$rw) ? SQLITE3_OPEN_READONLY : SQLITE3_OPEN_READWRITE;

        $this->db = new SQLite3($this->db_file, $flag, $this->encryption_key);
    }

    /**
     * Close database.
     * @return void
     */
    public function close() {
        if (!is_object($this->db)) return FALSE;

        $this->db->close();
    }

    /**
     * Query the database.
     * @param string $query  Query to execute.
     * @param array $values  Query values.
     * @return array  Query results.
     */
    public function query($query, $values=array()) {
        if (!is_object($this->db)) return FALSE;

        $stmt = $this->db->prepare($query);
        foreach ($values as $v) {
            $stmt->bindValue($v[0], $v[1], $v[2]);
        }

        $result = $stmt->execute();

        $dump = array();
        while ($row = $result->fetchArray(TRUE)) {
            $dump[] = $row;
        }

        $stmt->close();

        return $dump;
    }

    /**
     * Query the database for a single row.
     * @param string $query  Query to execute.
     * @param array $values  Query values.
     * @return array  Query result.
     */
    public function querySingle($query, $values=array()) {
        if (!is_object($this->db)) return FALSE;

        $result = $this->query($query, $values);

        if (count($result) < 1) {
            return array();
        }

        return $result[0];
    }

    /**
     * Write changes to the database.
     * @param mixed $query  Query to execute.
     * @param mixed $values  Query values.
     * @return boolean  Whether the query was executed successfully.
     */
    public function write($query, $values=array()) {
        if (!is_object($this->db)) return FALSE;

        $stmt = $this->db->prepare($query);

        foreach ($values as $v) {
            $stmt->bindValue($v[0], $v[1], $v[2]);
        }

        return $stmt->execute();
    }
}
