import { Expr } from "./expr";
import { Token } from "../token";
import { ExprVisitor } from "./expr-visitor";

export class Get extends Expr {
    constructor(public object: Expr, public name: Token) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }
}
