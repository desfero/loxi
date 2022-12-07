import { Expr } from "./expr";
import { Token } from "../token";
import { ExprVisitor } from "./expr-visitor";

export class Binary extends Expr {
    constructor(public left: Expr, public operator: Token, public right: Expr) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}
