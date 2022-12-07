import { Expr } from "./expr";
import {ExprVisitor} from "./expr-visitor";

export class Literal extends Expr {
    constructor(public value: Object | null) {
        super();
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}
