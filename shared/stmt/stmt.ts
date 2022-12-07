import {StmtVisitor} from "./stmt-visitor";

export abstract class Stmt {
    abstract accept<R>(visitor: StmtVisitor<R>): R

}
