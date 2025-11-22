class InvalidArgumentError extends Error {
    constructor(message: string) {
        // Logs the entire stack trace to the console right when the error is instantiated
        if (__DEBUG__) console.trace('InvalidArgumentError created. Called from: ');
        super(message);
        this.name = "InvalidArgumentError";
    }
}

export default class Vector {
    protected values: [number, number] = [0.0, 0.0];

    constructor(...args: any[]) {
        const [x, y] = Vector.processArgs(...args);

        this.x = x;
        this.y = y;
    }

    [Symbol.iterator] = this.values[Symbol.iterator].bind(this.values);

    // Static helper to create a Vector from various inputs
    static create(...args: any[]): Vector {
        const [x, y] = Vector.processArgs(...args);
        return new Vector(x, y);
    }

    get x(): number { return this.values[0]; }
    set x(value: number) {
        this.values[0] = Vector.isNumber(value
        ) && !Number.isNaN(value) ? value : 0;
    }
    get y(): number { return this.values[1]; }
    set y(value: number) {
        this.values[1] = Vector.isNumber(value
        ) && !Number.isNaN(value) ? value : 0;
    }

    /**
     * Processes various argument inputs to normalize them into a standard [x, y] number array.
     * This function supports zero arguments, single numbers (treated as [n, n]),
     * two numbers (treated as [x, y]), or array/Vector types of length 1 or 2.
     *
     * @static
     * @param {...(number|Array<number>|Vector)} args - The input arguments to process.
     * @returns {Array<number>} A normalized array of [x, y] coordinates, typically defaulting to [0.0, 0.0] on invalid input.
     * @throws {InvalidArgumentError} If __DEBUG__ is true and arguments are invalid.
     */
    static processArgs(...args: any[]): [number, number] {
        const [x = 0.0, y = 0.0] = args;

        // 0 arguments
        if (args.length === 0) return [0.0, 0.0];

        // Handle Vector or Array inputs first (most complex data types)
        // We combine the length 1 and length 2 array logic into one check
        if (Vector.isVector(x) || Vector.isArray(x)) {
            // Assuming Vector.isArray(x) checks if it is an array generally.
            // If it's length 1, we treat it as [x, x], if length 2+, we take the first two.
            const valX = x[0] || 0.0;
            const valY = (x.length > 1 ? x[1] : valX) || 0.0;
            return [valX, valY];
        }

        // Handle two separate number arguments (length 2 case)
        if (args.length === 2 && Vector.isNumber(x) &&
            Vector.isNumber(y)) {
            return [x, y];
        }

        // Handle single number argument (length 1 case)
        if (args.length === 1 && Vector.isNumber(x)) {
            return [x, x];
        }

        // Default error/fallback case for all invalid inputs
        if (__DEBUG__) {
            throw new InvalidArgumentError('Vector.processArgs: Invalid arguments');
        }
        return [0.0, 0.0];
    }

    toString(): string {
        return `Vector: [${this.x.toFixed(2)}, ${this.y.toFixed(2)}]`;
    }

    set(x: number, y: number): this {
        [this.x, this.y] = Vector.processArgs(x, y);
        return this;
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    copy(arg?: Vector | undefined): Vector | this {
        if (arg === undefined) {
            return this.clone();
        } else if (Vector.isVector(arg)) {
            this.set(arg.x, arg.y);
            return this;
        }
        return this;
    }

    add(...args: any[]): this {
        const [x, y] = Vector.processArgs(...args);
        this.x += x;
        this.y += y;
        return this;
    }

    subtract(...args: any[]): this {
        const [x, y] = Vector.processArgs(...args);
        this.x -= x;
        this.y -= y;
        return this;
    }

    /**
     * Calculates the remainder of the current vector's components divided by the provided x and y values.
     * Only performs the modulo operation if the divisor is non-zero.
     * @private
     * @param {number} x - The x divisor value.
     * @param {number} y - The y divisor value.
     * @returns {Vector} The current vector instance for chaining.
     */
    #calculateRemainder(x: number, y: number): this {
        if (x !== 0) this.x %= x;
        if (y !== 0) this.y %= y;
        return this;
    }

    /**
     * Calculates the remainder of this vector when divided by another vector, array, or numbers.
     * Delegates argument parsing to Vector.processArgs().
     * @param {...(number|Array<number>|Vector)} args - The divisor arguments.
     * @returns {Vector} The current vector instance for chaining.
     */
    remainder(...args: any[]): this {
        const [x, y] = Vector.processArgs(...args);
        return this.#calculateRemainder(x, y);
    }

    /**
     * Multiplies the current vector's components by a scalar, vector, or array components.
     * @param {...(number|Array<number>|Vector)} args - The multiplier arguments.
     * @returns {Vector} The current vector instance for chaining.
     */
    multiply(...args: any[]): this {
        const [x, y] = Vector.processArgs(...args);
        this.x *= x;
        this.y *= y;
        return this;
    }

    /**
     * Divides the current vector's components by a scalar, vector, or array components.
     * Division by zero for any component is safely ignored (the component remains unchanged).
     * @param {...(number|Array<number>|Vector)} args - The divisor arguments.
     * @returns {Vector} The current vector instance for chaining.
     */
    divide(...args: any[]): this {
        const [x, y] = Vector.processArgs(...args);
        if (x !== 0) this.x /= x;
        if (y !== 0) this.y /= y;
        return this;
    }

    magnitude(): number {
        return Math.sqrt(this.magnitudeSq());
    }

    magnitudeSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Calculates the dot product (scalar product) of this vector and another.
     * The result is a single number (scalar).
     * @param {...(number|Array<number>|Vector)} args - The second vector arguments.
     * @returns {number} The resulting dot product value.
     */
    dot(...args: any[]): number {
        const v = Vector.create(args);

        // The dot product formula: v1.x * v2.x + v1.y * v2.y
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Calculates a 2D "cross product" (technically, the determinant of the two vectors),
     * resulting in a scalar value.
     * @param {...(number|Array<number>|Vector)} args - The second vector arguments.
     * @returns {number} The resulting scalar value.
     */
    cross(...args: any[]): number {
        const v = Vector.create(args);

        // The 2D cross product formula: u.x * v.y - u.y * v.x
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Calculates the distance between this vector and another vector, array, or coordinates.
     * @param {...(number|Array<number>|Vector)} args - The target vector arguments.
     * @returns {number} The distance between the two vectors.
     */
    distance(...args: any[]): number {
        const v: Vector = Vector.create(args);
        const d: Vector = Vector.subtract(this, v);
        return d.magnitude();
    }

    normalize(): this {
        const mag = this.magnitude();
        if (mag !== 0) this.multiply(1 / mag);
        return this;
    }

    normalized(): Vector {
        const mag = this.magnitude();
        return mag !== 0 ? this.clone().normalize() : this.clone();
    }

    limit(arg: number): this {
        if (!Vector.isNumber(arg) || arg < 0) {
            console.warn("Vector.limit: Argument must be a non - negative number.");
            return this;
        }
        const magSq = this.magnitudeSq();
        if (magSq > arg * arg) {
            this.multiply(1 / Math.sqrt(magSq)).multiply(arg);
        }
        return this;
    }

    setMagnitude(arg: number): this {
        if (!Vector.isNumber(arg) || arg < 0) {
            console.warn('Vector.setMagnitude: Invalid arguments, no operation performed.');
            return this;
        }
        if (this.magnitudeSq() === 0) {
            console.warn('Vector.setMagnitude: Cannot set magnitude on a zero Vector.');
            return this;
        }
        return this.normalize().multiply(arg);
    }

    heading(): number {
        return Math.atan2(this.y, this.x);
    }

    setHeading(theta: number): this {
        if (!Vector.isNumber(theta)) {
            console.warn('Vector.setHeading: Invalid arguments, no operation performed.');
            return this;
        }
        const mag = this.magnitude();
        if (mag === 0) {
            console.warn('Vector.setHeading: Cannot set heading of a zero Vector.');
            return this;
        }
        return this.set(mag * Math.cos(theta), mag * Math.sin(theta));
    }

    rotate(theta: number): this {
        if (!Vector.isNumber(theta)) {
            console.warn('Vector.rotate: Invalid arguments, no operation performed.');
            return this;
        }
        return this.setHeading(this.heading() + theta);
    }

    /**
     * Calculates the angle (in radians) between this vector and another vector.
     * @param {...(number|Array<number>|Vector)} args - The second vector arguments.
     * @returns {number} The angle in radians, or NaN if either vector is a zero vector.
     */
    angleBetween(...args: any[]): number {
        const v: Vector = Vector.create(args);
        const magSqProduct: number = this.magnitudeSq() * v.magnitudeSq();

        if (magSqProduct === 0) {
            if (__DEBUG__) throw new
                InvalidArgumentError('Vector.angleBetween: Cannot compute angle with a zero Vector.');
            return NaN;
        }

        const dot: number = this.dot(v); // Reuse existing dot method
        const cross = this.x * v.y - this.y * v.x;

        return Math.atan2(cross, dot);
    }

    /**
     * Linearly interpolates this vector towards a target vector, array, or coordinates.
     *
     * @param {...(number|Array<number>|Vector)} args - The target x, y coordinates or Vector. The last argument should be the interpolation amount (0.0 to 1.0).
     * @returns {Vector} The current vector instance for chaining.
     */
    lerp(...args: any[]): this {
        // Extract the interpolation amount, which is always the last argument
        const amt = args.pop();

        // Use processArgs for the target X, Y coordinates
        const [x, y] = Vector.processArgs(...args);

        if (typeof amt !== 'number' || !Number.isFinite(amt)) {
            console.warn("Vector.lerp: 'amt' must be a finite number and the last argument.");
            return this;
        }

        // Perform the linear interpolation
        this.x += (x - this.x) * amt;
        this.y += (y - this.y) * amt;

        return this;
    }

    /**
     * Spherical linearly interpolates this vector toward a target vector v.
     * Note: If either vector is a zero vector, it falls back to linear interpolation (LERP).
     *
     * @param {...(number|Array<number>|Vector)} args - The target vector arguments (v) followed by the interpolation amount (amt).
     * @returns {Vector} The current vector instance for chaining.
     */
    slerp(...args: any[]): this {
        const amt = args.pop();
        if (typeof amt !== 'number' || !Number.isFinite(amt)) {
            console.warn("Vector.slerp: 'amt' must be a finite number and the last argument.");
            return this;
        }

        const v = Vector.create(...args);

        // Edge cases: no interpolation needed
        if (amt === 0) return this;
        if (amt === 1) return this.set(v.x, v.y);

        // Calculate angle between vectors (handles zero vectors safely by returning NaN)
        const angle = this.angleBetween(v);

        // Fallback to LERP if a true angle cannot be determined (zero vector or math error)
        if (!Number.isFinite(angle) || angle === 0) {
            // Use the consistent lerp logic you refined earlier
            return this.lerp(v.x, v.y, amt);
        }

        // Core SLERP logic using existing methods:

        // Interpolate magnitude linearly
        const mag1 = this.magnitude();
        const mag2 = v.magnitude();
        const interpolatedMagnitude = mag1 + (mag2 - mag1) * amt;

        // Rotate this vector by the appropriate fraction of the angle
        this.rotate(angle * amt);

        // Set the interpolated magnitude
        return this.setMagnitude(interpolatedMagnitude);
    }

    /**
     * Reflects this vector across a surface defined by a normal vector.
     * @param {...(number|Array<number>|Vector)} args - The surface normal vector arguments.
     * @returns {Vector} The reflected vector instance for chaining.
     */
    reflect(...args: any[]): this {
        const surfaceNormal = Vector.create(args);
        if (surfaceNormal.magnitudeSq() === 0) {
            console.warn('Vector.reflect: Surface normal cannot be a zero vector, no operation performed.');
            return this;
        }
        const normal = surfaceNormal.normalize();
        const projection = 2 * this.dot(normal);
        return this.subtract(normal.multiply(projection));
    }

    array(): [number, number] {
        return [this.x, this.y];
    }

    /**
     * Checks if this vector is equal to another vector, array, or coordinates within the tolerance of Number.EPSILON.
     * @param {...(number|Array<number>|Vector)} args - The target vector arguments to compare against.
     * @returns {boolean} True if the vectors are equal, false otherwise.
     */
    equals(...args: any[]): boolean {
        const v = Vector.create(args);
        const xEqual = Math.abs(this.x - v.x) < Number.EPSILON;
        const yEqual = Math.abs(this.y - v.y) < Number.EPSILON;
        return xEqual && yEqual;
    }

    clampToZero(): this {
        this.x = this.#clampToZero(this.x);
        this.y = this.#clampToZero(this.y);
        return this;
    }

    #clampToZero(value: number): number {
        const val = typeof value === 'number' ? value : 0;
        return Math.abs(val) <= Number.EPSILON ? 0 : val;
    }

    /*
     * Static Methods
     */

    static fromAngle(angle: number, length = 1): Vector | null {
        if (!Vector.isNumber(angle) || !Vector.isNumber(length)
            || length < 0) {
            console.warn("Vector.fromAngle: Parameters are of wrong type.");
            return null;
        }
        return new Vector(length * Math.cos(angle), length *
            Math.sin(angle));
    }

    static random(): Vector | null {
        return this.fromAngle(Math.random() * Math.PI * 2);
    }

    /**
     * Creates a new Vector instance that is a copy of the provided coordinates or Vector object.
     * This is an alias for the static create method.
     *
     * @static
     * @param {...(number|Array<number>|Vector)} args - The coordinates or Vector to copy.
     * @returns {Vector} A new Vector instance with the copied values.
     */
    static copy(...args: any[]): Vector {
        return Vector.create(args);
    }

    /**
     * Creates a new Vector that is the result of adding two other vectors together.
     *
     * @static
     * @param {Vector} v1 - The first vector.
     * @param {Vector} v2 - The second vector.
     * @returns {Vector} A new Vector instance representing the sum of v1 and v2.
     */
    static add(v1: Vector, v2: Vector): Vector {
        const target = Vector.create(v1);
        return target.add(v2);
    }

    /**
     * Creates a new Vector that is the result of applying a remainder operation on two vectors.
     * Division by zero for any component is safely ignored.
     *
     * @static
     * @param {Vector} v1 - The vector to be divided (the dividend).
     * @param {...(number|Array<number>|Vector)} args - The divisor arguments.
     * @returns {Vector} A new Vector instance representing the remainder.
     */
    static remainder(v1: Vector, ...args: any[]): Vector {
        const target = Vector.create(v1);
        return target.remainder(...args);
    }

    /**
     * Creates a new Vector that is the result of subtracting one vector from another.
     *
     * @static
     * @param {Vector} v1 - The vector to be subtracted from (the minuend).
     * @param {...(number|Array<number>|Vector)} args - The vector arguments to subtract (the subtrahend).
     * @returns {Vector} A new Vector instance representing the difference.
     */
    static subtract(v1: Vector, ...args: any[]): Vector {
        const target = Vector.create(v1);
        return target.subtract(...args);
    }

    /**
     * Creates a new Vector that is the result of multiplying a vector by a scalar or another vector/array.
     *
     * @static
     * @param {Vector} v1 - The vector to multiply.
     * @param {...(number|Array<number>|Vector)} args - The multiplier arguments (scalar or vector components).
     * @returns {Vector} A new Vector instance representing the product.
     */
    static multiply(v1: Vector, ...args: any[]): Vector {
        const target = Vector.create(v1);
        return target.multiply(...args);
    }

    /**
     * Creates a new Vector that is the result of rotating an existing vector by a specific angle.
     *
     * @static
     * @param {Vector} v - The vector to rotate.
     * @param {number} angle - The angle (in radians) to rotate by.
     * @returns {Vector} A new Vector instance representing the rotated vector.
     */
    static rotate(v: Vector, theta: number): Vector {
        const target = Vector.create(v);
        return target.rotate(theta);
    }

    /**
     * Creates a new Vector that is the result of dividing a vector by a scalar or another vector/array components.
     * Division by zero for any component is safely ignored.
     *
     * @static
     * @param {Vector} v1 - The vector to be divided (the dividend).
     * @param {...(number|Array<number>|Vector)} args - The divisor arguments (scalar or vector components).
     * @returns {Vector} A new Vector instance representing the quotient.
     */
    static divide(v1: Vector, ...args: any[]): Vector {
        const target = Vector.create(v1);
        return target.divide(...args);
    }

    static dot(v1: Vector, ...args: any[]): number {
        const target = Vector.create(v1);
        return target.dot(...args);
    }

    static cross(v1: Vector, ...args: any[]): number {
        const target = Vector.create(v1);
        return target.cross(...args);
    }

    static distance(v1: Vector, ...args: any[]): number {
        const target = Vector.create(v1);
        return target.distance(...args);
    }

    /**
     * Creates a new Vector that is the result of linearly interpolating between two vectors.
     *
     * @static
     * @param {Vector} v1 - The starting vector.
     * @param {Vector} v2 - The target vector.
     * @param {number} amt - The interpolation amount (0.0 to 1.0).
     * @returns {Vector} A new Vector instance representing the interpolated value.
     */
    static lerp(v1: Vector, v2: Vector, amt: number): Vector {
        const target = Vector.create(v1);

        return target.lerp(v2.x, v2.y, amt);
    }

    /**
     * Creates a new Vector that is the result of spherically linearly interpolating between two vectors.
     * Falls back to LERP if a true angle cannot be determined (e.g., zero vector).
     *
     * @static
     * @param {Vector} v1 - The starting vector.
     * @param {Vector} v2 - The target vector.
     * @param {number} amt - The interpolation amount (0.0 to 1.0).
     * @returns {Vector} A new Vector instance representing the interpolated value.
     */
    static slerp(v1: Vector, v2: Vector, amt: number): Vector {
        const target = Vector.create(v1);
        return target.slerp(v2, amt);
    }

    static magnitude(arg: Vector): number {
        const target = Vector.create(arg);
        return target.magnitude();
    }

    static magnitudeSq(arg: Vector): number {
        const target = Vector.create(arg);
        return target.magnitudeSq();
    }

    /**
     * Creates a new, normalized Vector (a unit vector with magnitude 1) from an existing vector.
     * Returns a zero vector if the input vector is a zero vector.
     *
     * @static
     * @param {Vector} arg - The vector to normalize.
     * @returns {Vector} A new Vector instance that is normalized.
     */
    static normalize(arg: Vector): Vector {
        const target = Vector.create(arg);
        return target.normalize();
    }

    /**
     * Creates a new Vector that is a limited version of an existing vector (magnitude capped at 'max').
     *
     * @static
     * @param {Vector} arg - The vector to limit.
     * @param {number} max - The maximum magnitude.
     * @returns {Vector} A new limited Vector instance.
     */
    static limit(arg: Vector, max: number): Vector {
        const target = Vector.create(arg);
        return target.limit(max);
    }

    /**
     * Creates a new Vector from an existing one, but with a modified magnitude (length).
     * Cannot set magnitude on a zero vector.
     *
     * @static
     * @param {Vector} arg - The vector to modify the magnitude of.
     * @param {number} mag - The new magnitude.
     * @returns {Vector} A new Vector instance with the new magnitude.
     */
    static setMagnitude(arg: Vector, mag: number): Vector {
        const target = Vector.create(arg);
        return target.setMagnitude(mag);
    }

    static heading(arg: Vector) {
        if (!Vector.isVector(arg)) {
            console.warn("Vector.heading: Parameter is of wrong type.");
            return;
        }
        return arg.heading();
    }

    static angleBetween(v1: Vector, v2: Vector) {
        if (!Vector.isVector(v1) || !Vector.isVector(v2)) {
            console.warn("Vector.angleBetween: Parameters are of wrong type.");
            return;
        }
        return v1.angleBetween(v2);
    }

    /**
     * Creates a new Vector that is the result of reflecting an input vector across a surface normal.
     *
     * @static
     * @param {Vector} arg - The vector to reflect (incoming vector).
     * @param {Vector} surfaceNormal - The surface normal vector.
     * @returns {Vector} A new Vector instance representing the reflected vector.
     */
    static reflect(arg: Vector, surfaceNormal: Vector): Vector {
        // Create a new vector using arg's data
        const target = arg.clone();

        // Use the optimized instance reflect method, which handles the surface normal validation
        return target.reflect(surfaceNormal);
    }

    static array(arg: Vector) {
        if (!Vector.isVector(arg)) {
            console.warn("Vector.array: Parameter error.");
            return;
        }
        return arg.array();
    }

    static equals(v1: Vector, v2: Vector) {
        if (!Vector.isVector(v1) || !Vector.isVector(v2)) {
            console.warn("Vector.equals: Parameters are of wrong type.");
            return;
        }
        return v1.equals(v2);
    }

    static toRadians(arg: number) {
        if (!Vector.isNumber(arg)) {
            console.warn("Vector.toRadians: Parameter is of wrong type.");
            return NaN;
        }
        return arg * (Math.PI / 180);
    }

    static toDegrees(arg: number) {
        if (!Vector.isNumber(arg)) {
            console.warn("Vector.toDegrees: Parameter is of wrong type.");
            return NaN;
        }
        return arg * (180 / Math.PI);
    }

    static isVector = (arg: any): boolean => arg instanceof Vector;

    static isNumber = (arg: any): boolean => typeof arg === 'number'
        && !Number.isNaN(arg) && Number.isFinite(arg);

    /**
     * Checks if a value is an array.
     * @param {*} arg The value to check.
     * @returns {boolean} True if the value is an array, otherwise false.
     */
    static isArray = (arg: any, length?: number) => {
        return (!Array.isArray(arg)) ? false :
            (length !== undefined && arg.length !== length) ? false :
                (!arg.every(Vector.isNumber)) ? false : true;
    }

    // Generate a random direction using a random angle between 0 and 2π
    static randomDirection(): Vector {
        const angle = Math.random() * Math.PI * 2;
        return new Vector(Math.cos(angle), Math.sin(angle));
    }
}// End Class Vector


export class Range extends Vector {
    constructor(...args: any[]) {
        const [x, y] = Vector.processArgs(...args);
        super(x, y);
    }

    get min() { return this.values[0]; }
    set min(value) {
        this.values[0] = Vector.isNumber(value) &&
            !Number.isNaN(value) ? value : 0;
    }
    get max() { return this.values[1]; }
    set max(value) {
        this.values[1] = Vector.isNumber(value) &&
            !Number.isNaN(value) ? value : 0;
    }
}