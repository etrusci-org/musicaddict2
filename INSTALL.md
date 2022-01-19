# Music Addict 2 - Installation

Here is hopefully all the info you need to host the game on your own server.

**This guide is still a bit WIP.**

---

## Requirements

To just host the game:

- Webserver
- PHP8 with SQLite3 enabled

To further develop the game some nifty tools are recommended:

- [SQLite3](https://sqlite.org) for managing the database.
- [SASS](https://sass-lang.com) for  writing and building CSS.
- [CSSO](https://github.com/css/csso) for optimizing CSS.
- [JSDoc](https://jsdoc.app) for generating JavaScript docs.
- [PHPDoc](https://phpdoc.org) for generating PHP docs.

See the dev/bin directory for some Windows scripts for those tools:

- **sass_watch.cmd:** Watch and build CSS.
- **csso_watch.cmd:** Watch and optimize built CSS.
- **db_admin.cmd:** Manage database.
- **sqlite3.exe:** Used by db_admin.cmd
- **jsdoc_gen.cmd:** Generate JavaScript docs.
- **phpdoc_gen.cmd:** Generate PHP docs.
- **phpDocumentor.phar:** Used by phpdoc_gen.cmd

---

## Setup

For this guide it's assumed that the following directory structure is created on the webserver.

```text
* public/ is the public web root of your webserver. This is the place
  where usually your website's index.html will be found and where the
  visitor will land if he goes to example.org.

* protected/ is a directory outside of the public web root and is
  only accessible by processes on the server itself and not by
  website visitors.

* With the structure below, you would access the game through:
  https://example.org/musicaddict2

example.org:
├───public/                   # public web root directory
│   └───musicaddict2/         # app root directory
│       ├───lib/              # app lib directory
│       ├───res/              # app res directory
│       ├───api.php           # app api entry file
│       └───index.html        # app index file
└───protected/                # directory outside of the public web root
    └───musicaddict2-data/    # app data directory
        └───db.sqlite3
```

### 1. Download The Code

<https://github.com/etrusci-org/musicaddict2>

### 2. Create App Root Directory

```text
public/musicaddict2/
```

### 3. Create App Data Directory

```text
protected/musicaddict2-data/
```

### 4. Create App Database File

Use **dev/bin/sqlite3.exe** and **dev/sql/db-schema.sql** to create the database file and upload it to the app data directory.

```text
sqlite3.exe db.sqlite3 ".read db-schema.sql"
protected/musicaddict2-data/db.sqlite3
```

### 5. Upload App Root Files

Upload contents of **dist/web/** to the previously created app root directory.

```text
dist/web/lib/ -> public/musicaddict2/lib/
dist/web/res/ -> public/musicaddict2/res/
dist/web/api.php -> public/musicaddict2/api.php
dist/web/index.html -> public/musicaddict2/index.html
```

### 6. Setting Permissions

Set the permissions for both `protected/musicaddict2-data/` and `protected/musicaddict2-data/db.sqlite3` so that the webserver and PHP can read and write (sqlite3 must be able to create temporary files inside the app data directory).

```text
protected/musicaddict2-data/ -> rw
protected/musicaddict2-data/db.sqlite3 -> rw
```

---

## Configuration

### File: public/musicaddict2/api.php

Change `$querySrc` to `'post'`.

Change `$databaseFile` to `protected/musicaddict2-data/db.sqlite3`.

```php
$API = new MusicAddictAPI(
    $querySrc='post',
    $databaseFile='protected/musicaddict2-data/db.sqlite'
);
```

---

## Test It

At this point everything should work. Go to <https://example.org/musicaddict2> and try it out. Open the dev console in your browser to check for errors if you're unsure.

---

[README](https://github.com/etrusci-org/musicaddict2/blob/main/README.md)
[CREDITS](https://github.com/etrusci-org/musicaddict2/blob/main/CREDITS.md)
[LICENSE](https://github.com/etrusci-org/musicaddict2/blob/main/LICENSE.md)

---
