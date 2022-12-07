import { Expr } from "./expr";
import { Token } from "../token";
import { ExprVisitor } from "./expr-visitor";

export class Assign extends Expr {
    constructor(public name: Token, public value: Expr) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}
