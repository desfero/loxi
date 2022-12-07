import { Expr } from "./expr";
import { Token } from "../token";
import {ExprVisitor} from "./expr-visitor";

export class This extends Expr {
    constructor(public keyword: Token) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}
