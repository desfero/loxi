import {Callable} from "./callable";

export class Clock extends Callable {
    arity(): number {
        return 0;
    }

    call(): Object | null {
        return Date.now() / 1000;
    }

    toString() {
        return "<native fn>";
    }
}
