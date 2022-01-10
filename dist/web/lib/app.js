// @ts-check
'use strict'

/**
 * All the magic.
 * @namespace MusicAddict2
 * @prop {object} ui  User-Interface HTML elements collected in main().
 * @prop {object} rd  Random data from data.js. Mainly to use with the random* methods.
 * @prop {object} sd  Save data to be stored to the database.
 * @prop {object} conf  Static configuration.
 * @prop {object} ram  Temporary vars and objects.
 */
const MusicAddict2 = {
    /**
     * A float or integer number representing milliseconds.
     * @typedef {number} secMilli
     */

    /**
     * A float or integer number representing an unixtime value in milliseconds.
     * @typedef {number} unixMilli
     */

    /**
     * A float number representing a chance value between 0.0 and 1.0. The higher the number the higher the chance to be lucky.
     * @typedef {number} luckyChance
     */

    /**
     * Collected User-Interface HTML elements.
     * @prop {object} ui
     * @example
     * // Mark element for collection with the key "foo".
     * <span data-uikey="foo">hello world</span>
     * @example
     * // The CSS classes .ui and .foo will be added automagically.
     * <span class="ui foo" data-uikey="foo">hello world</span>
     */
    ui: {},

    /**
     * Random data from data.js. Mainly to use with the random* methods.
     * @prop {object} rd
     */
    rd: {},

    /**
     * Save data to be stored to the database.
     * @prop {object} sd
     * @prop {string} sd.token=null  Secret token.
     * @prop {unixMilli} sd.firstPlayedOn=null  First play time.
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
     * @prop {secMilli} conf.exitDelay=2_000  Delay before exiting after ctrlExit.
     * @prop {secMilli} conf.autoSaveInterval=60_000  How often to save automagically.
     * @prop {integer} conf.recordsMax=500  How many records the player can keep in the collection before a bulk sale gets triggered.
     * @prop {integer} conf.bulkSaleAmount=50  How many records to sell in a bulk sale.
     * @prop {object} conf.listenDuration={...}  Range for randomly choosing the listening duration from.
     * @prop {secMilli} conf.listenDuration.min=5_000  Minimum listening duration
     * @prop {secMilli} conf.listenDuration.max=20_000  Maximum listening duration
     * @prop {luckyChance} conf.discoverChance=0.20  Chance a interesting record can be discovered.
     * @prop {luckyChance} conf.offerChance=0.125  Chance get a opportunity to sell a record.
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
     * @prop {unixMilli} ram.lastCtrlProgressClickOn=null  When the ui.ctrlProgress element was last clicked.
     * @prop {unixMilli} ram.lastSavedOn=null  When the last save occured.
     * @prop {string} ram.nextProgressAction=null  What the next progress() action will be.
     * @prop {array} ram.nextProgressActionChoices=null  What the choices are for the next progress() action.
     * @prop {object} ram.randomRecord=null  The current record for either the buy or sell progress() action.
     * @prop {boolean} ram.incomingOffer=null  True if there is an incoming offer.
     * @prop {integer} ram.bulkSaleID=null  ID of the bulkSale progress() action's setInterval loop.
     * @prop {secMilli} ram.listenDuration=null  For how to to listen to a record.
     * @prop {unixMilli} ram.startedListeningOn=null  When the player has started listening to a record.
     * @prop {unixMilli} ram.startedSessionOn=null  When the current game session was started.
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
                this.uiSetVal('inputToken', localStorageToken)
            }
        }

        // Initially hide some UI elements.
        this.uiSetDisplay('game', 'hide') // unhide in start()

        // Update some UI elements.
        this.uiSetVal('inputPlayerName', '')
        this.uiSetVal('actionGif', 'idle')

        // Finally un-hide the app.
        this.uiSetDisplay('app', 'block')
    },

    /**
     * Start or continue playing. Primarily used by ctrlRegisterHandleClick() and ctrlContinueHandler().
     */
    start() {
        // Set display of elements.
        this.uiSetDisplay('ctrlRegister', 'hide')
        this.uiSetDisplay('ctrlContinue', 'hide')
        this.uiSetDisplay('inputToken', 'hide')
        this.uiSetDisplay('home', 'hide')
        this.uiSetDisplay('game', 'show')

        // If this is the first progress, remember it forever.
        if (!this.sd.firstPlayedOn) {
            this.sd.firstPlayedOn = Date.now()
            this.uiSetVal('actionLog', `
                Welcome ${this.sd.playerName}!
                Remember your secret token. You'll need it to continue later:
                ${this.sd.token}
            `)
        }
        else {
            this.uiSetVal('actionLog', `Welcome back ${this.sd.playerName}!`)
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
        this.uiSetState('ctrlProgress', 'disabled')
        this.uiSetState('ctrlExit', 'disabled')
        this.uiSetVal('actionLog', `Bye ${this.sd.playerName}, see you soon!`)

        // Wait a bit before exiting.
        setTimeout(() => {
            location.reload()
        }, this.conf.exitDelay)
    },

    /**
     * Progress in the game.
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
            // Default entry action is digg.
            //
            // !broke
            //   ?offer
            // !bulkSale
            //   digg
            // digg
            //   ?discover
            //     listen
            //       ?buy
            //         digg
            //         ?skipBuy
            //           digg
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

                // If lucky, add offer to next action choices.
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
                this.uiSetVal('actionGif', 'sell')

                // Add action log Message.
                this.uiSetVal('actionLog', `You can not store more records and decide to sell some in bulk.`)

                // Disable controls so we don't mess up data.
                this.uiSetState('ctrlProgress', 'disabled')
                this.uiSetState('ctrlExit', 'disabled')

                // Sell records in bulk one by one.
                this.ram.bulkSaleID = null
                let bulkSaleCounter = 0
                this.ram.bulkSaleID = setInterval(() => {
                    let k = this.randomArrayKey(this.sd.records)
                    this.ram.randomRecord = { ...this.sd.records[k] }
                    this.ram.randomRecord.collectionKey = k
                    this.ram.randomRecord.sellPrice = this.randomSellPrice(this.ram.randomRecord.buyPrice)

                    this.sd.cash += this.ram.randomRecord.sellPrice
                    this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                    bulkSaleCounter += 1

                    this.uiSetVal('actionLog', `Sold ${this.recordString(this.ram.randomRecord)} for ${this.moneyString(this.ram.randomRecord.sellPrice)} (${this.moneyString(this.ram.randomRecord.sellPrice - this.ram.randomRecord.buyPrice)} profit).`)

                    if (bulkSaleCounter >= this.conf.bulkSaleAmount) {
                        clearInterval(this.ram.bulkSaleID)
                        this.ram.bulkSaleID = null

                        this.uiSetState('ctrlProgress', 'enabled')
                        this.uiSetState('ctrlExit', 'enabled')

                        this.uiSetVal('actionLog', `Done selling ${bulkSaleCounter} records.`)
                    }
                }, 1_000)

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
                // Update action GIF.
                this.uiSetVal('actionGif', 'listen')

                // Add action log message.
                this.uiSetVal('actionLog', `Listening.`)

                // Set next action to digg by default.
                this.ram.nextProgressActionChoices = ['listen']

                // Start tracking listening time if not doing so already and set the listening duration.
                if (!this.ram.startedListeningOn) {
                    this.ram.startedListeningOn = Date.now()
                    this.ram.listenDuration = this.randomInteger(this.conf.listenDuration.min, this.conf.listenDuration.max)
                }

                // If listening duration is over, add buy and skipBuy to next action choices.
                if (this.timesUp(this.ram.startedListeningOn, this.ram.listenDuration)) {
                    this.ram.nextProgressActionChoices = ['buy', 'skipBuy']
                    this.ram.startedListeningOn = null
                    this.ram.listenDuration = null
                }
                break

            case 'buy':
                // Buy if enough cash.
                if (this.sd.cash >= this.ram.randomRecord.buyPrice) {
                    // Update action GIF.
                    this.uiSetVal('actionGif', 'buy')

                    this.sd.cash -= this.ram.randomRecord.buyPrice
                    this.sd.records.push(this.ram.randomRecord)

                    this.uiSetVal('actionLog', `Bought ${this.recordString(this.ram.randomRecord)} for ${this.moneyString(this.ram.randomRecord.buyPrice)}.`)
                }
                // Be sad if not enough cash.
                else {
                    this.uiSetVal('actionLog', `You want ${this.recordString(this.ram.randomRecord)}, but don't have enough cash to buy it for ${this.moneyString(this.ram.randomRecord.buyPrice)} (need ${this.moneyString(this.ram.randomRecord.buyPrice - this.sd.cash)} more).`)
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

                // Set next action choices to sell and skipSell.
                this.ram.nextProgressActionChoices = ['sell', 'skipSell']
                break

            case 'sell':
                // Update action GIF.
                this.uiSetVal('actionGif', 'sell')

                // Sell the record and reset the incomingOffer boolean that was maybe set in the broke action.
                this.sd.cash += this.ram.randomRecord.sellPrice
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

            // Store new token the db returned.
            this.sd.token = response.token

            // Reset localStorage token.
            if (window.localStorage) {
                window.localStorage.removeItem('musicaddict2')
            }

            // Set player name from input or leave it to the default.
            let playerName = this.ui.inputPlayerName.value.trim().substring(0, 30)
            playerName = playerName.replace(/[^A-Za-z0-9_-]/g, '')
            if (playerName) {
                this.sd.playerName = playerName
                this.uiSetVal('inputPlayerName', playerName)
            }

            // Set token input value for easy re-login after exit.
            this.uiSetVal('inputToken', this.sd.token)

            // Set player name input value.
            this.uiSetVal('inputPlayerName', this.sd.playerName)

            // Start the game.
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

        // Request save data from api.
        this.apiRequest({
            action: 'continue',
            token: inputToken,
        },
        (response) => {
            if (!response.saveData) {
                console.error('did not get saveData from api')
                return
            }

            // Store token the db returned not what the user has entered.
            this.sd = response.saveData

            // Set player name input value.
            this.uiSetVal('inputPlayerName', this.sd.playerName)

            // Start the game.
            this.start()
        })
    },

    /**
     * Handle ctrlProgress clicks.
     */
    ctrlProgressHandleClick(/* e */) {
        // Stop if we don't have a token.
        if (!this.sd.token) {
            return
        }

        // Remember when this method was last run for later use.
        this.ram.lastCtrlProgressClickOn = Date.now()

        // Disable progress button for a short while.
        this.uiSetState('ctrlProgress', 'disabled')
        setTimeout(() => {
            if (!this.ram.bulkSaleID) {
                this.uiSetState('ctrlProgress', 'enabled')
            }
        }, this.conf.clickSpeed)

        // Trigger a progress action.
        this.progress()
    },

    /**
     * Handle ctrlExit clicks.
     */
    ctrlExitHandleClick(/* e */) {
        // Save and exit.
        this.save(true)
    },




    /* ================================== BACKGROUND UPDATE ==================================== */

    /**
     * Update stuff in the background.
     * @param {boolean} [startWorker=false]  If true, start worker interval.
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
    },

    /**
     * Stop updating stuff in the background.
     */
    backgroundUpdateStop() {
        // Clear the update worker.
        clearInterval(this.ram.backgroundUpdateIntervalID)

        // Reset the worker's interval ID.
        this.ram.backgroundUpdateIntervalID = null
    },




    /* ========================================= UI ============================================ */

    /**
     * Set UI element values.
     * @param {string} uikey  Key of the element stored inside ui. By default innerHTML will be set to val. For the following some extra transformation will be applied: actionLog, inputPlayerName, inputToken, actionGif.
     * @param {string} [val='']  Value to update the element with.
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
                // p.innerHTML = `<span class="sys">${this.secToDHMS(Date.now() - this.ram.startedSessionOn)} &middot;</span> ${val}`
                p.innerHTML = `<span class="sys">${this.secToDHMS(Date.now() - this.sd.firstPlayedOn)} &middot;</span> ${val}`
                this.ui[uikey].prepend(p)
                // Remove excess lines.
                while (this.ui[uikey].children.length > this.conf.actionLogMax) {
                    this.ui[uikey].removeChild(this.ui[uikey].lastElementChild)
                }
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
     * Set UI element display.
     * @param {string} uikey  Key of the element stored inside ui.
     * @param {string} vis  Can be either hide, show, or any value accepted by CSS's display property.
     */
    uiSetDisplay(uikey, vis) {
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

            default:
                // Set display to whatever vis is.
                this.ui[uikey].style.display = vis
        }
    },

    /**
     * Set UI element state.
     * @param {string} uikey  Key of the element stored inside ui.
     * @param {string} [state='toggle']  Can be either set to enabled, disabled or toggle.
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




    /* ========================================= API =========================================== */

    /**
     * Make an API request.
     * @param {object} query  The query to send to the API.
     * @param {function} [onSuccess=null]  A function to run on success. That function will get the response data passed over.
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
            artist: this.randomArtistName(),
            format: this.randomRecordFormat(),
            buyPrice: this.randomBuyPrice(),
            sellPrice: null, // will be decided in action offer, not when buying.
        }
    },

    /**
     * A random record artist.
     * @returns {string}  A random artist name.
     */
    randomArtistName() {
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
     * @returns {number}  A random buy price.
     */
    randomBuyPrice() {
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
     * @param {number} buyPrice  The record's buy price to use as base for the highly scientific calculation.
     * @returns {number}  A random sellPrice.
     */
    randomSellPrice(buyPrice) {
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
     * @param {unixMilli} pastTime  Past time to use as a base for the check.
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
