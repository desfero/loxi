import {Stmt} from "./stmt";
import {StmtVisitor} from "./stmt-visitor";
import {Token} from "../token";
import {FunctionStmt} from "./function-stmt";
import {Variable} from "../expr/variable";

export class ClassStmt extends Stmt {
    constructor(public name: Token, public superClass: Variable | null, public methods: FunctionStmt[]) {
        super();
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitClassStmt(this);
    }
}
