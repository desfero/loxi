import { Expr } from "./expr";
import { Token } from "../token";
import { ExprVisitor } from "./expr-visitor";

export class Set extends Expr {
    constructor(public object: Expr, public name: Token, public value: Expr) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSetExpr(this);
    }
}
