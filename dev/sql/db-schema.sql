-- Schema for for SQLite3. Last version tested: 3.37.1.
-- Create database/load this schema with dev/bin/sqlite3.exe.

BEGIN TRANSACTION;


CREATE TABLE IF NOT EXISTS sd (
    token      TEXT     NOT NULL UNIQUE,
    playerName TEXT     DEFAULT 'Anonymous',
    cash       INTEGER  DEFAULT 7,
    records    TEXT     DEFAULT '[]',

    -- The following columns are not part of MusicAddict2.sd object
    -- and will not be returned when loading progress.
    created    INTEGER  DEFAULT (strftime('%s','now')),
    lastSaved  INTEGER  DEFAULT (strftime('%s','now'))
);


COMMIT;
