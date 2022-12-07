import {ExprVisitor} from "./shared/expr/expr-visitor";
import {Expr} from "./shared/expr/expr";
import {Binary} from "./shared/expr/binary";
import {Grouping} from "./shared/expr/grouping";
import {Literal} from "./shared/expr/literal";
import {Unary} from "./shared/expr/unary";

export class AstPrinter implements ExprVisitor<string> {
    print(expr: Expr): string {
        return expr.accept(this);
    }

    visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGropingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil";
        return expr.value.toString();
    }

    visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    private parenthesize(name: string, ...exprs: Expr[]) {
        return `(${name}${exprs.map(exp => ` ${exp.accept(this)}`)})`;
    }
}
