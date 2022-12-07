import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";
import {Token} from "../token";

export class ReturnStmt extends Stmt {
    constructor(public keyword: Token, public value: Expr) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}
