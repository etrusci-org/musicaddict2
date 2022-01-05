<?php
// Generate a new token.
function newToken() {
    return hash('ripemd160', openssl_random_pseudo_bytes(1024));
}


// Check if a token is valid.
function isValidToken($token) {
    return ctype_alnum($token) && strlen($token) == 40;
}


// Encode data to JSON.
function jenc($data, $flags=JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) {
    return json_encode($data, $flags);
}


// Decode JSON data.
function jdec($data) {
    return json_decode($data, TRUE);
}


// SQLite3 Database class
class DatabaseSQLite3 {
    protected $db_file;
    protected $db;
    protected $encryption_key;
    protected $sqlite_version;

    public function __construct($db_file, $encryption_key='')
    {
        $this->db_file = $db_file;
        $this->encryption_key = $encryption_key;
        $this->sqlite_version = SQLite3::version();
    }


    public function open($rw=FALSE)
    {
        if (is_object($this->db)) return $this->db;

        $flag = (!$rw) ? SQLITE3_OPEN_READONLY : SQLITE3_OPEN_READWRITE;
        $this->db = new SQLite3($this->db_file, $flag, $this->encryption_key);
        // var_dump($this->db);
    }


    public function close()
    {
        if (!is_object($this->db)) return FALSE;

        $this->db->close();
    }


    public function query($query, $values=array())
    {
        // var_dump($this->db, $query, $values);
        if (!is_object($this->db)) return FALSE;
        $stmt = $this->db->prepare($query);

        foreach ($values as $v) {
            $stmt->bindValue($v[0], $v[1], $v[2]);
        }

        $result = $stmt->execute();
        $dump   = array();
        while ($row = $result->fetchArray(TRUE)) {
            $dump[] = $row;
        }

        $stmt->close();

        return $dump;
    }


    public function querySingle($query, $values=array())
    {
        if (!is_object($this->db)) return FALSE;

        $result = $this->query($query, $values);
        if (count($result) < 1) {
            return array();
        }
        else {
            return $result[0];
        }
    }


    public function write($query, $values=array())
    {
        if (!is_object($this->db)) return FALSE;

        $stmt = $this->db->prepare($query);

        foreach ($values as $v) {
            $stmt->bindValue($v[0], $v[1], $v[2]);
        }

        return $stmt->execute();
    }
}
