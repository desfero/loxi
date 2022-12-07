import { Expr } from "./expr";
import { Token } from "../token";
import {ExprVisitor} from "./expr-visitor";

export class Unary extends Expr {
    constructor(public operator: Token, public right: Expr) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}
