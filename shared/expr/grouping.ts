import { Expr } from "./expr";
import {ExprVisitor} from "./expr-visitor";

export class Grouping extends Expr {
    constructor(public expression: Expr) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGropingExpr(this);
    }
}
