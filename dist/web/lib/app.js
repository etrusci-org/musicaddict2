// @ts-check
'use strict'

/**
 * All the magic.
 * @namespace MusicAddict2
 * @prop {object} ui  User-Interface HTML elements collected in main(). To mark an element for collection, add data-uikey to it like so: <span data-uikey="foo">
 * @prop {object} rd  Random data from app.rd.js. Mainly to use with the random* methods.
 * @prop {object} sd  Save data to be stored to the database.
 * @prop {object} conf  Static configuration.
 * @prop {object} ram  Temporary vars and objects.
 */
const MusicAddict2 = {
    /**
     * A float or integer representing milliseconds.
     * @typedef {number} secMilli
     */

    /**
     * A float or integer representing an unixtime value in milliseconds.
     * @typedef {number} unixtimeMilli
     */

    /**
     * A float representing a chance value between 0.0 and 1.0. The higher the number the higher the chance to be lucky.
     * @typedef {number} luckyChance
     */

    /**
     * Collected User-Interface HTML elements.
     * @prop {object} ui
     * @example
     * // Mark element for collection with the key "foo".
     * <span data-uikey="foo">access me tru ui.foo then</span>
     */
    ui: {},

    /**
     * Random data from app.rd.js. Mainly to use with the random* methods.
     * @prop {object} rd
     */
    rd: {},

    /**
     * Save data to be stored to the database.
     * @prop {object} sd
     * @prop {string} sd.token=null  Secret token.
     * @prop {unixtimeMilli} sd.firstPlayedOn=null  First play time.
     * @prop {string} sd.playerName='Anonymous'  Player name.
     * @prop {integer} sd.cash=7  Cash holdings.
     * @prop {array} sd.records=[]]  Record collection.
     */
    sd: {
        token: null,
        firstPlayedOn: null,
        playerName: 'Anonymous',
        cash: 7,
        records: [],
    },

    /**
     * Static configuration.
     * @prop {object} conf
     * @prop {string} conf.apiPath='./api.php'  Absolute or relative path to dist/web/api.php.
     * @prop {object} conf.eventHandler={...}  Event handler configuration.
     * @prop {integer} conf.actionLogMax=500  How many lines to keep in the action log.
     * @prop {secMilli} conf.backgroundUpdateInterval=500  Background updater interval delay.
     * @prop {secMilli} conf.clickSpeed=1_000  Timeout after a ctrlProgress click.
     * @prop {secMilli} conf.exitDelay=2_000  Delay click before exiting after ctrlExit.
     * @prop {secMilli} conf.autoSaveInterval=60_000  How often to save automagically.
     * @prop {integer} conf.recordsMax=500  How many records the player can keep in the collection before a bulk sale gets triggered.
     * @prop {integer} conf.bulkSaleAmount=50  How many records to sell in a bulk sale.
     * @prop {object} conf.listenDuration={...}  Range for randomly choosing the listening duration from.
     * @prop {secMilli} conf.listenDuration.min=5_000  Minimum listening duration
     * @prop {secMilli} conf.listenDuration.max=20_000  Maximum listening duration
     * @prop {chance} conf.discoverChance=0.20  Chance a interesting record can be discovered, chance can be between 0.0 and 1.0.
     * @prop {chance} conf.offerChance=0.125  Chance get a opportunity to sell a record, chance can be between 0.0 and 1.0.
     * @prop {secMilli} conf.maxIdleDuration=600_000  Maximum time can pass without clicking before getting kicked out of the game.
     */
    conf: {
        apiPath: './api.php',
        eventHandler: [
            { uikey: 'ctrlRegister', type: 'click', handler: 'ctrlRegisterHandleClick' },
            { uikey: 'ctrlContinue', type: 'click', handler: 'ctrlContinueHandleClick' },
            { uikey: 'ctrlProgress', type: 'click', handler: 'ctrlProgressHandleClick' },
            { uikey: 'ctrlExit', type: 'click', handler: 'ctrlExitHandleClick' },
        ],
        actionLogMax: 500,
        backgroundUpdateInterval: 500,
        clickSpeed: 1_000,
        exitDelay: 2_000,
        autoSaveInterval: 60_000,
        recordsMax: 500,
        bulkSaleAmount: 50,
        listenDuration: { min: 5_000, max: 20_000 },
        discoverChance: 0.20,
        offerChance: 0.125,
        maxIdleDuration: 600_000,
    },

    /**
     * Temporary vars and objects.
     * @prop {object} ram
     * @prop {integer} ram.backgroundUpdateIntervalID=null  ID of backgroundUpdate()'s setInterval loop.
     * @prop {unixtimeMilli} ram.lastCtrlProgressClickOn=null  When the ui.ctrlProgress element was last clicked.
     * @prop {unixtimeMilli} ram.lastSavedOn=null  When the last save occured.
     * @prop {string} ram.nextProgressAction=null  What the next progress() action will be.
     * @prop {array} ram.nextProgressActionChoices=null  What the choices are for the next progress() action.
     * @prop {object} ram.randomRecord=null  The current record for either the buy or sell progress() action.
     * @prop {boolean} ram.incomingOffer=null  True if there is an incoming offer.
     * @prop {integer} ram.bulkSaleID=null  ID of the bulkSale progress() action's setInterval loop.
     * @prop {secMilli} ram.listenDuration=null  For how to to listen to a record.
     * @prop {unixtimeMilli} ram.startedListeningOn=null  When the player has started listening to a record.
     * @prop {unixtimeMilli} ram.startedSessionOn=null  When the current game session was started.
     */
    ram: {
        backgroundUpdateIntervalID: null,
        lastCtrlProgressClickOn: null,
        lastSavedOn: null,
        nextProgressAction: null,
        nextProgressActionChoices: null,
        randomRecord: null,
        incomingOffer: null,
        bulkSaleID: null,
        listenDuration: null,
        startedListeningOn: null,
        startedSessionOn: null,
    },




    /* ========================================= CORE ========================================== */

    /**
     * Init crucial stuff.
     */
    main() {
        // Collect marked UI elements.
        document.querySelectorAll('[data-uikey]').forEach(ele => {
            // @ts-ignore
            this.ui[ele.dataset.uikey] = ele
            // @ts-ignore
            ele.classList.add('ui', ele.dataset.uikey)
        })

        // Register event handlers.
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

        // Check if we have a token in localStorage and enter it into inputToken for the lazy.
        if (window.localStorage) {
            let localStorageToken = window.localStorage.getItem('musicaddict2')
            if (localStorageToken) {
                localStorageToken = atob(localStorageToken)
                this.uiSetEle('inputToken', localStorageToken)
            }
        }

        // Initially hide some UI elements.
        this.uiVis('game', 'hide') // unhide in start()

        // Update some UI elements.
        this.uiSetEle('inputPlayerName', '')
        this.uiSetEle('actionGif', 'idle')

        // Finally un-hide the app.
        this.uiVis('app', 'block')
    },

    /**
     * Start or continue playing. Primarily used by ctrlRegisterHandleClick() and ctrlContinueHandler().
     */
    start() {
        // Set display of elements.
        this.uiVis('ctrlRegister', 'hide')
        this.uiVis('ctrlContinue', 'hide')
        this.uiVis('inputToken', 'hide')
        this.uiVis('home', 'hide')
        this.uiVis('game', 'show')

        // If this is the first time, remember it forever.
        if (!this.sd.firstPlayedOn) {
            this.sd.firstPlayedOn = Date.now()
        }

        // Remember when the current session has started.
        this.ram.startedSessionOn = Date.now()

        // Don't auto-save right after starting.
        this.ram.lastSavedOn = Date.now()

        // Don't auto-exit right after starting.
        this.ram.lastCtrlProgressClickOn = Date.now()

        // Start background update.
        this.backgroundUpdate(true)
    },

    /**
     * Save progress.
     * @param {boolean} [exit=false]  If true, trigger exit() after saving.
     */
    save(exit=false) {
        // No token no save.
        if (!this.sd.token) {
            return
        }

        // Always reset lastSavedOn even if the api request failed or we get into an endless try/fail loop.
        this.ram.lastSavedOn = Date.now()

        // Sanitize and remember player name input.
        let playerName = this.ui.inputPlayerName.value.trim().substring(0, 30)
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
                console.warn('Error while saving', response._errors)
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
     * Stop the world from turning and reload life.
     */
    exit() {
        // Stop the background update worker
        this.backgroundUpdateStop()

        // Update ui elements
        this.uiState('ctrlProgress', 'disabled')
        this.uiState('ctrlExit', 'disabled')
        this.uiSetEle('actionLog', `Bye ${this.sd.playerName}, see you soon!`)

        // Wait a bit before exiting.
        setTimeout(() => {
            location.reload()
        }, this.conf.exitDelay)
    },

    /**
     * Progress in the game.
     */
    progress() {
        // Decide what happens next.
        if (!this.ram.nextProgressAction) {
            this.ram.nextProgressAction = 'digg'
        }

        if (this.sd.cash == 0 && !this.ram.incomingOffer) {
            this.ram.nextProgressAction = 'broke'
        }

        if (this.sd.records.length > this.conf.recordsMax) {
            this.ram.nextProgressAction = 'bulkSale'
        }

        // Perform action depending on current nextProgressAction
        // and choose possible choices for the next loop iteration.
        this.ram.nextProgressActionChoices = []

        // -----------------------
        // Basic Game Flow
        //
        // # broke
        //     ?offer
        // # bulkSale
        //     digg
        // # digg
        //     ?discover
        //         listen
        //             ?buy
        //                 digg
        //             ?skipBuy
        //                 digg
        //     ?offer
        //         ?sell
        //             digg
        //         ?skipSell
        //             digg
        // -----------------------
        switch (this.ram.nextProgressAction) {
            case 'digg':
                this.uiSetEle('actionGif', 'digg')

                this.uiSetEle('actionLog', `Digging for cool records.`)

                this.ram.nextProgressActionChoices = ['digg']

                if (this.lucky(this.conf.discoverChance)) {
                    this.ram.nextProgressActionChoices.push('discover')
                }

                if (this.lucky(this.conf.offerChance) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            case 'broke':
                this.uiSetEle('actionGif', 'broke')

                this.uiSetEle('actionLog', `You're broke.`)

                this.ram.incomingOffer = this.lucky(this.conf.offerChance)

                if (this.ram.incomingOffer) {
                    this.ram.nextProgressActionChoices = ['offer']
                }
                break

            case 'bulkSale':
                this.uiSetEle('actionGif', 'sell')

                this.uiSetEle('actionLog', `You can not store more records and decide to sell some in bulk.`)

                this.uiState('ctrlProgress', 'disabled')
                this.uiState('ctrlExit', 'disabled')

                this.ram.bulkSaleID = null
                let bulkSaleCounter = 0

                this.ram.bulkSaleID = setInterval(() => {
                    let k = this.randomArrayKey(this.sd.records)
                    this.ram.randomRecord = { ...this.sd.records[k] }
                    this.ram.randomRecord.collectionKey = k
                    this.ram.randomRecord.sellPrice = this.randomRecordSellPrice(this.ram.randomRecord.buyPrice)

                    this.sd.cash += this.ram.randomRecord.sellPrice
                    this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                    bulkSaleCounter += 1

                    this.uiSetEle('actionLog', `Sold ${this.recordString(this.ram.randomRecord)} for ${this.moneyString(this.ram.randomRecord.sellPrice)} (${this.moneyString(this.ram.randomRecord.sellPrice - this.ram.randomRecord.buyPrice)} profit).`)

                    if (bulkSaleCounter >= this.conf.bulkSaleAmount) {
                        clearInterval(this.ram.bulkSaleID)
                        this.ram.bulkSaleID = null

                        this.uiState('ctrlProgress', 'enabled')
                        this.uiState('ctrlExit', 'enabled')

                        this.uiSetEle('actionLog', `Done selling ${bulkSaleCounter} records.`)
                    }
                }, 1_000)

                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'discover':
                this.uiSetEle('actionGif', 'discover')

                this.ram.randomRecord = this.randomRecord()

                this.uiSetEle('actionLog', `Discovered ${this.recordString(this.ram.randomRecord)}.`)

                this.ram.nextProgressActionChoices = ['listen']
                break

            case 'listen':
                this.uiSetEle('actionGif', 'listen')

                this.uiSetEle('actionLog', `Listening.`)

                this.ram.nextProgressActionChoices = ['listen']

                if (!this.ram.startedListeningOn) {
                    this.ram.startedListeningOn = Date.now()
                    this.ram.listenDuration = this.randomInteger(this.conf.listenDuration.min, this.conf.listenDuration.max)
                }

                if (this.timesUp(this.ram.startedListeningOn, this.ram.listenDuration)) {
                    this.ram.nextProgressActionChoices = ['buy', 'skipBuy']
                    this.ram.startedListeningOn = null
                    this.ram.listenDuration = null
                }
                break

            case 'buy':
                this.uiSetEle('actionGif', 'buy')

                if (this.sd.cash >= this.ram.randomRecord.buyPrice) {
                    this.sd.cash -= this.ram.randomRecord.buyPrice
                    this.sd.records.push(this.ram.randomRecord)

                    this.uiSetEle('actionLog', `Bought ${this.recordString(this.ram.randomRecord)} for ${this.moneyString(this.ram.randomRecord.buyPrice)}.`)
                }
                else {
                    this.uiSetEle('actionLog', `You want ${this.recordString(this.ram.randomRecord)}, but don't have enough cash to buy it for ${this.moneyString(this.ram.randomRecord.buyPrice)} (need ${this.moneyString(this.ram.randomRecord.buyPrice - this.sd.cash)} more).`)
                }

                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'skipBuy':
                this.uiSetEle('actionGif', 'skipBuy')

                this.uiSetEle('actionLog', `Nah, you don't like ${this.recordString(this.ram.randomRecord)} that much.`)

                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'offer':
                this.uiSetEle('actionGif', 'offer')

                let k = this.randomArrayKey(this.sd.records)
                this.ram.randomRecord = { ...this.sd.records[k] }
                this.ram.randomRecord.collectionKey = k
                this.ram.randomRecord.sellPrice = this.randomRecordSellPrice(this.ram.randomRecord.buyPrice)

                this.uiSetEle('actionLog', `Someone wants to buy ${this.recordString(this.ram.randomRecord)} from your collection.`)

                this.ram.nextProgressActionChoices = ['sell', 'skipSell']
                break

            case 'sell':
                this.uiSetEle('actionGif', 'sell')

                this.sd.cash += this.ram.randomRecord.sellPrice
                this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                this.uiSetEle('actionLog', `Sold it for ${this.moneyString(this.ram.randomRecord.sellPrice)} (${this.moneyString(this.ram.randomRecord.sellPrice - this.ram.randomRecord.buyPrice)} profit).`)

                this.ram.incomingOffer = null

                this.ram.nextProgressActionChoices = ['digg']
                break

            case 'skipSell':
                this.uiSetEle('actionGif', 'skipSell')

                this.uiSetEle('actionLog', `Nah, you keep this one for now.`)

                this.ram.incomingOffer = null

                this.ram.nextProgressActionChoices = ['digg']
                break

            default:
                console.error('Unknown nextProgressAction:', this.ram.nextProgressAction)
        }

        this.ram.nextProgressAction = this.randomArrayItem(this.ram.nextProgressActionChoices)
    },




    /* ==================================== EVENT HANDLERS ===================================== */

    /**
     * Handle ctrlRegister clicks.
     */
    ctrlRegisterHandleClick(/* e */) {
        // Stop if we already have a token.
        if (this.sd.token) {
            return
        }

        // Request new token from api
        this.apiRequest({
            action: 'register',
        },
        (response) => {
            if (!response.token) {
                console.error('Got no token from api')
                return
            }

            this.sd.token = response.token

            if (window.localStorage) {
                window.localStorage.removeItem('musicaddict2')
            }

            let playerName = this.ui.inputPlayerName.value.trim().substring(0, 30)
            playerName = playerName.replace(/[^A-Za-z0-9_-]/g, '')
            if (playerName) {
                this.sd.playerName = playerName
                this.uiSetEle('inputPlayerName', playerName)
            }

            this.uiSetEle('inputToken', this.sd.token)
            this.uiSetEle('inputPlayerName', this.sd.playerName)

            this.start()
        })
    },

    /**
     * Handle ctrlContinue clicks.
     */
    ctrlContinueHandleClick(/* e */) {
        // Stop if we already have a token.
        if (this.sd.token) {
            return
        }

        // Stop if the token input is empty.
        let inputToken = this.ui.inputToken.value.trim()
        if (!inputToken) {
            console.info('You need to enter your Secret Token to continue.')
            return
        }

        // Request saveData from api
        this.apiRequest({
            action: 'continue',
            token: inputToken,
        },
        (response) => {
            if (!response.saveData) {
                console.error('did not get saveData from api')
                return
            }

            this.sd = response.saveData

            this.uiSetEle('inputPlayerName', this.sd.playerName)

            this.start()
        })
    },

    /**
     * Handle ctrlProgress clicks.
     */
    ctrlProgressHandleClick(/* e */) {
        if (!this.sd.token) {
            return
        }

        this.ram.lastCtrlProgressClickOn = Date.now()

        this.uiState('ctrlProgress', 'disabled')
        setTimeout(() => {
            if (!this.ram.bulkSaleID) {
                this.uiState('ctrlProgress', 'enabled')
            }
        }, this.conf.clickSpeed)

        this.progress()
    },

    /**
     * Handle ctrlExit clicks.
     */
    ctrlExitHandleClick(/* e */) {
        this.save(true)
    },




    /* ================================== BACKGROUND UPDATE ==================================== */

    /**
     * Update stuff in the background.
     * @param {boolean} [startWorker=false]  If true, start worker interval.
     */
    backgroundUpdate(startWorker=false) {
        // Start loop if startWorker=true and backgroundUpdateIntervalID is not already set.
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
            this.uiSetEle('actionLog', `Idle detection kicked in.`)
            this.save(true)
        }

        // Update stuff.
        this.uiSetEle('sdCash', `${this.moneyString(this.sd.cash)}`)
        this.uiSetEle('sdRecordsCount', `${this.sd.records.length}`)
    },

    /**
     * Stop updating stuff in the background.
     */
    backgroundUpdateStop() {
        clearInterval(this.ram.backgroundUpdateIntervalID)
        this.ram.backgroundUpdateIntervalID = null
    },




    /* ========================================= UI ============================================ */

    /**
     * Set UI element values.
     * @todo Rename to uiSetVal.
     * @param {string} uikey  Key of the element stored inside ui. By default innerHTML will be set to val. For the following some extra transformation will be applied: actionLog, inputPlayerName, inputToken, actionGif.
     * @param {string} [val='']  Value to update the element with.
     */
    uiSetEle(uikey, val='') {
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        switch (uikey) {
            case 'actionLog':
                let p = document.createElement('p')
                p.innerHTML = `<span class="sys">${this.secToDHMS(Date.now() - this.ram.startedSessionOn)} &middot;</span> ${val}`
                this.ui[uikey].prepend(p)
                while (this.ui[uikey].children.length > this.conf.actionLogMax) {
                    this.ui[uikey].removeChild(this.ui[uikey].lastElementChild)
                }
                break

            case 'inputPlayerName':
            case 'inputToken':
                this.ui[uikey].value = val
                break

            case 'actionGif':
                this.ui[uikey].style.backgroundImage = `url('res/actiongif/${val}.gif')`
                break

            default:
                this.ui[uikey].innerHTML = val
        }
    },

    /**
     * Set UI element display.
     * @todo Rename to uiSetDisplay.
     * @param {string} uikey  Key of the element stored inside ui.
     * @param {string} [vis='']  Can be either hide, show, or any value accepted by CSS's display property.
     */
    uiVis(uikey, vis='') {
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        if (!vis) {
            console.warn('Missing vis value')
            return
        }

        switch (vis) {
            case 'hide':
                this.ui[uikey].style.display = 'none'
                break

            case 'show':
                this.ui[uikey].style.display = ''
                break

            default:
                this.ui[uikey].style.display = vis
        }
    },

    /**
     * Set UI element state.
     * @todo Rename to uiSetState.
     * @todo Test toggle.
     * @param {string} uikey  Key of the element stored inside ui.
     * @param {string} [state='toggle']  Can be either set to enabled, disabled or toggle.
     */
    uiState(uikey, state='toggle') {
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        switch (state) {
            case 'enabled':
                this.ui[uikey].disabled = false
                break

            case 'disabled':
                    this.ui[uikey].disabled = true
                    break

            case 'toggle':
                if (!this.ui[uikey].disabled) {
                    this.ui[uikey].disabled = true
                }
                else{
                    this.ui[uikey].disabled = false
                }
                break

            default:
                console.warn('Invalid state:', state)
        }
    },




    /* ========================================= API =========================================== */

    /**
     * Make an API request.
     * @param {object} query  The query to send to the API.
     * @param {function} [onSuccess=null]  A function to run on success. That function will get the response data passed over.
     */
    apiRequest(query, onSuccess=null) {
        const queryData = new FormData()
        for (const k in query) {
            queryData.append(k, query[k])
        }
        fetch(this.conf.apiPath, {
            method: 'POST',
            body: queryData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK')
            }
            return response.json()
        })
        .then(responseData => {
            if (typeof(onSuccess) == 'function') {
                onSuccess(responseData)
            }
        })
        .catch(error => {
            console.error('apiRequest Error:', error)
        })
    },




    /* ====================================== RANDOMNESS ======================================= */

    /**
     * Be lucky, or not.
     * @param {luckyChance} chance  The chance to be lucky.
     * @returns {boolean}  True if lucky.
     */
    lucky(chance) {
        chance = Math.max(0, chance)
        return Math.random() < chance
    },

    /**
     * A complete random record.
     * @returns {object}  A complete random record with the attributes: title, artist, format, buyPrice, sellPrice.
     */
    randomRecord() {
        return {
            title: this.randomRecordTitle(),
            artist: this.randomRecordArtist(),
            format: this.randomRecordFormat(),
            buyPrice: this.randomRecordPrice(),
            sellPrice: null, // will be decided in action offer, not when buying.
        }
    },

    /**
     * A random record artist.
     * @todo Rename to randomArtistName.
     * @returns {string}  A random artist name.
     */
    randomRecordArtist() {
        let c = this.randomInteger(1, 3)
        let name = []

        while (c > 0) {
            let word = this.randomArrayItem(this.rd.recordArtistWords)
            if (name.indexOf(word) == -1) {
                name.push(word)
                c--
            }
        }

        return name.join(' ')
    },

    /**
     * A random record title.
     * @returns {string}  A random record title.
     */
    randomRecordTitle() {
        let c = this.randomInteger(1, 4)
        let title = []

        while (c > 0) {
            let word = this.randomArrayItem(this.rd.recordTitleWords)
            if (title.indexOf(word) == -1) {
                title.push(word)
                c--
            }
        }

        return title.join(' ')
    },

    /**
     * A random record format.
     * @returns {string}  A random record format.
     */
    randomRecordFormat() {
        return this.randomArrayItem(this.rd.recordFormat)
    },

    /**
     * A random record buy price.
     * @todo Rename to randomBuyPrice.
     * @returns {number}  A random buy price.
     */
    randomRecordPrice() {
        let tier = Math.random()

        // Tier 6
        if (tier < 0.01 && this.sd.cash > 500) {
            return this.randomInteger(501, 1000)
        }

        // Tier 5
        if (tier < 0.05 && this.sd.cash > 200) {
            return this.randomInteger(201, 500)
        }

        // Tier 4
        if (tier < 0.15 && this.sd.cash > 50) {
            return this.randomInteger(51, 200)
        }

        // Tier 3
        if (tier < 0.40 && this.sd.cash > 20) {
            return this.randomInteger(21, 50)
        }

        // Tier 2
        if (tier < 0.90 && this.sd.cash > 7) {
            return this.randomInteger(8, 20)
        }

        // Tier 1
        return this.randomInteger(1, 7)
    },

    /**
     * A random sellPrice based on buyPrice.
     * @todo Rename to randomSellPrice.
     * @param {number} buyPrice  The record's buy price to use as base for the highly scientific calculation.
     * @returns {number}  A random sellPrice.
     */
    randomRecordSellPrice(buyPrice) {
        return buyPrice + this.randomInteger(1, Math.max(2, buyPrice * 0.5))
    },

    /**
     * Get a random item from an array.
     * @param {array} array  Input array with items to choose from.
     * @returns {any}  Nobody knows.
     */
    randomArrayItem(array) {
        return array[Math.floor(Math.random() * array.length)]
    },

    /**
     * Get a numeric random array key.
     * @param {array} array  Input array to choose they keys from.
     * @returns {number}  Random key.
     */
    randomArrayKey(array) {
        return Math.floor(Math.random() * array.length)
    },

    /**
     * Get a random integer between and minNum and maxNum (inclusive).
     * @param {number} minNum  Smallest number to include in the range.
     * @param {number} maxNum  Largest number to include in the range.
     * @return {number} - Random integer between and inclusive minNum and maxNum.
     */
    randomInteger(minNum, maxNum) {
        minNum = Math.ceil(minNum)
        maxNum = Math.floor(maxNum)
        return Math.floor(Math.random() * (maxNum - minNum + 1) + minNum)
    },




    /* ====================================== DATE/TIME ======================================== */

    /**
     * Check if time's up.
     * @param {unixtimeMilli} pastTime  Past time to use as a base for the check.
     * @param {secMilli} interval  Interval duration to use for the check.
     * @returns {boolean}  True if Date.now() - pastTime > interval.
     */
    timesUp(pastTime, interval) {
        return Date.now() - pastTime > interval
    },

    /**
     * Convert seconds to a human readable duration string.
     * @param {number} sec  Seconds to convert.
     * @param {boolean} [milli=true]  If true, indicates that milliseconds are used as input.
     * @returns {string}  A string in the format NdNNhNNmNNs.
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




    /* ============================== TEXT/NUMBER TRASNFORM ==================================== */

    /**
     * Pad numbers < 10 with a 0.
     * @param {number} num  The number to be padded.
     * @returns {string}  A padded or the original number.
     */
    padNum(num) {
        return (num < 10 && num >= 0) ? `0${num}` : `${num}`
    },

    /**
     * Nice formatted record string.
     * @param {object} record  A record object.
     * @returns {string}  Formatted HTML.
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
     * Nice formatted money string.
     * @param {number} moneyAmount  Amount of money.
     * @returns {string}  Formatted HTML.
     */
    moneyString(moneyAmount) {
        let warningClass = (moneyAmount <= 0) ? ` warning` : ``
        return `<span class="money${warningClass}">${moneyAmount}</span>`
    },

} // /MusicAddict2
