import { Expr } from "./expr";
import { Token } from "../token";
import { ExprVisitor } from "./expr-visitor";

export class Logical extends Expr {
    constructor(public left: Expr, public operator: Token, public right: Expr) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
}
