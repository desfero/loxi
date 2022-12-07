import {ExprVisitor} from "../shared/expr/expr-visitor";
import {StmtVisitor} from "../shared/stmt/stmt-visitor";
import {Interpreter} from "../interpreter/interpreter";
import {Assign} from "../shared/expr/assign";
import {Binary} from "../shared/expr/binary";
import {BlockStmt} from "../shared/stmt/block-stmt";
import {Call} from "../shared/expr/call";
import {ExpressionStmt} from "../shared/stmt/expression-stmt";
import {FunctionStmt} from "../shared/stmt/function-stmt";
import {Grouping} from "../shared/expr/grouping";
import {IfStmt} from "../shared/stmt/if-stmt";
import {Literal} from "../shared/expr/literal";
import {Logical} from "../shared/expr/logical";
import {PrintStmt} from "../shared/stmt/print-stmt";
import {ReturnStmt} from "../shared/stmt/return-stmt";
import {Unary} from "../shared/expr/unary";
import {VarStmt} from "../shared/stmt/var-stmt";
import {Variable} from "../shared/expr/variable";
import {WhileStmt} from "../shared/stmt/while-stmt";
import {Stmt} from "../shared/stmt/stmt";
import {Expr} from "../shared/expr/expr";
import {Token} from "../shared/token";
import {ErrorReporter} from "../error-reporter";
import {ClassStmt} from "../shared/stmt/class-stmt";
import { Get } from "../shared/expr/get";
import { Set } from "../shared/expr/set";
import { This } from "../shared/expr/this";
import { Super } from "../shared/expr/super";

class ResolverError extends Error {
}

enum FunctionType {
    NONE,
    FUNCTION,
    METHOD,
    INITIALIZER
}

enum ClassType {
    NONE,
    CLASS,
    SUBCLASS
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private scopes: Record<string, boolean>[] = [];
    private currentFunction = FunctionType.NONE;
    private currentClass = ClassType.NONE;

    constructor(private interpreter: Interpreter) {
    }

    resolveStmts(stmts: Stmt[]) {
        stmts.forEach(stmt => this.resolveStmt(stmt));
    }

    resolveStmt(stmt: Stmt) {
        stmt.accept(this);
    }

    resolveExpr(expr: Expr) {
        expr.accept(this);
    }

    visitSuperExpr(expr: Super): void {
        if (this.currentClass === ClassType.NONE) {
            this.error(expr.keyword, "Can't use 'super' outside of a class.");
        }
        if (this.currentClass === ClassType.CLASS) {
            this.error(expr.keyword, "Can't use 'super' in a class with no superclass.");
        }

        this.resolveLocal(expr, expr.keyword);
    }

    visitThisExpr(expr: This): void {
        if (this.currentClass === ClassType.NONE) {
            this.error(expr.keyword, "Can't use 'this' outside of a class.");
        }

        this.resolveLocal(expr, expr.keyword);
    }

    visitSetExpr(expr: Set): void {
        this.resolveExpr(expr.value);
        this.resolveExpr(expr.object);
    }

    visitClassStmt(stmt: ClassStmt): void {
        const enclosingClass = this.currentClass;
        this.currentClass = ClassType.CLASS;

        this.declare(stmt.name);
        this.define(stmt.name);

        if (stmt.superClass !== null && stmt.name.lexeme === stmt.superClass.name.lexeme) {
            this.error(stmt.superClass.name, "A class can't inherit from itself.");
        }

        if (stmt.superClass !== null) {
            this.currentClass = ClassType.SUBCLASS;
            this.resolveExpr(stmt.superClass);

            this.beginScope();
            this.scopes.at(-1)["super"] = true;
        }

        this.beginScope();
        this.scopes.at(-1)["this"] = true;

        stmt.methods.forEach(method => {
            const declaration = method.name.lexeme === "init" ? FunctionType.INITIALIZER : FunctionType.METHOD;
            this.resolveFunction(method, declaration);
        });

        this.endScope();

        if (stmt.superClass !== null) {
            this.endScope();
        }

        this.currentClass = enclosingClass;
    }

    visitAssignExpr(expr: Assign): void {
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name)
    }

    visitBinaryExpr(expr: Binary): void {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    visitGetExpr(expr: Get): void {
        this.resolveExpr(expr.object);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();

        this.resolveStmts(stmt.statements);

        this.endScope();
    }

    visitCallExpr(expr: Call): void {
        this.resolveExpr(expr.callee);
        expr.args.forEach(arg => this.resolveExpr(arg));
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.resolveExpr(stmt.expr);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt, FunctionType.FUNCTION);
    }

    visitGropingExpr(expr: Grouping): void {
        this.resolveExpr(expr.expression);
    }

    visitIfStmt(stmt: IfStmt): void {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.resolveStmt(stmt.elseBranch);
        }
    }

    visitLiteralExpr(expr: Literal): void {
        return;
    }

    visitLogicalExpr(expr: Logical): void {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    visitPrintStmt(stmt: PrintStmt): void {
        this.resolveExpr(stmt.expr);
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        if (this.currentFunction === FunctionType.NONE) {
            this.error(stmt.keyword, "Can't return from top-level code.");
        }

        if (stmt.value !== null) {
            if (this.currentFunction === FunctionType.INITIALIZER) {
                this.error(stmt.keyword, "Can't return a value from an initializer.");
            }

            this.resolveExpr(stmt.value);
        }
    }

    visitUnaryExpr(expr: Unary): void {
        this.resolveExpr(expr.right);
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declare(stmt.name);

        if (stmt.initializer !== null) {
            this.resolveExpr(stmt.initializer);
        }

        this.define(stmt.name);
    }

    visitVariableExpr(expr: Variable): void {
        if (this.scopes.length > 0 && this.scopes.at(-1)[expr.name.lexeme] === false) {
            this.error(expr.name, "Can't read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.body);
    }

    private resolveFunction(stmt: FunctionStmt, type: FunctionType) {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = type;

        this.beginScope();

        stmt.params.forEach(param => {
            this.declare(param);
            this.define(param);
        })

        this.resolveStmts(stmt.body);

        this.endScope();

        this.currentFunction = enclosingFunction;
    }

    private resolveLocal(expr: Expr, name: Token) {
        const numberOfScopes = this.scopes.length;

        for (let i = numberOfScopes - 1; i >= 0; i--) {
            const scope = this.scopes[i];

            if (scope[name.lexeme] !== undefined) {
                this.interpreter.resolve(expr, numberOfScopes - 1 - i);
                return;
            }
        }
    }

    private beginScope() {
        this.scopes.push({});
    }

    private endScope() {
        this.scopes.pop();
    }

    private declare(name: Token) {
        if (this.scopes.length === 0) {
            return;
        }

        const scope = this.scopes.at(-1);

        if (scope[name.lexeme] !== undefined) {
            this.error(name, "Already a variable with this name in this scope.");
        }

        scope[name.lexeme] = false;
    }

    private define(name: Token) {
        if (this.scopes.length === 0) {
            return;
        }

        const scope = this.scopes.at(-1);

        scope[name.lexeme] = true;
    }


    private error(token: Token, message: string): ResolverError {
        ErrorReporter.reportSyntaxError(token.line, "", message)

        return new ResolverError();
    }
}
