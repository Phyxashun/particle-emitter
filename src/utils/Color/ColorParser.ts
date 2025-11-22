import Color from "./Color";

export default class ColorParser {
    output: Color = new Color();

    constructor(...args: any[]) {
        this.output = this.#parseInput(args);
    }

    /**
     * Parse input arguments and determine format
     * @param {Array} args - Constructor arguments
     */
    #parseInput(args: any[]): Color {
        const method: string = 'parseInput';
        let _COLOR: Color;
        const firstArg = args[0];
        if (args.length === 1 && typeof firstArg === 'string') {
            _COLOR = this.#parseStringInput(firstArg);
        } else if (args.length === 1 && typeof firstArg === 'object' && firstArg !== null) {
            _COLOR = this.#parseObjectInput(firstArg);
        } else if (args.every(arg => typeof arg === 'number')) {
            _COLOR = this.#parseNumericInput(args);
        } else {
            throw new ColorError(invalidColor, method, `Invalid color input format: ${args} `);
        }
        _COLOR.getLuminance();
        return _COLOR;
    }

    /**
     * Parse string input (hex, named colors, CSS strings)
     * @param {string} input - String input
     */
    #parseStringInput(hsla: string): Color;
    #parseStringInput(hsva: string): Color;
    #parseStringInput(hwba: string): Color;
    #parseStringInput(rgba: string): Color;
    #parseStringInput(input: string): Color {
        const method = 'parseStringInput';
        const noWhiteSpace = input.replace(/\s+/g, "");
        const trimmed = noWhiteSpace.trim().toLowerCase();

        // Check for hex format
        if (trimmed.startsWith('#')) {
            this.#parseHexString(trimmed);
        }
        // Check for CSS rgb/rgba format
        else if (trimmed.startsWith('rgb(') || trimmed.startsWith('rgba(')) {
            this.#parseCSSString(trimmed);
        }
        // Check for CSS hsl/hsla format
        else if (trimmed.startsWith('hwb(')) {
            this.#parseHWBString(trimmed);
        }
        // Check for CSS hwb format
        else if (trimmed.startsWith('hsl(') || trimmed.startsWith('hsla(')) {
            this.#parseHSLString(trimmed);
        }
        // Check for named colors
        else if (Colors[trimmed]) {
            this.#parseHexString(Colors[trimmed]);
        }
        else {
            throw new ColorError(unknownColor, method, `Unknown color format: ${input} `);
        }
        return this;
    }

    /**
     * Parse object input (HSL, HSV, RGB objects)
     * @param {Object} obj - Color object
     */
    #parseObjectInput(color: Color): this;
    #parseObjectInput(hsla: { h: number, s: number, l: number, a?: number }): this;
    #parseObjectInput(hsva: { h: number, s: number, v: number, a?: number }): this;
    #parseObjectInput(hwba: { h: number, w: number, b: number, a?: number }): this;
    #parseObjectInput(rgba: { r: number, g: number, b: number, a?: number }): this;
    #parseObjectInput(...args: any[]): this {
        const method = 'parseObjectInput';
        if (Color.isColor(args)) return (this as any).#copyFrom(args);
        if ('h' in args && 's' in args && 'l' in args) {
            // HSL object
            const hsla = args as { h: number, s: number, l: number, a?: number };
            const color = Color.fromHSL(hsla.h, hsla.s, hsla.l, hsla.a || 1.0);
            (this as any).#copyFrom(color);
        }
        else if ('h' in args && 's' in args && 'v' in args) {
            // HSV object
            const hsv = args as { h: number, s: number, v: number, a?: number };
            const color = Color.fromHSV(hsv.h, hsv.s, hsv.v, hsv.a || 1.0);
            this.#copyFrom(color);
        }
        else if ('h' in args && 'w' in args && 'b' in args) {
            // HWB object
            const hwb = args as { h: number, w: number, b: number, a?: number };
            const color = Color.fromHWB(hwb.h, hwb.w, hwb.b, hwb.a || 1.0);
            this.#copyFrom(color);
        }
        else if ('r' in args && 'g' in args && 'b' in args) {
            const rgba = args as { r: number, g: number, b: number, a?: number };
            // RGB object
            this.r = rgba.r as number;
            this.g = rgba.g as number;
            this.b = rgba.b as number;
            this.a = rgba.a !== undefined ? rgba.a as number : 1.0;
        }
        else {
            throw new ColorError(unknownColor, method, `Invalid color object format: ${args} `);
        }
        return this;
    }

    /**
     * Parse numeric input (RGB or RGBA values)
     * @param {Array} args - Numeric arguments
     */
    #parseNumericInput(args: number[]): this {
        const method = 'parseNumericInput';

        if (args.length === 1) {
            // Handle single value: grayscale
            const grayValue = Color.clamp(args[0] as number);
            this.r = grayValue;
            this.g = grayValue;
            this.b = grayValue;
            this.a = 1.0;
        } else if (args.length === 3 || args.length === 4) {
            // Handle RGB or RGBA
            this.r = Color.clamp(args[0] ?? 255.0);
            this.g = Color.clamp(args[1] ?? 255.0);
            this.b = Color.clamp(args[2] ?? 255.0);
            // Default 'a' to 1.0 (fully opaque) if undefined or missing
            this.a = Color.clamp(args[3] ?? 1.0, ALPHA);

            // Special note: Alpha channel is usually 0.0 to 1.0,
            // but assuming your class uses 0.0 to 255.0 for all channels based on original code.
            // If 'a' should be 0.0 to 1.0, a separate clamp for alpha is needed.
        } else {
            throw new ColorError(invalidColor, method, 'Color format requires 1, 3, or 4 numeric values (grayscale, RGB, or RGBA).');
        }
        return this;
    }

    /**
     * Parse hex string
     * @param {string} hex - Hex color string
     */
    #parseHexString(hex: string): this {
        const result = Color.fromHex(hex);
        this.#copyFrom(result);
        return this;
    }

    /**
     * Parse CSS rgb/rgba string
     * @param {string} css - CSS color string
     */
    #parseCSSString(css: string): this {
        const method = 'parseCSSString'
        const cssRegex = /rgba?\(\s*(?<r>25[0-5]|2[0-4]\d|1\d{1,2}|\d{1,2})\s*,\s*(?<g>25[0-5]|2[0-4]\d|1\d{1,2}|\d{1,2})\s*,\s*(?<b>25[0-5]|2[0-4]\d|1\d{1,2}|\d{1,2})\s*(?:,\s*(?<a>[01]?\.?\d+))?\s*\)/;

        const match = css.match(cssRegex);

        if (!match || !match.groups) {
            throw new ColorError(invalidColor, method, `Invalid CSS color format: ${css} `);
        }

        // TypeScript knows that match.groups exists here
        const { r, g, b, a } = match.groups;

        // Use type assertions if necessary, or rely on the regex guarantee
        this.r = parseInt(r as string);
        this.g = parseInt(g as string);
        this.b = parseInt(b as string);
        this.a = a !== undefined ? parseFloat(a as string) : 1.0;
        return this;
    }


    /**
     * Parse CSS hsl/hsla string
     * @param {string} css - CSS HSL color string
     */
    #parseHSLString(css: string): this {
        const method = 'parseHSLString';
        const hslaRegex = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[,|/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;

        const match = css.match(hslaRegex);
        if (!match || !match.groups) {
            throw new ColorError(invalidColor, method, `Invalid CSS HSL color format: ${css} `);
        }

        const { h, s, l, a } = match.groups;

        const color = Color.fromHSL(
            parseInt(h as string),
            parseInt(s as string),
            parseInt(l as string),
            a !== undefined ? parseFloat(a as string) : 1.0
        );
        this.#copyFrom(color);
        return this;
    }

    /* Helper function (you'd need to implement these based on your lbrary's needs) */

    /**
     * Parses a CSS Hue value string (e.g., "180", "180deg", "0.5turn", "3.14rad", "200grad")
     * and converts it to degrees (0-360 range).
     * @param value The CSS hue string.
     * @returns The hue value in degrees.
     */
    #parseHue = (value: string): number => {
        const str = value.trim().toLowerCase();
        let resultDegrees = parseFloat(str);
        // Units are degrees or unitless (already parsed by parseFloat)
        if (str.endsWith('deg') || /^-?\d+(\.\d+)?$/.test(str)) { }
        // Units are turns ( 1 turn = 360 degrees )
        else if (str.endsWith('turn'))
            resultDegrees *= 360;
        // Units are radians ( 2 * PI radians = 360 degrees )
        else if (str.endsWith('rad'))
            resultDegrees *= (180 / Math.PI);
        // Units are gradians ( 400 gradians = 360 degrees )
        else if (str.endsWith('grad'))
            resultDegrees *= (360 / 400);
        // Invalid format or unsupported unit
        else
            console.warn(`Invalid or unsupported hue unit in value: ${value} `);
        // Default to 0 degrees if parsing fails
        return this.#normalizeDegree(resultDegrees || 0);
    };

    /**
     * Helper to normalize degrees into a 0-360 range, useful for HSL/HSV/HWB models
     * @param degrees
     * @returns
     */
    #normalizeDegree = (degrees: number): number => {
        return ((degrees % 360) + 360) % 360;
    }

    /**
     * Parses a CSS percentage string (e.g., "50%", "100", "0.25%")
     * and returns the numeric value (e.g., 50, 100, 0.25).
     * @param value The CSS percentage/number string.
     * @returns The numeric percentage value (0 to 100+).
     */
    #parsePercent = (value: string): number => {
        return Color.validNumber(parseFloat(value.trim().toLowerCase().replace('%', '')));
    };

    #parseAlpha = (value: string): number => {
        const str = value.trim().toLowerCase();
        let result = this.#parsePercent(str);
        if (str.endsWith('%')) result /= 100;
        return result;
    };

    /**
     * Parse CSS hwb string
     * @param {string} css - CSS HWB color string
     */
    #parseHWBString(css: string): this {
        const method = 'parseHWBString';

        const hwbRegex = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*([+-]?[\d.]+)%\s*[\s,]\s*([+-]?[\d.]+)%\s*(?:[\s,]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;

        const match = css.match(hwbRegex);
        if (!match || !match.groups) {
            throw new ColorError(invalidColor, method, `Invalid CSS HWB color format: ${css} `);
        }

        const { h, w, b, a } = match.groups;
        const color = Color.fromHWB(
            this.#parseHue(h as string),
            this.#parsePercent(w as string),
            this.#parsePercent(b as string),
            a !== undefined ? this.#parseAlpha(a as string) : 1.0
        );

        (this as any).#copyFrom(color);
        return this;
    }
}