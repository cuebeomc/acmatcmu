/**
 * terminal.js
 * please don't look at this code it really sucks ass
 *
 * @author Cuebeom Choi
 */

// Define constants related to the terminal
const container = '#terminal';
const promptText = 'acm@cmu.org:~ $';
const clearChars = Array.from('clear');
const cursor = '▋'

// Define delays for typing animation
const typeDelay = 35;
const lineDelay = 150;

const linkIds = ['welcome', 'aboutus', 'events', 'sponsors', 'login'];

/* wait is a helper to wait the given amount of time, in ms. */
function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * parseJson takes an array of JSON objects that represent a
 * series of HTML divs, and constructs the corresonding divs. It 
 * appends all created divs as children to the given element.
 */
function parseJson(parent, arr) {
    for (let elem of arr) {
        if (elem.type == 'string') {
            parent.innerHTML += elem.data;
        } else {
            // create child element and set attributes
            var child = document.createElement(elem.type);
            for (var attr in elem.attrs) {
                child.setAttribute(attr, elem.attrs[attr]);
            }

            // recursively add the children's children
            parseJson(child, elem.data)
            parent.appendChild(child);
        }
    }
}

class Terminal {
    /**
     * Terminal class constructor. Gets the container for
     * the terminal and defines variables to insure "safe"
     * links; that is, we want to avoid proccing two terminal
     * outputs twice in a row, for example.
     */
    constructor() {
        this.container = document.querySelector(container);
        this.previousInput = '';
        this.stalledLine = null;
        this.validLinks = false;

        // set the navbar links
        this.setLinks();

        // fetch the data for the welcome page
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
     * start takes the lines in this.lines and runs through them, using
     * the 'type' field to accordingly display divs on the terminal
     */
    async start() {
        await wait(lineDelay);

        for (let entry of this.lines) {
            var line = document.createElement('span');
            const type = entry.type;
            const data = entry.data;

            console.log(entry)
            if (type == 'input') {
                line.setAttribute(`cursor`, cursor);

                await this.type(line, data);
                await wait(lineDelay);
            } else if (type == 'text') {
                line.setAttribute('class', type);
                parseJson(line, data);
                console.log(line)

                this.container.appendChild(line);
                await wait(lineDelay);
            }

            line.removeAttribute(`cursor`);
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
     * guest@acmatcmu.org:~ $ register
     * 
     * Lines like the above are constructed by type; data, in this
     * case, would be "register".
     */
    async type(line, data) {
        // construct array of chars and spans for container and prompt
        const chars = Array.from(data);
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
        await wait(lineDelay)
        for (let char of chars) {
            await wait(typeDelay);
            line.textContent += char;
        }
    }

    /**
     * typeClear tracks down the stalled line if it exists (typeClear
     * should not be called if there is no stalled line) then types "clear".
     */
    async typeClear() {
        if (this.stalledLine != null) {
            var line = this.stalledLine;
            var chars = clearChars;

            for (let char of chars) {
                await wait(typeDelay);
                line.textContent += char;
            }

            await wait(lineDelay);
            line.removeAttribute(`cursor`);
        }
        this.stalledLine = null;
    }

    /* creates a stalled prompt line with blinking cursor */
    stall() {
        // construct spans for the stalling prompt
        var line = document.createElement('span');
        line.setAttribute(`cursor`, cursor);
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

                    document.getElementById("menu-btn").checked = false;
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
}

if (document.currentScript.hasAttribute('data-terminal-container')) {
    var terminal = new Terminal();
}

window.onload = function() {
    terminal.start();
}
