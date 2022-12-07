import {Args, Callable} from "./callable";
import {Interpreter} from "./interpreter";
import {LoxInstance} from "./lox-instance";
import {LoxFunction} from "./lox-function";

export class LoxClass extends Callable {
    constructor(public name: string, private superClass: LoxClass | null, private methods: Map<string, LoxFunction>) {
        super();
    }

    toString() {
        return this.name;
    }

    arity(): number {
        const initializer = this.findMethod("init");

        if (initializer === null) {
            return 0;
        }

        return initializer.arity();
    }

    call(interpreter: Interpreter, args: Args[]): Object | null {
        const instance = new LoxInstance(this);
        const initializer = this.findMethod("init");

        if (initializer !== null) {
            initializer.bind(instance).call(interpreter, args);
        }

        return instance;
    }

    findMethod(name: string): LoxFunction | null {
        if (this.methods.has(name)) {
            return this.methods.get(name);
        }

        if (this.superClass !== null) {
            return this.superClass.findMethod(name);
        }

        return null;
    }
}
