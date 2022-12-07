import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";

export class WhileStmt extends Stmt {
    constructor(public condition: Expr, public body: Stmt) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}
