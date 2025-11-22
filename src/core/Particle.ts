import Context from '../renderer/Context';
//import { Bounds } from "../shapes/Obstacle";
//import { QuadTree, Circle } from '../shapes/QuadTree';
//import Color from '../utils/Color/Color';
import Utility from '../utils/Utility';
import Vector from '../utils/Vector';
//import Easing from '../utils/Easing';

// A single temporary vector for all calculations to prevent object instantiation in loops
const zeroVector = new Vector(0, 0);
//const queryCircle = new Circle(0, 0, 0);

export default class Particle {
    static #normalizationConstant: number = 0;
    static #h: number = 0;
    static #h2: number = 0;

    id: string;
    options: any;
    position: Vector = zeroVector;
    prevPosition: Vector = zeroVector;
    velocity: Vector = zeroVector;
    acceleration: Vector = zeroVector;
    callback: ((p: Particle) => void) | undefined;
    active: boolean = false;
    //ease = new Easing(Easing.easeInOutBounce);

    constructor(options: any) {
        this.id = Utility.nextId();
        this.options = options;
    }

    init(callback: (p: Particle) => void, position = zeroVector,
        velocity = zeroVector) {
        this.callback = callback;
        this.active = true;
        this.position = position;
        this.prevPosition = position.clone();
        this.velocity = velocity;
        this.acceleration.multiply(0);
    }

    destroy() {
        this.active = false;
        // The callback moves the particle back to the pool via the Emitter
        if (this.callback) {
            this.callback(this);
        }
        // Clear the callback reference after use
        this.callback = undefined;
    }

    reset() {
        this.active = false;
        this.position = zeroVector;
        this.velocity = zeroVector;
    }

    get dead() {
        return this.options.lifespan < 0;
    }

    // Applies a force based on Newton's Second Law: a = F / m
    applyForce(force: Vector) {
        if (this.options.isStatic) return;
        this.acceleration.add(Vector.divide(force, this.options.mass));
    }

    // Applies a drag force that opposes velocity
    applyDrag() {
        if (this.options.isStatic) return;
        const speed = this.velocity.magnitude();
        if (speed === 0) return;
        const zero = zeroVector.clone();
        zero.copy(this.velocity)
            .normalize()
            .multiply(-speed * this.options.friction);

        this.applyForce(zero);
        zero.multiply(0);
    }

    //applyConstraints(obstacles: Bounds[] = []) {
    //    for (const obs of obstacles) obs.collide(this);
    //}

    // A simplified Verlet integration for better stability
    Oupdate(dt: number) {
        if (this.options.isStatic || this.dead) return;

        // Use the non-allocating vector math version
        const dt2 = dt * dt;

        zeroVector.copy(this.position)
            .multiply(2)
            .subtract(this.prevPosition)
            .add(this.acceleration
                .multiply(dt2));

        this.prevPosition.copy(this.position);
        this.position.copy(zeroVector);
        console.log("POSITION:", this.position);
        // Velocity calculation (optimized)
        this.velocity.copy(this.position).subtract(
            this.prevPosition).divide(dt);

        this.acceleration.multiply(0);
        this.options.lifespan -= dt;
    }

    update(dt: number) {
        const { newPosition, oldPosition } = {
            ...Utility.eulerUpdate(
                this, dt)
        };
        this.prevPosition = oldPosition;
        this.position = newPosition;
        this.options.lifespan -= dt;
        this.options.alpha = this.options.lifespan / (2 *
            this.options.lifeRange.max);
        if (this.options.lifespan < 0) this.destroy();
    }

    verlet_update(dt: number) {
        const { newPosition, oldPosition } = {
            ...Utility.verletUpdate(this, dt)
        };
        this.prevPosition = oldPosition;
        this.position = newPosition;
        this.options.lifespan -= dt;
        this.options.alpha = this.options.lifespan / (2 *
            this.options.lifeRange.max);
        if (this.options.lifespan < 0) this.destroy();
    }

    draw(ctx: Context) {
        if (this.dead) return;
        this.options.color = this.options.color.withAlpha(this.options.alpha);
        ctx.circle(this.position.x, this.position.y,
            this.options.radius, this.options.color);
    }

    run(ctx: Context, dt: number) {
        this.update(dt);
        //this.verlet_update( dt );
        this.draw(ctx);
    }

    // Collision Detection and Resolution
    checkCollision(other: Particle) {
        zeroVector.copy(other.position).subtract(this.position);
        const sumRadius = this.options.radius + other.options.radius;
        const distance = zeroVector.magnitude();

        if (distance < sumRadius) {
            const overlap = sumRadius - distance;

            if (distance === 0) {
                const randomDirection =
                    Vector.randomDirection().multiply(overlap / 2);
                this.position.add(randomDirection);
                other.position.subtract(randomDirection);
                return;
            }

            zeroVector.normalize();
            const collisionNormal = zeroVector;

            const correctionVector = zeroVector.multiply(overlap / 2);
            this.position.add(correctionVector);
            other.position.subtract(correctionVector);

            const vRel = zeroVector.copy(this.velocity).subtract(
                other.velocity);
            const speed = vRel.dot(collisionNormal);

            if (speed && speed < 0) {
                const mSum = this.options.mass + other.options.mass;
                const mThisRatio = 2 * other.options.mass / mSum;
                const mOtherRatio = 2 * this.options.mass / mSum;

                const impulse = collisionNormal.multiply(speed);

                this.velocity.subtract(zeroVector.copy(impulse
                ).multiply(mThisRatio));
                other.velocity.add(impulse.multiply(mOtherRatio));
            }
        }
    }

    // Bounce edges
    checkBoundaries(ctx: Context) {
        if (this.position.x > ctx.width - this.options.radius) {
            this.position.x = ctx.width - this.options.radius;
            this.velocity.x *= -1;
        } else if (this.position.x < this.options.radius) {
            this.position.x = this.options.radius;
            this.velocity.x *= -1;
        }

        if (this.position.y > ctx.height - this.options.radius) {
            this.position.y = ctx.height - this.options.radius;
            this.velocity.y *= -1;
        } else if (this.position.y < this.options.radius) {
            this.position.y = this.options.radius;
            this.velocity.y *= -1;
        }
    }

    /**
     ** How to Calculate the Density of a 2D Particle
     *
     * For a particle simulation, the concept of "density" for a single particle is not
     * meaningful. Instead, you calculate the local density at a specific particle's
     * position by considering all the neighboring particles within a certain area. This
     * is a core component of many particle-based physics simulations, such as
     * Smoothed-Particle Hydrodynamics (SPH).
     *
     * The local density for a particle (\(p_{i}\)) is the sum of the mass contributions of its
     * neighbors, weighted by a "smoothing kernel" function (W) that decreases with distance.
     * This gives more weight to closer particles and no weight to particles outside a
     * defined "smoothing radius" (h).
     *
     ** Formula for density in 2D
     *
     * The standard formula for calculating the local density (\(\rho _{i}\)) of a particle
     * (\(p_{i}\)) in 2D is:
     *
     **     (\(\rho _{i}\)) = sum from (\(m{j}\)) * W( (\(r_{i}{j})), h)
     *
     * Where:
     *  - (\(m_{j}\)) is the mass of a neighboring particle (\(p_{j}\)).
     *  - (\(r_{i}{j})) is the distance between particle (\(p_{i}\)) and particle (\(p_{j}\)).
     *  - h is the smoothing radius.
     *  - W is the smoothing kernel function.
     *
     ** A common choice for the kernel function is the Poly6 kernel.
     *
     * The Poly6 kernel function is defined as:
     *
     **     W(r, h) = (4 / (Math.PI * h^8)) * (h^2 - r^2)^3
     *
     * Where:
     *  - r is the distance from the center.
     *  - h is the smoothing radius.
     *  - The pre-factor (4 / (Math.PI * h^8)) is a normalization constant
     *      to ensure the integral of the kernel over its domain is one.
     *  - The function is non-zero only when r <= h.
     */

    /**
     * Poly6 kernel function using distance squared to avoid Math.sqrt().
     * @param {number} r2 - The distance squared between particles
     * @returns {number} The kernel value
     */
    static #poly6KernelSq(r2: number) {
        if (r2 > Particle.#h2) return 0;
        const diff = Particle.#h2 - r2;
        return Particle.#normalizationConstant * diff * diff * diff;
    }

    /**
     * Set the smoothing radius and precompute constants for efficiency.
     * This should be called once per frame if 'h' is adaptive, or once at initialization if constant.
     * @param {number} h - The smoothing radius
     */
    static setSmoothingRadius(h: number) {
        Particle.#h = h;
        Particle.#h2 = h * h;
        const h4 = Particle.#h2 * Particle.#h2;
        const h8 = h4 * h4;
        Particle.#normalizationConstant = (4 / Math.PI) / h8;
    }

    /**
     * Calculates the density for all particles using the current smoothing radius.
     * @param {Array<Particle>} particles - The array of particles
     */
    static calculateDensities(particles: Array<Particle>,
        smoothingRadius: number = 1.0) {
        const tempVector = new Vector(0, 0);

        this.setSmoothingRadius(smoothingRadius);

        // Cache the constant for the kernel value at r=0
        const kernel0 = this.#poly6KernelSq(0);

        for (const p1 of particles) {
            p1.options.density = p1.options.mass * kernel0; // Density contribution from itself

            for (const p2 of particles) {
                if (p1 === p2) continue;

                // Use the squared magnitude to avoid costly Math.sqrt()
                const distanceSq = tempVector.copy(p1.position
                ).subtract(p2.position).magnitudeSq();

                // Get kernel value using the squared distance
                const densityContribution = p2.options.mass *
                    this.#poly6KernelSq(distanceSq);
                p1.options.density += densityContribution;
            }
        }
    }

    /**
     * Calculates the density for all particles using a quadtree for efficiency.
     * @param {Array<Particle>} particles - The array of particles.
     * @param {Quadtree} quadtree - The quadtree containing the particles.
     * @param {number} smoothingRadius - The smoothing radius (optional).
     */
    /*
    static calculateDensitiesWithQuadtree(particles: Array<Particle>,
        quadtree: QuadTree, smoothingRadius: number = 1.0) {
        const tempVector = new Vector(0, 0);

        // Set smoothing radius once per frame (or when it changes)
        Particle.setSmoothingRadius(smoothingRadius);

        // Cache the constant for the kernel value at r=0
        const kernel0 = this.#poly6KernelSq(0);

        queryCircle.r = Particle.#h;

        for (const p1 of particles) {
            p1.options.density = p1.options.mass * kernel0; // Self-density

            // Update the query circle's position using the particle's position
            queryCircle.x = p1.position.x;
            queryCircle.y = p1.position.y;

            const neighbors = quadtree.query(queryCircle);

            if (Array.isArray(neighbors)) {
                for (const p2 of neighbors) {
                    if (p1 === p2) continue;

                    // Use zeroVector for subtraction to avoid new object allocation
                    tempVector.copy(p1.position).subtract(p2.position);
                    const distanceSq = tempVector.magnitudeSq();

                    // Optimization: The quadtree query already filters by radius,
                    // but this check is cheap and robust.
                    if (distanceSq <= Particle.#h2) {
                        const densityContribution = p2.options.mass *
                            this.#poly6KernelSq(distanceSq);
                        p1.options.density += densityContribution;
                    }
                }
            }
        }
    }//*/
} // End class Particle