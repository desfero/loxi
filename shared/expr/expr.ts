import {ExprVisitor} from "./expr-visitor";

export abstract class Expr {
    abstract accept<R>(visitor: ExprVisitor<R>): R
}
