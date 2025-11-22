import Vector from '../utils/Vector';
import Context from '../renderer/Context';

declare interface IConstants {
    PI: number;
    TWO_PI: number;
    MAX_PARTICLES: number;
    WIDTH: number;
    HEIGHT: number;
    CENTER: Vector;
    updateDimensions: (ctx: Context) => void;
}

declare class Constants implements IConstants {
    PI = Math.PI;
    TWO_PI = 2 * Math.PI;
    MAX_PARTICLES = 500;
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    CENTER = new Vector(window.innerWidth / 2, window.innerHeight / 2);
    updateDimensions = (ctx: Context) => {
        this.WIDTH = ctx.width || window.innerWidth;
        this.HEIGHT = ctx.height || window.innerHeight;
        this.CENTER = new Vector(this.WIDTH / 2, this.HEIGHT / 2);
    }
}

declare global {
    var __DEBUG__: boolean;
    var Constants: Constants;
}

globalThis.__DEBUG__ = true;
globalThis.Constants = new Constants();