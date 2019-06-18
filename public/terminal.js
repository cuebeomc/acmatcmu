/**
 * terminal.js
 * 
 * Adapted from Ines Montani's termynal.js implementation, made more interactive.
 * Changed to take jsons to load new pages after clearning.
 *
 * @author Cuebeom Choi
 * @version 0.0.1
 * @license MIT
 */

const container = '#terminal';
const promptText = 'guest@acmatcmu:~ $';
const linkIds = ['welcome', 'aboutus', 'events', 'register'];
const clearChars = ['c', 'l', 'e', 'a', 'r'];
const lookupURL = 'https://apis.scottylabs.org/directory/v1/andrewID/';

var welcomeLines = [{"data": "./Welcome", "type": "input"},
                    {"data": "<div id='title'>ACM@CMU</div> <div id='infotext'> ACM@CMU is Carnegie Mellon's student chapter of the Association for Computing Machinery, the leading premier organization for computing professionals. We are dedicated to promoting interdisciplinary computing and enabling professional development on campus. </div>", "type": "welcometext"},
                    {"data": "ls", "type": "input"},
                    {"data": "<a href='#' id='welcome'>Welcome</a> &nbsp; <a href='#' id='aboutus'>About_us</a> &nbsp; <a href='#' id='events'>Events</a> &nbsp; <a href='#' id='register'>Register</a>", "type": "links"}];

class Terminal {
    constructor() {
        this.container = document.querySelector(container);
        this.pfx = `data-ty`;
        this.typeDelay = 50;
        this.startDelay = 200;
        this.lineDelay = 500;
        this.cursor = '▋';
        this.stalledLine = null;
        this.previousInput = '';

        this.clear(welcomeLines);
    }

    clear(lines) {
        this.lines = lines;
        this.container.setAttribute('data-termynal', '');
        this.container.innerHTML = '';
    }

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

        this.stall();
        this.setLinks();
    }

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

    async wrongId() {
        var line = document.createElement('span');
        const response = "<div id='failure'>Finished without completing registration.</div>"
        line.innerHTML = response;
        this.container.appendChild(line);
        await this._wait(this.lineDelay);
    }

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
            console.log(elem)
            elem.innerHTML = name;
        }
        this.previousInput = '';
    }

    async askEmail(json) {
        var line = document.createElement('span');
        line.setAttribute(`${this.pfx}-cursor`, this.cursor);
        var email = json.preferred_email;
        const userInput = "<div class='usertext' id='email'></div>";
        var prompt = `<div id='userprompt'>What is your preferred email (${email})?</div> &nbsp;`;
        line.innerHTML = prompt + userInput;
        line.setAttribute('class', 'output');
        this.container.appendChild(line);

        await this.readInput(line);
        await this._wait(this.lineDelay);
        line.removeAttribute(`${this.pfx}-cursor`);

        if (this.previousInput == '') {
            var elem = document.getElementById('email');
            elem.innerHTML = email;
        }
        this.previousInput = ''
    }

    async notifyFailure(e) {
        console.log(e)
        var line = document.createElement('span');
        const failResponse = "<div id='failure'>Error: Could not find AndrewID.</div>";
        line.innerHTML = failResponse;
        this.container.appendChild(line);
        await this._wait(this.lineDelay);
    }

    async readInput(line) {
        var inputDiv = line.getElementsByClassName('usertext')[0];
        await this.readKey(inputDiv);
    }

    async readKey(div) {
        return new Promise(resolve => {
            window.addEventListener('keydown', async function(e) {
                if (e.which >= 48 && e.which <= 57 ||
                    e.which >= 65 && e.which <= 90 ||
                    e.which >= 97 && e.which <= 122 ||
                    e.which == 190) {
                        div.textContent += e.key;
                } else if (e.key == 'Backspace') {
                    if (div.innerHTML !== '') {
                        var text = div.innerHTML;
                        div.innerHTML = text.substring(0, text.length - 1);
                    }
                }
                
                if (e.key !== 'Enter')
                    await terminal.readKey(div);
                else
                    terminal.previousInput = div.innerHTML;
                resolve();
            }, {once:true});
        }); 
    }

    async type(line, data) {
        const chars = Array.from(data);
        const delay = this.typeDelay;
        var combined = document.createElement('span');
        var prompt = document.createElement('span');

        combined.setAttribute('data-ty', 'input');
        prompt.setAttribute('id', 'prompt');
        prompt.innerHTML = promptText;

        combined.appendChild(prompt);
        combined.appendChild(line);
        this.container.appendChild(combined);

        await this._wait(this.startDelay)
        for (let char of chars) {
            await this._wait(delay);
            line.textContent += char;
        }
    }

    async typeClear() {
        if (this.stalledLine !== null) {
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

    stall() {
        var line = document.createElement('span');
        line.setAttribute(`${this.pfx}-cursor`, this.cursor);
        var combined = document.createElement('span');
        var prompt = document.createElement('span');

        combined.setAttribute('data-ty', 'input');
        prompt.setAttribute('id', 'prompt');
        prompt.innerHTML = promptText;

        combined.appendChild(prompt);
        combined.appendChild(line);
        this.container.appendChild(combined);

        this.stalledLine = line;
    }

    setLinks() {
        for (let entry of linkIds) {
            var elem = document.getElementById(entry)
            if (elem == null) {
                continue
            }
            elem.onclick = function() {
                fetch('/' + entry)
                .then(response => response.json())
                .then(json => terminal.run(json.data))
            }
        }
    }

    async run(lines) {
        await this.typeClear()
        this.clear(lines)
        this.start()
    }

    _wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
}

if (document.currentScript.hasAttribute('data-terminal-container')) {
    var terminal = new Terminal();
}

window.onload = function() {
    terminal.start()
}