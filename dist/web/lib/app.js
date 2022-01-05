// @ts-check
'use strict'


const MusicAddict2 = {

    // User-Interface elements. Will be populated in main().
    ui: {},

    // Save data.
    sd: {
        token: '',
        playerName: 'Anonymous',
        playerHash: '294de3557d9d00b3d2d8a1e6aab028cf',
        cash: 7,
        records: [
            // { title: 'Record1', format: 'Cassette', price: 10 }
        ],
    },

    // Static configuration.
    conf: {
        apiPath: './api.php', // abs or rel path to dist/api.php
        eventHandler: [
            // handler functions will be prefixed with the uikey and suffixed with 'Handler'.
            // E.g.: { uikey: 'example', type: 'click' } -> looks for exampleHandler function.
            { uikey: 'ctrlRegister', type: 'click' },
            { uikey: 'ctrlContinue', type: 'click' },
            { uikey: 'ctrlProgress', type: 'click' },
            { uikey: 'ctrlExit',     type: 'click' },
        ],
        actionLogMax: 100, // how many lines to keep in the actionlog
        backgroundUpdateInterval: 500, // do stuff every N, millisec
        clickSpeed: 250, // how fast we can click, millisec
        exitDelay: 2_000, // timeout after we clicked exit before the page gets reloaded, millisec
        autoSaveInterval: 30_000, // interval for auto saving, millisec

        recordsMax: 100, // how many records the player can keep in their collection, integer
        bulkSaleAmount: 25, // how many records to sell in a bulk sale, integer
    },

    // Temporary stuff the app needs to work.
    ram: {
        backgroundUpdateIntervalID: null,
        lastSavedOn: null,

        nextProgressAction: null,
        nextProgressActionChoices: null,

        randomRecord: null,
        incomingOffer: null,
        bulkSaleID: null,
    },




    // ========================================= CORE =============================================

    // Init crucial stuff.
    main() {
        // Collect UI elements.
        document.querySelectorAll('[data-uikey]').forEach(ele => {
            // @ts-ignore
            this.ui[ele.dataset.uikey] = ele
            // @ts-ignore
            ele.classList.add('ui', ele.dataset.uikey)
        })

        // Register event handlers.
        this.conf.eventHandler.forEach((v) => {
            if (typeof(this[`${v.uikey}Handler`]) != 'function') {
                console.warn('main()', 'Event handler is configured but function does not exist:', `${v.uikey}Handler()`)
            }
            else {
                this.ui[v.uikey].addEventListener(v.type, e => this[`${v.uikey}Handler`](e))
            }
        })

        // Hide some UI elements.
        this.uiVis('groupPlay', 'hide') // unhide in ctrlRegisterHandler() + ctrlContinueHandler()

        // Finally un-hide the app.
        this.uiVis('app', 'block')
    },

    // Start or continue playing. Mainly used by ctrlRegisterHandler() and ctrlContinueHandler()
    start() {
        // We don't need the auth part anymore now.
        // Only the fun stuff.
        this.uiVis('groupAuth', 'hide')
        this.uiVis('groupPlay', 'show')

        // We don't want to auto-save right after starting.
        this.ram.lastSavedOn = Date.now()

        // Start background update.
        this.backgroundUpdate(true)
    },

    // Save progress.
    save(exit=false) {
        if (!this.sd.token) {
            return
        }

        // Always reset lastSavedOn even if the api request failed or we get into an endless try/fail loop.
        this.ram.lastSavedOn = Date.now()

        this.apiRequest({
            action: 'save',
            saveData: JSON.stringify(this.sd),
        },
        (response) => {
            if (!response.saved) {
                console.warn('Error while saving', response._errors)
                return
            }

            console.debug('Progress saved.')

            if (exit) {
                this.exit()
            }
        })
    },

    // Stop the world from turning and reload life.
    exit() {
        this.backgroundUpdateStop()

        this.uiState('ctrlProgress', 'disabled')
        this.uiState('ctrlExit', 'disabled')

        this.uiSetEle('actionLog', `Bye!`)

        setTimeout(() => {
            location.reload()
        }, this.conf.exitDelay);
    },

    // Progress in the game.
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

        console.log(Date.now(), this.ram.nextProgressAction)

        // Perform action depending on current nextProgressAction
        // and choose possible choices for the next loop iteration.
        this.ram.nextProgressActionChoices = []

        // -----------------------
        // Basic Game Flow
        //
        // # digg
        // # broke
        // # bulkSale
        //     discover
        //         listen
        //             buy
        //             skipBuy
        //     offer
        //         sell
        //         skipSell
        // -----------------------
        switch (this.ram.nextProgressAction) {
            // next:
            //     digg
            //     discover
            //     offer
            case 'digg':
                this.uiSetEle('actionLog', 'digg')

                this.ram.nextProgressActionChoices = ['digg', 'discover']

                if (this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     broke
            //     offer
            case 'broke':
                this.uiSetEle('actionLog', 'broke')

                this.ram.incomingOffer = Math.random() < 0.5
                if (this.ram.incomingOffer) {
                    this.ram.nextProgressActionChoices = ['offer']
                }
                break

            // next:
            //     digg
            //     offer
            case 'bulkSale':
                this.uiSetEle('actionLog', 'bulkSale')

                this.ram.bulkSaleID = null
                let bulkSaleCounter = 0

                this.uiState('ctrlProgress', 'disabled')
                this.uiState('ctrlExit', 'disabled')

                this.ram.bulkSaleID = setInterval(() => {
                    let k = this.randomArrayKey(this.sd.records)
                    this.ram.randomRecord = { ...this.sd.records[k] }
                    this.ram.randomRecord.collectionKey = k
                    this.ram.randomRecord.sellPrice = this.ram.randomRecord.price + this.randomInteger(1, this.ram.randomRecord.price * 0.5)

                    this.sd.cash += this.ram.randomRecord.sellPrice
                    this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                    bulkSaleCounter += 1

                    this.uiSetEle('actionLog', `Sold ${JSON.stringify(this.ram.randomRecord)}.`)

                    if (bulkSaleCounter == this.conf.bulkSaleAmount) {
                        clearInterval(this.ram.bulkSaleID)
                        this.ram.bulkSaleID = null

                        this.uiState('ctrlProgress', 'enabled')
                        this.uiState('ctrlExit', 'enabled')

                        this.uiSetEle('actionLog', `Done selling ${bulkSaleCounter} records.`)
                    }
                }, 250)

                this.ram.nextProgressActionChoices = ['digg', 'offer']
                break

            // next:
            //     listen
            case 'discover':
                this.uiSetEle('actionLog', 'discover')

                this.ram.randomRecord = this.randomRecord()

                this.ram.nextProgressActionChoices = ['listen']
                break

            // next:
            //     buy
            //     skipBuy
            case 'listen':
                this.uiSetEle('actionLog', 'listen')

                this.ram.nextProgressActionChoices = ['listen']

                // if enough time passed {
                    this.ram.nextProgressActionChoices = ['buy', 'skipBuy']
                // }
                break

            // next:
            //     digg
            //     offer
            case 'buy':
                this.uiSetEle('actionLog', 'buy')

                if (this.sd.cash >= this.ram.randomRecord.price) {
                    this.sd.cash -= this.ram.randomRecord.price
                    this.sd.records.push(this.ram.randomRecord)

                    this.uiSetEle('actionLog', `Bought ${JSON.stringify(this.ram.randomRecord)}.`)
                }
                else {
                    this.uiSetEle('actionLog', `You want it, but have not enough cash.`)
                }

                this.ram.nextProgressActionChoices = ['digg']

                if (this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     digg
            //     offer
            case 'skipBuy':
                this.uiSetEle('actionLog', 'skipBuy')

                this.ram.nextProgressActionChoices = ['digg']

                if (this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     sell
            //     skipSell
            case 'offer':
                this.uiSetEle('actionLog', 'offer')

                let k = this.randomArrayKey(this.sd.records)
                this.ram.randomRecord = { ...this.sd.records[k] }
                this.ram.randomRecord.collectionKey = k
                this.ram.randomRecord.sellPrice = this.ram.randomRecord.price + this.randomInteger(1, this.ram.randomRecord.price * 0.5)

                this.ram.nextProgressActionChoices = ['sell', 'skipSell']
                break

            // next:
            //     digg
            //     offer
            case 'sell':
                this.uiSetEle('actionLog', 'sell')

                this.sd.cash += this.ram.randomRecord.sellPrice
                this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                this.uiSetEle('actionLog', `Sold ${JSON.stringify(this.ram.randomRecord)}.`)

                this.ram.incomingOffer = null
                this.ram.nextProgressActionChoices = ['digg']

                if (this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     digg
            //     offer
            case 'skipSell':
                this.uiSetEle('actionLog', 'skipSell')

                this.ram.incomingOffer = null
                this.ram.nextProgressActionChoices = ['digg']

                if (this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            default:
                console.error('Unknown nextProgressAction:', this.ram.nextProgressAction)
        }

        this.ram.nextProgressAction = this.randomArrayItem(this.ram.nextProgressActionChoices)
    },




    // ==================================== EVENT HANDLERS ========================================

    // Handle ctrlRegister clicks
    ctrlRegisterHandler(e) {
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

            this.start()
        })
    },

    // Handle ctrlContinue clicks
    ctrlContinueHandler(e) {
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

            this.start()
        })
    },

    // Handle ctrlProgress clicks
    ctrlProgressHandler(e) {
        if (!this.sd.token) {
            return
        }

        this.uiState('ctrlProgress', 'disabled')
        setTimeout(() => {
            if (!this.ram.bulkSaleID) {
                this.uiState('ctrlProgress', 'enabled')
            }
        }, this.conf.clickSpeed)

        this.progress()
    },

    // Handle ctrlExit clicks
    ctrlExitHandler(e) {
        this.save(true)
    },




    // ================================== BACKGROUND UPDATE =======================================

    // Update stuff in the background.
    backgroundUpdate(startWorker=false) {
        // Start loop if startWorker=true and backgroundUpdateIntervalID is not already set.
        if (startWorker && !this.ram.backgroundUpdateIntervalID) {
            this.ram.backgroundUpdateIntervalID = setInterval(() => {
                this.backgroundUpdate()
            }, this.conf.backgroundUpdateInterval)
        }

        // Auto-save from time to time.
        if (Date.now() - this.ram.lastSavedOn > this.conf.autoSaveInterval) {
            this.save()
        }

        // Update stuff.
        this.uiSetEle('sdCash', `<span class="cur">${this.sd.cash}</span>`)
        this.uiSetEle('sdRecordsCount', `${this.sd.records.length}`)
    },

    // Stop updating stuff in the background.
    backgroundUpdateStop() {
        clearInterval(this.ram.backgroundUpdateIntervalID)
        this.ram.backgroundUpdateIntervalID = null
    },




    // ========================================= UI ===============================================

    // Set UI element values
    uiSetEle(uikey='', val='') {
        if (!uikey || !this.ui[uikey]) {
            console.warn('Missing or unknown uikey:', uikey)
            return
        }

        switch (uikey) {
            case 'actionLog':
                let p = document.createElement('p')
                p.innerHTML = `${Date.now()}: ${val}`
                this.ui.actionLog.prepend(p)
                while (this.ui.actionLog.children.length > this.conf.actionLogMax) {
                    this.ui.actionLog.removeChild(this.ui.actionLog.lastElementChild)
                }
                break

            default:
                this.ui[uikey].innerHTML = val
        }
    },

    // Set UI element visibility.
    uiVis(uikey='', vis='') {
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

    // Set UI element state. E.g. e.disabled = true|false
    uiState(uikey='', state='') {
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

            default:
                console.warn('Invalid state:', state)
        }
    },




    // ========================================= API ==============================================

    // Make an API request.
    apiRequest(query={}, onSuccess=null) {
        console.debug('api request:', query)

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
                throw new Error('Network response was not OK');
            }
            return response.json();
        })

        .then(responseData => {
            console.debug('api response:', responseData)
            if (typeof(onSuccess) == 'function') {
                onSuccess(responseData)
            }
        })

        .catch(error => {
            console.error('apiRequest Error:', error);
        });
    },




    // ====================================== RANDOMNESS ==========================================

    // A complete random record.
    // WIP
    randomRecord() {
        return {
            title: `Record-${this.randomInteger(1, 1_000)}`,
            artist: `Artist-${this.randomInteger(1, 1_000)}`,
            format: `Format-${this.randomInteger(1, 1_000)}`,
            price: this.randomInteger(1, 10),
        }
    },

    // Get a random item from an array.
    randomArrayItem(array) {
        return array[Math.floor(Math.random() * array.length)]
    },

    // Get a numeric random array key.
    randomArrayKey(array) {
        return Math.floor(Math.random() * array.length)
    },

    // Get a random integer between and min and max (inclusive).
    randomInteger(min, max) {
        min = Math.ceil(min)
        max = Math.floor(max)
        return Math.floor(Math.random() * (max - min + 1) + min)
    },


} // /MusicAddict2
