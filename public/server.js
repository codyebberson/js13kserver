'use strict';

let noop = () => {};

/**
 * Remove an item from an array.
 *
 * @param {*[]} array - Array to remove from.
 * @param {*} item - Item to remove.
 *
 * @returns {Boolean|undefined} True if the item was removed.
 */
function removeFromArray(array, item) {
  let index = array.indexOf(item);
  if (index != -1) {
    array.splice(index, 1);
    return true;
  }
}

/**
 * A simple event system. Allows you to hook into Kontra lifecycle events or create your own, such as for [Plugins](api/plugin).
 *
 * ```js
 * import { on, off, emit } from 'kontra';
 *
 * function callback(a, b, c) {
 *   console.log({a, b, c});
 * });
 *
 * on('myEvent', callback);
 * emit('myEvent', 1, 2, 3);  //=> {a: 1, b: 2, c: 3}
 * off('myEvent', callback);
 * ```
 * @sectionName Events
 */

// expose for testing
let callbacks$2 = {};

/**
 * Call all callback functions for the event. All arguments will be passed to the callback functions.
 * @function emit
 *
 * @param {String} event - Name of the event.
 * @param {...*} args - Comma separated list of arguments passed to all callbacks.
 */
function emit(event, ...args) {
  (callbacks$2[event] || []).map(fn => fn(...args));
}

/**
 * Functions for initializing the Kontra library and getting the canvas and context
 * objects.
 *
 * ```js
 * import { getCanvas, getContext, init } from 'kontra';
 *
 * let { canvas, context } = init();
 *
 * // or can get canvas and context through functions
 * canvas = getCanvas();
 * context = getContext();
 * ```
 * @sectionName Core
 */

let canvasEl, context;

// allow contextless environments, such as using ThreeJS as the main
// canvas, by proxying all canvas context calls
let handler$1 = {
  // by using noop we can proxy both property and function calls
  // so neither will throw errors
  get(target, key) {
    // export for testing
    if (key == '_proxy') return true;
    return noop;
  }
};

/**
 * Return the canvas element.
 * @function getCanvas
 *
 * @returns {HTMLCanvasElement} The canvas element for the game.
 */
function getCanvas() {
  return canvasEl;
}

/**
 * Return the context object.
 * @function getContext
 *
 * @returns {CanvasRenderingContext2D} The context object the game draws to.
 */
function getContext() {
  return context;
}

/**
 * Initialize the library and set up the canvas. Typically you will call `init()` as the first thing and give it the canvas to use. This will allow all Kontra objects to reference the canvas when created.
 *
 * ```js
 * import { init } from 'kontra';
 *
 * let { canvas, context } = init('game');
 * ```
 * @function init
 *
 * @param {String|HTMLCanvasElement} [canvas] - The canvas for Kontra to use. Can either be the ID of the canvas element or the canvas element itself. Defaults to using the first canvas element on the page.
 * @param {Object} [options] - Game options.
 * @param {Boolean} [options.contextless=false] - If the game will run in an contextless environment. A contextless environment uses a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for the `canvas` and `context` so all property and function calls will noop.
 *
 * @returns {{canvas: HTMLCanvasElement, context: CanvasRenderingContext2D}} An object with properties `canvas` and `context`. `canvas` it the canvas element for the game and `context` is the context object the game draws to.
 */
function init$1(canvas, { contextless = false } = {}) {
  // check if canvas is a string first, an element next, or default to
  // getting first canvas on page
  canvasEl =
    document.getElementById(canvas) ||
    canvas ||
    document.querySelector('canvas');

  if (contextless) {
    canvasEl = canvasEl || new Proxy({}, handler$1);
  }

  // @ifdef DEBUG
  if (!canvasEl) {
    throw Error('You must provide a canvas element for the game');
  }
  // @endif

  context = canvasEl.getContext('2d') || new Proxy({}, handler$1);
  context.imageSmoothingEnabled = false;

  emit('init');

  return { canvas: canvasEl, context };
}

/**
 * An object for drawing sprite sheet animations.
 *
 * An animation defines the sequence of frames to use from a sprite sheet. It also defines at what speed the animation should run using `frameRate`.
 *
 * Typically you don't create an Animation directly, but rather you would create them from a [SpriteSheet](api/spriteSheet) by passing the `animations` argument.
 *
 * ```js
 * import { SpriteSheet, Animation } from 'kontra';
 *
 * let image = new Image();
 * image.src = 'assets/imgs/character_walk_sheet.png';
 * image.onload = function() {
 *   let spriteSheet = SpriteSheet({
 *     image: image,
 *     frameWidth: 72,
 *     frameHeight: 97
 *   });
 *
 *   // you typically wouldn't create an Animation this way
 *   let animation = Animation({
 *     spriteSheet: spriteSheet,
 *     frames: [1,2,3,6],
 *     frameRate: 30
 *   });
 * };
 * ```
 * @class Animation
 *
 * @param {Object} properties - Properties of the animation.
 * @param {SpriteSheet} properties.spriteSheet - Sprite sheet for the animation.
 * @param {Number[]} properties.frames - List of frames of the animation.
 * @param {Number}  properties.frameRate - Number of frames to display in one second.
 * @param {Boolean} [properties.loop=true] - If the animation should loop.
 */
class Animation {
  constructor({ spriteSheet, frames, frameRate, loop = true }) {
    /**
     * The sprite sheet to use for the animation.
     * @memberof Animation
     * @property {SpriteSheet} spriteSheet
     */
    this.spriteSheet = spriteSheet;

    /**
     * Sequence of frames to use from the sprite sheet.
     * @memberof Animation
     * @property {Number[]} frames
     */
    this.frames = frames;

    /**
     * Number of frames to display per second. Adjusting this value will change the speed of the animation.
     * @memberof Animation
     * @property {Number} frameRate
     */
    this.frameRate = frameRate;

    /**
     * If the animation should loop back to the beginning once completed.
     * @memberof Animation
     * @property {Boolean} loop
     */
    this.loop = loop;

    let { width, height, margin = 0 } = spriteSheet.frame;

    /**
     * The width of an individual frame. Taken from the [frame width value](api/spriteSheet#frame) of the sprite sheet.
     * @memberof Animation
     * @property {Number} width
     */
    this.width = width;

    /**
     * The height of an individual frame. Taken from the [frame height value](api/spriteSheet#frame) of the sprite sheet.
     * @memberof Animation
     * @property {Number} height
     */
    this.height = height;

    /**
     * The space between each frame. Taken from the [frame margin value](api/spriteSheet#frame) of the sprite sheet.
     * @memberof Animation
     * @property {Number} margin
     */
    this.margin = margin;

    // f = frame, a = accumulator
    this._f = 0;
    this._a = 0;
  }

  /**
   * Clone an animation so it can be used more than once. By default animations passed to [Sprite](api/sprite) will be cloned so no two sprites update the same animation. Otherwise two sprites who shared the same animation would make it update twice as fast.
   * @memberof Animation
   * @function clone
   *
   * @returns {Animation} A new Animation instance.
   */
  clone() {
    return new Animation(this);
  }

  /**
   * Reset an animation to the first frame.
   * @memberof Animation
   * @function reset
   */
  reset() {
    this._f = 0;
    this._a = 0;
  }

  /**
   * Update the animation.
   * @memberof Animation
   * @function update
   *
   * @param {Number} [dt=1/60] - Time since last update.
   */
  update(dt = 1 / 60) {
    // if the animation doesn't loop we stop at the last frame
    if (!this.loop && this._f == this.frames.length - 1) return;

    this._a += dt;

    // update to the next frame if it's time
    while (this._a * this.frameRate >= 1) {
      this._f = ++this._f % this.frames.length;
      this._a -= 1 / this.frameRate;
    }
  }

  /**
   * Draw the current frame of the animation.
   * @memberof Animation
   * @function render
   *
   * @param {Object} properties - Properties to draw the animation.
   * @param {Number} properties.x - X position to draw the animation.
   * @param {Number} properties.y - Y position to draw the animation.
   * @param {Number} [properties.width] - width of the sprite. Defaults to [Animation.width](api/animation#width).
   * @param {Number} [properties.height] - height of the sprite. Defaults to [Animation.height](api/animation#height).
   * @param {CanvasRenderingContext2D} [properties.context] - The context the animation should draw to. Defaults to [core.getContext()](api/core#getContext).
   */
  render({
    x,
    y,
    width = this.width,
    height = this.height,
    context = getContext()
  }) {
    // get the row and col of the frame
    let row = (this.frames[this._f] / this.spriteSheet._f) | 0;
    let col = this.frames[this._f] % this.spriteSheet._f | 0;

    context.drawImage(
      this.spriteSheet.image,
      col * this.width + (col * 2 + 1) * this.margin,
      row * this.height + (row * 2 + 1) * this.margin,
      this.width,
      this.height,
      x,
      y,
      width,
      height
    );
  }
}

function factory$b() {
  return new Animation(...arguments);
}

/**
 * Rotate a point by an angle.
 * @function rotatePoint
 *
 * @param {{x: Number, y: Number}} point - The {x,y} point to rotate.
 * @param {Number} angle - Angle (in radians) to rotate.
 *
 * @returns {{x: Number, y: Number}} The new x and y coordinates after rotation.
 */
function rotatePoint(point, angle) {
  let sin = Math.sin(angle);
  let cos = Math.cos(angle);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

/**
 * Clamp a number between two values, preventing it from going below or above the minimum and maximum values.
 * @function clamp
 *
 * @param {Number} min - Min value.
 * @param {Number} max - Max value.
 * @param {Number} value - Value to clamp.
 *
 * @returns {Number} Value clamped between min and max.
 */
function clamp(min, max, value) {
  return Math.min(Math.max(min, value), max);
}

/**
 * Return the world rect of an object. The rect is the world position of the top-left corner of the object and its size. Takes into account the objects anchor and scale.
 * @function getWorldRect
 *
 * @param {{x: Number, y: Number, width: Number, height: Number}|{world: {x: Number, y: Number, width: Number, height: Number}}|{mapwidth: Number, mapheight: Number}} obj - Object to get world rect of.
 *
 * @returns {{x: Number, y: Number, width: Number, height: Number}} The world `x`, `y`, `width`, and `height` of the object.
 */
function getWorldRect(obj) {
  let { x = 0, y = 0, width, height } = obj.world || obj;

  // take into account tileEngine
  if (obj.mapwidth) {
    width = obj.mapwidth;
    height = obj.mapheight;
  }

  // @ifdef GAMEOBJECT_ANCHOR
  // account for anchor
  if (obj.anchor) {
    x -= width * obj.anchor.x;
    y -= height * obj.anchor.y;
  }
  // @endif

  // @ifdef GAMEOBJECT_SCALE
  // account for negative scales
  if (width < 0) {
    x += width;
    width *= -1;
  }
  if (height < 0) {
    y += height;
    height *= -1;
  }
  // @endif

  return {
    x,
    y,
    width,
    height
  };
}

/**
 * A simple 2d vector object.
 *
 * ```js
 * import { Vector } from 'kontra';
 *
 * let vector = Vector(100, 200);
 * ```
 * @class Vector
 *
 * @param {Number} [x=0] - X coordinate of the vector.
 * @param {Number} [y=0] - Y coordinate of the vector.
 */
class Vector {
  constructor(x = 0, y = 0, vec = {}) {
    this.x = x;
    this.y = y;

    // @ifdef VECTOR_CLAMP
    // preserve vector clamping when creating new vectors
    if (vec._c) {
      this.clamp(vec._a, vec._b, vec._d, vec._e);

      // reset x and y so clamping takes effect
      this.x = x;
      this.y = y;
    }
    // @endif
  }

  /**
   * Calculate the addition of the current vector with the given vector.
   * @memberof Vector
   * @function add
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to add to the current Vector.
   *
   * @returns {Vector} A new Vector instance whose value is the addition of the two vectors.
   */
  add(vec) {
    return new Vector(this.x + vec.x, this.y + vec.y, this);
  }

  // @ifdef VECTOR_SUBTRACT
  /**
   * Calculate the subtraction of the current vector with the given vector.
   * @memberof Vector
   * @function subtract
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to subtract from the current Vector.
   *
   * @returns {Vector} A new Vector instance whose value is the subtraction of the two vectors.
   */
  subtract(vec) {
    return new Vector(this.x - vec.x, this.y - vec.y, this);
  }
  // @endif

  // @ifdef VECTOR_SCALE
  /**
   * Calculate the multiple of the current vector by a value.
   * @memberof Vector
   * @function scale
   *
   * @param {Number} value - Value to scale the current Vector.
   *
   * @returns {Vector} A new Vector instance whose value is multiplied by the scalar.
   */
  scale(value) {
    return new Vector(this.x * value, this.y * value);
  }
  // @endif

  // @ifdef VECTOR_NORMALIZE
  /**
   * Calculate the normalized value of the current vector. Requires the Vector [length](api/vector#length) function.
   * @memberof Vector
   * @function normalize
   *
   * @returns {Vector} A new Vector instance whose value is the normalized vector.
   */
  // @see https://github.com/jed/140bytes/wiki/Byte-saving-techniques#use-placeholder-arguments-instead-of-var
  normalize(length = this.length()) {
    return new Vector(this.x / length, this.y / length);
  }
  // @endif

  // @ifdef VECTOR_DOT||VECTOR_ANGLE
  /**
   * Calculate the dot product of the current vector with the given vector.
   * @memberof Vector
   * @function dot
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to dot product against.
   *
   * @returns {Number} The dot product of the vectors.
   */
  dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }
  // @endif

  // @ifdef VECTOR_LENGTH||VECTOR_NORMALIZE||VECTOR_ANGLE
  /**
   * Calculate the length (magnitude) of the Vector.
   * @memberof Vector
   * @function length
   *
   * @returns {Number} The length of the vector.
   */
  length() {
    return Math.hypot(this.x, this.y);
  }
  // @endif

  // @ifdef VECTOR_DISTANCE
  /**
   * Calculate the distance between the current vector and the given vector.
   * @memberof Vector
   * @function distance
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to calculate the distance between.
   *
   * @returns {Number} The distance between the two vectors.
   */
  distance(vec) {
    return Math.hypot(this.x - vec.x, this.y - vec.y);
  }
  // @endif

  // @ifdef VECTOR_ANGLE
  /**
   * Calculate the angle (in radians) between the current vector and the given vector. Requires the Vector [dot](api/vector#dot) and [length](api/vector#length) functions.
   * @memberof Vector
   * @function angle
   *
   * @param {Vector} vector - Vector to calculate the angle between.
   *
   * @returns {Number} The angle (in radians) between the two vectors.
   */
  angle(vec) {
    return Math.acos(this.dot(vec) / (this.length() * vec.length()));
  }
  // @endif

  // @ifdef VECTOR_CLAMP
  /**
   * Clamp the Vector between two points, preventing `x` and `y` from going below or above the minimum and maximum values. Perfect for keeping a sprite from going outside the game boundaries.
   *
   * ```js
   * import { Vector } from 'kontra';
   *
   * let vector = Vector(100, 200);
   * vector.clamp(0, 0, 200, 300);
   *
   * vector.x += 200;
   * console.log(vector.x);  //=> 200
   *
   * vector.y -= 300;
   * console.log(vector.y);  //=> 0
   *
   * vector.add({x: -500, y: 500});
   * console.log(vector);    //=> {x: 0, y: 300}
   * ```
   * @memberof Vector
   * @function clamp
   *
   * @param {Number} xMin - Minimum x value.
   * @param {Number} yMin - Minimum y value.
   * @param {Number} xMax - Maximum x value.
   * @param {Number} yMax - Maximum y value.
   */
  clamp(xMin, yMin, xMax, yMax) {
    this._c = true;
    this._a = xMin;
    this._b = yMin;
    this._d = xMax;
    this._e = yMax;
  }

  /**
   * X coordinate of the vector.
   * @memberof Vector
   * @property {Number} x
   */
  get x() {
    return this._x;
  }

  /**
   * Y coordinate of the vector.
   * @memberof Vector
   * @property {Number} y
   */
  get y() {
    return this._y;
  }

  set x(value) {
    this._x = this._c ? clamp(this._a, this._d, value) : value;
  }

  set y(value) {
    this._y = this._c ? clamp(this._b, this._e, value) : value;
  }
  // @endif
}

function factory$a() {
  return new Vector(...arguments);
}

/**
 * This is a private class that is used just to help make the GameObject class more manageable and smaller.
 *
 * It maintains everything that can be changed in the update function:
 * position
 * velocity
 * acceleration
 * ttl
 */
class Updatable {
  constructor(properties) {
    return this.init(properties);
  }

  init(properties = {}) {
    // --------------------------------------------------
    // defaults
    // --------------------------------------------------

    /**
     * The game objects position vector. Represents the local position of the object as opposed to the [world](api/gameObject#world) position.
     * @property {Vector} position
     * @memberof GameObject
     * @page GameObject
     */
    this.position = factory$a();

    // --------------------------------------------------
    // optionals
    // --------------------------------------------------

    // @ifdef GAMEOBJECT_VELOCITY
    /**
     * The game objects velocity vector.
     * @memberof GameObject
     * @property {Vector} velocity
     * @page GameObject
     */
    this.velocity = factory$a();
    // @endif

    // @ifdef GAMEOBJECT_ACCELERATION
    /**
     * The game objects acceleration vector.
     * @memberof GameObject
     * @property {Vector} acceleration
     * @page GameObject
     */
    this.acceleration = factory$a();
    // @endif

    // @ifdef GAMEOBJECT_TTL
    /**
     * How may frames the game object should be alive.
     * @memberof GameObject
     * @property {Number} ttl
     * @page GameObject
     */
    this.ttl = Infinity;
    // @endif

    // add all properties to the object, overriding any defaults
    Object.assign(this, properties);
  }

  /**
   * Update the position of the game object and all children using their velocity and acceleration. Calls the game objects [advance()](api/gameObject#advance) function.
   * @memberof GameObject
   * @function update
   * @page GameObject
   *
   * @param {Number} [dt] - Time since last update.
   */
  update(dt) {
    this.advance(dt);
  }

  /**
   * Move the game object by its acceleration and velocity. If you pass `dt` it will multiply the vector and acceleration by that number. This means the `dx`, `dy`, `ddx` and `ddy` should be how far you want the object to move in 1 second rather than in 1 frame.
   *
   * If you override the game objects [update()](api/gameObject#update) function with your own update function, you can call this function to move the game object normally.
   *
   * ```js
   * import { GameObject } from 'kontra';
   *
   * let gameObject = GameObject({
   *   x: 100,
   *   y: 200,
   *   width: 20,
   *   height: 40,
   *   dx: 5,
   *   dy: 2,
   *   update: function() {
   *     // move the game object normally
   *     this.advance();
   *
   *     // change the velocity at the edges of the canvas
   *     if (this.x < 0 ||
   *         this.x + this.width > this.context.canvas.width) {
   *       this.dx = -this.dx;
   *     }
   *     if (this.y < 0 ||
   *         this.y + this.height > this.context.canvas.height) {
   *       this.dy = -this.dy;
   *     }
   *   }
   * });
   * ```
   * @memberof GameObject
   * @function advance
   * @page GameObject
   *
   * @param {Number} [dt] - Time since last update.
   *
   */
  advance(dt) {
    // @ifdef GAMEOBJECT_VELOCITY
    // @ifdef GAMEOBJECT_ACCELERATION
    let acceleration = this.acceleration;

    // @ifdef VECTOR_SCALE
    if (dt) {
      acceleration = acceleration.scale(dt);
    }
    // @endif

    this.velocity = this.velocity.add(acceleration);
    // @endif
    // @endif

    // @ifdef GAMEOBJECT_VELOCITY
    let velocity = this.velocity;

    // @ifdef VECTOR_SCALE
    if (dt) {
      velocity = velocity.scale(dt);
    }
    // @endif

    this.position = this.position.add(velocity);
    this._pc();
    // @endif

    // @ifdef GAMEOBJECT_TTL
    this.ttl--;
    // @endif
  }

  // --------------------------------------------------
  // velocity
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_VELOCITY
  /**
   * X coordinate of the velocity vector.
   * @memberof GameObject
   * @property {Number} dx
   * @page GameObject
   */
  get dx() {
    return this.velocity.x;
  }

  /**
   * Y coordinate of the velocity vector.
   * @memberof GameObject
   * @property {Number} dy
   * @page GameObject
   */
  get dy() {
    return this.velocity.y;
  }

  set dx(value) {
    this.velocity.x = value;
  }

  set dy(value) {
    this.velocity.y = value;
  }
  // @endif

  // --------------------------------------------------
  // acceleration
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_ACCELERATION
  /**
   * X coordinate of the acceleration vector.
   * @memberof GameObject
   * @property {Number} ddx
   * @page GameObject
   */
  get ddx() {
    return this.acceleration.x;
  }

  /**
   * Y coordinate of the acceleration vector.
   * @memberof GameObject
   * @property {Number} ddy
   * @page GameObject
   */
  get ddy() {
    return this.acceleration.y;
  }

  set ddx(value) {
    this.acceleration.x = value;
  }

  set ddy(value) {
    this.acceleration.y = value;
  }
  // @endif

  // --------------------------------------------------
  // ttl
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_TTL
  /**
   * Check if the game object is alive.
   * @memberof GameObject
   * @function isAlive
   * @page GameObject
   *
   * @returns {Boolean} `true` if the game objects [ttl](api/gameObject#ttl) property is above `0`, `false` otherwise.
   */
  isAlive() {
    return this.ttl > 0;
  }
  // @endif

  _pc() {}
}

/**
 * The base class of most renderable classes. Handles things such as position, rotation, anchor, and the update and render life cycle.
 *
 * Typically you don't create a GameObject directly, but rather extend it for new classes.
 * @class GameObject
 *
 * @param {Object} [properties] - Properties of the game object.
 * @param {Number} [properties.x] - X coordinate of the position vector.
 * @param {Number} [properties.y] - Y coordinate of the position vector.
 * @param {Number} [properties.width] - Width of the game object.
 * @param {Number} [properties.height] - Height of the game object.
 *
 * @param {CanvasRenderingContext2D} [properties.context] - The context the game object should draw to. Defaults to [core.getContext()](api/core#getContext).
 *
 * @param {Number} [properties.dx] - X coordinate of the velocity vector.
 * @param {Number} [properties.dy] - Y coordinate of the velocity vector.
 * @param {Number} [properties.ddx] - X coordinate of the acceleration vector.
 * @param {Number} [properties.ddy] - Y coordinate of the acceleration vector.
 * @param {Number} [properties.ttl=Infinity] - How many frames the game object should be alive. Used by [Pool](api/pool).
 *
 * @param {{x: Number, y: Number}} [properties.anchor={x:0,y:0}] - The x and y origin of the game object. {x:0, y:0} is the top left corner of the game object, {x:1, y:1} is the bottom right corner.
 * @param {GameObject[]} [properties.children] - Children to add to the game object.
 * @param {Number} [properties.opacity=1] - The opacity of the game object.
 * @param {Number} [properties.rotation=0] - The rotation around the anchor in radians.
 * @param {Number} [properties.scaleX=1] - The x scale of the game object.
 * @param {Number} [properties.scaleY=1] - The y scale of the game object.
 *
 * @param {(dt?: Number) => void} [properties.update] - Function called every frame to update the game object.
 * @param {Function} [properties.render] - Function called every frame to render the game object.
 *
 * @param {...*} properties.props - Any additional properties you need added to the game object. For example, if you pass `gameObject({type: 'player'})` then the game object will also have a property of the same name and value. You can pass as many additional properties as you want.
 */
class GameObject extends Updatable {
  /**
   * @docs docs/api_docs/gameObject.js
   */

  /**
   * Use this function to reinitialize a game object. It takes the same properties object as the constructor. Useful it you want to repurpose a game object.
   * @memberof GameObject
   * @function init
   *
   * @param {Object} properties - Properties of the game object.
   */
  init({
    // --------------------------------------------------
    // defaults
    // --------------------------------------------------

    /**
     * The width of the game object. Represents the local width of the object as opposed to the [world](api/gameObject#world) width.
     * @memberof GameObject
     * @property {Number} width
     */
    width = 0,

    /**
     * The height of the game object. Represents the local height of the object as opposed to the [world](api/gameObject#world) height.
     * @memberof GameObject
     * @property {Number} height
     */
    height = 0,

    /**
     * The context the game object will draw to.
     * @memberof GameObject
     * @property {CanvasRenderingContext2D} context
     */
    context = getContext(),

    render = this.draw,
    update = this.advance,

    // --------------------------------------------------
    // optionals
    // --------------------------------------------------

    // @ifdef GAMEOBJECT_GROUP
    /**
     * The game objects parent object.
     * @memberof GameObject
     * @property {GameObject|null} parent
     */

    /**
     * The game objects children objects.
     * @memberof GameObject
     * @property {GameObject[]} children
     */
    children = [],
    // @endif

    // @ifdef GAMEOBJECT_ANCHOR
    /**
     * The x and y origin of the game object. {x:0, y:0} is the top left corner of the game object, {x:1, y:1} is the bottom right corner.
     * @memberof GameObject
     * @property {{x: Number, y: Number}} anchor
     *
     * @example
     * // exclude-code:start
     * let { GameObject } = kontra;
     * // exclude-code:end
     * // exclude-script:start
     * import { GameObject } from 'kontra';
     * // exclude-script:end
     *
     * let gameObject = GameObject({
     *   x: 150,
     *   y: 100,
     *   width: 50,
     *   height: 50,
     *   color: 'red',
     *   // exclude-code:start
     *   context: context,
     *   // exclude-code:end
     *   render: function() {
     *     this.context.fillStyle = this.color;
     *     this.context.fillRect(0, 0, this.height, this.width);
     *   }
     * });
     *
     * function drawOrigin(gameObject) {
     *   gameObject.context.fillStyle = 'yellow';
     *   gameObject.context.beginPath();
     *   gameObject.context.arc(gameObject.x, gameObject.y, 3, 0, 2*Math.PI);
     *   gameObject.context.fill();
     * }
     *
     * gameObject.render();
     * drawOrigin(gameObject);
     *
     * gameObject.anchor = {x: 0.5, y: 0.5};
     * gameObject.x = 300;
     * gameObject.render();
     * drawOrigin(gameObject);
     *
     * gameObject.anchor = {x: 1, y: 1};
     * gameObject.x = 450;
     * gameObject.render();
     * drawOrigin(gameObject);
     */
    anchor = { x: 0, y: 0 },
    // @endif

    // @ifdef GAMEOBJECT_OPACITY
    /**
     * The opacity of the object. Represents the local opacity of the object as opposed to the [world](api/gameObject#world) opacity.
     * @memberof GameObject
     * @property {Number} opacity
     */
    opacity = 1,
    // @endif

    // @ifdef GAMEOBJECT_ROTATION
    /**
     * The rotation of the game object around the anchor in radians. Represents the local rotation of the object as opposed to the [world](api/gameObject#world) rotation.
     * @memberof GameObject
     * @property {Number} rotation
     */
    rotation = 0,
    // @endif

    // @ifdef GAMEOBJECT_SCALE
    /**
     * The x scale of the object. Represents the local x scale of the object as opposed to the [world](api/gameObject#world) x scale.
     * @memberof GameObject
     * @property {Number} scaleX
     */
    scaleX = 1,

    /**
     * The y scale of the object. Represents the local y scale of the object as opposed to the [world](api/gameObject#world) y scale.
     * @memberof GameObject
     * @property {Number} scaleY
     */
    scaleY = 1,
    // @endif

    ...props
  } = {}) {
    // @ifdef GAMEOBJECT_GROUP
    this._c = [];
    // @endif

    // by setting defaults to the parameters and passing them into
    // the init, we can ensure that a parent class can set overriding
    // defaults and the GameObject won't undo it (if we set
    // `this.width` then no parent could provide a default value for
    // width)
    super.init({
      width,
      height,
      context,

      // @ifdef GAMEOBJECT_ANCHOR
      anchor,
      // @endif

      // @ifdef GAMEOBJECT_OPACITY
      opacity,
      // @endif

      // @ifdef GAMEOBJECT_ROTATION
      rotation,
      // @endif

      // @ifdef GAMEOBJECT_SCALE
      scaleX,
      scaleY,
      // @endif

      ...props
    });

    // di = done init
    this._di = true;
    this._uw();

    // @ifdef GAMEOBJECT_GROUP
    this.addChild(children);
    // @endif

    // rf = render function
    this._rf = render;

    // uf = update function
    this._uf = update;
  }

  /**
   * Update all children
   */
  update(dt) {
    this._uf(dt);

    // @ifdef GAMEOBJECT_GROUP
    this.children.map(child => child.update && child.update(dt));
    // @endif
  }

  /**
   * Render the game object and all children. Calls the game objects [draw()](api/gameObject#draw) function.
   * @memberof GameObject
   * @function render
   */
  render() {
    let context = this.context;
    context.save();

    // 1) translate to position
    //
    // it's faster to only translate if one of the values is non-zero
    // rather than always translating
    // @see https://jsperf.com/translate-or-if-statement/2
    if (this.x || this.y) {
      context.translate(this.x, this.y);
    }

    // @ifdef GAMEOBJECT_ROTATION
    // 3) rotate around the anchor
    //
    // it's faster to only rotate when set rather than always rotating
    // @see https://jsperf.com/rotate-or-if-statement/2
    if (this.rotation) {
      context.rotate(this.rotation);
    }
    // @endif

    // @ifdef GAMEOBJECT_SCALE
    // 4) scale after translation to position so object can be
    // scaled in place (rather than scaling position as well).
    //
    // it's faster to only scale if one of the values is not 1
    // rather than always scaling
    // @see https://jsperf.com/scale-or-if-statement/4
    if (this.scaleX != 1 || this.scaleY != 1) {
      context.scale(this.scaleX, this.scaleY);
    }
    // @endif

    // @ifdef GAMEOBJECT_ANCHOR
    // 5) translate to the anchor so (0,0) is the top left corner
    // for the render function
    let anchorX = -this.width * this.anchor.x;
    let anchorY = -this.height * this.anchor.y;

    if (anchorX || anchorY) {
      context.translate(anchorX, anchorY);
    }
    // @endif

    // @ifdef GAMEOBJECT_OPACITY
    // it's not really any faster to gate the global alpha
    // @see https://jsperf.com/global-alpha-or-if-statement/1
    this.context.globalAlpha = this.opacity;
    // @endif

    this._rf();

    // @ifdef GAMEOBJECT_ANCHOR
    // 7) translate back to the anchor so children use the correct
    // x/y value from the anchor
    if (anchorX || anchorY) {
      context.translate(-anchorX, -anchorY);
    }
    // @endif

    // @ifdef GAMEOBJECT_GROUP
    // perform all transforms on the parent before rendering the
    // children
    let children = this.children;
    children.map(child => child.render && child.render());
    // @endif

    context.restore();
  }

  /**
   * Draw the game object at its X and Y position, taking into account rotation, scale, and anchor.
   *
   * Do note that the canvas has been rotated and translated to the objects position (taking into account anchor), so {0,0} will be the top-left corner of the game object when drawing.
   *
   * If you override the game objects `render()` function with your own render function, you can call this function to draw the game object normally.
   *
   * ```js
   * let { GameObject } = kontra;
   *
   * let gameObject = GameObject({
   *  x: 290,
   *  y: 80,
   *  width: 20,
   *  height: 40,
   *
   *  render: function() {
   *    // draw the game object normally (perform rotation and other transforms)
   *    this.draw();
   *
   *    // outline the game object
   *    this.context.strokeStyle = 'yellow';
   *    this.context.lineWidth = 2;
   *    this.context.strokeRect(0, 0, this.width, this.height);
   *  }
   * });
   *
   * gameObject.render();
   * ```
   * @memberof GameObject
   * @function draw
   */
  draw() {}

  /**
   * Sync property changes from the parent to the child
   */
  _pc() {
    this._uw();

    // @ifdef GAMEOBJECT_GROUP
    this.children.map(child => child._pc());
    // @endif
  }

  /**
   * X coordinate of the position vector.
   * @memberof GameObject
   * @property {Number} x
   */
  get x() {
    return this.position.x;
  }

  /**
   * Y coordinate of the position vector.
   * @memberof GameObject
   * @property {Number} y
   */
  get y() {
    return this.position.y;
  }

  set x(value) {
    this.position.x = value;

    // pc = property changed
    this._pc();
  }

  set y(value) {
    this.position.y = value;
    this._pc();
  }

  get width() {
    // w = width
    return this._w;
  }

  set width(value) {
    this._w = value;
    this._pc();
  }

  get height() {
    // h = height
    return this._h;
  }

  set height(value) {
    this._h = value;
    this._pc();
  }

  /**
   * Update world properties
   */
  _uw() {
    // don't update world properties until after the init has finished
    if (!this._di) return;

    // @ifdef GAMEOBJECT_GROUP||GAMEOBJECT_OPACITY||GAMEOBJECT_ROTATION||GAMEOBJECT_SCALE
    let {
      _wx = 0,
      _wy = 0,

      // @ifdef GAMEOBJECT_OPACITY
      _wo = 1,
      // @endif

      // @ifdef GAMEOBJECT_ROTATION
      _wr = 0,
      // @endif

      // @ifdef GAMEOBJECT_SCALE
      _wsx = 1,
      _wsy = 1
      // @endif
    } = this.parent || {};
    // @endif

    // wx = world x, wy = world y
    this._wx = this.x;
    this._wy = this.y;

    // ww = world width, wh = world height
    this._ww = this.width;
    this._wh = this.height;

    // @ifdef GAMEOBJECT_OPACITY
    // wo = world opacity
    this._wo = _wo * this.opacity;
    // @endif

    // @ifdef GAMEOBJECT_SCALE
    // wsx = world scale x, wsy = world scale y
    this._wsx = _wsx * this.scaleX;
    this._wsy = _wsy * this.scaleY;

    this._wx = this._wx * _wsx;
    this._wy = this._wy * _wsy;
    this._ww = this.width * this._wsx;
    this._wh = this.height * this._wsy;
    // @endif

    // @ifdef GAMEOBJECT_ROTATION
    // wr = world rotation
    this._wr = _wr + this.rotation;

    let { x, y } = rotatePoint({ x: this._wx, y: this._wy }, _wr);
    this._wx = x;
    this._wy = y;
    // @endif

    // @ifdef GAMEOBJECT_GROUP
    this._wx += _wx;
    this._wy += _wy;
    // @endif
  }

  /**
   * The world position, width, height, opacity, rotation, and scale. The world property is the true position, width, height, etc. of the object, taking into account all parents.
   *
   * The world property does not adjust for anchor or scale, so if you set a negative scale the world width or height could be negative. Use [getWorldRect](/api/helpers#getWorldRect) to get the world position and size adjusted for anchor and scale.
   * @property {{x: Number, y: Number, width: Number, height: Number, opacity: Number, rotation: Number, scaleX: Number, scaleY: Number}} world
   * @memberof GameObject
   */
  get world() {
    return {
      x: this._wx,
      y: this._wy,
      width: this._ww,
      height: this._wh,

      // @ifdef GAMEOBJECT_OPACITY
      opacity: this._wo,
      // @endif

      // @ifdef GAMEOBJECT_ROTATION
      rotation: this._wr,
      // @endif

      // @ifdef GAMEOBJECT_SCALE
      scaleX: this._wsx,
      scaleY: this._wsy
      // @endif
    };
  }

  // --------------------------------------------------
  // group
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_GROUP
  set children(value) {
    this.removeChild(this._c);
    this.addChild(value);
  }

  get children() {
    return this._c;
  }

  /**
   * Add an object as a child to this object. The objects position, size, and rotation will be relative to the parents position, size, and rotation. The childs [world](api/gameObject#world) property will be updated to take into account this object and all of its parents.
   * @memberof GameObject
   * @function addChild
   *
   * @param {...(GameObject|GameObject[])[]} objects - Object to add as a child. Can be a single object, an array of objects, or a comma-separated list of objects.
   *
   * @example
   * // exclude-code:start
   * let { GameObject } = kontra;
   * // exclude-code:end
   * // exclude-script:start
   * import { GameObject } from 'kontra';
   * // exclude-script:end
   *
   * function createObject(x, y, color, size = 1) {
   *   return GameObject({
   *     x,
   *     y,
   *     width: 50 / size,
   *     height: 50 / size,
   *     anchor: {x: 0.5, y: 0.5},
   *     color,
   *     // exclude-code:start
   *     context: context,
   *     // exclude-code:end
   *     render: function() {
   *       this.context.fillStyle = this.color;
   *       this.context.fillRect(0, 0, this.height, this.width);
   *     }
   *   });
   * }
   *
   * let parent = createObject(300, 100, 'red');
   *
   * // create a child that is 25px to the right and
   * // down from the parents position
   * let child = createObject(25, 25, 'yellow', 2);
   *
   * parent.addChild(child);
   *
   * parent.render();
   */
  addChild(...objects) {
    objects.flat().map(child => {
      this.children.push(child);
      child.parent = this;
      child._pc = child._pc || noop;
      child._pc();
    });
  }

  /**
   * Remove an object as a child of this object. The removed objects [world](api/gameObject#world) property will be updated to not take into account this object and all of its parents.
   * @memberof GameObject
   * @function removeChild
   *
   * @param {...(GameObject|GameObject[])[]} objects - Object to remove as a child. Can be a single object, an array of objects, or a comma-separated list of objects.
   */
  removeChild(...objects) {
    objects.flat().map(child => {
      if (removeFromArray(this.children, child)) {
        child.parent = null;
        child._pc();
      }
    });
  }
  // @endif

  // --------------------------------------------------
  // opacity
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_OPACITY
  get opacity() {
    return this._opa;
  }

  set opacity(value) {
    this._opa = value;
    this._pc();
  }
  // @endif

  // --------------------------------------------------
  // rotation
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_ROTATION
  get rotation() {
    return this._rot;
  }

  set rotation(value) {
    this._rot = value;
    this._pc();
  }
  // @endif

  // --------------------------------------------------
  // scale
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_SCALE
  /**
   * Set the x and y scale of the object. If only one value is passed, both are set to the same value.
   * @memberof GameObject
   * @function setScale
   *
   * @param {Number} x - X scale value.
   * @param {Number} [y=x] - Y scale value.
   */
  setScale(x, y = x) {
    this.scaleX = x;
    this.scaleY = y;
  }

  get scaleX() {
    return this._scx;
  }

  set scaleX(value) {
    this._scx = value;
    this._pc();
  }

  get scaleY() {
    return this._scy;
  }

  set scaleY(value) {
    this._scy = value;
    this._pc();
  }
  // @endif
}

/**
 * A versatile way to update and draw your sprites. It can handle simple rectangles, images, and sprite sheet animations. It can be used for your main player object as well as tiny particles in a particle engine.
 * @class Sprite
 * @extends GameObject
 *
 * @param {Object} [properties] - Properties of the sprite.
 * @param {String} [properties.color] - Fill color for the game object if no image or animation is provided.
 * @param {HTMLImageElement|HTMLCanvasElement} [properties.image] - Use an image to draw the sprite.
 * @param {{[name: String] : Animation}} [properties.animations] - An object of [Animations](api/animation) from a [Spritesheet](api/spriteSheet) to animate the sprite.
 */
class Sprite extends GameObject {
  /**
   * @docs docs/api_docs/sprite.js
   */

  init({
    /**
     * The color of the game object if it was passed as an argument.
     * @memberof Sprite
     * @property {String} color
     */

    // @ifdef SPRITE_IMAGE
    /**
     * The image the sprite will use when drawn if passed as an argument.
     * @memberof Sprite
     * @property {HTMLImageElement|HTMLCanvasElement} image
     */
    image,

    /**
     * The width of the sprite. If the sprite is a [rectangle sprite](api/sprite#rectangle-sprite), it uses the passed in value. For an [image sprite](api/sprite#image-sprite) it is the width of the image. And for an [animation sprite](api/sprite#animation-sprite) it is the width of a single frame of the animation.
     * @memberof Sprite
     * @property {Number} width
     */
    width = image ? image.width : undefined,

    /**
     * The height of the sprite. If the sprite is a [rectangle sprite](api/sprite#rectangle-sprite), it uses the passed in value. For an [image sprite](api/sprite#image-sprite) it is the height of the image. And for an [animation sprite](api/sprite#animation-sprite) it is the height of a single frame of the animation.
     * @memberof Sprite
     * @property {Number} height
     */
    height = image ? image.height : undefined,
    // @endif

    ...props
  } = {}) {
    super.init({
      // @ifdef SPRITE_IMAGE
      image,
      width,
      height,
      // @endif
      ...props
    });
  }

  // @ifdef SPRITE_ANIMATION
  /**
   * An object of [Animations](api/animation) from a [SpriteSheet](api/spriteSheet) to animate the sprite. Each animation is named so that it can can be used by name for the sprites [playAnimation()](api/sprite#playAnimation) function.
   *
   * ```js
   * import { Sprite, SpriteSheet } from 'kontra';
   *
   * let spriteSheet = SpriteSheet({
   *   // ...
   *   animations: {
   *     idle: {
   *       frames: 1,
   *       loop: false,
   *     },
   *     walk: {
   *       frames: [1,2,3]
   *     }
   *   }
   * });
   *
   * let sprite = Sprite({
   *   x: 100,
   *   y: 200,
   *   animations: spriteSheet.animations
   * });
   *
   * sprite.playAnimation('idle');
   * ```
   * @memberof Sprite
   * @property {{[name: String] : Animation}} animations
   */
  get animations() {
    return this._a;
  }

  set animations(value) {
    let prop, firstAnimation;
    // a = animations
    this._a = {};

    // clone each animation so no sprite shares an animation
    for (prop in value) {
      this._a[prop] = value[prop].clone();

      // default the current animation to the first one in the list
      firstAnimation = firstAnimation || this._a[prop];
    }

    /**
     * The currently playing Animation object if `animations` was passed as an argument.
     * @memberof Sprite
     * @property {Animation} currentAnimation
     */
    this.currentAnimation = firstAnimation;
    this.width = this.width || firstAnimation.width;
    this.height = this.height || firstAnimation.height;
  }

  /**
   * Set the currently playing animation of an animation sprite.
   *
   * ```js
   * import { Sprite, SpriteSheet } from 'kontra';
   *
   * let spriteSheet = SpriteSheet({
   *   // ...
   *   animations: {
   *     idle: {
   *       frames: 1
   *     },
   *     walk: {
   *       frames: [1,2,3]
   *     }
   *   }
   * });
   *
   * let sprite = Sprite({
   *   x: 100,
   *   y: 200,
   *   animations: spriteSheet.animations
   * });
   *
   * sprite.playAnimation('idle');
   * ```
   * @memberof Sprite
   * @function playAnimation
   *
   * @param {String} name - Name of the animation to play.
   */
  playAnimation(name) {
    this.currentAnimation = this.animations[name];

    if (!this.currentAnimation.loop) {
      this.currentAnimation.reset();
    }
  }

  advance(dt) {
    super.advance(dt);

    if (this.currentAnimation) {
      this.currentAnimation.update(dt);
    }
  }
  // @endif

  draw() {
    // @ifdef SPRITE_IMAGE
    if (this.image) {
      this.context.drawImage(
        this.image,
        0,
        0,
        this.image.width,
        this.image.height
      );
    }
    // @endif

    // @ifdef SPRITE_ANIMATION
    if (this.currentAnimation) {
      this.currentAnimation.render({
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        context: this.context
      });
    }
    // @endif

    if (this.color) {
      this.context.fillStyle = this.color;
      this.context.fillRect(0, 0, this.width, this.height);
    }
  }
}

function factory$8() {
  return new Sprite(...arguments);
}

/**
 * Clear the canvas.
 */
function clear(context) {
  let canvas = context.canvas;
  context.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * The game loop updates and renders the game every frame. The game loop is stopped by default and will not start until the loops `start()` function is called.
 *
 * The game loop uses a time-based animation with a fixed `dt` to [avoid frame rate issues](http://blog.sklambert.com/using-time-based-animation-implement/). Each update call is guaranteed to equal 1/60 of a second.
 *
 * This means that you can avoid having to do time based calculations in your update functions and instead do fixed updates.
 *
 * ```js
 * import { Sprite, GameLoop } from 'kontra';
 *
 * let sprite = Sprite({
 *   x: 100,
 *   y: 200,
 *   width: 20,
 *   height: 40,
 *   color: 'red'
 * });
 *
 * let loop = GameLoop({
 *   update: function(dt) {
 *     // no need to determine how many pixels you want to
 *     // move every second and multiple by dt
 *     // sprite.x += 180 * dt;
 *
 *     // instead just update by how many pixels you want
 *     // to move every frame and the loop will ensure 60FPS
 *     sprite.x += 3;
 *   },
 *   render: function() {
 *     sprite.render();
 *   }
 * });
 *
 * loop.start();
 * ```
 * @class GameLoop
 *
 * @param {Object} properties - Properties of the game loop.
 * @param {(dt: Number) => void} [properties.update] - Function called every frame to update the game. Is passed the fixed `dt` as a parameter.
 * @param {Function} properties.render - Function called every frame to render the game.
 * @param {Number}   [properties.fps=60] - Desired frame rate.
 * @param {Boolean}  [properties.clearCanvas=true] - Clear the canvas every frame before the `render()` function is called.
 * @param {CanvasRenderingContext2D} [properties.context] - The context that should be cleared each frame if `clearContext` is not set to `false`. Defaults to [core.getContext()](api/core#getContext).
 * @param {Boolean} [properties.blur=false] - If the loop should still update and render if the page does not have focus.
 */
function GameLoop({
  fps = 60,
  clearCanvas = true,
  update = noop,
  render,
  context = getContext(),
  blur = false
} = {}) {
  // check for required functions
  // @ifdef DEBUG
  if (!render) {
    throw Error('You must provide a render() function');
  }
  // @endif

  // animation variables
  let accumulator = 0;
  let delta = 1e3 / fps; // delta between performance.now timings (in ms)
  let step = 1 / fps;
  let clearFn = clearCanvas ? clear : noop;
  let last, rAF, now, dt, loop;
  let focused = true;

  if (!blur) {
    window.addEventListener('focus', () => {
      focused = true;
    });
    window.addEventListener('blur', () => {
      focused = false;
    });
  }

  /**
   * Called every frame of the game loop.
   */
  function frame() {
    rAF = requestAnimationFrame(frame);

    // don't update the frame if tab isn't focused
    if (!focused) return;

    now = performance.now();
    dt = now - last;
    last = now;

    // prevent updating the game with a very large dt if the game
    // were to lose focus and then regain focus later
    if (dt > 1e3) {
      return;
    }

    emit('tick');
    accumulator += dt;

    while (accumulator >= delta) {
      loop.update(step);

      accumulator -= delta;
    }

    clearFn(context);
    loop.render();
  }

  // game loop object
  loop = {
    /**
     * Called every frame to update the game. Put all of your games update logic here.
     * @memberof GameLoop
     * @function update
     *
     * @param {Number} [dt] - The fixed dt time of 1/60 of a frame.
     */
    update,

    /**
     * Called every frame to render the game. Put all of your games render logic here.
     * @memberof GameLoop
     * @function render
     */
    render,

    /**
     * If the game loop is currently stopped.
     *
     * ```js
     * import { GameLoop } from 'kontra';
     *
     * let loop = GameLoop({
     *   // ...
     * });
     * console.log(loop.isStopped);  //=> true
     *
     * loop.start();
     * console.log(loop.isStopped);  //=> false
     *
     * loop.stop();
     * console.log(loop.isStopped);  //=> true
     * ```
     * @memberof GameLoop
     * @property {Boolean} isStopped
     */
    isStopped: true,

    /**
     * Start the game loop.
     * @memberof GameLoop
     * @function start
     */
    start() {
      last = performance.now();
      this.isStopped = false;
      requestAnimationFrame(frame);
    },

    /**
     * Stop the game loop.
     * @memberof GameLoop
     * @function stop
     */
    stop() {
      this.isStopped = true;
      cancelAnimationFrame(rAF);
    },

    // expose properties for testing
    // @ifdef DEBUG
    _frame: frame,
    set _last(value) {
      last = value;
    }
    // @endif
  };

  return loop;
}

/**
 * A simple keyboard API. You can use it move the main sprite or respond to a key press.
 *
 * ```js
 * import { initKeys, keyPressed } from 'kontra';
 *
 * // this function must be called first before keyboard
 * // functions will work
 * initKeys();
 *
 * function update() {
 *   if (keyPressed('arrowleft')) {
 *     // move left
 *   }
 * }
 * ```
 * @sectionName Keyboard
 */

/**
 * Below is a list of keys that are provided by default. If you need to extend this list, you can use the [keyMap](api/keyboard#keyMap) property.
 *
 * - a-z
 * - 0-9
 * - enter, esc, space, arrowleft, arrowup, arrowright, arrowdown
 * @sectionName Available Keys
 */

let keydownCallbacks = {};
let keyupCallbacks = {};
let pressedKeys = {};

/**
 * A map of [KeyboardEvent code values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values) to key names. Add to this object to expand the list of [available keys](api/keyboard#available-keys).
 *
 * ```js
 * import { keyMap, onKey } from 'kontra';
 *
 * keyMap['ControlRight'] = 'ctrl';
 *
 * onKey('ctrl', function(e) {
 *   // handle ctrl key
 * });
 * ```
 * @property {{[key in (String|Number)]: String}} keyMap
 */
let keyMap = {
  // named keys
  'Enter': 'enter',
  'Escape': 'esc',
  'Space': 'space',
  'ArrowLeft': 'arrowleft',
  'ArrowUp': 'arrowup',
  'ArrowRight': 'arrowright',
  'ArrowDown': 'arrowdown'
};

/**
 * Call the callback handler of an event.
 * @param {Function} callback
 * @param {KeyboardEvent} evt
 */
function call(callback = noop, evt) {
  if (callback._pd) {
    evt.preventDefault();
  }
  callback(evt);
}

/**
 * Execute a function that corresponds to a keyboard key.
 *
 * @param {KeyboardEvent} evt
 */
function keydownEventHandler(evt) {
  let key = keyMap[evt.code];
  let callback = keydownCallbacks[key];
  pressedKeys[key] = true;
  call(callback, evt);
}

/**
 * Set the released key to not being pressed.
 *
 * @param {KeyboardEvent} evt
 */
function keyupEventHandler(evt) {
  let key = keyMap[evt.code];
  let callback = keyupCallbacks[key];
  pressedKeys[key] = false;
  call(callback, evt);
}

/**
 * Reset pressed keys.
 */
function blurEventHandler() {
  pressedKeys = {};
}

/**
 * Initialize keyboard event listeners. This function must be called before using other keyboard functions.
 * @function initKeys
 */
function initKeys() {
  let i;

  // alpha keys
  // @see https://stackoverflow.com/a/43095772/2124254
  for (i = 0; i < 26; i++) {
    // rollupjs considers this a side-effect (for now), so we'll do it
    // in the initKeys function
    keyMap['Key' + String.fromCharCode(i + 65)] = String.fromCharCode(
      i + 97
    );
  }

  // numeric keys
  for (i = 0; i < 10; i++) {
    keyMap['Digit' + i] = keyMap['Numpad' + i] = '' + i;
  }

  window.addEventListener('keydown', keydownEventHandler);
  window.addEventListener('keyup', keyupEventHandler);
  window.addEventListener('blur', blurEventHandler);
}

/**
 * Check if a key is currently pressed. Use during an `update()` function to perform actions each frame.
 *
 * ```js
 * import { Sprite, initKeys, keyPressed } from 'kontra';
 *
 * initKeys();
 *
 * let sprite = Sprite({
 *   update: function() {
 *     if (keyPressed('arrowleft')){
 *       // left arrow pressed
 *     }
 *     else if (keyPressed('arrowright')) {
 *       // right arrow pressed
 *     }
 *
 *     if (keyPressed('arrowup')) {
 *       // up arrow pressed
 *     }
 *     else if (keyPressed('arrowdown')) {
 *       // down arrow pressed
 *     }
 *   }
 * });
 * ```
 * @function keyPressed
 *
 * @param {String} key - Key to check for pressed state.
 *
 * @returns {Boolean} `true` if the key is pressed, `false` otherwise.
 */
function keyPressed(key) {
  return !!pressedKeys[key];
}

/**
 * Parse a string of consecutive frames.
 *
 * @param {Number|String} frames - Start and end frame.
 *
 * @returns {Number|Number[]} List of frames.
 */
function parseFrames(consecutiveFrames) {
  // return a single number frame
  // @see https://github.com/jed/140bytes/wiki/Byte-saving-techniques#coercion-to-test-for-types
  if (+consecutiveFrames == consecutiveFrames) {
    return consecutiveFrames;
  }

  let sequence = [];
  let frames = consecutiveFrames.split('..');

  // coerce string to number
  // @see https://github.com/jed/140bytes/wiki/Byte-saving-techniques#coercion-to-test-for-types
  let start = +frames[0];
  let end = +frames[1];
  let i = start;

  // ascending frame order
  if (start < end) {
    for (; i <= end; i++) {
      sequence.push(i);
    }
  }
  // descending order
  else {
    for (; i >= end; i--) {
      sequence.push(i);
    }
  }

  return sequence;
}

/**
 * A sprite sheet to animate a sequence of images. Used to create [animation sprites](api/sprite#animation-sprite).
 *
 * <figure>
 *   <a href="assets/imgs/character_walk_sheet.png">
 *     <img src="assets/imgs/character_walk_sheet.png" width="266" height="512" alt="11 frames of a walking pill-like alien wearing a space helmet.">
 *   </a>
 *   <figcaption>Sprite sheet image courtesy of <a href="https://kenney.nl/assets">Kenney</a>.</figcaption>
 * </figure>
 *
 * Typically you create a sprite sheet just to create animations and then use the animations for your sprite.
 *
 * ```js
 * import { Sprite, SpriteSheet } from 'kontra';
 *
 * let image = new Image();
 * image.src = 'assets/imgs/character_walk_sheet.png';
 * image.onload = function() {
 *   let spriteSheet = SpriteSheet({
 *     image: image,
 *     frameWidth: 72,
 *     frameHeight: 97,
 *     animations: {
 *       // create a named animation: walk
 *       walk: {
 *         frames: '0..9',  // frames 0 through 9
 *         frameRate: 30
 *       }
 *     }
 *   });
 *
 *   let sprite = Sprite({
 *     x: 200,
 *     y: 100,
 *
 *     // use the sprite sheet animations for the sprite
 *     animations: spriteSheet.animations
 *   });
 * };
 * ```
 * @class SpriteSheet
 *
 * @param {Object} properties - Properties of the sprite sheet.
 * @param {HTMLImageElement|HTMLCanvasElement} properties.image - The sprite sheet image.
 * @param {Number} properties.frameWidth - The width of a single frame.
 * @param {Number} properties.frameHeight - The height of a single frame.
 * @param {Number} [properties.frameMargin=0] - The amount of whitespace between each frame.
 * @param {Object} [properties.animations] - Animations to create from the sprite sheet using [Animation](api/animation). Passed directly into the sprite sheets [createAnimations()](api/spriteSheet#createAnimations) function.
 */
class SpriteSheet {
  constructor({
    image,
    frameWidth,
    frameHeight,
    frameMargin,
    animations
  } = {}) {
    // @ifdef DEBUG
    if (!image) {
      throw Error('You must provide an Image for the SpriteSheet');
    }
    // @endif

    /**
     * An object of named [Animation](api/animation) objects. Typically you pass this object into [Sprite](api/sprite) to create an [animation sprites](api/spriteSheet#animation-sprite).
     * @memberof SpriteSheet
     * @property {{[name: String] : Animation}} animations
     */
    this.animations = {};

    /**
     * The sprite sheet image.
     * @memberof SpriteSheet
     * @property {HTMLImageElement|HTMLCanvasElement} image
     */
    this.image = image;

    /**
     * An object that defines properties of a single frame in the sprite sheet. It has properties of `width`, `height`, and `margin`.
     *
     * `width` and `height` are the width of a single frame, while `margin` defines the amount of whitespace between each frame.
     * @memberof SpriteSheet
     * @property {{width: Number, height: Number, margin: Number}} frame
     */
    this.frame = {
      width: frameWidth,
      height: frameHeight,
      margin: frameMargin
    };

    // f = framesPerRow
    this._f = (image.width / frameWidth) | 0;

    this.createAnimations(animations);
  }

  /**
   * Create named animations from the sprite sheet. Called from the constructor if the `animations` argument is passed.
   *
   * This function populates the sprite sheets `animations` property with [Animation](api/animation) objects. Each animation is accessible by its name.
   *
   * ```js
   * import { Sprite, SpriteSheet } from 'kontra';
   *
   * let image = new Image();
   * image.src = 'assets/imgs/character_walk_sheet.png';
   * image.onload = function() {
   *
   *   let spriteSheet = SpriteSheet({
   *     image: image,
   *     frameWidth: 72,
   *     frameHeight: 97,
   *
   *     // this will also call createAnimations()
   *     animations: {
   *       // create 1 animation: idle
   *       idle: {
   *         // a single frame
   *         frames: 1
   *       }
   *     }
   *   });
   *
   *   spriteSheet.createAnimations({
   *     // create 4 animations: jump, walk, moonWalk, attack
   *     jump: {
   *       // sequence of frames (can be non-consecutive)
   *       frames: [1, 10, 1],
   *       frameRate: 10,
   *       loop: false,
   *     },
   *     walk: {
   *       // ascending consecutive frame animation (frames 2-6, inclusive)
   *       frames: '2..6',
   *       frameRate: 20
   *     },
   *     moonWalk: {
   *       // descending consecutive frame animation (frames 6-2, inclusive)
   *       frames: '6..2',
   *       frameRate: 20
   *     },
   *     attack: {
   *       // you can also mix and match, in this case frames [8,9,10,13,10,9,8]
   *       frames: ['8..10', 13, '10..8'],
   *       frameRate: 10,
   *       loop: false,
   *     }
   *   });
   * };
   * ```
   * @memberof SpriteSheet
   * @function createAnimations
   *
   * @param {Object} animations - Object of named animations to create from the sprite sheet.
   * @param {Number|String|Number[]|String[]} animations.<name>.frames - The sequence of frames to use from the sprite sheet. It can either be a single frame (`1`), a sequence of frames (`[1,2,3,4]`), or a consecutive frame notation (`'1..4'`). Sprite sheet frames are `0` indexed.
   * @param {Number} animations.<name>.frameRate - The number frames to display per second.
   * @param {Boolean} [animations.<name>.loop=true] - If the animation should loop back to the beginning once completed.
   */
  createAnimations(animations) {
    let sequence, name;

    for (name in animations) {
      let { frames, frameRate, loop } = animations[name];

      // array that holds the order of the animation
      sequence = [];

      // @ifdef DEBUG
      if (frames == undefined) {
        throw Error(
          'Animation ' + name + ' must provide a frames property'
        );
      }
      // @endif

      // add new frames to the end of the array
      [].concat(frames).map(frame => {
        sequence = sequence.concat(parseFrames(frame));
      });

      this.animations[name] = factory$b({
        spriteSheet: this,
        frames: sequence,
        frameRate,
        loop
      });
    }
  }
}

function factory$1() {
  return new SpriteSheet(...arguments);
}

/**
 * Get the row from the y coordinate.
 * @private
 *
 * @param {Number} y - Y coordinate.
 * @param {Number} tileheight - Height of a single tile (in pixels).
 *
 * @return {Number}
 */
function getRow(y, tileheight) {
  return (y / tileheight) | 0;
}

/**
 * Get the col from the x coordinate.
 * @private
 *
 * @param {Number} x - X coordinate.
 * @param {Number} tilewidth - Width of a single tile (in pixels).
 *
 * @return {Number}
 */
function getCol(x, tilewidth) {
  return (x / tilewidth) | 0;
}

/**
 * A tile engine for managing and drawing tilesets.
 *
 * <figure>
 *   <a href="assets/imgs/mapPack_tilesheet.png">
 *     <img src="assets/imgs/mapPack_tilesheet.png" width="1088" height="768" alt="Tileset to create an overworld map in various seasons.">
 *   </a>
 *   <figcaption>Tileset image courtesy of <a href="https://kenney.nl/assets">Kenney</a>.</figcaption>
 * </figure>
 * @class TileEngine
 *
 * @param {Object} properties - Properties of the tile engine.
 * @param {Number} properties.width - Width of the tile map (in number of tiles).
 * @param {Number} properties.height - Height of the tile map (in number of tiles).
 * @param {Number} properties.tilewidth - Width of a single tile (in pixels).
 * @param {Number} properties.tileheight - Height of a single tile (in pixels).
 * @param {CanvasRenderingContext2D} [properties.context] - The context the tile engine should draw to. Defaults to [core.getContext()](api/core#getContext)
 *
 * @param {Object[]} properties.tilesets - Array of tileset objects.
 * @param {Number} properties.<tilesetN>.firstgid - First tile index of the tileset. The first tileset will have a firstgid of 1 as 0 represents an empty tile.
 * @param {String|HTMLImageElement} properties.<tilesetN>.image - Relative path to the HTMLImageElement or an HTMLImageElement. If passing a relative path, the image file must have been [loaded](api/assets#load) first.
 * @param {Number} [properties.<tilesetN>.margin=0] - The amount of whitespace between each tile (in pixels).
 * @param {Number} [properties.<tilesetN>.tilewidth] - Width of the tileset (in pixels). Defaults to properties.tilewidth.
 * @param {Number} [properties.<tilesetN>.tileheight] - Height of the tileset (in pixels). Defaults to properties.tileheight.
 * @param {String} [properties.<tilesetN>.source] - Relative path to the source JSON file. The source JSON file must have been [loaded](api/assets#load) first.
 * @param {Number} [properties.<tilesetN>.columns] - Number of columns in the tileset image.
 *
 * @param {Object[]} properties.layers - Array of layer objects.
 * @param {String} properties.<layerN>.name - Unique name of the layer.
 * @param {Number[]} properties.<layerN>.data - 1D array of tile indices.
 * @param {Boolean} [properties.<layerN>.visible=true] - If the layer should be drawn or not.
 * @param {Number} [properties.<layerN>.opacity=1] - Percent opacity of the layer.
 */

/**
 * @docs docs/api_docs/tileEngine.js
 */
class TileEngine {
  constructor(properties = {}) {
    let {
      /**
       * The width of tile map (in tiles).
       * @memberof TileEngine
       * @property {Number} width
       */
      width,

      /**
       * The height of tile map (in tiles).
       * @memberof TileEngine
       * @property {Number} height
       */
      height,

      /**
       * The width a tile (in pixels).
       * @memberof TileEngine
       * @property {Number} tilewidth
       */
      tilewidth,

      /**
       * The height of a tile (in pixels).
       * @memberof TileEngine
       * @property {Number} tileheight
       */
      tileheight,

      /**
       * Array of all tilesets of the tile engine.
       * @memberof TileEngine
       * @property {Object[]} tilesets
       */
      tilesets

      /**
       * The context the tile engine will draw to.
       * @memberof TileEngine
       * @property {CanvasRenderingContext2D} context
       */
    } = properties;
    let mapwidth = width * tilewidth;
    let mapheight = height * tileheight;

    // create an off-screen canvas for pre-rendering the map
    // @see http://jsperf.com/render-vs-prerender
    let canvas = document.createElement('canvas');
    canvas.width = mapwidth;
    canvas.height = mapheight;

    // c = canvas, ctx = context
    this._c = canvas;
    this._ctx = canvas.getContext('2d');

    // @ifdef TILEENGINE_TILED
    // resolve linked files (source, image)
    tilesets.map(tileset => {
      // get the url of the Tiled JSON object (in this case, the
      // properties object)
      let { __k, location } = window;
      let url = (__k ? __k.dm.get(properties) : '') || location.href;

      let { source } = tileset;
      if (source) {
        // @ifdef DEBUG
        if (!__k) {
          throw Error(
            `You must use "load" or "loadData" to resolve tileset.source`
          );
        }
        // @endif

        let resolvedSorce = __k.d[__k.u(source, url)];

        // @ifdef DEBUG
        if (!resolvedSorce) {
          throw Error(
            `You must load the tileset source "${source}" before loading the tileset`
          );
        }
        // @endif

        Object.keys(resolvedSorce).map(key => {
          tileset[key] = resolvedSorce[key];
        });
      }

      let { image } = tileset;
      /* eslint-disable-next-line no-restricted-syntax */
      if ('' + image === image) {
        // @ifdef DEBUG
        if (!__k) {
          throw Error(
            `You must use "load" or "loadImage" to resolve tileset.image`
          );
        }
        // @endif

        let resolvedImage = __k.i[__k.u(image, url)];

        // @ifdef DEBUG
        if (!resolvedImage) {
          throw Error(
            `You must load the image "${image}" before loading the tileset`
          );
        }
        // @endif

        tileset.image = resolvedImage;
      }
    });
    // @endif

    // add all properties to the object, overriding any defaults
    Object.assign(this, {
      context: getContext(),
      layerMap: {},
      layerCanvases: {},

      /**
       * The width of the tile map (in pixels).
       * @memberof TileEngine
       * @property {Number} mapwidth
       */
      mapwidth,

      /**
       * The height of the tile map (in pixels).
       * @memberof TileEngine
       * @property {Number} mapheight
       */
      mapheight,

      // @ifdef TILEENGINE_CAMERA
      _sx: 0,
      _sy: 0,
      // o = objects
      _o: [],
      // @endif

      /**
       * Array of all layers of the tile engine.
       * @memberof TileEngine
       * @property {Object[]} layers
       */
      ...properties
    });

    // p = prerender
    this._p();
  }

  // @ifdef TILEENGINE_CAMERA
  /**
   * X coordinate of the tile map camera.
   * @memberof TileEngine
   * @property {Number} sx
   */
  get sx() {
    return this._sx;
  }

  /**
   * Y coordinate of the tile map camera.
   * @memberof TileEngine
   * @property {Number} sy
   */
  get sy() {
    return this._sy;
  }

  // when clipping an image, sx and sy must be within the image
  // region, otherwise. Firefox and Safari won't draw it.
  // @see http://stackoverflow.com/questions/19338032/canvas-indexsizeerror-index-or-size-is-negative-or-greater-than-the-allowed-a
  set sx(value) {
    this._sx = clamp(0, this.mapwidth - getCanvas().width, value);
  }

  set sy(value) {
    this._sy = clamp(0, this.mapheight - getCanvas().height, value);
  }

  set objects(value) {
    this.remove(this._o);
    this.add(value);
  }

  get objects() {
    return this._o;
  }

  /**
   * Add an object to the tile engine.
   * @memberof TileEngine
   * @function add
   *
   * @param {...(Object|Object[])[]} objects - Object to add to the tile engine. Can be a single object, an array of objects, or a comma-separated list of objects.
   */
  add(...objects) {
    objects.flat().map(object => {
      this._o.push(object);
    });
  }

  /**
   * Remove an object from the tile engine.
   * @memberof TileEngine
   * @function remove
   *
   * @param {...(Object|Object[])[]} objects - Object to remove from the tile engine. Can be a single object, an array of objects, or a comma-separated list of objects.
   */
  remove(...objects) {
    objects.flat().map(object => {
      removeFromArray(this._o, object);
    });
  }
  // @endif

  // @ifdef TILEENGINE_DYNAMIC
  /**
   * Set the tile at the specified layer using either x and y coordinates or row and column coordinates.
   *
   * ```js
   * import { TileEngine } from 'kontra';
   *
   * let tileEngine = TileEngine({
   *   tilewidth: 32,
   *   tileheight: 32,
   *   width: 4,
   *   height: 4,
   *   tilesets: [{
   *     // ...
   *   }],
   *   layers: [{
   *     name: 'collision',
   *     data: [ 0,0,0,0,
   *             0,1,4,0,
   *             0,2,5,0,
   *             0,0,0,0 ]
   *   }]
   * });
   *
   * tileEngine.setTileAtLayer('collision', {row: 2, col: 1}, 10);
   * tileEngine.tileAtLayer('collision', {row: 2, col: 1});  //=> 10
   * ```
   * @memberof TileEngine
   * @function setTileAtLayer
   *
   * @param {String} name - Name of the layer.
   * @param {{x: Number, y: Number}|{row: Number, col: Number}} position - Position of the tile in either {x, y} or {row, col} coordinates.
   * @param {Number} tile - Tile index to set.
   */
  setTileAtLayer(name, position, tile) {
    let { layerMap, tileheight, tilewidth, width } = this;
    let { row, col, x, y } = position;

    let tileRow = row ?? getRow(y, tileheight);
    let tileCol = col ?? getCol(x, tilewidth);

    if (layerMap[name]) {
      this._d = true;
      layerMap[name]._d = true;
      layerMap[name].data[tileRow * width + tileCol] = tile;
    }
  }

  /**
   * Set the data at the specified layer.
   *
   * ```js
   * import { TileEngine } from 'kontra';
   *
   * let tileEngine = TileEngine({
   *   tilewidth: 32,
   *   tileheight: 32,
   *   width: 2,
   *   height: 2,
   *   tilesets: [{
   *     // ...
   *   }],
   *   layers: [{
   *     name: 'collision',
   *     data: [ 0,1,
   *             2,3 ]
   *   }]
   * });
   *
   * tileEngine.setLayer('collision', [ 4,5,6,7]);
   * tileEngine.tileAtLayer('collision', {row: 0, col: 0});  //=> 4
   * tileEngine.tileAtLayer('collision', {row: 0, col: 1});  //=> 5
   * tileEngine.tileAtLayer('collision', {row: 1, col: 0});  //=> 6
   * tileEngine.tileAtLayer('collision', {row: 1, col: 1});  //=> 7
   * ```
   *
   * @memberof TileEngine
   * @function setLayer
   *
   * @param {String} name - Name of the layer.
   * @param {Number[]} data - 1D array of tile indices.
   */
  setLayer(name, data) {
    let { layerMap } = this;
    if (layerMap[name]) {
      this._d = true;
      layerMap[name]._d = true;
      layerMap[name].data = data;
    }
  }
  // @endif

  // @ifdef TILEENGINE_QUERY
  /**
   * Check if the object collides with the layer (shares a gird coordinate with any positive tile index in layers data). The object being checked must have the properties `x`, `y`, `width`, and `height` so that its position in the grid can be calculated. [Sprite](api/sprite) defines these properties for you.
   *
   * ```js
   * import { TileEngine, Sprite } from 'kontra';
   *
   * let tileEngine = TileEngine({
   *   tilewidth: 32,
   *   tileheight: 32,
   *   width: 4,
   *   height: 4,
   *   tilesets: [{
   *     // ...
   *   }],
   *   layers: [{
   *     name: 'collision',
   *     data: [ 0,0,0,0,
   *             0,1,4,0,
   *             0,2,5,0,
   *             0,0,0,0 ]
   *   }]
   * });
   *
   * let sprite = Sprite({
   *   x: 50,
   *   y: 20,
   *   width: 5,
   *   height: 5
   * });
   *
   * tileEngine.layerCollidesWith('collision', sprite);  //=> false
   *
   * sprite.y = 28;
   *
   * tileEngine.layerCollidesWith('collision', sprite);  //=> true
   * ```
   * @memberof TileEngine
   * @function layerCollidesWith
   *
   * @param {String} name - The name of the layer to check for collision.
   * @param {Object} object - Object to check collision against.
   *
   * @returns {Boolean} `true` if the object collides with a tile, `false` otherwise.
   */
  layerCollidesWith(name, object) {
    let { tilewidth, tileheight, layerMap } = this;
    let { x, y, width, height } = getWorldRect(object);

    let row = getRow(y, tileheight);
    let col = getCol(x, tilewidth);
    let endRow = getRow(y + height, tileheight);
    let endCol = getCol(x + width, tilewidth);

    let layer = layerMap[name];

    // check all tiles
    for (let r = row; r <= endRow; r++) {
      for (let c = col; c <= endCol; c++) {
        if (layer.data[c + r * this.width]) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the tile at the specified layer using either x and y coordinates or row and column coordinates.
   *
   * ```js
   * import { TileEngine } from 'kontra';
   *
   * let tileEngine = TileEngine({
   *   tilewidth: 32,
   *   tileheight: 32,
   *   width: 4,
   *   height: 4,
   *   tilesets: [{
   *     // ...
   *   }],
   *   layers: [{
   *     name: 'collision',
   *     data: [ 0,0,0,0,
   *             0,1,4,0,
   *             0,2,5,0,
   *             0,0,0,0 ]
   *   }]
   * });
   *
   * tileEngine.tileAtLayer('collision', {x: 50, y: 50});  //=> 1
   * tileEngine.tileAtLayer('collision', {row: 2, col: 1});  //=> 2
   * ```
   * @memberof TileEngine
   * @function tileAtLayer
   *
   * @param {String} name - Name of the layer.
   * @param {{x: Number, y: Number}|{row: Number, col: Number}} position - Position of the tile in either {x, y} or {row, col} coordinates.
   *
   * @returns {Number} The tile index. Will return `-1` if no layer exists by the provided name.
   */
  tileAtLayer(name, position) {
    let { layerMap, tileheight, tilewidth, width } = this;
    let { row, col, x, y } = position;

    let tileRow = row ?? getRow(y, tileheight);
    let tileCol = col ?? getCol(x, tilewidth);

    if (layerMap[name]) {
      return layerMap[name].data[tileRow * width + tileCol];
    }

    return -1;
  }
  // @endif

  /**
   * Render all visible layers.
   * @memberof TileEngine
   * @function render
   */
  render(_canvas = this._c, _renderObjects = true) {
    let { _d, context, sx = 0, sy = 0 } = this;

    if (_d) {
      this._p();
    }

    let { width, height } = getCanvas();
    let sWidth = Math.min(_canvas.width, width);
    let sHeight = Math.min(_canvas.height, height);

    context.drawImage(
      _canvas,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      sWidth,
      sHeight
    );

    // @ifdef TILEENGINE_CAMERA
    // draw objects
    if (_renderObjects) {
      context.save();

      // it's faster to only translate if one of the values is
      // non-zero rather than always translating
      // @see https://jsperf.com/translate-or-if-statement/2
      if (sx || sy) {
        context.translate(-sx, -sy);
      }

      this.objects.map(obj => obj.render && obj.render());

      context.restore();
    }
    // @endif
  }

  /**
   * Render a specific layer by name.
   * @memberof TileEngine
   * @function renderLayer
   *
   * @param {String} name - Name of the layer to render.
   */
  renderLayer(name) {
    let { layerCanvases, layerMap } = this;
    let layer = layerMap[name];
    let canvas = layerCanvases[name];
    let context = canvas?.getContext('2d');

    if (!canvas) {
      // cache the rendered layer so we can render it again without
      // redrawing all tiles
      let { mapwidth, mapheight } = this;
      canvas = document.createElement('canvas');
      context = canvas.getContext('2d');
      canvas.width = mapwidth;
      canvas.height = mapheight;

      layerCanvases[name] = canvas;
      this._r(layer, context);
    }

    // @ifdef TILEENGINE_DYNAMIC
    if (layer._d) {
      layer._d = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      this._r(layer, context);
    }
    // @endif

    this.render(canvas, false);
  }

  /**
   * Pre-render the tiles to make drawing fast.
   */
  _p() {
    let { _ctx, layers = [], layerMap } = this;

    // d = dirty
    this._d = false;

    layers.map(layer => {
      let { name, data, visible } = layer;
      layer._d = false;
      layerMap[name] = layer;

      if (data && visible != false) {
        this._r(layer, _ctx);
      }
    });
  }

  /**
   * Render a layer.
   *
   * @param {Object} layer - Layer data.
   * @param {Context} context - Context to draw layer to.
   */
  _r(layer, context) {
    let { opacity, data = [] } = layer;
    let { tilesets, width, tilewidth, tileheight } = this;

    context.save();
    context.globalAlpha = opacity;

    data.map((tile, index) => {
      // skip empty tiles (0)
      if (!tile) return;

      // find the tileset the tile belongs to
      // assume tilesets are ordered by firstgid
      let tileset;
      for (let i = tilesets.length - 1; i >= 0; i--) {
        tileset = tilesets[i];

        if (tile / tileset.firstgid >= 1) {
          break;
        }
      }

      let { image, margin = 0, firstgid, columns } = tileset;
      let offset = tile - firstgid;
      let cols = columns ?? (image.width / (tilewidth + margin)) | 0;

      let x = (index % width) * tilewidth;
      let y = ((index / width) | 0) * tileheight;
      let sx = (offset % cols) * (tilewidth + margin);
      let sy = ((offset / cols) | 0) * (tileheight + margin);

      context.drawImage(
        image,
        sx,
        sy,
        tilewidth,
        tileheight,
        x,
        y,
        tilewidth,
        tileheight
      );
    });

    context.restore();
  }
}

function factory() {
  return new TileEngine(...arguments);
}

function log(...args) {
}

/**
 * The event fired by the Socket instance on connection.
 * @const {string}
 */
/**
 * The event fired by the Socket instance upon disconnection.
 * See: https://socket.io/docs/v4/server-socket-instance/#disconnect
 * @const {string}
 */
const NETWORK_EVENT_DISCONNECT = "disconnect";
/**
 * Our custom event fired on every client or server update.
 * @const {string}
 */
const NETWORK_EVENT_UPDATE = "u";

const ENTITY_TYPE_PLAYER = 1;

// const WIDTH = 1920;
// const HEIGHT = 1080;
function initClient() {
    let tileEngine;
    let sprite;
    // Initialize the websocket to the server
    const socket = io({ upgrade: false, transports: ["websocket"] });
    // Initialize Kontra
    const { context } = init$1();
    // Load the graphics
    const image = new Image();
    image.src = "i.png";
    image.onload = function () {
        tileEngine = factory({
            // tile size
            tilewidth: 8,
            tileheight: 8,
            // map size in tiles
            width: 8,
            height: 8,
            // tileset object
            tilesets: [
                {
                    firstgid: 1,
                    image,
                },
            ],
            // layer object
            layers: [
                {
                    name: "ground",
                    data: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 7, 8, 0, 0, 0, 0, 6, 27, 24,
                        24, 25, 0, 0, 0, 0, 23, 24, 24, 24, 26, 8, 0, 0, 0, 23, 24, 24, 24,
                        24, 26, 8, 0, 0, 23, 24, 24, 24, 24, 24, 25, 0, 0, 40, 41, 41, 10,
                        24, 24, 25, 0, 0, 0, 0, 0, 40, 41, 41, 42, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0,
                    ],
                },
            ],
        });
        const spriteSheet = factory$1({
            image,
            frameWidth: 8,
            frameHeight: 8,
            animations: {
                walk: {
                    frames: "0..3",
                    frameRate: 30,
                },
            },
        });
        sprite = factory$8({
            x: 300,
            y: 100,
            width: 8,
            height: 8,
            // frame
            anchor: { x: 0.5, y: 0.5 },
            image,
            animations: spriteSheet.animations,
        });
    };
    // // Initialize the canvas
    // const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    // const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    // Initialize the player
    const player = {
        entityId: 0,
        entityType: ENTITY_TYPE_PLAYER,
        x: 0,
        y: 0,
    };
    let gameState = undefined;
    socket.on(NETWORK_EVENT_UPDATE, (data) => {
        if (!data || data.entities === undefined) {
            return;
        }
        gameState = data;
        socket.emit(NETWORK_EVENT_UPDATE, player);
    });
    initKeys();
    // function render(now: number): void {
    //   if (keyPressed("arrowleft")) {
    //     player.x--;
    //   } else if (keyPressed("arrowright")) {
    //     player.x++;
    //   }
    //   if (keyPressed("arrowup")) {
    //     player.y--;
    //   } else if (keyPressed("arrowdown")) {
    //     player.y++;
    //   }
    //   context.fillStyle = "black";
    //   context.fillRect(0, 0, WIDTH, HEIGHT);
    //   context.fillStyle = "white";
    //   context.fillText("Time: " + now.toFixed(1), 10, 10);
    //   if (gameState) {
    //     context.fillText("Entities: " + gameState.entities.length, 10, 30);
    //     gameState.entities.forEach((entity) => {
    //       context.fillStyle = "white";
    //       context.fillRect(entity.x, entity.y, 10, 10);
    //     });
    //   } else {
    //     context.fillText("Waiting for server...", 10, 30);
    //   }
    //   if (player) {
    //     context.fillText(`Player: ${player.x}, ${player.y}`, 10, 50);
    //   } else {
    //     context.fillText(`Player not found (${gameState?.currentEntityId})`, 10, 50);
    //   }
    //   requestAnimationFrame(render);
    // }
    // requestAnimationFrame(render);
    const loop = GameLoop({
        update: () => {
            if (keyPressed("arrowleft")) {
                player.x--;
            }
            else if (keyPressed("arrowright")) {
                player.x++;
            }
            if (keyPressed("arrowup")) {
                player.y--;
            }
            else if (keyPressed("arrowdown")) {
                player.y++;
            }
            if (sprite) {
                sprite.update();
            }
        },
        render: () => {
            if (tileEngine) {
                tileEngine.render();
            }
            if (sprite) {
                sprite.x = player.x;
                sprite.y = player.y;
                // sprite.width = 8;
                // sprite.height = 8;
                sprite.render();
            }
            // context.fillStyle = "black";
            // context.fillRect(0, 0, WIDTH, HEIGHT);
            context.fillStyle = "white";
            // context.fillText("Time: " + now.toFixed(1), 10, 10);
            if (gameState) {
                context.fillText("Entities: " + gameState.entities.length, 10, 30);
                gameState.entities.forEach((entity) => {
                    context.fillStyle = "white";
                    context.fillRect(entity.x, entity.y, 10, 10);
                });
            }
            else {
                context.fillText("Waiting for server...", 10, 30);
            }
            if (player) {
                context.fillText(`Player: ${player.x}, ${player.y}`, 10, 50);
            }
            else {
                context.fillText(`Player not found (${gameState === null || gameState === void 0 ? void 0 : gameState.currentEntityId})`, 10, 50);
            }
        },
    });
    loop.start();
}

/**
 * Removes an element from the array.
 * @param {!Array} array
 * @param {!Object} element
 */
function removeElement(array, element) {
    array.splice(array.indexOf(element), 1);
}

function initServer() {
    const users = [];
    const gameState = {
        entities: [],
        events: [],
    };
    let nextEntityId = 1;
    module.exports = (socket) => {
        const entity = {
            entityId: nextEntityId++,
            entityType: ENTITY_TYPE_PLAYER,
            x: 0,
            y: 0,
        };
        gameState.entities.push(entity);
        const user = { socket, entity, events: [] };
        users.push(user);
        socket.on(NETWORK_EVENT_DISCONNECT, () => {
            log("Disconnected: " + socket.id);
            removeElement(users, user);
            removeElement(gameState.entities, entity);
        });
        socket.on(NETWORK_EVENT_UPDATE, (data) => {
            if (!data || data.x === undefined || data.y === undefined) {
                return;
            }
            entity.x = data.x;
            entity.y = data.y;
            entity.dx = data.dx;
            entity.dy = data.dy;
            sendUpdate();
        });
        function sendUpdate() {
            socket.emit(NETWORK_EVENT_UPDATE, {
                ...gameState,
                currentEntityId: entity.entityId,
                events: user.events,
            });
            user.events.length = 0;
        }
        sendUpdate();
        log(`Connected: socket=${socket.id}, entity=${entity.entityId}`);
    };
}

if (typeof module !== "undefined") {
    initServer();
}
else {
    initClient();
}
