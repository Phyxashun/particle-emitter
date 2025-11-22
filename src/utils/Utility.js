//import Logger from './Logger.js';
//import TopologicalSort from './TopologicalSort.js';
import Vector from './Utility';

export default class Utility {
    static #seed = 0;

    static #seededRandom = () => {
        // https://en.wikipedia.org/wiki/Linear_congruential_generator
        Utility.#seed = (Utility.#seed * 9301 + 49297) % 233280;
        return Utility.#seed / 233280;
    };

    static get = (obj, path, begin = 0, end) => {
        const pathParts = path.split('.').slice(begin, end);
        return pathParts.reduce(
            (current, key) => current?.hasOwnProperty(key) ?
                current[key] : undefined, obj
        );
    };

    static set = (obj, path, val, begin = 0, end) => {
        const parts = path.split('.').slice(begin, end);
        const parent = parts.slice(0, -1).reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        parent[parts[parts.length - 1]] = val;
        return val;
    };

    static chain = (...funcs) => {
        const flatten = (arr) => arr.flatMap(func => func._chained || func);
        const flattenedFuncs = flatten(funcs);

        const newChain = (...args) => {
            let lastResult;
            for (const func of flattenedFuncs) {
                const result = func.apply(this, args);
                if (typeof result !== 'undefined') lastResult = result;
            }
            return lastResult;
        };
        newChain._chained = flattenedFuncs;
        return newChain;
    };

    static chainPath = (base, path, func, before = false) => {
        const originalFunc = Utility.get(base, path);
        return Utility.set(
            base,
            path,
            before ? Utility.chain(func, originalFunc) :
                Utility.chain(originalFunc, func)
        );
    };

    static chainPathAfter = (base, path, func) => {
        return Utility.set(
            base,
            path,
            Utility.chain(Utility.get(base, path), func)
        );
    };

    static chainPathBefore = (base, path, func) => {
        return Utility.set(
            base,
            path,
            Utility.chain(func, Utility.get(base, path))
        );
    };

    static choose = (options) => options[Math.floor(
        Utility.random() * options.length)];

    static clamp = (value, min, max) => Math.min(Math.max(value,
        min), max);

    static clone = (obj, deep = false) => {
        if (deep && typeof structuredClone === 'function') {
            return structuredClone(obj);
        } else if (deep) {
            return Utility.extend({}, true, obj);
        } else {
            return {
                ...obj
            };
        }
    };

    static constrain = (value, min, max) => Math.max(Math.min(
        value, max), min);

    static deprecated = (obj, prop, warning, loggerInstance =
        Utility.logger) => {
        const originalFunction = obj[prop];
        if (typeof originalFunction !== 'function') {
            loggerInstance.warn(`Could not deprecate '${prop}' as
it is not a function.` );
            return;
        }
        obj[prop] = function (...args) {
            loggerInstance.warnOnce('⭐⭐⭐ DEPRECATED ⭐⭐⭐', warning);
            return originalFunction.apply(this, args);
        };
    };

    static eulerUpdate = (p, dt) => {
        const oldPosition = p.position.clone();
        const newPosition = p.position.clone();

        //newPosition.add( p.velocity.multiply( dt ) );
        newPosition.add(p.velocity);
        p.applyForce(p.options.gravity);
        p.velocity.add(p.acceleration.multiply(dt * dt));
        p.acceleration.multiply(0);

        return { newPosition: newPosition, oldPosition: oldPosition };
    };

    static extend = (target, deep = true, ...sources) => {
        if (deep && typeof structuredClone === 'function') {
            for (const source of sources) {
                if (source && typeof source === 'object') {
                    for (const key of Object.keys(source)) {
                        target[key] = structuredClone(source[key]);
                    }
                }
            }
        } else {
            for (const source of sources) {
                if (source && typeof source === 'object') {
                    for (const key of Object.keys(source)) {
                        if (deep && source[key] && typeof source[
                            key] === 'object' && typeof source[key] !== 'function') {
                            if (!target[key] || typeof target[key
                            ] !== 'object') {
                                target[key] = Array.isArray(source[
                                    key]) ? [] : {};
                            }
                            Utility.extend(target[key], deep,
                                source[key]);
                        } else {
                            target[key] = source[key];
                        }
                    }
                }
            }
        }
        return target;
    };

    static indexOf = (haystack, needle) => haystack.indexOf(needle);

    static isArray = (arr, length) => {
        return (!Array.isArray(arr)) ? false :
            (length !== undefined && arr.length !== length) ? false :
                (!arr.every(Utility.isNumber)) ? false : true;
    };

    static isElement = (el) => el instanceof HTMLElement;

    static isFunction = (obj) => typeof obj === 'function';

    static isNumber = (n) => typeof n === 'number' && !Number.isNaN(
        n) && Number.isFinite(n);

    static isObject = (obj) => {
        if (obj === null || typeof obj !== 'object') {
            return false;
        }
        const proto = Object.getPrototypeOf(obj);
        return proto === null || proto === Object.prototype;
    };

    static isString = (obj) => typeof obj === 'string';

    static isVector = (v) => v instanceof Vector;

    static length = 0;

    static logger = new Logger();

    static name = "Utility";

    static nextId = (() => {
        let counter = 0;
        return (prefix = '') => `${prefix}${counter++}`;
    })();

    static now = () => {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        return Date.now();
    };

    // PROTOTYPE

    static randNeg = (num) => {
        return Utility.random(-num, num);
    };

    static random = (min, max) => {
        min = (typeof min !== "undefined") ? min : 0;
        max = (typeof max !== "undefined") ? max : 1;
        return Utility.#seededRandom() * (max - min) + min;
    };

    static randomFloat = (min, max = undefined) => {
        min = (typeof min !== "undefined") ? min : 0;
        max = (typeof max !== "undefined") ? max : 1;
        return Utility.#seededRandom() * (max - min) + min;
    };

    static randomInt = (min, max = undefined) => {
        min = Math.ceil((typeof min !== "undefined") ? min : 0);
        max = Math.floor((typeof max !== "undefined") ? max : 1);
        return Math.floor(Utility.#seededRandom() * (max - min + 1)) + min;
    };

    static shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Utility.random(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    static sign = (value) => Math.sign(value);

    static squareDist = (p1, p2) => {
        return (p1.x - p2.x) ** 2 + (p2.y - p1.y) ** 2;
    };

    static TopologicalSort = (graph) => new TopologicalSort(graph);

    static transformArray = (list, func) => list.map(func);

    static values = (obj) => Object.values(obj);

    static verletUpdate = (p, dt) => {
        p.applyForce(p.options.gravity);
        const oldPosition = p.position.clone();
        const deltaPosition = p.position.subtract(p.prevPosition);

        const newPosition = Vector.add(
            Vector.add(p.position, deltaPosition),
            p.acceleration.multiply(dt * dt)
        );
        p.acceleration.multiply(0);
        return { newPosition: newPosition, oldPosition: oldPosition };
    };

    static rgbToRgba = (rgbString, alpha = 1.0) => {
        // Use a regular expression to capture the RGB values.
        const regex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
        const match = rgbString.match(regex);

        // If a match is found, construct and return the rgba string.
        if (match) {
            const r = match[1];
            const g = match[2];
            const b = match[3];
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Return null or throw an error for invalid input.
        return null;
    };

    static colorToNumber = (colorString) => {
        const hex = colorString.startsWith('#') ?
            colorString.substring(1) : colorString;
        const fullHex = hex.length === 3 ? hex.split('').map(char
            => char + char).join('') : hex;
        return parseInt(fullHex, 16);
    };

    static randomColor = () => {
        return Utility.generateRGBAColorString({
            r: Math.floor(Utility.randomInt(256)),   // Random
            value for Red(0 - 255)
            g: Math.floor(Utility.randomInt(256)),   // Random
            value for Green(0 - 255)
            b: Math.floor(Utility.randomInt(256))    // Random
value for Blue(0 - 255)
        });
    };

    static randomGray = () => {
        // Generate a random value between 0 and 255 for the grayscale component
        const grayValue = Math.floor(Math.random() * (256));

        // For gray colors, R, G, and B values are equal
        const r = grayValue;
        const g = grayValue;
        const b = grayValue;

        // The alpha value is fixed at 1.0
        const a = 1.0;

        // Return the color string in rgba format
        return Utility.generateRGBAColorString({ r: r, g: g, b: b, a: a });
    }

    static generateColor = () => {
        return Utility.randomColor();
    };

    static generateFireColor = () => {
        return Utility.generateRGBColorString({
            r: 255,
            g: 150 + Utility.randomInt(105),
            b: Utility.randomInt(100)
        });
    };

    static generateRGBColorString = ({ r = 255, g = 255, b = 255 }) => {
        return `rgb(${r}, ${g}, ${b})`;
    };

    static generateRGBAColorString = ({ r = 255, g = 255, b = 255, a
        = 1.0 }) => {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };
}