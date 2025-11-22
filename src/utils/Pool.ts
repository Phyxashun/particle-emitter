class ObjectNotProvidedError extends Error {
    constructor(message: string | undefined) {
        super(message);
        this.name = 'ObjectNotProvidedError';
    }
}

class Pool<T> {
    #allObjects: T[] = [];
    #activeObjects: T[] = [];
    #inactiveObjects: T[] = [];

    // Store the constructor type safely in a private readonly field
    ObjectClass: new (options: any) => T;
    maxSize: number;
    options: any;

    /**
     * @param { ClassConstructor< T > } ObjectClass - The class to be pooled (e.g., Particle).
     * @param { number } maxSize - The maximum size of the object pool.
     */
    constructor(ObjectClass: new (options: any) => T, maxSize:
        number, options: any) {
        if (!ObjectClass) {
            throw new ObjectNotProvidedError('An object class must be provided to the Pool constructor.');
        }

        this.ObjectClass = ObjectClass;
        this.maxSize = maxSize;
        this.options = options;
        this.init();

        if (__DEBUG__) console.log("POOL:", this);
    }

    /**
     * Pre-fills the pool with objects.
     */
    private init(): void {
        for (let index = 0; index < this.maxSize; index++) {
            const newObject = this.createObject();
            this.#allObjects.push(newObject);
            this.#inactiveObjects.push(newObject);
        }
    }

    /**
     * Creates a new instance of T using the provided constructor.
     */
    private createObject(): T {
        return new this.ObjectClass(this.options);
    }

    /**
     * Retrieves an object from the pool.
     * Returns null if the pool has reached its maximum size.
     */
    acquire(): T | null {
        let object: T;
        if (this.#inactiveObjects.length > 0) {
            // Pop from inactive, it is guaranteed to be T
            object = this.#inactiveObjects.pop()!;
        } else if (this.#allObjects.length < this.maxSize) {
            // Create a new instance if capacity allows
            object = this.createObject();
            this.#allObjects.push(object);
        } else {
            return null; // Pool is full
        }

        this.#activeObjects.push(object);

        return object;
    }

    /**
     * Releases an object back to the pool.
     * It's good practice to ensure the released object isn't already inactive.
     * @param { object } object - The object to release.
     */
    release(object: T): void {
        const activeIndex = this.#activeObjects.indexOf(object);

        if (activeIndex > -1) {
            // Remove from active objects
            this.#activeObjects.splice(activeIndex, 1);

            // Add back to inactive objects *if* it's not already there(safety check)
            if (this.#inactiveObjects.indexOf(object) === -1) {
                this.#inactiveObjects.push(object);
            }
        } else {
            // Optional warning if you try to release an unmanaged or already inactive object
            console.warn("Attempted to release an object that was not active or managed by this pool.");
        }
    }

    /**
     * All currently active objects.
     */
    getActivePool(): T[] {
        return this.#activeObjects;
    }

    /**
     * Get the total number of objects in the pool (active and inactive).
     */
    get length(): number {
        return this.#allObjects.length;
    }

    /**
     * Make the pool iterable so it can be used with `for...of` loops over active items.
     */
    *[Symbol.iterator](): Iterator<T> {
        for (const object of this.#activeObjects) {
            yield object;
        }
    }
}

export default Pool;