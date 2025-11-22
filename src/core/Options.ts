import Color from "../utils/Color/Color.js";
import Utility from "../utils/Utility.js";
import Vector, { Range } from "../utils/Vector";

/**
 * The base Component interface defines properties and
 * operations that can be altered by decorators.
 */
interface IOptions {
    type: string;

    // Position and Motion
    isStatic: boolean;
    rate: number;
    speedRange: Range;
    xSpeedRange: Range;
    ySpeedRange: Range;
    speed: number;

    // Physical Properties
    sizeRange: Range;
    size: number;
    density: number;
    mass: number;

    // Lifecycle
    lifeRange: Range;
    lifespan: number;

    // Visual Properties
    alpha: number;
    color: Color;
    angle: number;
    rotation: number;
    angularVelocity: number;

    // Environmental Interaction
    temperature: number;
    drag: number;
    bounce: number;
    friction: number;
    damper: number;
}

class OptionsReference {
    prototype: IOptions;

    constructor(prototype: IOptions) {
        this.prototype = prototype;
    }
}

abstract class OptionsDecorator implements IOptions {
    protected reference: OptionsReference | null;
    protected options: IOptions;

    type: string = 'decorator';

    // Position and Motion
    isStatic: boolean = false;
    rate: number = 0.0;
    speedRange: Range = new Range(0, 0);
    xSpeedRange: Range = new Range(0, 0);
    ySpeedRange: Range = new Range(0, 0);
    speed: number = 0.0;

    // Physical Properties
    sizeRange: Range = new Range(0, 0);
    size: number = 0.0;
    density: number = 0.0;
    mass: number = 0.0;

    // Lifecycle
    lifeRange: Range = new Range(0, 0);
    lifespan: number = 0.0;

    // Visual Properties
    alpha: number = 0.0;
    color: Color = new Color(255, 255, 255);
    angle: number = 0.0;
    rotation: number = 0.0;
    angularVelocity: number = 0.0;

    // Environmental Interaction
    temperature: number = 0.0;
    drag: number = 0.0;
    bounce: number = 0.0;
    friction: number = 0.0;
    damper: number = 0.0;

    constructor(options: IOptions) {
        this.options = options;
        this.reference = null;
    }

    public clone() {
        const clone = Object.create(this);
        clone.reference = new OptionsReference(clone);
        clone.type = this.type;
        return clone;
    }
}

abstract class BaseOptions implements IOptions {
    type: string = 'base';

    // Position and Motion
    isStatic: boolean = false;
    rate: number = 0.0;
    speedRange: Range = new Range(0, 0);
    xSpeedRange: Range = new Range(0, 0);
    ySpeedRange: Range = new Range(0, 0);
    speed: number = 0.0;

    // Physical Properties
    sizeRange: Range = new Range(0, 0);
    size: number = 0.0;
    density: number = 0.0;
    mass: number = 0.0;

    // Lifecycle
    lifeRange: Range = new Range(0, 0);
    lifespan: number = 0.0;
    // Visual Properties
    alpha: number = 0.0;
    color: Color = new Color(255, 255, 255);
    angle: number = 0.0;
    rotation: number = 0.0;
    angularVelocity: number = 0.0;

    // Environmental Interaction
    temperature: number = 0.0;
    drag: number = 0.0;
    bounce: number = 0.0;
    friction: number = 0.0;
    damper: number = 0.0;
}

export class DefaultOptions implements BaseOptions {
    type: string;

    // Position and Motion
    isStatic: boolean;
    rate: number;
    speedRange: Range;
    xSpeedRange: Range;
    ySpeedRange: Range;

    // Physical Properties
    sizeRange: Range;
    density: number;

    // Lifecycle
    lifeRange: Range;
    lifespan: number;

    // Visual Properties
    alpha: number;
    color: Color;
    angle: number;
    rotation: number;
    angularVelocity: number;

    // Environmental Interaction
    temperature: number;
    drag: number;
    bounce: number;
    friction: number;
    damper: number;

    constructor(type = 'default') {
        this.type = type;

        // Position and Motion
        this.isStatic = false;
        this.rate = 2.5;
        this.speedRange = new Range(-2.0, 2.0);
        this.xSpeedRange = this.speedRange;
        this.ySpeedRange = this.speedRange;
        // Physical Properties
        this.sizeRange = new Range(1.0, 10.0);
        this.density = 1;

        // Lifecycle
        this.lifeRange = new Range(2.0, 5.0);
        this.lifespan = Utility.random(this.lifeRange.min,
            this.lifeRange.max);

        // Visual Properties
        this.alpha = 1.0;
        this.color = new Color(Utility.randomColor());
        this.angle = Utility.random(Constants.TWO_PI);
        this.rotation = Utility.random(Constants.TWO_PI);
        this.angularVelocity = Utility.random(0, Constants.TWO_PI);

        // Environmental Interaction
        this.temperature = 20.0;
        this.drag = 0.98;
        this.bounce = 0.7;
        this.friction = 9.5;
        this.damper = 0.75;
    }

    get speed(): number {
        return Utility.random(this.speedRange.min, this.speedRange.max);
    }

    get size(): number {
        return Utility.random(this.sizeRange.min, this.sizeRange.max);
    }

    get mass(): number {
        // Mass = Density * Area;
        return (this.density * Constants.PI * this.size * this.size);
    }
}

export class EmitterOptions extends OptionsDecorator {
    position: Vector = new Vector(Constants.CENTER.x,
        Constants.CENTER.y - 200);

    constructor(options: BaseOptions = new DefaultOptions()) {
        super(options);
        this.type = 'emitter';
        this.isStatic = true;
    }
}

export class BoundsOptions extends OptionsDecorator {
    padding: number = 20.0;
    strength: number = 5.0;

    constructor(options: BaseOptions = new DefaultOptions()) {
        super(options);
        this.type = 'bounds';
        this.isStatic = true;
        this.damper = 0.8;
    }
}

export class SmokeOptions extends OptionsDecorator {
    maxLife: number = 256.0;
    gravity: Vector = new Vector(0, 0.0001);


    constructor(options: BaseOptions = new DefaultOptions()) {
        super(options);
        this.type = 'smoke';
        this.drag = 0.99;
        this.color = new Color(Utility.randomGray());
        this.ySpeedRange = new Range(-1, 0);
        this.lifespan = Utility.random(this.lifeRange.min, this.maxLife);
    }

    get vx(): number {
        return Utility.random(this.xSpeedRange.min, this.xSpeedRange.max);
    }

    get vy(): number {
        return Utility.random(this.ySpeedRange.min, this.ySpeedRange.max);
    }
}

