import {Binary} from "./binary";
import {Unary} from "./unary";
import {Grouping} from "./grouping";
import {Literal} from "./literal";
import {Variable} from "./variable";
import {Assign} from "./assign";
import {Logical} from "./logical";
import {Call} from "./call";
import {Get} from "./get";
import {Set} from "./set";
import {This} from "./this";
import {Super} from "./super";

export interface ExprVisitor<R> {
    visitThisExpr(expr: This): R;
    visitSuperExpr(expr: Super): R;
    visitBinaryExpr(expr: Binary): R;
    visitCallExpr(expr: Call): R;
    visitLogicalExpr(expr: Logical): R;
    visitUnaryExpr(expr: Unary): R;
    visitGropingExpr(expr: Grouping): R;
    visitLiteralExpr(expr: Literal): R;
    visitVariableExpr(expr: Variable): R;
    visitAssignExpr(expr: Assign): R;
    visitGetExpr(expr: Get): R;
    visitSetExpr(expr: Set): R;
}
