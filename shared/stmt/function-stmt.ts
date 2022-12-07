import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Expr} from "../expr/expr";
import {Token} from "../token";

export class FunctionStmt extends Stmt {
    constructor(public name: Token, public params: Token[], public body: Stmt[]) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}
