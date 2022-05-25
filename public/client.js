const socket = io({ upgrade: false, transports: ["websocket"] });
const buttons = document.getElementsByTagName("button");
const message = document.getElementById("message");
const score = document.getElementById("score");
disableButtons();
bind();
const points = {
    //Game points
    draw: 0,
    win: 0,
    lose: 0,
};
/**
 * Disable all button
 */
function disableButtons() {
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute("disabled", "disabled");
    }
}
/**
 * Enable all button
 */
function enableButtons() {
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].removeAttribute("disabled");
    }
}
/**
 * Set message text
 * @param {string} text
 */
function setMessage(text) {
    message.innerHTML = text;
}
/**
 * Set score text
 * @param {string} text
 */
function displayScore(text) {
    score.innerHTML = [
        "<h2>" + text + "</h2>",
        "Won: " + points.win,
        "Lost: " + points.lose,
        "Draw: " + points.draw,
    ].join("<br>");
}
/**
 * Binde Socket.IO and button events
 */
function bind() {
    socket.on("start", () => {
        enableButtons();
        setMessage("Round " + (points.win + points.lose + points.draw + 1));
    });
    socket.on("win", () => {
        points.win++;
        displayScore("You win!");
    });
    socket.on("lose", () => {
        points.lose++;
        displayScore("You lose!");
    });
    socket.on("draw", () => {
        points.draw++;
        displayScore("Draw!");
    });
    socket.on("end", () => {
        disableButtons();
        setMessage("Waiting for opponent...");
    });
    socket.on("connect", () => {
        disableButtons();
        setMessage("Waiting for opponent...");
    });
    socket.on("disconnect", () => {
        disableButtons();
        setMessage("Connection lost!");
    });
    socket.on("error", () => {
        disableButtons();
        setMessage("Connection error!");
    });
    for (let i = 0; i < buttons.length; i++) {
        ((button, guess) => {
            button.addEventListener("click", function () {
                disableButtons();
                socket.emit("guess", guess);
            }, false);
        })(buttons[i], i + 1);
    }
}
