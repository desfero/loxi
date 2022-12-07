import {LoxClass} from "./lox-class";
import {Token} from "../shared/token";
import {Value} from "./environment";

export class LoxInstanceError extends Error {}

export class LoxInstance {
    private fields = new Map<string, Value>();

    constructor(private clazz: LoxClass) {
    }

    get(token: Token): Value {
        const name = token.lexeme;

        if (this.fields.has(name)) {
            return this.fields.get(name);
        }

        const method = this.clazz.findMethod(token.lexeme);
        if (method !== null) {
            return method.bind(this);
        }

        throw new LoxInstanceError(`Undefined property '${name}'.`);
    }

    set(token: Token, value: Value) {
        this.fields.set(token.lexeme, value);
    }

    toString() {
        return `${this.clazz.name} instance`;
    }
}
