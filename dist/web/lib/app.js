// @ts-check
'use strict'


const MusicAddict2 = {

    // User-Interface elements. Will be populated in main().
    ui: {},

    // Random data. Set in lib/data.js
    rd: {},

    // Save data.
    sd: {
        token: '',
        playerName: 'Anonymous',
        cash: 7,
        records: [],
    },

    // Static configuration.
    conf: {
        apiPath: './api.php', // abs or rel path to dist/api.php
        eventHandler: [
            { uikey: 'ctrlRegister', type: 'click', handler: 'ctrlRegisterHandleClick' },
            { uikey: 'ctrlContinue', type: 'click', handler: 'ctrlContinueHandleClick' },
            { uikey: 'ctrlProgress', type: 'click', handler: 'ctrlProgressHandleClick' },
            { uikey: 'ctrlExit', type: 'click', handler: 'ctrlExitHandleClick' },
        ],
        actionLogMax: 100, // how many lines to keep in the actionlog
        backgroundUpdateInterval: 500, // do stuff every N, millisec
        clickSpeed: 250, // how fast we can click, millisec
        exitDelay: 2_000, // timeout after we clicked exit before the page gets reloaded, millisec
        autoSaveInterval: 30_000, // interval for auto saving, millisec
        recordsMax: 100, // how many records the player can keep in their collection, integer
        bulkSaleAmount: 25, // how many records to sell in a bulk sale, integer

        discoverInterval: 5_000, // how much time to pass until there is a chance to discover a record, millisec
        offerInterval: 10_000, // how much time to pass until there is a chance to get an offer to sell a record, millisec
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

        lastDiscoverOn: null,
        lastOfferOn: null,
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
            // if (typeof(this[`${v.uikey}Handler`]) != 'function') {
            //     console.warn('main()', 'Event handler is configured but function does not exist:', `${v.uikey}Handler()`)
            // }
            // else {
            //     this.ui[v.uikey].addEventListener(v.type, e => this[`${v.uikey}Handler`](e))
            // }
            if (typeof(this[v.handler]) != 'function') {
                console.warn('main()', 'Event handler is configured but function does not exist:', `${v.handler}()`)
            }
            else {
                this.ui[v.uikey].addEventListener(v.type, e => this[v.handler](e))
            }
        })

        // Check if we have a Token in localStorage and enter it for the lazy/forgetful.
        if (window.localStorage) {
            let localStorageToken = window.localStorage.getItem('musicaddict2')
            if (localStorageToken) {
                localStorageToken = atob(localStorageToken)
                this.uiSetEle('inputToken', localStorageToken)
            }
        }

        // Hide some UI elements.
        this.uiVis('game', 'hide') // unhide in start()

        // Add/update some UI elements.
        this.uiSetEle('inputPlayerName', '')
        this.uiSetEle('actionGif', 'idle')

        // Finally un-hide the app.
        this.uiVis('app', 'block')
    },

    // Start or continue playing. Primarily used by ctrlRegisterHandleClick() and ctrlContinueHandler().
    start() {
        // We don't need the auth part anymore now.
        // Only the fun stuff..
        this.uiVis('ctrlRegister', 'hide')
        this.uiVis('ctrlContinue', 'hide')
        this.uiVis('inputToken', 'hide')
        this.uiVis('game', 'show')

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

        let playerName = this.ui.inputPlayerName.value.trim().substring(0, 30)
        playerName = playerName.replace(/[^A-Za-z0-9_-]/g, '')
        if (playerName) {
            this.sd.playerName = playerName
        }

        this.apiRequest({
            action: 'save',
            saveData: JSON.stringify(this.sd),
        },
        (response) => {
            if (!response.saved) {
                console.warn('Error while saving', response._errors)
                return
            }

            // Remember Token in localStorage.
            if (window.localStorage) {
                window.localStorage.setItem('musicaddict2', btoa(this.sd.token))
            }

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
        }, this.conf.exitDelay)
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

        if (!this.ram.lastDiscoverOn) {
            this.ram.lastDiscoverOn = Date.now()
        }

        if (!this.ram.lastOfferOn) {
            this.ram.lastOfferOn = Date.now()
        }

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
                this.uiSetEle('actionGif', 'digg')

                this.ram.nextProgressActionChoices = ['digg']

                if (this.timesUp(this.ram.lastDiscoverOn, this.conf.discoverInterval)) {
                    this.ram.nextProgressActionChoices.push('discover')
                }

                if (this.timesUp(this.ram.lastOfferOn, this.conf.offerInterval) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     offer
            case 'broke':
                this.uiSetEle('actionLog', 'broke')
                this.uiSetEle('actionGif', 'broke')

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
                this.uiSetEle('actionGif', 'sell')

                this.ram.bulkSaleID = null
                let bulkSaleCounter = 0

                this.uiState('ctrlProgress', 'disabled')
                this.uiState('ctrlExit', 'disabled')

                this.ram.bulkSaleID = setInterval(() => {
                    let k = this.randomArrayKey(this.sd.records)
                    this.ram.randomRecord = { ...this.sd.records[k] }
                    this.ram.randomRecord.collectionKey = k
                    this.ram.randomRecord.sellPrice = this.ram.randomRecord.buyPrice + this.randomInteger(1, this.ram.randomRecord.buyPrice * 0.5)

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
                }, 1_000)

                this.ram.nextProgressActionChoices = ['digg']

                if (this.timesUp(this.ram.lastOfferOn, this.conf.offerInterval) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     listen
            case 'discover':
                this.uiSetEle('actionLog', 'discover')
                this.uiSetEle('actionGif', 'discover')

                this.ram.lastDiscoverOn = Date.now()

                this.ram.randomRecord = this.randomRecord()

                this.ram.nextProgressActionChoices = ['listen']
                break

            // next:
            //     buy
            //     skipBuy
            case 'listen':
                this.uiSetEle('actionLog', 'listen')
                this.uiSetEle('actionGif', 'listen')

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
                this.uiSetEle('actionGif', 'buy')

                if (this.sd.cash >= this.ram.randomRecord.buyPrice) {
                    this.sd.cash -= this.ram.randomRecord.buyPrice
                    this.sd.records.push(this.ram.randomRecord)

                    this.uiSetEle('actionLog', `Bought ${JSON.stringify(this.ram.randomRecord)}.`)
                }
                else {
                    this.uiSetEle('actionLog', `You want ${JSON.stringify(this.ram.randomRecord)}, but have not enough cash.`)
                }

                this.ram.nextProgressActionChoices = ['digg']

                if (this.timesUp(this.ram.lastOfferOn, this.conf.offerInterval) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     digg
            //     offer
            case 'skipBuy':
                this.uiSetEle('actionLog', 'skipBuy')
                this.uiSetEle('actionGif', 'skipBuy')

                this.ram.nextProgressActionChoices = ['digg']

                if (this.timesUp(this.ram.lastOfferOn, this.conf.offerInterval) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     sell
            //     skipSell
            case 'offer':
                this.uiSetEle('actionLog', 'offer')
                this.uiSetEle('actionGif', 'offer')

                this.ram.lastOfferOn = Date.now()

                let k = this.randomArrayKey(this.sd.records)
                this.ram.randomRecord = { ...this.sd.records[k] }
                this.ram.randomRecord.collectionKey = k
                this.ram.randomRecord.sellPrice = this.ram.randomRecord.buyPrice + this.randomInteger(1, this.ram.randomRecord.buyPrice * 0.5)

                this.ram.nextProgressActionChoices = ['sell', 'skipSell']
                break

            // next:
            //     digg
            //     offer
            case 'sell':
                this.uiSetEle('actionLog', 'sell')
                this.uiSetEle('actionGif', 'sell')

                this.sd.cash += this.ram.randomRecord.sellPrice
                this.sd.records.splice(this.ram.randomRecord.collectionKey, 1)

                this.uiSetEle('actionLog', `Sold ${JSON.stringify(this.ram.randomRecord)}.`)

                this.ram.incomingOffer = null
                this.ram.nextProgressActionChoices = ['digg']

                if (this.timesUp(this.ram.lastOfferOn, this.conf.offerInterval) && this.sd.records.length > 0) {
                    this.ram.nextProgressActionChoices.push('offer')
                }
                break

            // next:
            //     digg
            //     offer
            case 'skipSell':
                this.uiSetEle('actionLog', 'skipSell')
                this.uiSetEle('actionGif', 'skipSell')

                this.ram.incomingOffer = null
                this.ram.nextProgressActionChoices = ['digg']

                if (this.timesUp(this.ram.lastOfferOn, this.conf.offerInterval) && this.sd.records.length > 0) {
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
    ctrlRegisterHandleClick(e) {
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

    // Handle ctrlContinue clicks
    ctrlContinueHandleClick(e) {
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

    // Handle ctrlProgress clicks
    ctrlProgressHandleClick(e) {
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
    ctrlExitHandleClick(e) {
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




    // ====================================== RANDOMNESS ==========================================

    // A complete random record.
    // WIP
    randomRecord() {
        return {
            title: this.randomRecordTitle(),
            artist: this.randomRecordArtist(),
            format: this.randomRecordFormat(),
            buyPrice: this.randomRecordPrice(),
            sellPrice: null,
        }
    },

    // A random record title.
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

    // A random record title.
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

    // A random record format.
    randomRecordFormat() {
        return this.randomArrayItem(this.rd.recordFormat)
    },

    // A random record price.
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




    // ====================================== DATE/TIME ===========================================

    timesUp(pastTime=0, interval=0) {
        return Date.now() - pastTime > interval
    },


} // /MusicAddict2
