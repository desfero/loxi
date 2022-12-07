import {PrintStmt} from "./print-stmt";
import {ExpressionStmt} from "./expression-stmt";
import {VarStmt} from "./var-stmt";
import {BlockStmt} from "./block-stmt";
import {IfStmt} from "./if-stmt";
import {WhileStmt} from "./while-stmt";
import {FunctionStmt} from "./function-stmt";
import {ReturnStmt} from "./return-stmt";
import {ClassStmt} from "./class-stmt";

export interface StmtVisitor<R> {
    visitPrintStmt(expr: PrintStmt): R;
    visitClassStmt(expr: ClassStmt): R;
    visitFunctionStmt(expr: FunctionStmt): R;
    visitWhileStmt(expr: WhileStmt): R;
    visitIfStmt(expr: IfStmt): R;
    visitReturnStmt(expr: ReturnStmt): R;
    visitExpressionStmt(expr: ExpressionStmt): R;
    visitVarStmt(expr: VarStmt): R;
    visitBlockStmt(expr: BlockStmt): R;
}
