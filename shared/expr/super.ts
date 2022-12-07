import { Expr } from "./expr";
import { Token } from "../token";
import {ExprVisitor} from "./expr-visitor";

export class Super extends Expr {
    constructor(public keyword: Token, public method: Token) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSuperExpr(this);
    }
}
