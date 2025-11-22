import Vector from '../utils/Vector';
import Pool from '../utils/Pool';
import Particle from './Particle';
import Context from '../renderer/Context';
import { EmitterOptions, SmokeOptions } from './Options';

export default class Emitter {
    options: EmitterOptions;
    position: Vector;

    private pool: Pool<Particle>;

    constructor(options: EmitterOptions) {
        this.options = options;
        this.position = this.options.position.clone();
        const pOptions = new SmokeOptions();
        this.pool = new Pool<Particle>(Particle,
            Constants.MAX_PARTICLES, pOptions);
    }

    get length() {
        return this.pool.length;
    }

    private release = (p: Particle): void => {
        this.pool.release(p);
    }

    addParticles(): void {
        const p = this.pool.acquire();
        if (!p) return; // Pool is empty
        const velocity = new Vector(p.options.vx, p.options.vy);
        p.init(this.release, this.position, velocity);
    }

    run(ctx: Context, dt: number): void {
        const particles = this.pool.getActivePool();

        for (const p of particles) {
            if (!p) return;
            if (p.active) {
                p.run(ctx, dt);
            }
        }
    }
}