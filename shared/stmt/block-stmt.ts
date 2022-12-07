import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";

export class BlockStmt extends Stmt {
    constructor(public statements: Stmt[]) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}
