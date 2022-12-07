import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";

export class IfStmt extends Stmt {
    constructor(public condition: Expr, public thenBranch: Stmt, public elseBranch: Stmt | null) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}
