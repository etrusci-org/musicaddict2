-- Schema for for SQLite3. Last version tested: 3.37.1.
-- Create database/load this schema with dev/bin/sqlite3.exe.

BEGIN TRANSACTION;


CREATE TABLE IF NOT EXISTS sd (
    token          TEXT     NOT NULL UNIQUE,
    firstPlayedOn  INTEGER  DEFAULT NULL,
    playerName     TEXT     DEFAULT 'Anonymous',
    cash           INTEGER  DEFAULT 7,
    tradeProfit    INTEGER  DEFAULT 0,
    records        TEXT     DEFAULT '[]',
    upgrades       TEXT     DEFAULT '{}',
    pickyGrade     REAL     DEFAULT 0.5,
    clingyGrade    REAL     DEFAULT 0.5,

    -- The following columns are not part of MusicAddict2.sd object
    -- and will not be returned when loading progress.
    createdOn    INTEGER  DEFAULT (strftime('%s','now')),
    lastSavedOn  INTEGER  DEFAULT NULL
);


COMMIT;
