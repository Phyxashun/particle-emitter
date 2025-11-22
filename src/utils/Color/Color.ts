/// <reference types="./Color.d.ts" />
/**
 * Comprehensive color class for particle systems
 * Supports automatic detection of input format in constructor
 */

/**
 * @constant EPSILON
 *
 * @default     0.04045
 * @description The value 0.04045 is a more precise standard value used in some
 *              specifications.
 *
 * @variation   0.03928
 * @description  The value 0.03928 is the linear threshold for the sRGB piecewise
 *              function, corresponding to an 8-bit value of 10.
 *
 * @summary However, for a 0-255 RGB range, this difference is almost negligible.
 *          Choosing one and sticking to it consistently is the best approach.
 */
export const EPSILON: number = 0.04045; 0.03928
export const ALPHA: boolean = true;

export default class Color {
    #r: number = 0;
    #g: number = 0;
    #b: number = 0;
    #a: number = 0;

    // Flag for lazy luminance calculation
    #isDirty: boolean = true;
    #luminance: number | undefined = undefined;

    // Pre-defined internal common colors
    static white: Color = new Color(255, 255, 255, 1.0);
    static black: Color = new Color(0, 0, 0, 1.0);
    static red: Color = new Color(255, 0, 0, 1.0);
    static green: Color = new Color(0, 255, 0, 1.0);
    static blue: Color = new Color(0, 0, 255, 1.0);
    static yellow: Color = new Color(255, 255, 0, 1.0);
    static cyan: Color = new Color(0, 255, 255, 1.0);
    static magenta: Color = new Color(255, 0, 255, 1.0);
    static transparent: Color = new Color(0, 0, 0, 0.0);

    constructor(...args: any[]) {
        if (args.length === 0) {
            this.r = 255;
            this.g = 255;
            this.b = 255;
            this.a = 1.0;
        } else {
            this.#parseInput(args);
        }

        this.#luminance = this.getLuminance();
    }

    /**
     * Copy values from another color
     * @param {Color} other - Source color
     */
    #copyFrom(other: Color): this {
        this.#r = other.r;
        this.#g = other.g;
        this.#b = other.b;
        this.#a = other.a;
        return this;
    }

    static isColor = (arg: any): boolean => arg instanceof Color;

    static validNumber = (arg: any): number => {
        return (
            typeof arg === 'number' &&
            !Number.isNaN(arg) &&
            Number.isFinite(arg)
        ) ? arg : 0.0;
    }

    /**
     * Clamps a given number to be within the valid RGB range [0.0, 255.0].
     * If isAplha is true, clamp to [0.0, 1.0]
     * Non-numeric inputs will result in a runtime error if strict checks are on,
     * but JavaScript's loose typing will convert them if necessary.
     */
    static clamp = (arg: number, isAlpha?: typeof ALPHA, min?: number, max?: number): number => {
        min = min ?? 0.0;
        max = (isAlpha && max === undefined) ? 1.0 : (max ?? 255.0);

        const num: number = (
            typeof arg === 'number' &&
            !Number.isNaN(arg) &&
            Number.isFinite(arg)
        ) ? arg : min;

        return Math.max(min, Math.min(max, num));
    }

    /* Getters and setters */
    get r(): number { return this.#r; }
    set r(value: number) { this.#r = Color.clamp(Color.validNumber(value)); this.#isDirty = true; }

    get g(): number { return this.#g; }
    set g(value: number) { this.#g = Color.clamp(Color.validNumber(value)); this.#isDirty = true; }

    get b(): number { return this.#b; }
    set b(value: number) { this.#b = Color.clamp(Color.validNumber(value)); this.#isDirty = true; }

    get a(): number { return this.#a; }
    set a(value: number) { this.#a = Color.clamp(Color.validNumber(value), ALPHA); this.#isDirty = true; }

    /**
     * Create color from hex string
     * @param {string} input - Hex color (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
     * @returns {Color}
     */
    static fromHex(input: string): Color {
        const method = 'fromHex';
        const hexValue = input.replace(/^#/, '');
        const hexLength = hexValue.length;

        let standardizedHex: string;

        if (hexLength === 3 || hexLength === 4) {
            // Expand shorthand: #abc -> #aabbcc, #abcd -> #aabbccdd
            standardizedHex = hexValue.split('').map(c => c + c).join('');
            if (hexLength === 3) {
                standardizedHex += 'ff';
            }
        } else if (hexLength === 6) {
            standardizedHex = hexValue + 'ff';
        } else if (hexLength === 8) {
            standardizedHex = hexValue;
        } else {
            throw new Error(`Invalid hex color format in ${method}: ${input}`);
        }
        const _r = parseInt(standardizedHex.slice(0, 2), 16);
        const _g = parseInt(standardizedHex.slice(2, 4), 16);
        const _b = parseInt(standardizedHex.slice(4, 6), 16);
        const _a = parseInt(standardizedHex.slice(6, 8), 16) / 255.0;

        return new Color(_r, _g, _b, _a);
    }


    static parseHSLString(css: string): { h: number, s: number, l: number, a?: number } {
        const method = 'parseHSLString';
        const hslaRegex = /^hsla?\(\s*(?<h>[+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*(?<s>[+-]?[\d.]+)%\s*,?\s*(?<l>[+-]?[\d.]+)%\s*(?:[,|/]\s*(?<a>[+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
        const match = css.match(hslaRegex);
        if (!match || !match.groups) {
            throw new ColorError(invalidColor, method, `Invalid CSS HSL color format: ${css}.`);
        }
        const { h, s, l, a } = match.groups;
        return {
            h: parseFloat(h as string),
            s: parseFloat(s as string),
            l: parseFloat(l as string),
            a: a !== undefined ? parseFloat(a as string) : 1.0
        };
    }

    /**
     * Create color from HSL values
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @param {number} a - Alpha (0-1)
     * @returns {Color}
     */
    static fromHSL(hsla: string): Color;
    static fromHSL(h: number, s: number, l: number, a?: number): Color;
    static fromHSL(...args: any[]): Color {
        const method = 'fromHSL';
        let h: number = 0.0, s: number = 0.0, l: number = 0.0, a: number = 1.0;
        if (typeof args[0] === 'string') {
            const parsed = this.parseHSLString(args[0]);
            h = parsed.h;
            s = parsed.s;
            l = parsed.l;
            a = parsed.a ?? 1.0;
        } else if (typeof args[0] === 'number') {
            h = args[0];
            s = args[1];
            l = args[2];
            if (args.length === 4 && typeof args[3] === 'number') {
                a = args[3];
            }
        } else {
            throw new ColorError(invalidColor, method, "Invalid arguments provided.");
        }

        h = h % 360.0;
        s = Math.max(0.0, Math.min(100.0, s)) / 100.0;
        l = Math.max(0.0, Math.min(100.0, l)) / 100.0;

        const c = (1.0 - Math.abs(2.0 * l - 1.0)) * s;
        const x = c * (1.0 - Math.abs((h / 60.0) % 2.0 - 1.0));
        const m = l - c / 2.0;

        let _r: number, _g: number, _b: number;

        if (h >= 0.0 && h < 60.0) {
            _r = c; _g = x; _b = 0.0;
        } else if (h >= 60.0 && h < 120.0) {
            _r = x; _g = c; _b = 0.0;
        } else if (h >= 120.0 && h < 180.0) {
            _r = 0.0; _g = c; _b = x;
        } else if (h >= 180.0 && h < 240.0) {
            _r = 0.0; _g = x; _b = c;
        } else if (h >= 240.0 && h < 300.0) {
            _r = x; _g = 0.0; _b = c;
        } else {
            _r = c; _g = 0.0; _b = x;
        }

        return new Color(
            Math.round((_r + m) * 255.0),
            Math.round((_g + m) * 255.0),
            Math.round((_b + m) * 255.0),
            a
        );
    }

    static parseHSVString(css: string): { h: number, s: number, v: number, a?: number } {
        const method = 'parseHSVString';
        const hsvaRegex = /^hsva?\(\s*(?<h>[+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*(?<s>[+-]?[\d.]+)%\s*,?\s*(?<v>[+-]?[\d.]+)%\s*(?:[,|/]\s*(?<a>[+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
        const match = css.match(hsvaRegex);
        if (!match || !match.groups) {
            throw new ColorError(invalidColor, method, `Invalid CSS HSV color format: ${css}`);
        }
        const { h, s, v, a } = match.groups;
        return {
            h: parseFloat(h as string),
            s: parseFloat(s as string),
            v: parseFloat(v as string),
            a: a !== undefined ? parseFloat(a as string) : 1.0
        };
    }

    /**
     * Create color from HSV values
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} v - Value (0-100)
     * @param {number} a - Alpha (0-1)
     * @returns {Color}
     */
    static fromHSV(hsva: string): Color;
    static fromHSV(h: number, s: number, v: number, a?: number): Color;
    static fromHSV(...args: any[]): Color {
        const method = 'fromHSV';
        let h: number = 0.0, s: number = 0.0, v: number = 0.0, a: number = 1.0;
        if (typeof args[0] === 'string') {
            const parsed = this.parseHSVString(args[0]);
            h = parsed.h;
            s = parsed.s;
            v = parsed.v;
            a = parsed.a ?? 1.0;
        } else if (typeof args[0] === 'number') {
            h = args[0];
            s = args[1];
            v = args[2];
            if (args.length === 4 && typeof args[3] === 'number') {
                a = args[3];
            }
        } else {
            throw new ColorError(invalidColor, method, "Invalid arguments provided.");
        }

        h = h % 360.0;
        s = Math.max(0.0, Math.min(100.0, s)) / 100.0;
        v = Math.max(0.0, Math.min(100.0, v)) / 100.0;

        const c = v * s;
        const x = c * (1.0 - Math.abs((h / 60.0) % 2.0 - 1.0));
        const m = v - c;

        let _r: number, _g: number, _b: number;

        if (h >= 0.0 && h < 60.0) {
            _r = c; _g = x; _b = 0.0;
        } else if (h >= 60.0 && h < 120.0) {
            _r = x; _g = c; _b = 0.0;
        } else if (h >= 120.0 && h < 180.0) {
            _r = 0.0; _g = c; _b = x;
        } else if (h >= 180.0 && h < 240.0) {
            _r = 0.0; _g = x; _b = c;
        } else if (h >= 240.0 && h < 300.0) {
            _r = x; _g = 0.0; _b = c;
        } else {
            _r = c; _g = 0.0; _b = x;
        }

        return new Color(
            Math.round((_r + m) * 255.0),
            Math.round((_g + m) * 255.0),
            Math.round((_b + m) * 255.0),
            a
        );
    }

    static parseHWBString(css: string): { h: number, w: number, b: number, a?: number } {
        const method = 'parseHWBString';
        const hwbRegex = /^hwb\(\s*(?<h1>[+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*(?<w1>[+-]?[\d.]+)%\s*[\s,]\s*(?<b>[+-]?[\d.]+)%\s*(?:[\s,]\s*(?<a1>[+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
        const match = css.match(hwbRegex);
        if (!match || !match.groups) {
            throw new ColorError(invalidColor, method, `Invalid CSS HWB color format: ${css} `);
        }
        const { h, w, b, a } = match.groups;
        return {
            h: parseFloat(h as string),
            w: parseFloat(w as string),
            b: parseFloat(b as string),
            a: a !== undefined ? parseFloat(a as string) : 1.0
        };
    }

    /**
     * Create color from HWB values
     * @param {number} h - Hue (0-360)
     * @param {number} w - Whiteness (0-100)
     * @param {number} b - Blackness (0-100)
     * @param {number} a - Alpha (0-1)
     * @returns {Color}
     */
    static fromHWB(hwba: string): Color;
    static fromHWB(h: number, w: number, b: number, a?: number): Color;
    static fromHWB(...args: any[]): Color {
        const method = 'fromHWB';

        let h: number = 0.0, w: number = 0.0, b: number = 0.0, a: number = 1.0;

        if (typeof args[0] === 'string') {
            const parsed = this.parseHWBString(args[0]);
            h = parsed.h;
            w = parsed.w;
            b = parsed.b;
            a = parsed.a ?? 1.0;
        } else if (typeof args[0] === 'number') {
            h = args[0];
            w = args[1];
            b = args[2];
            if (args.length === 4 && typeof args[3] === 'number') {
                a = args[3];
            }
        } else {
            throw new ColorError(invalidColor, method, "Invalid arguments provided.");
        }

        h = h % 360.0;
        w = Math.max(0.0, Math.min(100.0, w)) / 100.0;
        b = Math.max(0.0, Math.min(100.0, b)) / 100.0;

        const c = b * w;
        const x = c * (1.0 - Math.abs((h / 60.0) % 2.0 - 1.0));
        const m = b - c;

        let _r: number, _g: number, _b: number;

        if (h >= 0.0 && h < 60.0) {
            _r = c; _g = x; _b = 0.0;
        } else if (h >= 60.0 && h < 120.0) {
            _r = x; _g = c; _b = 0.0;
        } else if (h >= 120.0 && h < 180.0) {
            _r = 0.0; _g = c; _b = x;
        } else if (h >= 180.0 && h < 240.0) {
            _r = 0.0; _g = x; _b = c;
        } else if (h >= 240.0 && h < 300.0) {
            _r = x; _g = 0.0; _b = c;
        } else {
            _r = c; _g = 0.0; _b = x;
        }

        return new Color(
            Math.round((_r + m) * 255.0),
            Math.round((_g + m) * 255.0),
            Math.round((_b + m) * 255.0),
            a
        );
    }

    /**
     * Create random color
     * @param {boolean} includeAlpha - Whether to randomize alpha
     * @returns {Color}
     */
    static random(includeAlpha: boolean = !ALPHA): Color {
        const r = Math.floor(Math.random() * 256.0);
        const g = Math.floor(Math.random() * 256.0);
        const b = Math.floor(Math.random() * 256.0);
        const a = includeAlpha ? Math.random() : 1.0;
        return new Color(r, g, b, a);
    }

    /**
     * Lerp between two colors
     * @param {Color} color1 - Start color
     * @param {Color} color2 - End color
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Color}
     */
    static lerp(color1: Color, color2: Color, t: number): Color {
        t = Math.max(0.0, Math.min(1.0, t));

        return new Color(
            color1.r + (color2.r - color1.r) * t,
            color1.g + (color2.g - color1.g) * t,
            color1.b + (color2.b - color1.b) * t,
            color1.a + (color2.a - color1.a) * t
        );
    }

    /**
     * Convert to hex string
     * @param {boolean} includeAlpha - Include alpha channel
     * @returns {string}
     */
    toHex(includeAlpha: boolean = !ALPHA): string {
        const toHex = (n: number): string => {
            const value = Math.round(Math.max(0.0, Math.min(255.0, n)));
            return value.toString(16).padStart(2, '0');
        };
        let hex = `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`;
        if (includeAlpha) {
            hex += toHex(this.a * 255.0);
        }
        return hex;
    }

    /**
     * Convert to CSS RGB/RGBA string
     * @returns {string}
     */
    toCSS(): string {
        if (this.a < 1.0) {
            return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
        }
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    /**
     * Convert to HSL
     * @returns {Object} {h, s, l, a}
     * */
    toHSL(): { h: number, s: number, l: number, a: number } {
        // Normalize RGB values to the [0, 1] range
        const r: number = this.r / 255.0;
        const g: number = this.g / 255.0;
        const b: number = this.b / 255.0;

        const max: number = Math.max(r, g, b);
        const min: number = Math.min(r, g, b);
        const diff: number = max - min;

        let h: number = 0.0;
        let s: number = 0.0;
        const l: number = (max + min) / 2.0;

        if (diff !== 0.0) {
            // Calculate saturation
            s = l > 0.5 ? diff / (2.0 - max - min) : diff / (max + min);

            // Calculate hue
            if (max === r) {
                h = ((g - b) / diff + (g < b ? 6.0 : 0.0)) * 60.0;
            } else if (max === g) {
                h = ((b - r) / diff + 2.0) * 60.0;
            } else {
                h = ((r - g) / diff + 4.0) * 60.0;
            }
        }

        return {
            h: h,
            s: s * 100.0,
            l: l * 100.0,
            a: this.a
        };
    }

    /**
     * Convert to HSV
     * @returns {Object} {h, s, v, a}
     */
    toHSV(): { h: number, s: number, v: number, a: number } {
        const r: number = this.r / 255.0;
        const g: number = this.g / 255.0;
        const b: number = this.b / 255.0;

        const max: number = Math.max(r, g, b);
        const min: number = Math.min(r, g, b);
        const diff: number = max - min;

        let h: number = 0.0;
        let s: number = max === 0.0 ? 0.0 : diff / max;
        const v: number = max;

        if (diff !== 0.0) {
            if (max === r) {
                h = ((g - b) / diff + (g < b ? 6.0 : 0.0)) * 60.0;
            } else if (max === g) {
                h = ((b - r) / diff + 2.0) * 60.0;
            } else {
                h = ((r - g) / diff + 4.0) * 60.0;
            }
        }

        return {
            h: h,
            s: s * 100.0,
            v: v * 100.0,
            a: this.a
        };
    }

    /**
     * Create a copy of this color
     * @returns {Color}
     */
    clone(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }

    /**
     * Set color values
     * @param {any[ ]} args - string, object, numeric representation of a color
     */
    public set(color: Color): this;
    public set(css: string): this;
    public set(color: { r: number, g: number, b: number, a?: number }): this;
    public set(r: number, g: number, b: number, a?: number): this;
    public set(...args: any[]): this {
        this.#parseInput(args);
        return this;
    }


    /**
     * Mix this color with another
     * @param {Color} other - Other color
     * @param {number} ratio - Mix ratio (0 = this color, 1 = other color)
     * @returns {Color} New mixed color
     */
    mix(other: Color, ratio: number = 0.5): Color {
        return Color.lerp(this, other, ratio);
    }


    /**
     * Brighten the color
     * @param {number} amount - Amount to brighten (0-1)
     * @returns {Color} New brightened color
     */
    brighten(amount: number = 0.1): Color {
        return new Color(
            Math.min(255.0, this.r + (255.0 - this.r) * amount),
            Math.min(255.0, this.g + (255.0 - this.g) * amount),
            Math.min(255.0, this.b + (255.0 - this.b) * amount),
            this.a
        );
    }

    /**
     * Darken the color
     * @param {number} amount - Amount to darken (0-1)
     * @returns {Color} New darkened color
     */
    darken(amount: number = 0.1): Color {
        return new Color(
            Math.max(0.0, this.r - this.r * amount),
            Math.max(0.0, this.g - this.g * amount),
            Math.max(0.0, this.b - this.b * amount),
            this.a
        );
    }

    /**
     * Adjust opacity
     * @param {number} alpha - New alpha value (0-1)
     * @returns {Color} New color with adjusted opacity
     */
    withAlpha(alpha: number): Color {
        return new Color(this.r, this.g, this.b, alpha);
    }

    /**
     * Get complementary color
     * @returns {Color}
     */
    complement(): Color {
        const hsl = this.toHSL();
        hsl.h = (hsl.h + 180) % 360;
        return Color.fromHSL(hsl.h, hsl.s, hsl.l, hsl.a);
    }

    /**
     * Check if colors are equal
     * @param {Color} other - Other color
     * @returns {boolean}
     */
    equals(other: Color): boolean {
        if (!(other instanceof Color)) return false;
        return this.r === other.r &&
            this.g === other.g &&
            this.b === other.b &&
            Math.abs(this.a - other.a) < 0.001;
    }

    /**
     * Get luminance (perceived brightness)
     * @returns {number} Luminance value (0-1)
     */
    getLuminance(): number {
        if (!this.#isDirty) return this.#luminance as number;
        const [r, g, b] = [this.r, this.g, this.b].map(c => {
            c = c / 255.0;
            return c <= EPSILON ? c / 12.92 : Math.pow((c + 0.055)
                / 1.055, 2.4);
        });

        this.#luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        this.#isDirty = false;
        return this.#luminance;
    }


    /**
     * Check if color is dark
     * @param {number} threshold - Luminance threshold (0-1)
     * @returns {boolean}
     */
    isDark(threshold: number = 0.5): boolean {
        return this.getLuminance() < threshold;
    }

    /**
     * String representation
     * @returns {string}
     */
    toString(): string {
        return this.toCSS();
    }
} // End class Color
