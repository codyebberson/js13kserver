'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const GUESS_NO = 0;
const GUESS_ROCK = 1;
const GUESS_PAPER = 2;
const GUESS_SCISSORS = 3;

/**
 * User sessions
 * @param {Array} users
 */
const users = [];
/**
 * Find opponent for a user
 * @param {User} user
 */
function findOpponent(user) {
    for (let i = 0; i < users.length; i++) {
        if (user !== users[i] && users[i].opponent === null) {
            new Game(user, users[i]).start();
        }
    }
}
/**
 * Remove user session
 * @param {User} user
 */
function removeUser(user) {
    users.splice(users.indexOf(user), 1);
}
/**
 * Game class
 */
class Game {
    constructor(user1, user2) {
        Object.defineProperty(this, "user1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: user1
        });
        Object.defineProperty(this, "user2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: user2
        });
    }
    /**
     * Start new game
     */
    start() {
        this.user1.start(this, this.user2);
        this.user2.start(this, this.user1);
    }
    /**
     * Is game ended
     * @return {boolean}
     */
    ended() {
        return this.user1.guess !== GUESS_NO && this.user2.guess !== GUESS_NO;
    }
    /**
     * Final score
     */
    score() {
        if ((this.user1.guess === GUESS_ROCK &&
            this.user2.guess === GUESS_SCISSORS) ||
            (this.user1.guess === GUESS_PAPER && this.user2.guess === GUESS_ROCK) ||
            (this.user1.guess === GUESS_SCISSORS && this.user2.guess === GUESS_PAPER)) {
            this.user1.win();
            this.user2.lose();
        }
        else if ((this.user2.guess === GUESS_ROCK &&
            this.user1.guess === GUESS_SCISSORS) ||
            (this.user2.guess === GUESS_PAPER && this.user1.guess === GUESS_ROCK) ||
            (this.user2.guess === GUESS_SCISSORS && this.user1.guess === GUESS_PAPER)) {
            this.user2.win();
            this.user1.lose();
        }
        else {
            this.user1.draw();
            this.user2.draw();
        }
    }
}
/**
 * User session class
 */
class User {
    /**
     * @param {Socket} socket
     */
    constructor(socket) {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "game", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "opponent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "guess", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.socket = socket;
        this.game = null;
        this.opponent = null;
        this.guess = GUESS_NO;
    }
    /**
     * Set guess value
     * @param {number} guess
     */
    setGuess(guess) {
        if (!this.opponent || guess <= GUESS_NO || guess > GUESS_SCISSORS) {
            return false;
        }
        this.guess = guess;
        return true;
    }
    /**
     * Start new game
     * @param {Game} game
     * @param {User} opponent
     */
    start(game, opponent) {
        this.game = game;
        this.opponent = opponent;
        this.guess = GUESS_NO;
        this.socket.emit("start");
    }
    /**
     * Terminate game
     */
    end() {
        this.game = null;
        this.opponent = null;
        this.guess = GUESS_NO;
        this.socket.emit("end");
    }
    /**
     * Trigger win event
     */
    win() {
        var _a;
        this.socket.emit("win", (_a = this.opponent) === null || _a === void 0 ? void 0 : _a.guess);
    }
    /**
     * Trigger lose event
     */
    lose() {
        var _a;
        this.socket.emit("lose", (_a = this.opponent) === null || _a === void 0 ? void 0 : _a.guess);
    }
    /**
     * Trigger draw event
     */
    draw() {
        var _a;
        this.socket.emit("draw", (_a = this.opponent) === null || _a === void 0 ? void 0 : _a.guess);
    }
}
/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
const io = (socket) => {
    const user = new User(socket);
    users.push(user);
    findOpponent(user);
    socket.on("disconnect", () => {
        console.log("Disconnected: " + socket.id);
        removeUser(user);
        if (user.opponent) {
            user.opponent.end();
            findOpponent(user.opponent);
        }
    });
    socket.on("guess", (guess) => {
        var _a;
        console.log("Guess: " + socket.id);
        if (user.setGuess(guess) && ((_a = user.game) === null || _a === void 0 ? void 0 : _a.ended())) {
            user.game.score();
            user.game.start();
            storage.get("games", 0).then((games) => {
                storage.set("games", games + 1);
            });
        }
    });
    console.log("Connected: " + socket.id);
};
const stat = (_req, res) => {
    storage.get("games", 0).then((games) => {
        res.send(`<h1>Games played: ${games}</h1>`);
    });
};

exports.io = io;
exports.stat = stat;
