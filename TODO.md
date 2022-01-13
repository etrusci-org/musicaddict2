# To-Do's + Ideas

In no particular order.

---

## TO-DO

- Random generators.
- Better random data.
- Only save firstPlayedOn once to db.
- Set element focus to inputPlayerName or ctrlContinue depending on if there is a token in localStorage.
- More granular chances for progress() actions.
- Code doc lib/api.php.
  - Started, but not done yet.
- Better variable/method names.

---

## IDEAS

### Trade Ledger

Because why not.

    {"tradeTime": 1234456000, "playerHash": "abcdef", "orderType": "buy",  "cashAmount": 7,  "recordArtist": "Artist1", "recordTitle": "Record2", "recordFormat": "Cassette" },
    {"tradeTime": 1234456010, "playerHash": "abcdef", "orderType": "sell", "cashAmount": 11, "recordArtist": "Artist1", "recordTitle": "Record2", "recordFormat": "Cassette" },
    {"tradeTime": 1234456020, "playerHash": "fedcab", "orderType": "buy",  "cashAmount": 11, "recordArtist": "Artist1", "recordTitle": "Record2", "recordFormat": "Cassette" }

### Trading Stats Graph

Show recent trades as a little graph.
