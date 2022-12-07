import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";
import {Token} from "../token";

export class VarStmt extends Stmt {
    constructor(public name: Token, public initializer: Expr | null) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitVarStmt(this);
    }
}
