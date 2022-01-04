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
        records: [],
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
        actionLogMax: 5, // how many lines to keep in the actionlog
        backgroundUpdateInterval: 500, // do stuff every N, millisec
        clickSpeed: 1_000, // how fast we can click, millisec
        exitDelay: 3_000, // timeout after we clicked exit before the page gets reloaded, millisec
    },

    // Temporary stuff the app needs to work.
    ram: {
        backgroundUpdateIntervalID: null,
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
    startGame() {
        this.uiVis('groupAuth', 'hide')
        this.uiVis('groupPlay', 'show')
        this.backgroundUpdate(true)
    },




    // ==================================== EVENT HANDLERS ========================================

    // Handle ctrlRegister clicks
    ctrlRegisterHandler(e) {
        // Stop if we already have a token.
        if (this.sd.token) {
            return
        }

        // Request new token from api
        this.apiRequest({action: 'register'}, (response) => {
            if (!response.token) {
                console.error('did not get token from api')
                return
            }

            this.sd.token = response.token
            this.startGame()
        })
    },

    // Handle ctrlContinue clicks
    ctrlContinueHandler(e) {
        // Stop if we already have a token.
        if (this.sd.token) {
            return
        }

        // Stop if the token input is empty.
        let token = this.ui.inputToken.value.trim()
        if (!token) {
            console.info('You need to enter your Secret Token to continue.')
            return
        }

        // Request saveData from api
        this.apiRequest({action: 'continue', token: token}, (response) => {
            if (!response.saveData) {
                console.error('did not get saveData from api')
                return
            }

            this.sd = response.saveData
            this.startGame()
        })
    },

    // Handle ctrlProgress clicks
    ctrlProgressHandler(e) {
        this.uiSetEle('actionLog', `<strong>${e.target.dataset.uikey}</strong>`)

        this.ui.ctrlProgress.disabled = true
        setTimeout(() => {
            this.ui.ctrlProgress.disabled = false
        }, this.conf.clickSpeed)
    },

    // Handle ctrlExit clicks
    ctrlExitHandler(e) {
        this.uiSetEle('actionLog', `<strong>${e.target.dataset.uikey}</strong>`)

        this.backgroundUpdateStop()

        this.ui.ctrlProgress.disabled = true
        this.ui.ctrlExit.disabled = true

        this.uiSetEle('actionLog', `Bye!`)

        setTimeout(() => {
            location.reload()
        }, this.conf.exitDelay);
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

        // Update stuff
        this.uiSetEle('actionLog', `backgroundUpdate`)
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

}
