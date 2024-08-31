class Mastermind {
    constructor(amountOfPositions = 4, amountOfColors = 8, brightnessThreshold = 120) {
        this.colors = new Colors(amountOfColors);
        this.amountOfPositions = amountOfPositions;
        if (this.colors.getAmountOfColors() < this.amountOfPositions) {
            showErrorMessage("invalidAmountOfColors");
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
            showErrorMessage("colorNotInArray");
            return;
        }
        if (position < 0 || position >= this.amountOfPositions) {
            showErrorMessage("invalidPosition");
            return;
        }
        if (this.playField.includes(color)) {
            showErrorMessage("colorAlreadyUsed");
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
        initialOption.textContent = getText("colors", "select");
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
        button.textContent = getText("buttons", "submit");
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
            showErrorMessage("notAllPositionsFilled");
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
            clone.innerHTML = getText("buttons", "reset");
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
            ${getText("feedback", "position")}: ${correctPositions}
            <br>
            ${getText("feedback", "colors")}: ${correctColors}}
        `;

        removeAllIdsAndEventListeners(tr);

        this.initControls();
        this.resetGuessField();
    }
    
    changeBrightnessThreshold(brightnessThreshold) {
        if (brightnessThreshold < 0 || brightnessThreshold > 255) {
            showErrorMessage("invalidBrightnessThreshold");
            return;
        }
        this.brightnessThreshold = brightnessThreshold;
    }

    changeAmountOfPositions(amountOfPositions) {
        if (amountOfPositions < 1) {
            showErrorMessage("negativeValue");
            return;
        }
        if (amountOfPositions > this.colors.getAmountOfColors()) {
            showErrorMessage("invalidAmountOfPositions");
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
                <button id="settings" class="modalButton">${getText("buttons", "settings")}</button>
                <br>
                <button id="help" class="modalButton">${getText("buttons", "help")}</button>
                </div>`
        );
        this._open();

        document.getElementById("help").addEventListener("click", () => {
            this.showHelp();
        });
        document.getElementById("settings").addEventListener("click", () => {
            this.showSettings();
        });
    }

    showSettings() {
        this._setContent(
            `<div class="center">
                <h1>${getText("settings", "title")}</h1>
                <label for="amountOfPositions">${getText("settings", "amountOfPositions")}:</label>
                <input type="number" id="amountOfPositions" name="amountOfPositions" min="1" max="${mastermind.colors.getAmountOfColors()}" value="${mastermind.amountOfPositions}">
                <label for="amountOfColors">${getText("settings", "amountOfColors")}:</label>
                <input type="number" id="amountOfColors" name="amountOfColors" min="${mastermind.amountOfPositions}" max="" value="${mastermind.colors.getAmountOfColors()}">
                <label for="Theme">${getText("settings", "theme")}:</label>
                <select id="theme" name="theme" class="select">
                    <option value="light">${getText("themes", "light")}</option>
                    <option value="dark">${getText("themes", "dark")}</option>
                    <option value="devicedefault" selected>${getText("themes", "default")}</option>
                </select>
                <label for="language">${getText("settings", "language")}:</label>
                <select id="language" name="language" class="select">
                    ${Object.keys(languagesJson).filter((lang) => lang !== "languages").sort().map((lang) => `<option value="${lang}" ${lang === language ? "selected" : ""}>${languagesJson["languages"][lang]}</option>`).join("")}
                </select>
                <label for="brightnessThreshold" title="${getText("settings", "brightnessThresholdTitle")}">${getText("settings", "brightnessThreshold")}:</label>
                <input type="number" id="brightnessThreshold" name="brightnessThreshold" min="0" max="255" value="${mastermind.brightnessThreshold}">
                <button id="back" class="modalButton backButton">${getText("buttons", "back")}</button>
                </div>`
        );
        this._open(); // just to be sure

        const theme = localStorage.getItem("theme") || "devicedefault";
        document.getElementById("theme").value = theme;

        document.getElementById("back").addEventListener("click", () => {
            this.showMainMenu();
        });

        document.getElementById("amountOfPositions").addEventListener("change", (event) => {
            if (event.target.value < 1) {
                showErrorMessage("negativeValue", this.showSettings.bind(this));
                return;
            }
            if (event.target.value > mastermind.colors.getAmountOfColors()) {
                showErrorMessage("invalidAmountOfPositions"), this.showSettings.bind(this);
                return;
            }
            if (mastermind.amountOfPositions !== event.target.value) {
                mastermind.changeAmountOfPositions(event.target.value);
                localStorage.setItem("amountOfPositions", event.target.value);

                document.getElementById("amountOfColors").min = event.target.value;
            }
        });
        document.getElementById("amountOfColors").addEventListener("change", (event) => {
            // this line is making weird things
            if (parseInt(event.target.value) < parseInt(mastermind.amountOfPositions)) {
                showErrorMessage("invalidAmountOfColors", this.showSettings.bind(this));
                return;
            }
            if (!localStorage.getItem("amountOfColors")) {
                this.warnAboutColorChange(event.target.value);
            } else if (localStorage.getItem("amountOfColors") !== event.target.value) {
                if (event.target.value >= 100 && !localStorage.getItem("insanityWarning")) {
                    localStorage.setItem("insanityWarning", true);
                    this.warnAboutColors(event.target.value);
                } else {
                    mastermind.colors.generatColors(event.target.value);
                    localStorage.setItem("amountOfColors", event.target.value);
                    mastermind.reset();

                    document.getElementById("amountOfPositions").max = event.target.value;
                }
            }
        });
        document.getElementById("brightnessThreshold").addEventListener("change", (event) => {
            if (event.target.value < 0 || event.target.value > 255) {
                showErrorMessage("invalidBrightnessThreshold");
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
        document.getElementById("language").addEventListener("change", (event) => {
            localStorage.setItem("language", event.target.value);
            language = event.target.value;
            
            // reload parts with text
            mastermind.colors.generatColors(mastermind.colors.getAmountOfColors());

            mastermind.reset();
            this.showSettings();
        });
    }

    showHelp() {
        this._showHelpWrapper(getText("buttons", "help"), getText("buttons", "back"), this.showMainMenu.bind(this));
    }

    showHello() {
        localStorage.setItem("theme", "devicedefault");
        this._showHelpWrapper(getText("hello"), getText("buttons", "intro"), this._close.bind(this));
    }

    _showHelpWrapper(header, outText, action) {
        this._setContent(
            `<div class="center">
                <h1>${header}</h1>
                <br>
                <p>${getText("help", "intro")}</p>
                <p>${getText("help", "code")}</p>
                <p>${getText("help", "feedback")}</p>
                <p>${getText("help", "pins")}</p>
                <p>${getText("help", "luck")}</p>
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
                <h1>${getText("warning", "title")}</h1>
                <br>
                <p>${getText("warning", "uniqueColors")}</p>
                <p>${getText("warning", "colorGenerationEffort")}</p>
                <br>
                <p>${getText("warning", "ps")}</p>
                <button id="back1" class="modalButton backButton">${getText("warning", "confirmChange")}</button>
                <button id="back2" class="modalButton backButton">${getText("warning", "changeMind")}</button>
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

    warnAboutColors(amountToChangeTo) {
        this._setContent(
            `<div class="center">
            <h1>${getText("warningNextLevel", "title")}</h1>
            <br>
            <p>${getText("warningNextLevel", "intro")}</p>
            <p>${getText("warningNextLevel", "boldMove").replace("${amountToChangeTo}", amountToChangeTo)}</p>
            <p>${getText("warningNextLevel", "greatPower")}</p>
            <p>${getText("warningNextLevel", "goodLuck")}</p>
            <p>${getText("warningNextLevel", "ps")}</p>
            <button id="back1" class="modalButton backButton">${getText("warningNextLevel", "confirmChange")}</button>
            <button id="back2" class="modalButton backButton">${getText("warningNextLevel", "changeMind")}</button>
        </div>`
        );
        this._open();

        document.getElementById("back1").addEventListener("click", () => {
            mastermind.colors.generatColors(amountToChangeTo);
            localStorage.setItem("amountOfColors", amountToChangeTo);
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
            <h1>${getText("success", "title")}</h1>
            <br>
            <p>${getText("success", "message")}</p>
            <button id="back" class="modalButton backButton">${getText("success", "buttonText")}</button>
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
                <h1>${getText("errors", "title")}</h1>
                <br>
                <p>${message}</p>
                <button id="back" class="modalButton backButton">${getText("errors", "back")}</button>
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

    askForReset(what, amount) {
        this._setContent(
            `<div class="center">
                <h1>${getText("reset", "title")}</h1>
                <br>
                <p>${getText("reset", "message").replace("${amount}", amount).replace("${what}", what)}</p>
                <p>${getText("reset", "message2").replace("${amount}", amount).replace("${what}", what)}</p>
                <button id="back" class="modalButton backButton">${getText("reset", "cancel")}</button>
                <button id="back2" class="modalButton backButton">${getText("reset", "confirm")}</button>
                </div>`
        );
        this._open();

        document.getElementById("back").addEventListener("click", () => {
            mastermind = new Mastermind();
            this._close();
        });

        document.getElementById("back2").addEventListener("click", () => {
            localStorage.setItem("amountOfColors", 8);
            localStorage.setItem("amountOfPositions", 4);

            // just reload the page
            location.reload();
        });

        
    }
}

class Colors {
    constructor(amountOfColors = 8) {
        if (amountOfColors < 1) {
            showErrorMessage("negativeValue");
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
        const baseColors = {
            red: "#FF0000",
            green: "#00FF00",
            blue: "#0000FF",
            yellow: "#FFFF00",
            cyan: "#00FFFF",
            magenta: "#FF00FF",
            orange: "#FFA500",
            purple: "#800080"
        };

        this.playColors = {};
        for (let color in baseColors) {
            const translatedColor = getText("colors", color);
            this.playColors[translatedColor] = baseColors[color];
        }
    }

    generatColors(numColors) {
        // two == because numColors can be a string
        if (numColors == 8) {
            this.baseColors();
            this.amountOfColors = numColors;
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
        // edge case: 1
        if (numValues == 1) {
            return [min];
        }
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
        if (hue < 15 || hue >= 345) colorName = "red";
        else if (hue < 45) colorName = "orange";
        else if (hue < 75) colorName = "yellow";
        else if (hue < 105) colorName = "lime";
        else if (hue < 135) colorName = "green";
        else if (hue < 165) colorName = "teal";
        else if (hue < 195) colorName = "cyan";
        else if (hue < 225) colorName = "azure";
        else if (hue < 255) colorName = "blue";
        else if (hue < 285) colorName = "purple";
        else if (hue < 315) colorName = "magenta";
        else if (hue < 345) colorName = "pink";

        colorName = getText("colors", colorName);

    
        // Lightness-based modifiers
        if (lightness < 40) colorName = getText("colors", "dark") + " " + colorName;
        else if (lightness > 60) colorName = getText("colors", "light") + " " + colorName;
    
        // Saturation-based modifiers
        if (saturation < 60) colorName = getText("colors", "pale") + " " + colorName;
        else if (saturation > 85) colorName = getText("colors", "vivid") + " " + colorName;
    
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

function showErrorMessage(message, goBackModal = false) {
    let translatedMessage = getText("errors", message);
    if (!modal) {
        // fallback if modal is not loaded
        alert(translatedMessage);
        return;
    }
    modal.showErrorMessage(translatedMessage, goBackModal);
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

function getText(...identifires) {
    if (!languagesJson || !languagesJson[language]) {
        return identifires;
    }
    let text = languagesJson[language];
    for (const identifire of identifires) {
        if (!text[identifire]) {
            return identifires;
        }
        text = text[identifire];
    }
    return text;
}

async function loadLanguages() {
    try {
        const response = await fetch('js/languages.json');
        if (!response.ok) {
            showErrorMessage("faliedToLoadLanguages");
            return null;
        }
        const languages = await response.json();
        return languages;
    } catch (error) {
        showErrorMessage("faliedToLoadLanguages");
        console.error(error);
        return null;
    }
}


let mastermind;
let modal;
let language = "en";
let languagesJson;

window.onload = async function() {
    // init languages
    languagesJson = await loadLanguages();
    const allLanguages = languagesJson ? Object.keys(languagesJson) : ["en"];

    language = localStorage.getItem("language") || navigator.language.split("-")[0];
    if (!allLanguages.includes(language)) {
        language = "en";
        // making sure the language is saved, or it will cause problesms in the settings
        localStorage.setItem("language", language);
    }

    // init modal
    modal = new ModalBase();
    document.getElementById("helpButtonArea").addEventListener("click", () => {
        modal.showMainMenu();
    });


    const amountOfPositions = localStorage.getItem("amountOfPositions") || 4;
    const brightnessThreshold = localStorage.getItem("brightnessThreshold") || 111;
    const amountOfColors = localStorage.getItem("amountOfColors") || 8;

    // in case of to large values ask the user if he want to reset
    if (amountOfColors >= 10000) {
        modal.askForReset(getText("reset", "colors"), amountOfColors);
        return;
    }
    if (amountOfPositions >= 1000) {
        modal.askForReset(getText("reset", "positions"), amountOfPositions);
        return;
    }

    // init mastermind
    mastermind = new Mastermind(amountOfPositions, amountOfColors, brightnessThreshold);

    
    // check if user was already on the page
    if (!localStorage.getItem("theme")) {
        // intro
        modal.showHello();
    }

};