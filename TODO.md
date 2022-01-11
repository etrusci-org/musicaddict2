# To-Do's + Ideas

In no particular order.

---

## TO-DO

- actionGif for "done listening".
- Record collection listing in UI.
- Code doc lib/api.php.
  - Started, but not done yet.
- Set element focus to inputPlayerName or ctrlContinue depending on if there is a token in localStorage.
- Only save firstPlayedOn once to db.
- Better variable/method names.
- Random generators.
- Better random data.
- Chances for progress() actions.
- Cleanup or replace console.log's to display useful data and ditch debug stuff.
- Unique GIF for progress action bulkSale.

---

## IDEAS

### Upgrades

This will engage the player. Examples of the raw idea below:

Buy upgrades with cash...

    [buy] -> Your mom a flower (5$)
    [buy] -> Faster clicks 1 (100$)
    [buy] -> Faster clicks 2 (300$)
    [buy] -> Faster clicks 3 (600$)
    [buy] -> Auto-clicker  (1000000$)

Get automatically upgrades depending on progress in the game, like clicks, playtime, etc. ...

    [when cash >= 100] -> Buy your mom a flower
    [when click count >= 1000] -> Faster clicks 1
    [when click count >= 10000] -> Faster clicks 2
    [when click count >= 100000] -> Faster clicks 3
    [when click count >= 1000000] -> Auto-clicker

### Trade Ledger

Because why not.

    {"tradeTime": 1234456000, "playerHash": "abcdef", "orderType": "buy",  "cashAmount": 7,  "recordArtist": "Artist1", "recordTitle": "Record2", "recordFormat": "Cassette" },
    {"tradeTime": 1234456010, "playerHash": "abcdef", "orderType": "sell", "cashAmount": 11, "recordArtist": "Artist1", "recordTitle": "Record2", "recordFormat": "Cassette" },
    {"tradeTime": 1234456020, "playerHash": "fedcab", "orderType": "buy",  "cashAmount": 11, "recordArtist": "Artist1", "recordTitle": "Record2", "recordFormat": "Cassette" }

### Trading Stats Graph

Show recent trades as a little graph.
