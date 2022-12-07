import {Interpreter} from "./interpreter";

export type Args = Object | null;

export const isCallable = (value: unknown): value is Callable => value instanceof Callable;

export abstract class Callable {
    abstract arity(): number;
    abstract call(interpreter: Interpreter, args: Args[]): Object | null;
}

