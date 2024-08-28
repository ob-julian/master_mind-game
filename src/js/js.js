class Mastermind {
    constructor(amountOfPositions = 4, amountOfColors = 8, brightnessThreshold = 120) {
        this.colors = new Colors(amountOfColors);
        console.log(this.colors.getColors());
        this.amountOfPositions = amountOfPositions;
        if (this.colors.getAmountOfColors() < this.amountOfPositions) {
            showErrorMessage("Not enough colors for the amount of positions");
            return;
        }
        
        this.secret = [];
        this.playField = [];
        this.brightnessThreshold = brightnessThreshold;
        
        // Init, ironically
        this.reset();
    }

    generateSecret() {
        this.secret = [];
        this.availableColors = this.colors.getColorKeys();
        for (let i = 0; i < this.amountOfPositions; i++) {
            const randomIndex = Math.floor(Math.random() * this.availableColors.length);
            this.secret.push(this.availableColors[randomIndex]);
            this.availableColors.splice(randomIndex, 1);
        }
    }

    resetGuessField() {
        this.playField = [];
        for (let i = 0; i < this.amountOfPositions; i++) {
            this.playField.push(null);
        }
    }

    play(color, position) {
        // check if the color is in the colors array
        if (!this.colors.includes(color)) {
            showErrorMessage("Invalid color");
            return;
        }
        if (position < 0 || position >= this.amountOfPositions) {
            showErrorMessage("Invalid position");
            return;
        }
        if (this.playField.includes(color)) {
            showErrorMessage("Color already used");
            return;
        }
        const oldColor = this.playField[position];
        this.playField[position] = color;

        // change color for selector
        const select = document.getElementById(`colorSelection_${position}`);
        const textColor = this.getContrastColor(this.colors.getColor(color));
        select.style.color = textColor;

        // disable color for user
        this.disableColor(color, oldColor);

        if (!this.playField.includes(null)) {
            document.getElementById("submit").disabled = false;
        }
    }

    disableColor(color, oldColor) {
        for (let i = 0; i < this.amountOfPositions; i++) {
            const select = document.getElementById(`colorSelection_${i}`);
            for (let j = 0; j < select.options.length; j++) {
                if (select.options[j].value === color) {
                    select.options[j].disabled = true;
                }
                if (oldColor !== null && select.options[j].value === oldColor) {
                    select.options[j].disabled = false;
                }
            }
        }
    }


    initControls() {
        // Cache the table element
        const table = document.getElementById("playArea");
        const tr = document.createElement("tr");
        tr.id = "tr_0";
        table.appendChild(tr);
    
        // Create a document fragment to build the selection field
        const fragment = document.createDocumentFragment();
    
        // Create the initial option element
        const initialOption = document.createElement("option");
        initialOption.value = "";
        initialOption.selected = true;
        initialOption.disabled = true;
        initialOption.textContent = "Select a color";
        fragment.appendChild(initialOption);
    
        // Create option elements for each color
        for (let color of this.colors.getColorKeys()) {
            const option = document.createElement("option");
            option.value = color;
            option.style.backgroundColor = this.colors.getColor(color);
            option.style.color = this.getContrastColor(this.colors.getColor(color));
            option.textContent = color;
            fragment.appendChild(option);
        }
    
        // Create the select elements and append them to the table row
        for (let i = 0; i < this.amountOfPositions; i++) {
            const td = document.createElement("td");
            td.id = `td_${i}`;
            const select = document.createElement("select");
            select.id = `colorSelection_${i}`;
            const clonedFragment = fragment.cloneNode(true);
            clonedFragment.firstChild.selected = true;
            select.appendChild(clonedFragment);
            td.appendChild(select);
            tr.appendChild(td);
        }
    
        // Add guess button
        const buttonTd = document.createElement("td");
        buttonTd.id = "button_td";
        buttonTd.className = "button_td";
        const button = document.createElement("button");
        button.id = "submit";
        button.disabled = true;
        button.textContent = "Guess";
        buttonTd.appendChild(button);
        tr.appendChild(buttonTd);
    
        // Event delegation for color selection
        tr.addEventListener("change", (event) => {
            if (event.target.tagName === "SELECT" && event.target.id.startsWith("colorSelection_")) {
                const index = parseInt(event.target.id.split("_")[1], 10);
                const color = event.target.value;
                this.play(color, index);
                document.getElementById(`td_${index}`).style.backgroundColor = this.colors.getColor(color);
            }
        });
    
        // Event listener for the submit button
        button.addEventListener("click", () => {
            this.check();
            this.resetGuessField();
        });
    }

    check(){
        // check if all positions are filled
        if (this.playField.includes(null)) {
            showErrorMessage("Not all positions are filled");
            return;
        }
        
        let correctPositions = 0;
        let correctColors = [];
        let correctColor = 0;
        // Check for correct positions
        for (let i = 0; i < this.amountOfPositions; i++) {
            if (this.playField[i] === this.secret[i]) {
                correctPositions++;
                correctColors.push(this.playField[i]);
            }
        }

        // win check
        if (correctPositions === this.amountOfPositions) {
            modal.showWin();
            // change button to reset
            const button = document.getElementById("submit");
            // remove event listener
            const clone = button.cloneNode(true);
            button.parentNode.replaceChild(clone, button);
            clone.innerHTML = "Reset";
            clone.addEventListener("click", () => {
                this.reset();
            });
            return;
        }

        // Check for correct colors
        for (let i = 0; i < this.amountOfPositions; i++) {
            for (let j = 0; j < this.amountOfPositions; j++) {
                if (this.playField[i] === this.secret[j] && !correctColors.includes(this.playField[i])) {
                    correctColor++;
                    correctColors.push(this.playField[i]);
                }
            }
        }

        this.updatePlayField(correctPositions, correctColor);
    }

    updatePlayField(correctPositions, correctColors) {
        const tr = document.getElementById("tr_0");

        // delete select fields
        for (let i = 0; i < this.amountOfPositions; i++) {
            const selectElement = document.getElementById(`colorSelection_${i}`);
            const td = selectElement.parentElement;
            td.title = selectElement.value;
            selectElement.remove();
        }

        const button__td = document.getElementById("button_td");
        button__td.innerHTML = `
            Positions: ${correctPositions}
            <br>
            Colors: ${correctPositions + correctColors}
        `;

        removeAllIdsAndEventListeners(tr);

        this.initControls();
        this.resetGuessField();
    }
    
    changeBrightnessThreshold(brightnessThreshold) {
        if (brightnessThreshold < 0 || brightnessThreshold > 255) {
            showErrorMessage("Invalid brightness threshold");
            return;
        }
        this.brightnessThreshold = brightnessThreshold;
    }

    changeAmountOfPositions(amountOfPositions) {
        if (amountOfPositions < 1 || amountOfPositions > this.colors.getAmountOfColors()) {
            showErrorMessage("Invalid amount of positions");
            return;
        }
        this.amountOfPositions = amountOfPositions;
        this.reset();
    }

    _hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }
    
    getContrastColor(color) {
        const intColor = this._hexToRgb(color);
        const brightness = Math.round(((intColor.r * 299) + (intColor.g * 587) + (intColor.b * 114)) / 1000);
        const btextColor = (brightness > this.brightnessThreshold) ? "black" : "white";
        return btextColor;
    }

    reset() {
        this.generateSecret();
        this.resetGuessField();

        document.getElementById("playArea").innerHTML = "";
        this.initControls();
    }

    _coloredPrint(hex, text) {
        console.log(`%c${text}`, `color: ${hex}`);
    }

    printAllColors() {
        for (let color of this.colors.getColorKeys()) {
            this._coloredPrint(this.colors.getColor(color), color);
        }
    }

    testFuction(x) {
        this.colors._generateColorsAndNames(x);
        this.printAllColors();
    }

}

class ModalBase {
    constructor() {
        this.modal = document.getElementById("modal");
        this.modalContent = document.getElementById("modal-content");
        this.modalClose = document.getElementById("modal-close");
        this.modalClose.addEventListener("click", () => {
            this._close();
        });
        this.modal.addEventListener("click", (event) => {
            if (event.target === this.modal) {
                this._close();
            }
        });
    }

    _open() {
        this.modal.style.display = "block";
    }

    _close() {
        this.modal.style.display = "none";
        this._clearContent();
    }

    _clearContent() {
        this.modalContent.innerHTML = "";
    }

    _setContent(content) {
        this.modalContent.innerHTML = content;
    }

    showMainMenu() {
        this._setContent(
            `<div class="center">
                <h1>Menu</h1>
                <br>
                <button id="play" class="modalButton">Settings</button>
                <br>
                <button id="help" class="modalButton">Help</button>
                </div>`
        );
        this._open();

        document.getElementById("help").addEventListener("click", () => {
            this.showHelp();
        });
        document.getElementById("play").addEventListener("click", () => {
            this.showSettings();
        });
    }

    showSettings() {
        this._setContent(
            `<div class="center">
                <h1>Settings</h1>
                <label for="amountOfPositions">Amount of positions:</label>
                <input type="number" id="amountOfPositions" name="amountOfPositions" min="1" max="${mastermind.colors.getAmountOfColors()}" value="${mastermind.amountOfPositions}">
                <label for="amountOfColors">Amount of colors:</label>
                <input type="number" id="amountOfColors" name="amountOfColors" min="${mastermind.amountOfPositions}" max="" value="${mastermind.colors.getAmountOfColors()}">
                <label for="Theme">Theme:</label>
                <select id="theme" name="theme" class="select">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="devicedefault" selected>Device default</option>
                </select>
                <label for="brightnessThreshold" title="The brightness threshold is used to determine the color of the text on the color selector. Higher values will result in more black text, lower values will result in more white text.">Brightness threshold:</label>
                <input type="number" id="brightnessThreshold" name="brightnessThreshold" min="0" max="255" value="${mastermind.brightnessThreshold}">
                <button id="back" class="modalButton backButton">Back</button>
                </div>`
        );
        this._open(); // just to be sure

        const theme = localStorage.getItem("theme") || "devicedefault";
        document.getElementById("theme").value = theme;

        document.getElementById("back").addEventListener("click", () => {
            this.showMainMenu();
        });

        document.getElementById("amountOfPositions").addEventListener("change", (event) => {
            if (event.target.value < 1 || event.target.value > mastermind.colors.getAmountOfColors()) {
                showErrorMessage("Invalid amount of positions", this.showSettings.bind(this));
                return;
            }
            if (mastermind.amountOfPositions !== event.target.value) {
                mastermind.changeAmountOfPositions(event.target.value);
                localStorage.setItem("amountOfPositions", event.target.value);

                document.getElementById("amountOfColors").min = event.target.value;
            }
        });
        document.getElementById("amountOfColors").addEventListener("change", (event) => {
            if (event.target.value < mastermind.amountOfPositions) {
                showErrorMessage("Invalid amount of colors", this.showSettings.bind(this));
                return;
            }
            if (!localStorage.getItem("amountOfColors")) {
                this.warnAboutColorChange(event.target.value);
            } else if (localStorage.getItem("amountOfColors") !== event.target.value) {
                if (event.target.value >= 100  && !localStorage.getItem("insanityWarning")) {
                    localStorage.setItem("insanityWarning", true);
                    this.warnAboutColors(event.target.value);
                } else {
                    mastermind.colors.generatColors(event.target.value);
                    localStorage.setItem("amountOfColors", event.target.value);
                    mastermind.reset();

                    document.getElementById("amountOfPositions").max = event.target.value
                }
            }
        });
        document.getElementById("brightnessThreshold").addEventListener("change", (event) => {
            if (event.target.value < 0 || event.target.value > 255) {
                showErrorMessage("Invalid brightness threshold");
                return;
            }
            if (mastermind.brightnessThreshold !== event.target.value) {
                mastermind.changeBrightnessThreshold(event.target.value);
                localStorage.setItem("brightnessThreshold", event.target.value);
            }
        });
        document.getElementById("theme").addEventListener("change", (event) => {
            localStorage.setItem("theme", event.target.value);
            if (event.target.value === "devicedefault") {
                document.body.classList.remove("light", "dark");
                document.body.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");
            } else {
                document.body.classList.remove("light", "dark");
                document.body.classList.add(event.target.value);
            }
        });
    }

    showHelp() {
        this._showHelpWrapper("Help", "Back", this.showMainMenu.bind(this));
    }

    showHello() {
        this._showHelpWrapper("Hello to Mastermind", "Thanks", this._closeHello.bind(this));
    }

    _closeHello() {
        this._close();
        localStorage.setItem("theme", "devicedefault");
    }

    _showHelpWrapper(header, outText, action) {
        this._setContent(
            `<div class="center">
                <h1>${header}</h1>
                <br>
                <p>Mastermind is a code-breaking game. The goal is to guess the secret code in the least amount of guesses.</p>
                <p>The secret code consists of a sequence of unique colors. The amount of colors and positions can be set in the settings.</p>
                <p>After each guess, you will receive feedback about the amount of correct colors and the amount of correct colors in the correct position.</p>
                <p>Originally, the feedback is given in the form of black and white pins. Black pins indicate the amount of correct colors in the correct position, white pins indicate the amount of correct colors in the wrong position.</p>
                <p>Good luck!</p>
                <button id="back" class="modalButton backButton">${outText}</button>
                </div>`
        );
        this._open();

        document.getElementById("back").addEventListener("click", () => {
            action();
        });
    }

    warnAboutColorChange(amoutToChangeTo) {
        this._setContent(
            `<div class="center">
                <h1>Warning</h1>
                <br>
                <p>Only for 8 colors it is guaranteed that the colors are unique and distinguishable.</p>
                <p>A considerable amount of effort has been put into the auto generation of colors, but as so often, it is not perfect.</p>
                <br>
                <p>PS: Changing the amount of colors (or positions for that matter) will reset the game.</p>
                <button id="back1" class="modalButton backButton">I understand, let me change it</button>
                <button id="back2" class="modalButton backButton">Changed my mind</button>
                </div>`
        );
        this._open();

        document.getElementById("back1").addEventListener("click", () => {
            mastermind.colors.generatColors(amoutToChangeTo);
            localStorage.setItem("amountOfColors", amoutToChangeTo);
            mastermind.reset();
            this.showSettings();
        });
        document.getElementById("back2").addEventListener("click", () => {
            localStorage.setItem("amountOfColors", 8);
            this.showSettings();
        });
    }

    warnAboutColors(amoutToChangeTo) {
        this._setContent(
            `<div class="center">
                <h1>Warning</h1>
                <br>
                <p>Whoa there, champ! I see you've decided to take things to the <strong>next level</strong>.</p>
                <p>Entering 100 or more? Bold move! 😎</p>
                <p>Just remember, with great power comes... well, a lot of extra difficulty. But hey, if you're up for the challenge, I’m here cheering you on (from a safe distance).</p>
                <p>Good luck!</p>
                <p>PS:  No more warnings from me. You’re on your own now, brave soul!
                <button id="back1" class="modalButton backButton">No turning back now!</button>
                <button id="back2" class="modalButton backButton">Changed my mind</button>
                </div>`
        );
        this._open();

        document.getElementById("back1").addEventListener("click", () => {
            mastermind.colors.generatColors(amoutToChangeTo);
            localStorage.setItem("amountOfColors", amoutToChangeTo);
            mastermind.reset();
            this.showSettings();
        });
        document.getElementById("back2").addEventListener("click", () => {
            this.showSettings();
        });
    }

    showWin() {
        this._setContent(
            `<div class="center">
                <h1>Congratulations!</h1>
                <br>
                <p>You have guessed the secret code!</p>
                <button id="back" class="modalButton backButton">Hooray!</button>
                </div>`
        );
        this._open();

        document.getElementById("back").addEventListener("click", () => {
            this._close();
        });
    }

    showErrorMessage(message, goBackModal) {
        this._setContent(
            `<div class="center">
                <h1>Error</h1>
                <br>
                <p>${message}</p>
                <button id="back" class="modalButton backButton">Ok</button>
                </div>`
        );
        this._open();

        const handleGoBack = () => {
            if (goBackModal) {
                goBackModal();
            } else {
                this._close();
            }
        };
        
        document.getElementById("back").addEventListener("click", handleGoBack);
        
        document.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                handleGoBack();
            }
        });
    }
}

class Colors {
    constructor(amountOfColors = 8) {
        if (amountOfColors < 1) {
            showErrorMessage("Invalid amount of colors");
            return;
        }
        this.amountOfColors = amountOfColors;
        this.generatColors(this.amountOfColors);
    }

    getColors() {
        return this.playColors;
    }

    getColorKeys() {
        return Object.keys(this.playColors);
    }

    getColor(color) {
        return this.playColors[color];
    }

    getAmountOfColors() {
        return parseInt(this.amountOfColors);
    }

    includes(color) {
        return this.getColorKeys().includes(color);
    }

    baseColors() {
        this.playColors = {
            red: "#FF0000",
            green: "#00FF00",
            blue: "#0000FF",
            yellow: "#FFFF00",
            cyan: "#00FFFF",
            magenta: "#FF00FF",
            orange: "#FFA500",
            purple: "#800080"
        };
    }

    generatColors(numColors) {
        // two == because numColors can be a string
        if (numColors == 8) {
            this.baseColors();
            return;
        }
        const { colors, colorNames } = this._generateColorsAndNames(numColors);
        const { sortedHSLArray, sortedNamesArray } = this.sortNameyByColors(colors, colorNames);

        this.playColors = {};
        sortedHSLArray.forEach((color, index) => {
            this.playColors[sortedNamesArray[index]] = this._hslToHex(color);
        });
        this.amountOfColors = numColors;
    }

    _getColorName(hue, saturation, lightness) {
        let colorName = '';
    
        // Base hue-based color name
        if (hue < 15 || hue >= 345) colorName = "Red";
        else if (hue < 45) colorName = "Orange";
        else if (hue < 75) colorName = "Yellow";
        else if (hue < 105) colorName = "Lime";
        else if (hue < 135) colorName = "Green";
        else if (hue < 165) colorName = "Teal";
        else if (hue < 195) colorName = "Cyan";
        else if (hue < 225) colorName = "Azure";
        else if (hue < 255) colorName = "Blue";
        else if (hue < 285) colorName = "Purple";
        else if (hue < 315) colorName = "Magenta";
        else if (hue < 345) colorName = "Pink";
    
        // Lightness-based modifiers
        if (lightness < 25) colorName = "Dark " + colorName;
        else if (lightness > 75) colorName = "Light " + colorName;
    
        // Saturation-based modifiers
        if (saturation < 25) colorName = "Pale " + colorName;
        else if (saturation > 75) colorName = "Vivid " + colorName;
    
        return colorName;
    }
    
    _generateColorsAndNames(numColors) {
        const colors = [];
        const colorNames = [];
        const toBeNumerated = new Set();
    
        const saturationPool = this.createValuePool(50, 100, numColors);
        const lightnessPool = this.createValuePool(30, 70, numColors);
    
        for (let i = 0; i < numColors; i++) {
            const hue = Math.floor((360 / numColors) * i);
            const saturation = saturationPool[i];
            const lightness = lightnessPool[i];
    
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            colors.push(color);
            const name = this._getColorName(hue, saturation, lightness);
            if (colorNames.includes(name)) {
                toBeNumerated.add(name);
            }
            colorNames.push(name);
        }
    
        for(let numeraterName of toBeNumerated) {
            let count = 1;
            for (let i = 0; i < numColors; i++) {
                if (colorNames[i] === numeraterName) {
                    colorNames[i] = `${numeraterName} ${count}`;
                    count++;
                }
            }
        }
    
        return { colors, colorNames };
    }
    
    createValuePool(min, max, numValues) {
        const pool = [];
        const step = (max - min) / (numValues - 1);
    
        for (let i = 0; i < numValues; i++) {
            pool.push(min + step * i);
        }
    
        // Shuffle the pool to introduce randomness
        return this.shuffleArray(pool);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    _getColorName(hue, saturation, lightness) {
        let colorName = '';
    
        // Base hue-based color name
        if (hue < 15 || hue >= 345) colorName = "Red";
        else if (hue < 45) colorName = "Orange";
        else if (hue < 75) colorName = "Yellow";
        else if (hue < 105) colorName = "Lime";
        else if (hue < 135) colorName = "Green";
        else if (hue < 165) colorName = "Teal";
        else if (hue < 195) colorName = "Cyan";
        else if (hue < 225) colorName = "Azure";
        else if (hue < 255) colorName = "Blue";
        else if (hue < 285) colorName = "Purple";
        else if (hue < 315) colorName = "Magenta";
        else if (hue < 345) colorName = "Pink";
    
        // Lightness-based modifiers
        if (lightness < 40) colorName = "Dark " + colorName;
        else if (lightness > 60) colorName = "Light " + colorName;
    
        // Saturation-based modifiers
        if (saturation < 60) colorName = "Pale " + colorName;
        else if (saturation > 85) colorName = "Vivid " + colorName;
    
        return colorName;
    }
    
    sortNameyByColors(hslArray, namesArray) {
        // Combine colors and names into an array of objects
        let combinedArray = hslArray.map((color, index) => ({
            color: color,
            name: namesArray[index]
        }));
    
        // Sort the combined array based on HSL values
        combinedArray.sort((a, b) => {
            // Extract H, S, and L components from HSL strings
            let [h1, s1, l1] = a.color.match(/\d+/g).map(Number);
            let [h2, s2, l2] = b.color.match(/\d+/g).map(Number);
    
            // Compare based on H first, then S, then L
            return h1 - h2 || s1 - s2 || l1 - l2;
        });
    
        // Separate the sorted array back into two arrays
        let sortedHSLArray = combinedArray.map(item => item.color);
        let sortedNamesArray = combinedArray.map(item => item.name);
    
        return {
            sortedHSLArray: sortedHSLArray,
            sortedNamesArray: sortedNamesArray
        };
    }


    _hslToHex(hsl) {
        let [hue, saturation, luminosity] = hsl.match(/(\d+(\.\d+)?)/g).map(Number);
        hue = (hue % 360 + 360) % 360; // Cycle hue to 0-359 range
        saturation = Math.max(0, Math.min(100, saturation)) / 100; // Clamp saturation to 0-100 and convert to 0-1
        luminosity = Math.max(0, Math.min(100, luminosity)) / 100; // Clamp luminosity to 0-100 and convert to 0-1

        // Convert HSL to RGB
        const rgb = this._toRgb(hue, saturation, luminosity);

        // Convert RGB to hex
        return '#' + rgb.map(n => (256 + n).toString(16).substr(-2)).join('');
    }

    _toRgb(hue, saturation, lightness) {
        if (hue === undefined) return [0, 0, 0];

        // after http://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB
    
        const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
        const huePrime = hue / 60;
        const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
        const lightnessAdjustment = lightness - (chroma / 2);
    
        let red, green, blue;
    
        switch (Math.floor(huePrime)) {
            case 0:
                red = chroma;
                green = secondComponent;
                blue = 0;
                break;
            case 1:
                red = secondComponent;
                green = chroma;
                blue = 0;
                break;
            case 2:
                red = 0;
                green = chroma;
                blue = secondComponent;
                break;
            case 3:
                red = 0;
                green = secondComponent;
                blue = chroma;
                break;
            case 4:
                red = secondComponent;
                green = 0;
                blue = chroma;
                break;
            case 5:
                red = chroma;
                green = 0;
                blue = secondComponent;
                break;
        }
    
        red += lightnessAdjustment;
        green += lightnessAdjustment;
        blue += lightnessAdjustment;
    
        return [
            Math.abs(Math.round(red * 255)),
            Math.abs(Math.round(green * 255)),
            Math.abs(Math.round(blue * 255))
        ];
    };
}


let mastermind;
let modal;

window.onload = function() {
    const amountOfPositions = localStorage.getItem("amountOfPositions") || 4;
    const brightnessThreshold = localStorage.getItem("brightnessThreshold") || 111;
    const amountOfColors = localStorage.getItem("amountOfColors") || 8;
    mastermind = new Mastermind(amountOfPositions, amountOfColors, brightnessThreshold);

    modal = new ModalBase();
    document.getElementById("helpButtonArea").addEventListener("click", () => {
        modal.showMainMenu();
    });

    // check if user was already on the page
    if (!localStorage.getItem("theme")) {
        // intro
        modal.showHello();
    }
}

function showErrorMessage(message, goBackModal = false) {
    if (!modal) {
        // fallback if modal is not loaded
        alert(message);
        return;
    }
    modal.showErrorMessage(message, goBackModal);
}

function removeAllIdsAndEventListeners(parent, idExceptions = []) {
    function removeIdsAndListeners(element) {
        if (!idExceptions.includes(element.id)) {
            element.removeAttribute('id');
        }

        // remove event listeners
        const clone = element.cloneNode(true);

        element.parentNode.replaceChild(clone, element);

        Array.from(clone.children).forEach(removeIdsAndListeners);
    }
    removeIdsAndListeners(parent);
}
