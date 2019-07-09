/**
 * terminal.js
 * 
 * Heavily adapted from Ines Montani's termynal.js implementation, made more interactive.
 * Changed to take jsons to load new pages after clearning.
 * 
 * please don't look at this code it really sucks ass
 *
 * @author Cuebeom Choi
 * @version 0.0.1
 */

const container = '#terminal';
const promptText = 'acm@cmu.org:~ $';
const linkIds = ['welcome', 'aboutus', 'events', 'sponsors', 'contactus', 'register'];
const clearChars = ['c', 'l', 'e', 'a', 'r'];
const lookupURL = 'https://apis.scottylabs.org/directory/v1/andrewID/';

class Terminal {
    /**
     * Here we construct the Terminal class. We set up all
     * the variables we need to, then fetch the page data for the
     * Welcome page. We want to change this eventually to pull the 
     * appropriate page.
     */
    constructor() {
        this.container = document.querySelector(container);
        this.pfx = `data-ty`;
        this.typeDelay = 35;
        this.startDelay = 150;
        this.lineDelay = 150;
        this.cursor = '▋';
        this.stalledLine = null;
        this.previousInput = '';
        this.validLinks = false;
        this.setLinks();

        fetch('/welcome')
        .then(response => response.json())
        .then(json => terminal.clear(json.data))
    }

    /* clear clears the terminal window for a fresh start. */
    clear(lines) {
        this.lines = lines;
        this.container.innerHTML = '';
    }

    /**
     * start starts the terminal and lets it display the lines
     * stored in this.lines. It goes through each one, reads the type
     * of the entry, and then displays it accordingly based on the type.
     */
    async start() {
        await this._wait(this.lineDelay);

        for (let entry of this.lines) {
            var line = document.createElement('span');
            const type = entry.type;
            const data = entry.data;
            const delay = this.lineDelay;

            if (type == 'input') {
                line.setAttribute(`${this.pfx}-cursor`, this.cursor);
                await this.type(line, data);
                await this._wait(delay);
            } else if (type == 'userinput') {
                line.setAttribute(`${this.pfx}-cursor`, this.cursor);
                line.innerHTML = data;
                line.setAttribute('id', type);
                this.container.appendChild(line);

                await this.readInput(line);
                await this._wait(delay);
            } else if (type == 'andrewidres') {
                var andrewid = this.previousInput;
                this.previousInput = '';

                await fetch(lookupURL + andrewid)
                .then(response => response.json())
                .then(json => terminal.startRegistration(json))
                .catch(error => terminal.notifyFailure(error));
            } else {
                line.innerHTML = data;
                line.setAttribute('id', type);
                this.container.appendChild(line);
                await this._wait(delay);
            }

            line.removeAttribute(`${this.pfx}-cursor`);
        }
        this.setScrollLinks();
        this.stall();
        this.validLinks = true;
    }

    /**
     * startRegistration starts the registration process given
     * the json response from the ScottyLabs API. This only
     * triggers if the given andrewID was found.
     */
    async startRegistration(json) {
        await this.verifyId(json);
        if (this.previousInput == 'n') {
            await this.wrongId();
        } else {
            if (this.previousInput == '') {
                var elem = document.getElementById('confirmation')
                elem.innerHTML = 'Y';
            }
            this.previousInput = '';

            await this.askName(json);
            await this.askEmail(json);
        }
    }

    /**
     * wrongId signifies that the user as said that they have put in the incorrect
     * andrewID information, and finishes the registration process without continuing.
     */
    async wrongId() {
        var line = document.createElement('span');
        const response = "<div id='failure'>Finished without completing registration.</div>"
        line.innerHTML = response;
        this.container.appendChild(line);
        await this._wait(this.lineDelay);
    }

    /**
     * verifyId takes the response from the server, shows the first given name
     * to the user, and asks the user for a response to check if the
     * found andrewID matches their name.
     */
    async verifyId(json) {
        var line = document.createElement('span');
        line.setAttribute(`${this.pfx}-cursor`, this.cursor);
        if (Array.isArray(json.names)) {
            var name = json.names[0]; // We just take the first name in the pref names.
        } else {
            var name = json.names;
        }
        const userInput = "<div class='usertext' id='confirmation'></div>";
        var prompt = `<div id='userprompt'>Found. Is '${name}' your name (Y/n)?</div> &nbsp;`;
        line.innerHTML = prompt + userInput;
        line.setAttribute('class', 'output');
        this.container.appendChild(line);

        await this.readInput(line);
        await this._wait(this.lineDelay);
        line.removeAttribute(`${this.pfx}-cursor`);
    }

    /**
     * askName asks the user to input their preferred name. This question
     * defaults to the first name in the list of preferred names.
     */
    async askName(json) {
        var line = document.createElement('span');
        line.setAttribute(`${this.pfx}-cursor`, this.cursor);
        if (Array.isArray(json.names)) {
            var name = json.names[0]; // We just take the first name in the pref names.
        } else {
            var name = json.names;
        }
        const userInput = "<div class='usertext' id='name'></div>";
        var prompt = `<div id='userprompt'>What is your preferred name (${name})?</div> &nbsp;`;
        line.innerHTML = prompt + userInput;
        line.setAttribute('class', 'output');
        this.container.appendChild(line);

        await this.readInput(line);
        await this._wait(this.lineDelay);
        line.removeAttribute(`${this.pfx}-cursor`);

        if (this.previousInput == '') {
            var elem = document.getElementById('name');
            elem.innerHTML = name;
        }
        this.previousInput = '';
    }

    /**
     * askEmail, similarly to askName, asks the user to input their preferred email.
     * This question defaults to the email in the preferred email from the ScottyLabs
     * API response object.
     */
    async askEmail(json) {
        // first, construct a span
        var line = document.createElement('span');
        line.setAttribute(`${this.pfx}-cursor`, this.cursor);


        // read the preferred email and construct text prompts
        var email = json.preferred_email;
        const userInput = "<div class='usertext' id='email'></div>";
        var prompt = `<div id='userprompt'>What is your preferred email (${email})?</div> &nbsp;`;
        line.innerHTML = prompt + userInput;
        line.setAttribute('class', 'output');
        this.container.appendChild(line);

        // read input from the user
        await this.readInput(line);
        await this._wait(this.lineDelay);
        line.removeAttribute(`${this.pfx}-cursor`);

        // if no input, we default to the found preferred email
        if (this.previousInput == '') {
            var elem = document.getElementById('email');
            elem.innerHTML = email;
        }
        this.previousInput = ''
    }

    /* notifyFailure notifies the user that the given andrewID was not valid. */
    async notifyFailure(e) {
        var line = document.createElement('span');
        const failResponse = "<div id='failure'>Error: Could not find AndrewID.</div>";
        line.innerHTML = failResponse;
        this.container.appendChild(line);
        await this._wait(this.lineDelay);
    }

    /**
     * readInput starts the reading of a series of keys into the defined
     * div for the given prompt. It uses the param line to figure out
     * which div we should be focusing on.
     */
    async readInput(line) {
        var inputDiv = line.getElementsByClassName('usertext')[0];
        await this.readKey(inputDiv);
    }

    /**
     * readKey reads a single keydown event, checks for the key
     * it presses, then either reads additional keys or completes
     * the field if the key pressed was the enter key.
     */
    async readKey(div) {
        return new Promise(resolve => {
            window.addEventListener('keydown', async function(e) {
                // we check for alphanumerics
                if (e.which >= 48 && e.which <= 57 ||
                    e.which >= 65 && e.which <= 90 ||
                    e.which >= 97 && e.which <= 122 ||
                    e.which == 190) {
                        div.textContent += e.key;

                // here we support deleting characters
                } else if (e.key == 'Backspace') {
                    // if the input field is not empty
                    if (div.innerHTML !== '') {
                        var text = div.innerHTML;
                        div.innerHTML = text.substring(0, text.length - 1);
                    }
                }
                
                // if we pressed a key that is not enter, continue
                // reading more keys
                if (e.key !== 'Enter')
                    await terminal.readKey(div);
                else
                    terminal.previousInput = div.innerHTML;
                resolve();
            }, {once:true});

        }); 
    }

    /**
     * type takes the line span and constructs the bash prompt with
     * and populates it with the given data. The type function is only
     * for entries that look like this:
     * 
     * guest@acmatcmu.org:~ $ ./Register
     * 
     * Lines like the above are constructed by type; data, in this
     * case, would be "./Register".
     */
    async type(line, data) {
        // construct array of chars and spans for container and prompt
        const chars = Array.from(data);
        const delay = this.typeDelay;
        var combined = document.createElement('span');
        var prompt = document.createElement('span');

        // set attributes and insert prompt text into span
        combined.setAttribute('id', 'input');
        prompt.setAttribute('id', 'prompt');
        line.setAttribute('id', 'promptinput');
        prompt.innerHTML = promptText;

        // combine constructed spans
        combined.appendChild(prompt);
        combined.appendChild(line);
        this.container.appendChild(combined);

        // type the chars one by one, each after a short delay
        await this._wait(this.startDelay)
        for (let char of chars) {
            await this._wait(delay);
            line.textContent += char;
        }
    }

    /**
     * typeClear tracks down the stalled line if it exists (typeClear
     * should not be called if their is no stalled line) then types "clear".
     */
    async typeClear() {
        if (this.stalledLine != null) {
            var line = this.stalledLine;
            var chars = clearChars;

            for (let char of chars) {
                await this._wait(this.typeDelay);
                line.textContent += char;
            }

            await this._wait(this.lineDelay);
            line.removeAttribute(`${this.pfx}-cursor`);
        }
        this.stalledLine = null;
    }

    /**
     * setScrollLinks sets scroll button links to scroll down to the intended div.
     */
    setScrollLinks() {
        var buttons = document.getElementsByClassName('scroll-button')
        for (let button of buttons) {
            button.onclick = function(e) {
                var section = $(this).attr("dest");
                $("html, body").animate({
                    scrollTop: $(section).position().top
                }, 700);
            };
        }
    }

    stall() {
        // construct spans for the stalling prompt
        var line = document.createElement('span');
        line.setAttribute(`${this.pfx}-cursor`, this.cursor);
        var combined = document.createElement('span');
        var prompt = document.createElement('span');

        // set attributes from prompt and populate text
        combined.setAttribute('id', 'input');
        prompt.setAttribute('id', 'prompt');
        line.setAttribute('id', 'promptinput');
        prompt.innerHTML = promptText;

        combined.appendChild(prompt);
        combined.appendChild(line);
        this.container.appendChild(combined);

        // store the constructed line as stalled line
        this.stalledLine = line;
    }

    /**
     * setLinks sets the links for the navbar. This makes sure that
     * validLinks is true whenever the buttons are used in order
     * to avoid problems where clicking links in succession might 
     * cause the terminal to output two pages (say, Welcome and
     * About Us) simultaneously.
     */
    setLinks() {
        for (let entry of linkIds) {
            var elem = document.getElementById(entry);
            if (elem == null) {
                continue;
            }
            elem.onclick = function() {
                if (terminal.validLinks == true) {
                    terminal.validLinks = false;
                    fetch('/' + entry)
                    .then(response => response.json())
                    .then(json => terminal.run(json.data))
                    .catch(err => {
                        terminal.validLinks = true;
                    });
                }
            };
        }
    }

    /**
     * run performs the sequence of typing clear, perfomring the
     * clear in the terminal, then starting the new sequence of lines
     * passed to this function.
     */
    async run(lines) {
        await this.typeClear();
        this.clear(lines);
        this.start();
    }

    /**
     * wait waits the amount of time specified in milliseconds.
     */
    _wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
}

if (document.currentScript.hasAttribute('data-terminal-container')) {
    var terminal = new Terminal();
}

window.onload = function() {
    terminal.start();
}
