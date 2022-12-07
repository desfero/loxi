import { Expr } from "./expr";
import { Token } from "../token";
import { ExprVisitor } from "./expr-visitor";

export class Call extends Expr {
    constructor(public callee: Expr, public paren: Token, public args: Expr[]) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }
}
