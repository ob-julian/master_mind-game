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
    constructor() {
        this.colors = Object.keys(playColors);
        this.amountOfPositions = 4;
        if (this.colors.length < this.amountOfPositions) {
            throw new Error("Not enough colors for the amount of positions");
        }
        this.secret = [];
        this.generateSecret();
        this.playField = [];
        this.resetPlayField();

        this.initControls();
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
        const textColor = get_contrast_color(playColors[color]);
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
            const btextColor = get_contrast_color(playColors[color]);
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

    reset() {
        this.generateSecret();
        this.resetPlayField();
        this.initControls();
        document.getElementById("resultArea").innerHTML = "";
    }

}
// for console testing
let mastermind;
window.onload = function() {
    mastermind = new Mastermind();
    mastermind.generateSecret();
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

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function get_contrast_color(color) {
    const intColor = hexToRgb(color);
    const brightness = Math.round(((intColor.r * 299) + (intColor.g * 587) + (intColor.b * 114)) / 1000);
    const btextColor = (brightness > 111) ? "black" : "white";
    return btextColor;
}