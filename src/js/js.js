const playColors = {
    red: "#FF0000",
    green: "#00FF00",
    blue: "#0000FF",
    yellow: "#FFFF00",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
    orange: "#FFA500",
    purple: "#800080"
};

const hints = {
    correctPosition: "black",
    correctColor: "white"
}

class Mastermind {
    constructor(amountOfPositions = 4, brightnessThreshold = 120) {
        this.colors = Object.keys(playColors);
        this.amountOfPositions = amountOfPositions;
        if (this.colors.length < this.amountOfPositions) {
            throw new Error("Not enough colors for the amount of positions");
        }
        this.secret = [];
        this.playField = [];
        this.brightnessThreshold = brightnessThreshold;
        
        // Init, ironically
        this.reset();
    }

    generateSecret() {
        this.secret = [];
        for (let i = 0; i < this.amountOfPositions; i++) {
            while (true) {
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                if (!this.secret.includes(color)) {
                    this.secret.push(color);
                    break;
                }
            }
        }
    }

    resetPlayField() {
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
        const textColor = this.getContrastColor(playColors[color]);
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
        document.getElementById("table").innerHTML = "<tbody><tr id='tr_0'></tr></tbody>";
        const tr = document.getElementById("tr_0");

        let selectionField = "<option value='' disabled selected>Select a color</option>";
        for (let color of this.colors) {
            const btextColor = this.getContrastColor(playColors[color]);
            selectionField += `<option value="${color}" style="background-color: ${playColors[color]}; color: ${btextColor}">${color}</option>`;
        }
        selectionField += "</select>";

        for (let i = 0; i < this.amountOfPositions; i++) {
            tr.innerHTML += `<td id="td_${i}"><select id='colorSelection_${i}'>${selectionField}</td>`;
        }

        // add guess button
        tr.innerHTML += "<td id='button_td' class='button_td'><button id='submit' disabled>Guess</button></td>";

        // Event listeners for the color selection
        for (let i = 0; i < this.amountOfPositions; i++) {
            document.getElementById(`colorSelection_${i}`).addEventListener("change", (event) => {
                const color = event.target.value;
                this.play(color, i);
                document.getElementById(`td_${i}`).style.backgroundColor = playColors[color];
            });
        }

        document.getElementById("submit").addEventListener("click", () => {
            this.check();
            this.resetPlayField();
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
            showErrorMessage("You won!");
            // chance button to reset
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
        const resultArea = document.getElementById("resultArea");

        // chrome and firefox have different behavior when not using tbody
        resultArea.innerHTML += "<table><tbody id='resultTable'></tbody></table>";

        const resultTable = document.getElementById("resultTable");
        resultTable.appendChild(tr);

        // delete select fields
        for (let i = 0; i < this.amountOfPositions; i++) {
            document.getElementById(`colorSelection_${i}`).remove();
        }
        // HTMLCollection to Array because its a live collection and we can't foreach over it nor directly remove elements
        [...document.getElementsByClassName("sr-only")].forEach(element => element.remove());

        const button__td = document.getElementById("button_td");
        button__td.innerHTML = "Correct:<br>Positons: " + correctPositions + "<br>Colors: " + (correctPositions + correctColors);
        removeAllIdsAndEventListeners(tr);

        this.initControls();
        this.resetPlayField();
    }
    
    changeBrightnessThreshold(brightnessThreshold) {
        if (brightnessThreshold < 0 || brightnessThreshold > 255) {
            throw new Error("Invalid brightness threshold");
        }
        this.brightnessThreshold = brightnessThreshold;
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
        this.resetPlayField();
        this.initControls();
        document.getElementById("resultArea").innerHTML = "";
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
                <button id="help" class="modalButton">Help</button>
                <br>
                <button id="play" class="modalButton">Settings</button>
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
                <input type="number" id="amountOfPositions" name="amountOfPositions" min="1" max="${mastermind.colors.length}" value="${mastermind.amountOfPositions}">
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
            if (event.target.value < 1 || event.target.value > mastermind.colors.length) {
                showErrorMessage("Invalid amount of positions");
                return;
            }
            if (mastermind.amountOfPositions !== event.target.value) {
                mastermind = new Mastermind(event.target.value);
                localStorage.setItem("amountOfPositions", event.target.value);
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
            document.body.classList.remove("light", "dark");
            document.body.classList.add(event.target.value);
        });
    }

    showHelp() {
        this._setContent(
            `<div class="center">
                <h1>Help</h1>
                <br>
                <p>Mastermind is a code-breaking game. The goal is to guess the secret code in the least amount of guesses.</p>
                <p>After each guess, you will receive feedback in the form the amount of correct colors and the amount of correct colors in the correct position.</p>
                <p>Originally, the feedback is given in the form of black and white pins. Black pins indicate the amount of correct colors in the correct position, white pins indicate the amount of correct colors in the wrong position.</p>
                <p>Good luck!</p>
                <button id="back" class="modalButton backButton">Back</button>
                </div>`
        );
        this._open();

        document.getElementById("back").addEventListener("click", () => {
            this.showMainMenu();
        });
    }
}

let mastermind;
let modal;

window.onload = function() {
    const amountOfPositions = localStorage.getItem("amountOfPositions") || 4;
    const brightnessThreshold = localStorage.getItem("brightnessThreshold") || 111;
    mastermind = new Mastermind(amountOfPositions, brightnessThreshold);

    modal = new ModalBase();
    document.getElementById("helpButtonArea").addEventListener("click", () => {
        modal.showMainMenu();
    });
}

function showErrorMessage(message) {
    alert(message);
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
