import {Args, Callable} from "./callable";
import {FunctionStmt} from "../shared/stmt/function-stmt";
import {Interpreter, Return} from "./interpreter";
import {Environment} from "./environment";
import {LoxInstance} from "./lox-instance";

export class LoxFunction extends Callable {
    constructor(private declaration: FunctionStmt, private closure: Environment, private isInitializer: boolean) {
        super();
    }

    arity(): number {
        return this.declaration.params.length;
    }

    call(interpreter: Interpreter, args: Args[]): Object | null {
        const environment = new Environment(this.closure);

        this.declaration.params.forEach((param, i) => {
           environment.define(param.lexeme, args[i]);
        });


        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (e) {
            if (e instanceof Return) {
                if (this.isInitializer) {
                    return this.closure.getAt(0, "this");
                }

                return e.value;
            }

            throw e;
        }

        if (this.isInitializer) {
            return this.closure.getAt(0, "this");
        }

        return null;
    }

    bind(instance: LoxInstance) {
        const environment = new Environment(this.closure);
        environment.define("this", instance);
        return new LoxFunction(this.declaration, environment, this.isInitializer);
    }

    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}
