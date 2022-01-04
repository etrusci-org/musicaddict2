BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS sd (
    token      TEXT     NOT NULL UNIQUE,
    playerName TEXT     DEFAULT 'Anonymous',
    playerHash TEXT     DEFAULT '294de3557d9d00b3d2d8a1e6aab028cf',
    cash       INTEGER  DEFAULT 7,
    records    TEXT     DEFAULT '[]'
);

COMMIT;
