import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";

export class PrintStmt extends Stmt {
    constructor(public expr: Expr) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}
