export type Value = Object | null;

export class EnvironmentError extends Error {}

export class Environment {
    private values: Map<string, Value> = new Map();

    constructor(public readonly enclosing: Environment | null) {}

    define(name: string, value: Value): void {
        this.values.set(name, value);
    }

    assign(name: string, value: Value): void {
        if (this.values.has(name)) {
            this.values.set(name, value);
            return;
        }

        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new EnvironmentError(`Undefined variable "${name}".`);
    }

    assignAt(distance: number, name: string, value: Value): void {
        this.ancestor(distance).values.set(name, value);
    }

    get(name: string): Value {
        if (this.values.has(name)) {
            return this.values.get(name)!;
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }


        throw new EnvironmentError(`Undefined variable "${name}".`);
    }

    getAt(distance: number, name: string): Value {
        return this.ancestor(distance).values.get(name);
    }

    ancestor(distance: number): Environment {
        let environment: Environment = this;

        for (let i = 0; i < distance; i++) {
            environment = environment.enclosing;
        }

        return environment;
    }
}
