// @ts-check
'use strict'


/**
 * @file Core of the app. Must be included/loaded first.
 * @example
 * <script src="./lib/app.js"></script>
 * <script src="./lib/main.js"></script>
 */


/**
 * All the magic.
 * @namespace MusicAddict2
 */
const MusicAddict2 = {
    /**
     * Float representing the chance to be lucky. Valid range: `0.0` (no luck) and `1.0` (win).
     * @typedef {number} luckyChance
     */

    /**
     * Random record object.
     * @typedef {object} randomRecord
     * @prop {string} title  Record title.
     * @prop {string} artist  Artist name.
     * @prop {string} format  Record format.
     * @prop {number} buyPrice  Buy price.
     * @prop {number|null} sellPrice  Sell price. Only set if action offer.
     */

    /**
     * Integer representing milliseconds.
     * @typedef {number} secMilli
     */

    /**
     * Integer representing an unixtime stamp in milliseconds.
     * @typedef {number} unixMilli
     */

    /**
     * App name.
     * @prop {string} APP_NAME
     */
    APP_NAME: 'Music Addict 2',

    /**
     * App version.
     * @prop {string} APP_VERSION
     */
    APP_VERSION: '2.0.0-beta1',

    /**
     * App author.
     * @prop {string} APP_AUTHOR
     * @see https://etrusci.org
     */
    APP_AUTHOR: 'arT2 <etrusci.org>',

    /**
     * App license.
     * @prop {string} APP_LICENSE
     */
    APP_LICENSE: 'Public Domain Worldwide',

    /**
     * App GitHub link.
     * @prop {string} APP_GITHUB
     */
    APP_GITHUB: 'https://github.com/etrusci-org/musicaddict2',

    /**
     * App/game configuration.
     * @prop {object} MusicAddict2.conf
     * @prop {integer} MusicAddict2.conf.actionLogMax=500  Maximum number of lines to keep in the actionLog.
     * @prop {string} MusicAddict2.conf.apiPath='./api.php'  Relative from dist/web/index.html or absolute path to dist/web/api.php.
     * @prop {secMilli} MusicAddict2.conf.autoSaveInterval=300_000  Auto-save interval.
     * @prop {secMilli} MusicAddict2.conf.backgroundUpdateInterval=500  Background updater interval.
     * @prop {integer} MusicAddict2.conf.bulkSaleAmount=50  How many records to sell in a bulk sale.
     * @prop {luckyChance} MusicAddict2.conf.buyChance=0.5  Chance to buy a record after having listened to it.
     * @prop {object} MusicAddict2.conf.buyPriceRanges={...}  Buy price ranges.
     * @prop {secMilli} MusicAddict2.conf.clickspeed=1_500  Base clickspeed from which the final clickspeed is calculated.
     * @prop {luckyChance} MusicAddict2.conf.discoverChance=0.40  Chance to discover an interesting record.
     * @prop {array} MusicAddict2.conf.eventHandler=[...]]  Event handler configuration.
     * @prop {secMilli} MusicAddict2.conf.exitDelay=5_000  Delay before reloading the page after the player has clicked the exit button.
     * @prop {object} MusicAddict2.conf.listenDuration={...}  Listen duration range.
     * @prop {secMilli} MusicAddict2.conf.maxIdleDuration=3600_000  Maximum time without a click on the progress button that can pass before kicking auto-exiting.
     * @prop {luckyChance} MusicAddict2.conf.offerChance=0.25
     * @prop {array} MusicAddict2.conf.preloadMedia=[...]]  Media to preload the oldskool way.
     * @prop {integer} MusicAddict2.conf.recordsMax=500  Maximum number of records the player can keep in their collection before a bulk sale gets triggered.
     * @prop {luckyChance} MusicAddict2.conf.sellChance=0.5  Chance to sell a record on when getting an offer.
     * @prop {float} MusicAddict2.conf.sellPriceRangeMultiplikator=0.5  Used to calculate the maximum possible sellPrice of a record: buyPrice * sellPriceRangeMultiplikator.
     * @prop {object} MusicAddict2.conf.upgrades={...}  Upgrades the player can unlock.
     */
    conf: {
        actionLogMax: 500,
        apiPath: './api.php',
        autoSaveInterval: 300_000,
        backgroundUpdateInterval: 500,
        bulkSaleAmount: 50,
        buyChance: 0.5,
        buyPriceRanges: {
            legendary: { rollMax: 0.0001, minCash: 100_000, range: [100_000, 1_000_000] },
            tier6: { rollMax: 0.0025, minCash: 500, range: [501, 1_000] },
            tier5: { rollMax: 0.0050, minCash: 200, range: [201, 500] },
            tier4: { rollMax: 0.0500, minCash: 50, range: [51, 200] },
            tier3: { rollMax: 0.0700, minCash: 20, range: [21, 50] },
            tier2: { rollMax: 0.4000, minCash: 7, range: [8, 20] },
            tier1: { rollMax: 1.0000, minCash: 0, range: [1, 7] },
        },
        clickspeed: 1_500,
        discoverChance: 0.40,
        eventHandler: [
            { uikey: 'ctrlRegister', type: 'click', handler: 'ctrlRegisterHandleClick' },
            { uikey: 'ctrlContinue', type: 'click', handler: 'ctrlContinueHandleClick' },
            { uikey: 'ctrlProgress', type: 'click', handler: 'ctrlProgressHandleClick' },
            { uikey: 'ctrlExit', type: 'click', handler: 'ctrlExitHandleClick' },
            { uikey: 'playerName', type: 'click', handler: 'playerNameHandleClick' },
            { uikey: 'upgradeClickspeedLevel', type: 'click', handler: 'upgradeClickspeedLevelHandleClick' },
            { uikey: 'sdRecordsCount', type: 'click', handler: 'sdRecordsCountHandleClick' },
            { uikey: 'recordCollectionClose', type: 'click', handler: 'sdRecordsCountHandleClick' },
        ],
        exitDelay: 5_000,
        listenDuration: { min: 10_000, max: 30_000 },
        maxIdleDuration: 3600_000,
        offerChance: 0.25,
        preloadMedia: [
            { tag: 'img', attrs: { src: './res/actiongif/digg.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/discover.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/listen.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/buy.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/skipBuy.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/offer.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/sell.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/skipSell.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/broke.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/bulkSale.gif' } },
            { tag: 'img', attrs: { src: './res/actiongif/bulkSaleStart.gif' } },
        ],
        recordsMax: 500,
        sellChance: 0.5,
        sellPriceRangeMultiplikator: 0.5,
        upgrades: {
            clickspeed: {
                initialPrice: 10,
                maxLevel: 10,
            },
        },
    },

    /**
     * Temporary stuff the app needs to work.
     * @prop {object} MusicAddict2.ram
     * @prop {integer} MusicAddict2.ram.backgroundUpdateIntervalID=null  ID of the background updater's setInterval() loop.
     * @prop {integer} MusicAddict2.ram.bulkSaleID=null  ID of the bulk sale's setInterval() loop.
     * @prop {boolean} MusicAddict2.ram.incomingOffer=null  Whether there is an incoming offer.
     * @prop {unixMilli} MusicAddict2.ram.lastCtrlProgressClickOn=null  When the progress button was last clicked.
     * @prop {unixMilli} MusicAddict2.ram.lastSavedOn=null  When the game progress was last saved.
     * @prop {unixMilli} MusicAddict2.ram.listenDuration=null  How long to listen to a record.
     * @prop {string} MusicAddict2.ram.nextProgressAction=null  What the next progress action will be.
     * @prop {array} MusicAddict2.ram.nextProgressActionChoices=null  What the next progress actions could be.
     * @prop {randomRecord} MusicAddict2.ram.randomRecord=null  Latest randomly generated record.
     * @prop {integer} MusicAddict2.ram.sessionProgressClicks=null  Progress clicks count in current session.
     * @prop {unixMilli} MusicAddict2.ram.startedListeningOn=null  When the player started to listen to a record.
     * @prop {unixMilli} MusicAddict2.ram.startedSessionOn=null  When the player entered the game.
     */
    ram: {
        backgroundUpdateIntervalID: null,
        bulkSaleID: null,
        incomingOffer: null,
        lastCtrlProgressClickOn: null,
        lastSavedOn: null,
        listenDuration: null,
        nextProgressAction: null,
        nextProgressActionChoices: null,
        randomRecord: null,
        sessionProgressClicks: null,
        startedListeningOn: null,
        startedSessionOn: null,
    },

    /**
     * Random data sources.
     * @prop {object} MusicAddict2.rd
     * @prop {array} MusicAddict2.rd.artistNameWords=[...]]  Words from which artist names are built.
     * @prop {array} MusicAddict2.rd.recordFormats=[...]]  Record formats.
     * @prop {array} MusicAddict2.rd.recordTitleWords=[...]]  Words from which record titles are built.
     */
    rd: {},

    /**
     * Save data to be stored to the database.
     * @prop {object} MusicAddict2.sd
     * @prop {integer} MusicAddict2.sd.cash=7  Cash amount.
     * @prop {unixMilli} MusicAddict2.sd.firstPlayedOn=null  Time first played.
     * @prop {string} MusicAddict2.sd.playerName='Anonymous'  Player name.
     * @prop {array} MusicAddict2.sd.records=[]]  Record collection.
     * @prop {string} MusicAddict2.sd.token=null  Unique secret token.
     * @prop {integer} MusicAddict2.sd.totalProgressClicks=null  Progress clicks count total since first game start.
     * @prop {integer} MusicAddict2.sd.tradeProfit=0  Total trade profit amount.
     * @prop {object} MusicAddict2.sd.upgrades={...}  Bought Upgrades.
     */
    sd: {
        cash: 7,
        firstPlayedOn: null,
        playerName: 'Anonymous',
        records: [],
        token: null,
        totalProgressClicks: 0,
        tradeProfit: 0,
        upgrades: {
            clickspeed: 0,
        },
    },

    /**
     * User interface elements.
     * @prop {object} MusicAddict2.ui={}
     */
    ui: {},

    /**
     * Query the API for something.
     * @method MusicAddict2.apiRequest
     * @param {object} query  Query properties.
     * @param {function} [onSuccess=null]  On success handler method.
     * @returns void
     */
    apiRequest(query, onSuccess=null) {
        // Prepare query data.
        const queryData = new FormData()
        for (const k in query) {
            queryData.append(k, query[k])
        }

        // Send request to api.
        fetch(this.conf.apiPath, {
            method: 'POST',
            body: queryData,
        })
        // Process the response.
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK')
            }
            return response.json()
        })
        // Pass the response to the onSuccess handler function.
        .then(responseData => {
            if (typeof(onSuccess) == 'function') {
                onSuccess(responseData)
            }
        })
        // Sad times.
        .catch(error => {
            console.error('apiRequest Error:', error)
            alert(`apiRequest Error.\n\n${error}`)
        })
    },

    /**
     * Update stuff in the background.
     * @method MusicAddict2.backgroundUpdate
     * @param {boolean} [startWorker=false]  Whether to start the setInterval() loop.
     * @returns void
     */
    backgroundUpdate(startWorker=false) {
        // Start worker loop if startWorker=true and there is no background worker already running.
        if (startWorker && !this.ram.backgroundUpdateIntervalID) {
            this.ram.backgroundUpdateIntervalID = setInterval(() => {
                this.backgroundUpdate()
            }, this.conf.backgroundUpdateInterval)
        }

        // Auto-save from time to time.
        if (this.timesUp(this.ram.lastSavedOn, this.conf.autoSaveInterval)) {
            this.save()
        }

        // Auto-exit if idling for too long.
        if (this.timesUp(this.ram.lastCtrlProgressClickOn, this.conf.maxIdleDuration)) {
            this.uiSetVal('actionLog', `Idle detection kicked in.`)
            this.save(true)
        }

        // Update UI elements.
        this.uiSetVal('sdCash', `${this.moneyString(this.sd.cash)}`)
        this.uiSetVal('sdRecordsCount', `${this.sd.records.length}`)
        this.uiSetVal('sdTradeProfit', `${this.moneyString(this.sd.tradeProfit)}`)
        this.uiSetVal('sdFirstPlayedOn', `${this.secToDHMS(Date.now() - this.sd.firstPlayedOn)} ago`)
        this.uiSetVal('upgradeClickspeedLevel', `Level ${this.sd.upgrades.clickspeed}`)
        this.uiSetVal('sdUpgradesClickspeed', `${this.currentClickspeed()/1000}s`)
        this.uiSetVal('sdSessionProgressClicks', `${this.ram.sessionProgressClicks | 0}`)
        this.uiSetVal('sdTotalProgressClicks', `${this.sd.totalProgressClicks}`)
    },

    /**
     * Stop/reset background worker setInterval() loop.
     * @method MusicAddict2.backgroundUpdateStop
     * @returns void
     */
    backgroundUpdateStop() {
        // Clear the update worker.
        clearInterval(this.ram.backgroundUpdateIntervalID)

        // Reset the worker's interval ID.
        this.ram.backgroundUpdateIntervalID = null
    },

    /**
     * Buy upgrade.
     * @method MusicAddict2.buyUpgrade
     * @param {string} upgradeName  Key of the upgrade's configuration.
     * @returns void
     */
    buyUpgrade(upgradeName) {
        // Stop if max level already reached.
        if (this.sd.upgrades[upgradeName] >= this.conf.upgrades[upgradeName].maxLevel) {
            alert(`${upgradeName} level already maxed out (${this.conf.upgrades[upgradeName].maxLevel}).`)
            return
        }

        // Calculate price based on new level.
        let newLevel = this.sd.upgrades[upgradeName] + 1
        let newPrice = Math.round(this.conf.upgrades[upgradeName].initialPrice ** (newLevel ** 0.420))

        // Stop if not enough cash.
        if (this.sd.cash < newPrice) {
            alert(`Not enough cash to upgrade ${upgradeName} to level ${newLevel} for ${newPrice}◈ (need ${newPrice - this.sd.cash}◈ more).`)
            return
        }

        // Confirm action just in case it was clicked unintentionally.
        if (!confirm(`Upgrade ${upgradeName} to level ${newLevel} for ${newPrice}◈?`)) {
            return
        }

        // Pay for the upgrade.
        this.sd.cash -= newPrice

        // Increase level.
        this.sd.upgrades[upgradeName] += 1

        this.uiSetVal('actionLog', `Upgraded ${upgradeName} to level ${newLevel} for ${this.moneyString(newPrice, true)}.`)
    },

    /**
     * Handle ctrlContinue clicks.
     * @method MusicAddict2.ctrlContinueHandleClick
     * @returns void
     */
    ctrlContinueHandleClick(/* e */) {
        // Stop if we already have a token.
        if (this.sd.token) {
            return
        }

        // Stop if the token input is empty.
        let inputToken = this.ui.inputToken.value.trim()
        if (!inputToken) {
            alert(`Please enter your secret token to continue.`)
            return
        }

        // Disable continue button for a short while.
        this.uiSetState('ctrlContinue', 'disabled')
        setTimeout(() => {
            this.uiSetState('ctrlContinue', 'enabled')
        }, 30_000)

        // Request save data from api.
        this.apiRequest({
            action: 'continue',
            token: inputToken,
        },
        (response) => {
            if (!response.saveData) {
                alert(`Error while fetching save data.\n\n${response._errors.join('\n')}`)
                return
            }

            // Store token the db returned not what the user has entered.
            this.sd = response.saveData

            // Start the game.
            this.start()
        })
    },

    /**
     * Handle ctrlExit clicks.
     * @method MusicAddict2.ctrlExitHandleClick
     * @returns void
     */
    ctrlExitHandleClick(/* e */) {
        // Show again actionLog if recordCollection opened.
        this.uiSetDisplay('actionLog', 'show')
        this.uiSetDisplay('recordCollection', 'hide')

        // Disable exit button for a short while.
        this.uiSetState('ctrlExit', 'disabled')
        setTimeout(() => {
            this.uiSetState('ctrlExit', 'enabled')
        }, 30_000)

        if (confirm('Exit the game?')) {
            // Save and exit.
            this.save(true)
        }
        else {
            this.uiSetState('ctrlExit', 'enabled')
        }
    },

    /**
     * Handle ctrlProgress clicks.
     * @method MusicAddict2.ctrlProgressHandleClick
     * @returns void
     */
    ctrlProgressHandleClick(/* e */) {
        // Stop if we don't have a token.
        if (!this.sd.token) {
            return
        }

        // Show again actionLog if recordCollection opened.
        this.uiSetDisplay('actionLog', 'show')
        this.uiSetDisplay('recordCollection', 'hide')

        // Disable progress button for a short while.
        this.uiSetState('ctrlProgress', 'disabled')
        setTimeout(() => {
            if (!this.ram.bulkSaleID) {
                this.uiSetState('ctrlProgress', 'enabled')
            }
        }, this.currentClickspeed())

        // Remember when this method was last run for later use.
        this.ram.lastCtrlProgressClickOn = Date.now()

        // Count session progress clicks.
        this.ram.sessionProgressClicks += 1
        this.sd.totalProgressClicks += 1

        // Trigger a progress action.
        this.progress()
    },

    /**
     * Handle ctrlRegister clicks.
     * @method MusicAddict2.ctrlRegisterHandleClick
     * @returns void
     */
    ctrlRegisterHandleClick(/* e */) {
        // Stop if we already have a token.
        if (this.sd.token) {
            return
        }

        // Disable register button for a short while.
        this.uiSetState('ctrlRegister', 'disabled')
        setTimeout(() => {
            this.uiSetState('ctrlRegister', 'enabled')
        }, 30_000)

        // Request new token from api
        this.apiRequest({
            action: 'register',
        },
        (response) => {
            if (!response.token) {
                alert(`Error while requesting new token.\n\n${response._errors.join('\n')}`)
                return
            }

            // Store new token the db returned.
            this.sd.token = response.token

            // Reset localStorage token.
            if (window.localStorage) {
                window.localStorage.removeItem('musicaddict2')
            }

            // Set player name from input or leave it to the default.
            let playerName = this.ui.inputPlayerName.value.trim().substring(0, 20)
            playerName = playerName.replace(/[^A-Za-z0-9_-]/g, '')
            if (playerName) {
                this.sd.playerName = playerName
            }

            // Start the game.
            this.start()
        })
    },

    /**
     * Get the current calculated clickspeed.
     * @method MusicAddict2.currentClickspeed
     * @returns {number}  Current clickspeed.
     */
    currentClickspeed() {
        return Math.round(this.conf.clickspeed - (this.sd.upgrades.clickspeed * 100))
    },

    /**
     * Exit game and go back to start page.
     * @method MusicAddict2.exit
     * @returns void
     */
    exit() {
        // Stop the background update worker
        this.backgroundUpdateStop()

        // Update ui elements
        this.uiSetState('ctrlProgress', 'disabled')
        this.uiSetState('ctrlExit', 'disabled')
        this.uiSetVal('actionLog', `<span class="sys">Bye ${this.sd.playerName}, see you soon!</span>`)

        // Wait a bit before exiting.
        setTimeout(() => {
            location.reload()
        }, this.conf.exitDelay)
    },

    /**
     * Inject oldskool preloaders.
     * @method MusicAddict2.injectPreloaders
     * @returns void
     */
    injectPreloaders() {
        this.conf.preloadMedia.forEach(v => {
            let ele = document.createElement(v.tag)
            for (const k in v.attrs) {
                ele.setAttribute(k, v.attrs[k])
                ele.classList.add('preloader')
                document.body.append(ele)
            }
        })
    },

    /**
     * Inject a script from the lib, yo.
     * @method MusicAddict2.injectScript
     * @param {string} scriptName  Filename in dist/web/lib/ without extension.
     * @returns void
     */
    injectScript(scriptName) {
        let ele = document.createElement('script')
        ele.src = `./lib/${scriptName}.js?v=${Date.now()}`
        document.body.append(ele)
    },

    /**
     * Be lucky or not.
     * @method MusicAddict2.lucky
     * @param {luckyChance} chance  Chance to be lucky.
     * @returns {boolean}  Whether the roll was a lucky one.
     */
    lucky(chance) {
        chance = (chance >= 0.0 && chance <= 1.0) ? chance : 0.0
        return Math.random() < chance
    },

    /**
     * Initialize app.
     * @method MusicAddict2.main
     * @returns void
     */
    main() {
        console.time('main()')
        console.log(`%c${this.APP_NAME}  ·  v${this.APP_VERSION}\n${this.APP_GITHUB}`, `color: #4FC6AB; background: #212529; padding: 5px; font-size: 24px; font-family: 'Share Tech', sans-serif;`)

        // Collect marked ui elements.
        this.uiCollectElements()

        // Register event handlers.
        this.registerEventHandlers()

        // Check if we have a token in localStorage and enter it into inputToken for the lazy.
        if (window.localStorage) {
            let localStorageToken = window.localStorage.getItem('musicaddict2')
            if (localStorageToken) {
                localStorageToken = atob(localStorageToken)
                this.uiSetVal('inputToken', localStorageToken)
            }
        }

        // Initially hide some UI elements.
        this.uiSetDisplay('playerName', 'hide') // unhide in start()
        this.uiSetDisplay('gameCtrl', 'hide') // unhide in start()
        this.uiSetDisplay('gameStats', 'hide') // unhide in start()
        this.uiSetDisplay('gameOutput', 'hide') // unhide in start()
        this.uiSetDisplay('recordCollection', 'hide') // unhide in start()

        // Update some UI elements.
        this.uiSetVal('APP_VERSION', `v${this.APP_VERSION}`)
        this.uiSetVal('inputPlayerName', '')
        this.uiSetVal('actionGif', 'idle')

        // Finally un-hide the app.
        this.uiSetDisplay('app', 'block')

        console.timeEnd('main()')
    },

    /**
     * Get a nicely formatted money string.
     * @method MusicAddict2.moneyString
     * @param {number} moneyAmount  Input money amount.
     * @param {boolean} [addWarning=false]  Whether to add CSS warning class also to positive amounts.
     * @returns {string}  Formatted money amount.
     */
    moneyString(moneyAmount, addWarning=false) {
        let warningClass = (moneyAmount <= 0 || addWarning) ? ` warning` : ``
        return `<span class="money${warningClass}">${moneyAmount}</span>`
    },

    /**
     * Pad number<10 and number>=0 with a 0 (zero).
     * @method MusicAddict2.padNum
     * @param {number} num  Input to be padded.
     * @returns {string}  Padded or original.
     */
    padNum(num) {
        return (num < 10 && num >= 0) ? `0${num}` : `${num}`
    },

    /**
     * Handle playerName clicks.
     * @method MusicAddict2.playerNameHandleClick
     * @returns void
     */
    playerNameHandleClick(/* e */) {
        let playerName = prompt('Change player name.\n20 characters maximum.\nAllowed: A-Z a-z 0-9 _ -\n\n', this.sd.playerName)

        if (!playerName) {
            return
        }

        playerName = playerName.trim().substring(0, 20)
        playerName = playerName.replace(/[^A-Za-z0-9_-]/g, '')
        if (playerName) {
            this.sd.playerName = playerName
            this.uiSetVal('playerName', this.playerNameString())
        }
    },

    /**
     * Get a nicely formatted player name.
     * @method MusicAddict2.playerNameString
     * @returns {string}  Formatted player name.
     */
    playerNameString() {
        return `<span class="playerName a">&lt;${this.sd.playerName}&gt;</span>`
    },

    /**
     * Run progress action.
     * @method MusicAddict2.progress
     * @returns void
     */
    progress() {
        // Fall back to digg by default.
        if (!this.ram.nextProgressAction) {
            this.ram.nextProgressAction = 'digg'
        }

        // Trigger broke if the player has no cash and there is no incoming offer.
        if (this.sd.cash == 0 && !this.ram.incomingOffer) {
            this.ram.nextProgressAction = 'broke'
        }

        // Trigger bulkSale if too many records in collection.
        if (this.sd.records.length > this.conf.recordsMax) {
            this.ram.nextProgressAction = 'bulkSale'
        }

        // Run action and choose possible choices for the next loop iteration.
        this.ram.nextProgressActionChoices = []

        switch (this.ram.nextProgressAction) {
            // --------------------------------------
            // ! = Triggered on special conditions.
            // ? = Based on chance.
            // default entry action is *digg*.

            // !broke
            //   ?offer
            // !bulkSale
            //   digg
            // digg
            //   ?discover
            //     listen
            //       ?buy
            //         digg
            //       ?skipBuy
            //         digg
            //   ?offer
            //     ?sell
            //       digg
            //     ?skipSell
            //       digg
            // --------------------------------------
            case 'digg':
                // Update action GIF.
                this.uiSetVal('actionGif', 'digg')

                // Add action log message.
                this.uiSetVal('actionLog', `Digging for cool records.`)

                // Set next action to digg by default.
                this.ram.nextProgressActionChoices = ['digg']

                // If lucky, add discover to next action choices.
                if (this.lucky(this.conf.discoverChance)) {
                    this.ram.nextProgressActionChoices.push('discover')
                }

                // If lucky, and records in collection, add offer to next action choices.
                if (this.lucky(this.conf.offerChance) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            case 'broke':
                // Update action GIF.
                this.uiSetVal('actionGif', 'broke')

                // Add action log message.
                this.uiSetVal('actionLog', `You're broke.`)

                // If lucky, add offer to next action choices.
                this.ram.incomingOffer = this.lucky(this.conf.offerChance)
                if (this.ram.incomingOffer) {
                    this.ram.nextProgressActionChoices = ['offer']
                }
                break

            case 'bulkSale':
                // Update action GIF.
                this.uiSetVal('actionGif', 'bulkSaleStart')

                // Add action log Message.
                this.uiSetVal('actionLog', `You can not store more records and decide to sell some in bulk.`)

                // Disable controls so we don't mess up data.
                this.uiSetState('ctrlProgress', 'disabled')
                this.uiSetState('ctrlExit', 'disabled')

                // Sell records in bulk one by one.
                this.ram.bulkSaleID = null
                let bulkSaleCounter = 0
                let bulkSaleIncome = 0
                let bulkSaleProfit = 0
                this.ram.bulkSaleID = setInterval(() => {
                    let k = this.randomArrayKey(this.sd.records)
                    this.ram.randomRecord = { ...this.sd.records[k] }
                    this.ram.randomRecord.collectionKey = k
                    this.ram.randomRecord.sellPrice = this.randomSellPrice(this.ram.randomRecord.buyPrice)

                    this.sd.cash += this.ram.randomRecord.sellPrice
                    this.sd.tradeProfit += this.ram.randomRecord.sellPrice
                    this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                    bulkSaleCounter += 1
                    bulkSaleIncome += this.ram.randomRecord.sellPrice
                    bulkSaleProfit += this.ram.randomRecord.sellPrice - this.ram.randomRecord.buyPrice

                    this.uiSetVal('actionGif', 'bulkSale')
                    this.uiSetVal('actionLog', `Sold ${this.recordString(this.ram.randomRecord)} for ${this.moneyString(this.ram.randomRecord.sellPrice)} (${this.moneyString(this.ram.randomRecord.sellPrice - this.ram.randomRecord.buyPrice)} profit).`)

                    if (bulkSaleCounter >= this.conf.bulkSaleAmount) {
                        clearInterval(this.ram.bulkSaleID)
                        this.ram.bulkSaleID = null

                        this.uiSetState('ctrlProgress', 'enabled')
                        this.uiSetState('ctrlExit', 'enabled')

                        this.uiSetVal('actionGif', 'sell')
                        this.uiSetVal('actionLog', `Done selling ${bulkSaleCounter} records for a total of ${this.moneyString(bulkSaleIncome)} (${this.moneyString(bulkSaleProfit)} profit).`)
                    }
                }, 2_000)

                // Set next action choices.
                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'discover':
                // Update action GIF.
                this.uiSetVal('actionGif', 'discover')

                // Set a new random record.
                this.ram.randomRecord = this.randomRecord()

                // Add action log message.
                this.uiSetVal('actionLog', `Discovered ${this.recordString(this.ram.randomRecord)}.`)

                // Set next action choices.
                this.ram.nextProgressActionChoices = ['listen']
                break

            case 'listen':
                // Set next action to listen by default.
                this.ram.nextProgressActionChoices = ['listen']

                // Update action GIF.
                this.uiSetVal('actionGif', 'listen')

                // Add action log message.
                this.uiSetVal('actionLog', `Listening.`)

                // Start tracking listening time if not doing so already and set the listening duration.
                if (!this.ram.startedListeningOn) {
                    this.ram.startedListeningOn = Date.now()
                    this.ram.listenDuration = this.randomInteger(this.conf.listenDuration.min, this.conf.listenDuration.max)
                }
                else {
                    // If listening duration is over.
                    if (this.timesUp(this.ram.startedListeningOn, this.ram.listenDuration)) {
                        this.ram.startedListeningOn = null
                        this.ram.listenDuration = null

                        // Be more open minded and buy the record, or be picky and skip it.
                        if (this.lucky(this.conf.buyChance)) {
                            this.ram.nextProgressActionChoices = ['buy']
                        }
                        else {
                            this.ram.nextProgressActionChoices = ['skipBuy']
                        }
                    }
                }
                break

            case 'buy':
                // Buy if enough cash.
                if (this.sd.cash >= this.ram.randomRecord.buyPrice) {
                    // Update action GIF.
                    this.uiSetVal('actionGif', 'buy')

                    this.sd.cash -= this.ram.randomRecord.buyPrice
                    this.sd.tradeProfit -= this.ram.randomRecord.buyPrice
                    this.sd.records.push(this.ram.randomRecord)

                    this.uiSetVal('actionLog', `Bought ${this.recordString(this.ram.randomRecord)} for ${this.moneyString(this.ram.randomRecord.buyPrice, true)}.`)
                }
                // Be sad if not enough cash.
                else {
                    this.uiSetVal('actionGif', 'broke')
                    this.uiSetVal('actionLog', `You want ${this.recordString(this.ram.randomRecord)}, but don't have enough cash to buy it for ${this.moneyString(this.ram.randomRecord.buyPrice)} (need ${this.moneyString(this.ram.randomRecord.buyPrice - this.sd.cash, true)} more).`)
                }

                // Set next action choice to digg.
                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'skipBuy':
                // Update action GIF.
                this.uiSetVal('actionGif', 'skipBuy')

                // Add action log message.
                this.uiSetVal('actionLog', `Nah, you don't like ${this.recordString(this.ram.randomRecord)} that much.`)

                // Set next action choice to digg.
                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'offer':
                // Update action GIF.
                this.uiSetVal('actionGif', 'offer')

                // Select a random record from the player's collection.
                let k = this.randomArrayKey(this.sd.records)
                this.ram.randomRecord = { ...this.sd.records[k] }
                this.ram.randomRecord.collectionKey = k
                this.ram.randomRecord.sellPrice = this.randomSellPrice(this.ram.randomRecord.buyPrice)

                // Add action log message.
                this.uiSetVal('actionLog', `Someone wants to buy ${this.recordString(this.ram.randomRecord)} from your collection.`)

                // Be more open minded and sell the record, or be clingy and skip it.
                if (this.lucky(this.conf.sellChance)) {
                    this.ram.nextProgressActionChoices = ['sell']
                }
                else {
                    this.ram.nextProgressActionChoices = ['skipSell']
                }
                break

            case 'sell':
                // Update action GIF.
                this.uiSetVal('actionGif', 'sell')

                // Sell the record and reset the incomingOffer boolean that was maybe set in the broke action.
                this.sd.cash += this.ram.randomRecord.sellPrice
                this.sd.tradeProfit += this.ram.randomRecord.sellPrice
                this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)
                this.ram.incomingOffer = null

                // Add action log message.
                this.uiSetVal('actionLog', `Sold it for ${this.moneyString(this.ram.randomRecord.sellPrice)} (${this.moneyString(this.ram.randomRecord.sellPrice - this.ram.randomRecord.buyPrice)} profit).`)

                // Set next action choice to digg.
                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'skipSell':
                // Update action GIF.
                this.uiSetVal('actionGif', 'skipSell')

                // Add action log message.
                this.uiSetVal('actionLog', `Nah, you keep this one for now.`)

                // Reset the incomingOffer boolean that was maybe set in the broke action.
                this.ram.incomingOffer = null

                // Set next action choice to digg.
                this.ram.nextProgressActionChoices = ['digg']
                break

            default:
                console.error('Unknown nextProgressAction:', this.ram.nextProgressAction)
        }

        // Select a random choice for what happens next.
        this.ram.nextProgressAction = this.randomArrayItem(this.ram.nextProgressActionChoices)
    },

    /**
     * Get a random item from an array.
     * @method MusicAddict2.randomArrayItem
     * @param {array} arr  Input to chose the items from.
     * @returns {any}  Nobody knows.
     */
    randomArrayItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    },

    /**
     * Get a random numeric array key.
     * @method MusicAddict2.randomArrayKey
     * @param {array} arr  Input to chose the keys from.
     * @returns {any}  Nobody knows.
     */
    randomArrayKey(arr) {
        return Math.floor(Math.random() * arr.length)
    },

    /**
     * Get a random buy price.
     * @method MusicAddict2.randomBuyPrice
     * @returns {number}  Random buy price.
     */
    randomBuyPrice() {
        for (const k in this.conf.buyPriceRanges) {
            let roll = Math.random()
            if (this.sd.cash >= this.conf.buyPriceRanges[k].minCash && roll <= this.conf.buyPriceRanges[k].rollMax) {
                return this.randomInteger(this.conf.buyPriceRanges[k].range[0], this.conf.buyPriceRanges[k].range[1])
            }
        }
    },

    /**
     * Get a random integer.
     * @method MusicAddict2.randomInteger
     * @param {number} min  Smallest number to include in the range.
     * @param {number} max  Largest number to include in the range.
     * @returns {number}  Random integer.
     */
    randomInteger(min, max) {
        min = Math.ceil(min)
        max = Math.floor(max)
        return Math.floor(Math.random() * (max - min + 1) + min)
    },

    /**
     * Get a randomly generated record.
     * @method MusicAddict2.randomRecord
     * @returns {randomRecord}  Random record.
     */
    randomRecord() {
        return {
            title: this.randomString('recordTitle'),
            artist: this.randomString('artistName'),
            format: this.randomRecordFormat(),
            buyPrice: this.randomBuyPrice(),
            sellPrice: null, // will be decided in action offer, not when buying.
        }
    },

    /**
     * Get a random record format.
     * @method MusicAddict2.randomRecordFormat
     * @returns {string}  Random record format.
     */
    randomRecordFormat() {
        return this.randomArrayItem(this.rd.recordFormats)
    },

    /**
     * Get a random sell price based on buy price.
     * @method MusicAddict2.randomSellPrice
     * @param {number} buyPrice  Buy price.
     * @returns {number}  Random sell price.
     */
    randomSellPrice(buyPrice) {
        return buyPrice + this.randomInteger(1, Math.max(2, buyPrice * this.conf.sellPriceRangeMultiplikator))
    },

    /**
     * Get a random string built from single words.
     * @method MusicAddict2.randomString
     * @param {string} stringType  What type of string to return.
     * @returns {string}  Random string.
     */
    randomString(stringType) {
        let wordCount = 1
        let randomString = []

        switch (stringType) {
            case 'artistName':
                wordCount = this.randomInteger(1, 3)
                break

            case 'recordTitle':
                wordCount = this.randomInteger(1, 4)
                break

            default:
                console.error('Unknown stringType:', stringType)
                return
        }

        while (randomString.length < wordCount) {
            let word = this.randomArrayItem(this.rd[`${stringType}Words`])
            if (randomString.indexOf(word) == -1) {
                randomString.push(word)
            }
        }

        return randomString.join(' ')
    },

    /**
     * Handle recordCollectionClose clicks.
     * @method MusicAddict2.recordCollectionCloseHandleClick
     * @returns void
     */
    recordCollectionCloseHandleClick(/* e */) {
        this.uiSetDisplay('actionLog', 'toggle')
        this.uiSetDisplay('recordCollection', 'toggle')
    },

    /**
     * Get a nicely formatted record string.
     * @method MusicAddict2.recordString
     * @param {object} record  Input record.
     * @returns {string}  Formatted record.
     */
    recordString(record) {
        return `
        <span class="record">
            <span class="title">${record.title}</span>
            by <span class="artist">${record.artist}</span>
            <span class="format">[${record.format}]</span>
        </span>`
    },

    /**
     * Register configured event handlers.
     * @method MusicAddict2.registerEventHandlers
     * @returns void
     */
    registerEventHandlers() {
        this.conf.eventHandler.forEach((v) => {
            if (typeof(this[v.handler]) != 'function') {
                console.warn('main()', 'Event handler is configured but function does not exist:', `${v.handler}()`)
            }
            else {
                if (!this.ui[v.uikey]) {
                    console.warn('main()', 'Event handler is configured but HTML element does not exist:', `${v.uikey}`)
                }
                else {
                    this.ui[v.uikey].addEventListener(v.type, e => this[v.handler](e))
                }
            }
        })
    },

    /**
     * Save game progress.
     * @method MusicAddict2.save
     * @param {boolean} [exit=false]  Whether to exit after saving.
     * @returns void
     */
    save(exit=false) {
        // No token no save.
        if (!this.sd.token) {
            return
        }

        // Always reset lastSavedOn even if the api request failed or we get into an endless try/fail loop.
        this.ram.lastSavedOn = Date.now()

        // Sanitize and remember player name input.
        let playerName = this.ui.inputPlayerName.value.trim().substring(0, 20)
        playerName = playerName.replace(/[^A-Za-z0-9_-]/g, '')
        if (playerName) {
            this.sd.playerName = playerName
        }

        // Save progress data to the database.
        this.apiRequest({
            action: 'save',
            saveData: JSON.stringify(this.sd),
        },
        (response) => {
            if (!response.saved) {
                return
            }

            // Remember Token in localStorage for easy continuing next time.
            if (window.localStorage) {
                window.localStorage.setItem('musicaddict2', btoa(this.sd.token))
            }

            if (exit) {
                this.exit()
            }
        })
    },

    /**
     * Handle sdRecordsCount clicks.
     * @method MusicAddict2.sdRecordsCountHandleClick
     * @returns void
     */
    sdRecordsCountHandleClick(/* e */) {
        this.updateRecordCollection()
        this.uiSetDisplay('actionLog', 'toggle')
        this.uiSetDisplay('recordCollection', 'toggle')
    },

    /**
     * Convert seconds to a human readable duration format.
     * @method MusicAddict2.secToDHMS
     * @param {number} sec  Input to be converted.
     * @param {boolean} [milli=true]  Whether to treat sec as milliseconds.
     * @returns {string}  Converted duration.
     */
    secToDHMS(sec, milli=true) {
        if (milli) {
            sec = sec / 1000
        }

        sec = Math.max(0, sec)

        let d = Math.floor(sec / (3600 * 24))
        let h = Math.floor(sec % (3600 * 24) / 3600)
        let m = Math.floor(sec % 3600 / 60)
        let s = Math.floor(sec % 60)

        if (d > 0) return `${d}d${this.padNum(h)}h${this.padNum(m)}m${this.padNum(s)}s`
        if (h > 0) return `${this.padNum(h)}h${this.padNum(m)}m${this.padNum(s)}s`
        if (m > 0) return `${this.padNum(m)}m${this.padNum(s)}s`
        return `${this.padNum(s)}s`
    },

    /**
     * Start game.
     * @method MusicAddict2.start
     * @returns void
     */
    start() {
        console.time('start()')

        // Load additional data.
        this.injectScript('data')

        // Let the browser preload the action GIFs.
        this.injectPreloaders()

        // Remember when the current session has started.
        this.ram.startedSessionOn = Date.now()

        // Don't auto-save right after starting.
        this.ram.lastSavedOn = Date.now()

        // Don't auto-exit right after starting.
        this.ram.lastCtrlProgressClickOn = Date.now()

        // Update ui elements.
        this.uiSetDisplay('story', 'hide')
        this.uiSetDisplay('links', 'hide')
        this.uiSetDisplay('auth', 'hide')
        this.uiSetDisplay('playerName', 'show')
        this.uiSetVal('playerName', this.playerNameString())
        this.uiSetDisplay('gameCtrl', 'show')
        this.uiSetDisplay('gameStats', 'show')
        this.uiSetDisplay('gameOutput', 'show')

        // If this is the first session, remember it and tell the user to remember the token.
        if (!this.sd.firstPlayedOn) {
            this.sd.firstPlayedOn = Date.now()
            this.uiSetVal('actionLog', `
                <span class="sys">
                    Welcome ${this.sd.playerName}!<br>
                    <br>
                    This is your secret token:<br>
                    <br>
                    ${this.sd.token}<br>
                    <br>
                    Store it somewhere safe and don't share it.
                    You will need this to continue the game when you come back.
                </span>`
            )
        }
        else {
            this.uiSetVal('actionLog', `<span class="sys">Welcome back ${this.sd.playerName}!</span>`)
        }

        // Start background update.
        this.backgroundUpdate(true)

        console.timeEnd('start()')
    },

    /**
     * Check if time's up based on past time and an interval.
     * @method MusicAddict2.timesUp
     * @param {unixMilli} pastTime  Past time.
     * @param {secMilli} interval  Duration that can pass before time's up.
     * @returns {boolean}  Whether the time's up.
     */
    timesUp(pastTime, interval) {
        return Date.now() - pastTime > interval
    },

    /**
     * Collect marked ui elements and store them in {@link MusicAddict2.ui}.
     * @method MusicAddict2.uiCollectElements
     * @returns void
     * @example
     * // mark an element for collection:
     * <span data-uikey="foo">hello world</span> <!-- before collection -->
     * @example
     * // CSS classes for .<uikey> and .ui will be injected automatically when the elements are collected.
     * <span class="ui foo" data-uikey="foo">hello world</span> <!-- after collection -->
     */
    uiCollectElements() {
        document.querySelectorAll('[data-uikey]').forEach(ele => {
            // @ts-ignore  Property 'dataset' does not exist on type 'Element'.ts(2339)
            this.ui[ele.dataset.uikey] = ele
            // @ts-ignore  Property 'dataset' does not exist on type 'Element'.ts(2339)
            ele.classList.add('ui', ele.dataset.uikey)
        })
    },

    /**
     * Set display of ui element.
     * @method MusicAddict2.uiSetDisplay
     * @param {string} uikey  Key of element in {@link MusicAddict2.ui}.
     * @param {string} [vis='toggle']  Display value.
     * @returns void
     */
    uiSetDisplay(uikey, vis='toggle') {
        // Stop if no uikey.
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        // Stop if no vis.
        if (!vis) {
            console.warn('Missing vis value')
            return
        }

        switch (vis) {
            case 'hide':
                // Hide element.
                this.ui[uikey].style.display = 'none'
                break

            case 'show':
                // Show element.
                this.ui[uikey].style.display = ''
                break

            case 'toggle':
                // Toggle element.
                if (this.ui[uikey].style.display == 'none') {
                    this.ui[uikey].style.display = ''
                }
                else {
                    this.ui[uikey].style.display = 'none'
                }
                break

            default:
                // Set display to whatever vis is.
                this.ui[uikey].style.display = vis
        }
    },

    /**
     * Set state of ui element.
     * @method MusicAddict2.uiSetState
     * @param {string} uikey  Key of element in {@link MusicAddict2.ui}.
     * @param {string} [state='toggle']  State value.
     * @returns void
     */
    uiSetState(uikey, state='toggle') {
        // Stop if no uikey.
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        switch (state) {
            case 'enabled':
                // Enable button.
                this.ui[uikey].disabled = false
                break

            case 'disabled':
                // Disable button.
                this.ui[uikey].disabled = true
                break

            case 'toggle':
                // Toggle button state.
                if (!this.ui[uikey].disabled) {
                    this.ui[uikey].disabled = true
                }
                else{
                    this.ui[uikey].disabled = false
                }
                break

            default:
                // Do nothing if state unknown.
                console.warn('Invalid state:', state)
        }
    },

    /**
     * Set value of ui element.
     * @todo Rename to uiSetValue.
     * @method MusicAddict2.uiSetVal
     * @param {string} uikey  Key of element in {@link MusicAddict2.ui}.
     * @param {string} [val='']  Value to set the element to.
     * @returns void
     */
    uiSetVal(uikey, val='') {
        // Stop if no uikey.
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        switch (uikey) {
            case 'actionLog':
                // Prepend a <p> element.
                let p = document.createElement('p')
                p.innerHTML = `<span class="sys">${this.secToDHMS(Date.now() - this.ram.startedSessionOn)} &middot;</span> ${val}`
                this.ui[uikey].prepend(p)
                // Remove excess lines.
                while (this.ui[uikey].children.length > this.conf.actionLogMax) {
                    this.ui[uikey].removeChild(this.ui[uikey].lastElementChild)
                }
                break

            case 'recordCollectionList':
                let tr = document.createElement('tr')
                let td1 = document.createElement('td')
                let td2 = document.createElement('td')
                let td3 = document.createElement('td')
                let td4 = document.createElement('td')

                tr.classList.add('record')
                // @ts-ignore
                td1.innerHTML = `<span class="title">${val.title}</span>`
                // @ts-ignore
                td2.innerHTML = `<span class="artist">${val.artist}</span>`
                // @ts-ignore
                td3.innerHTML = `<span class="format">${val.format}</span>`
                // @ts-ignore
                td4.innerHTML = this.moneyString(val.buyPrice)

                tr.append(td1)
                tr.append(td2)
                tr.append(td3)
                tr.append(td4)

                this.ui.recordCollectionList.append(tr)
                break

            case 'inputPlayerName':
            case 'inputToken':
                // Set <input> values.
                this.ui[uikey].value = val
                break

            case 'actionGif':
                // Set CSS property background-image.
                this.ui[uikey].style.backgroundImage = `url('res/actiongif/${val}.gif')`
                break

            default:
                this.ui[uikey].innerHTML = val
        }
    },

    /**
     * Update record collection listing.
     * @method MusicAddict2.updateRecordCollection
     * @returns void
     */
    updateRecordCollection() {
        this.ui.recordCollectionList.innerHTML = ``
        this.sd.records.forEach((v) => {
            this.uiSetVal('recordCollectionList', v)
        })
    },

    /**
     * Handle upgradeClickspeedLevel clicks.
     * @method MusicAddict2.upgradeClickspeedLevelHandleClick
     * @returns void
     */
    upgradeClickspeedLevelHandleClick(/* e */) {
        this.buyUpgrade('clickspeed')
    },


} // /MusicAddict2
