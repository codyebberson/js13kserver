import type { Request, Response } from "express";
import type { Socket } from "socket.io";
import type { Storage } from "../lib/storage";
import { GUESS_NO, GUESS_PAPER, GUESS_ROCK, GUESS_SCISSORS } from "./shared";

declare const storage: Storage;

/**
 * User sessions
 * @param {Array} users
 */
const users: User[] = [];

/**
 * Find opponent for a user
 * @param {User} user
 */
function findOpponent(user: User) {
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
function removeUser(user: User) {
  users.splice(users.indexOf(user), 1);
}

/**
 * Game class
 */
class Game {
  constructor(readonly user1: User, readonly user2: User) {}

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
    if (
      (this.user1.guess === GUESS_ROCK &&
        this.user2.guess === GUESS_SCISSORS) ||
      (this.user1.guess === GUESS_PAPER && this.user2.guess === GUESS_ROCK) ||
      (this.user1.guess === GUESS_SCISSORS && this.user2.guess === GUESS_PAPER)
    ) {
      this.user1.win();
      this.user2.lose();
    } else if (
      (this.user2.guess === GUESS_ROCK &&
        this.user1.guess === GUESS_SCISSORS) ||
      (this.user2.guess === GUESS_PAPER && this.user1.guess === GUESS_ROCK) ||
      (this.user2.guess === GUESS_SCISSORS && this.user1.guess === GUESS_PAPER)
    ) {
      this.user2.win();
      this.user1.lose();
    } else {
      this.user1.draw();
      this.user2.draw();
    }
  }
}

/**
 * User session class
 */
class User {
  readonly socket: Socket;
  game: Game | null;
  opponent: User | null;
  guess: number;

  /**
   * @param {Socket} socket
   */
  constructor(socket: Socket) {
    this.socket = socket;
    this.game = null;
    this.opponent = null;
    this.guess = GUESS_NO;
  }

  /**
   * Set guess value
   * @param {number} guess
   */
  setGuess(guess: number) {
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
  start(game: Game, opponent: User) {
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
    this.socket.emit("win", this.opponent?.guess);
  }

  /**
   * Trigger lose event
   */
  lose() {
    this.socket.emit("lose", this.opponent?.guess);
  }

  /**
   * Trigger draw event
   */
  draw() {
    this.socket.emit("draw", this.opponent?.guess);
  }
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
export const io = (socket: Socket) => {
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
    console.log("Guess: " + socket.id);
    if (user.setGuess(guess) && user.game?.ended()) {
      user.game.score();
      user.game.start();
      storage.get("games", 0).then((games) => {
        storage.set("games", games + 1);
      });
    }
  });

  console.log("Connected: " + socket.id);
};

export const stat = (_req: Request, res: Response) => {
  storage.get("games", 0).then((games) => {
    res.send(`<h1>Games played: ${games}</h1>`);
  });
};
