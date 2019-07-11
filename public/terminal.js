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
const linkIds = ['welcome', 'aboutus', 'events', 'sponsors', 'login'];
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
            elem.onclick = function(e) {
                e.preventDefault();
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
