type ColorModel = 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hwb' | 'hwba';

// The desired type alias
type StringOfLength<L extends number> =
    string & { length: L } & { __stringOfLength: true };

type HexColorString = StringOfLength<7>;

type ColorString = {
    hex: `#${string} `,
    rgba: ``,
    hsla: ``,
    hwba: ``,
    keyword: ``,
    get: {
        (color: string): { model: ColorModel; value: number[] } | null;
        rgba: (color: string) => number[] | null;
        hsla: (color: string) => number[] | null;
        hwba: (color: string) => number[] | null;
    };
    to: {
        hex: (r: number, g: number, b: number, a?: number) => string | null;
        rgba: {
            (r: number, g: number, b: number, a?: number): string | null;
            percent: (r: number, g: number, b: number, a?: number)
                => string | null;
        };
        keyword: (r: number, g: number, b: number, a?: number) =>
            string | null;
        hsla: (h: number, s: number, l: number, a?: number) => string | null;
        hwba: (h: number, w: number, b: number, a?: number) => string | null;
    };
};

type ColorNames = { [name: string]: Color };

type ColorErrorNames = 'UnknownColor' | 'InvalidColor' | '';

type TColorError = [name: ColorErrorNames, method: string, message: string];

declare const isHexColorString = (s: string): s is HexColorString => {
    // Regex: starts with #, followed by 6 or 8 characters (total length 7 or 9)
    return /^#(.{6}|.{8})$/.test(s);
}

declare const checkHexValue = (value: string) => {
    const method = 'checkHexValue';
    if (isHexColorString(value)) {
        return value;
    } else {
        throw new ColorError(invalidColor, method, `Invalid hex color value: ${value} `);
    }
}

declare const unknownColor: ColorErrorNames = 'UnknownColor';

declare const invalidColor: ColorErrorNames = 'InvalidColor';

declare class ColorError extends Error {
    constructor(...error: TColorError) {
        let [name, method, message] = [...error];
        name = (name) ? name : '';
        method = (method) ? method : '';
        message = (message) ? message : '';
        super('Color.' + method + '(): ' + message);
        this.name = name;
    }
}

declare const Colors: ColorNames;