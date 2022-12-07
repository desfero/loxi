import {ExprVisitor} from "../shared/expr/expr-visitor";
import {Binary} from "../shared/expr/binary";
import {Grouping} from "../shared/expr/grouping";
import {Literal} from "../shared/expr/literal";
import {Unary} from "../shared/expr/unary";
import {Expr} from "../shared/expr/expr";
import {Token, TokenType} from "../shared/token";
import {unreachable} from "../shared/utils";
import {ErrorReporter} from "../error-reporter";
import {StmtVisitor} from "../shared/stmt/stmt-visitor";
import {ExpressionStmt} from "../shared/stmt/expression-stmt";
import {PrintStmt} from "../shared/stmt/print-stmt";
import {Stmt} from "../shared/stmt/stmt";
import {Variable} from "../shared/expr/variable";
import {Environment, Value} from "./environment";
import {VarStmt} from "../shared/stmt/var-stmt";
import {Assign} from "../shared/expr/assign";
import {BlockStmt} from "../shared/stmt/block-stmt";
import {IfStmt} from "../shared/stmt/if-stmt";
import {Logical} from "../shared/expr/logical";
import {WhileStmt} from "../shared/stmt/while-stmt";
import { Call } from "../shared/expr/call";
import {isCallable} from "./callable";
import {Clock} from "./clock";
import {FunctionStmt} from "../shared/stmt/function-stmt";
import {LoxFunction} from "./lox-function";
import {ReturnStmt} from "../shared/stmt/return-stmt";
import {ClassStmt} from "../shared/stmt/class-stmt";
import {LoxClass} from "./lox-class";
import { Get } from "../shared/expr/get";
import {LoxInstance} from "./lox-instance";
import { Set } from "../shared/expr/set";
import { This } from "../shared/expr/this";
import {Lox} from "../lox";
import {Super} from "../shared/expr/super";

class InterpreterError extends Error {
}

export class Return extends InterpreterError {
    constructor(public value: Object | null) {
        super();
    }
}

export class Interpreter implements ExprVisitor<Object | null>, StmtVisitor<void> {
    private globals = new Environment(null);
    private locals = new Map<Expr, number>;
    private environment = this.globals;

    constructor() {
        this.globals.define("clock", new Clock());
    }

    interpret(stmts: Stmt[]): void {
        try {
            for (const stmt of stmts) {
                this.execute(stmt);
            }
        } catch(e) {
            console.error(e);
        }
    }

    resolve(expr: Expr, depth: number) {
        this.locals.set(expr, depth);
    }

    visitClassStmt(stmt: ClassStmt): void {
        let superClass: LoxClass | null = null;

        if (stmt.superClass !== null) {
            const resolved = this.evaluate(stmt.superClass);

            if (resolved instanceof LoxClass) {
                superClass = resolved;
            } else {
                throw this.error(stmt.superClass.name, "Superclass must be a class.");
            }
        }

        const name = stmt.name.lexeme;
        this.environment.define(name, null);

        if (superClass) {
            this.environment = new Environment(this.environment);
            this.environment.define("super", superClass);
        }

        const methods = new Map<string, LoxFunction>();
        for (const method of stmt.methods) {
            methods.set(method.name.lexeme, new LoxFunction(method, this.environment, method.name.lexeme === "init"));
        }

        const clazz = new LoxClass(name, superClass, methods);

        if (superClass !== null) {
            this.environment = this.environment.enclosing;
        }

        console.log(name);

        this.environment.assign(name, clazz);
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        let value = null;

        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }

        throw new Return(value);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        const fn = new LoxFunction(stmt, this.environment, false);

        this.environment.define(stmt.name.lexeme, fn);
    }

    visitWhileStmt(expr: WhileStmt): void {
        while (this.isTruthy(this.evaluate(expr.condition))) {
            this.execute(expr.body);
        }
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.evaluate(stmt.expr);
    }

    visitPrintStmt(stmt: PrintStmt): void {
        const value = this.evaluate(stmt.expr);

        console.log(this.stringify(value));
    }

    visitIfStmt(stmt: IfStmt): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitVarStmt(stmt: VarStmt): void {
        let value: Value = null;

        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name.lexeme, value);
    }

    visitSuperExpr(expr: Super): Object | null {
        const distance = this.locals.get(expr);
        const superClass = this.environment.getAt(distance, "super");
        const object = this.environment.getAt(distance - 1, "this");

        if (superClass instanceof LoxClass && object instanceof LoxInstance) {
            const method = superClass.findMethod(expr.method.lexeme);

            if (method === null) {
                throw this.error(expr.method, `Undefined property '${expr.method.lexeme}'.`);
            }

            return method.bind(object);
        }

        unreachable();
    }

    visitThisExpr(expr: This): Object | null {
        return this.lookUpVariable(expr.keyword, expr);
    }

    visitSetExpr(expr: Set): Object | null {
        const object = this.evaluate(expr.object);

        if (object instanceof LoxInstance) {
            const value = this.evaluate(expr.value);

            object.set(expr.name, value);

            return value;
        }


        throw this.error(expr.name, "Only instances have fields.");
    }

    visitGetExpr(expr: Get): Object | null {
        const object = this.evaluate(expr.object);

        if (object instanceof LoxInstance) {
            return object.get(expr.name);
        }

        throw this.error(expr.name, "Only instances have properties.");
    }

    visitCallExpr(expr: Call): Object | null {
        const callee = this.evaluate(expr.callee);

        const args = expr.args.map(arg => this.evaluate(arg));

        if (!isCallable(callee)) {
            throw this.error(expr.paren, "Can only call functions and classes.");
        }

        if (args.length !== callee.arity()) {
            throw this.error(expr.paren, `Expected ${callee.arity()} arguments but got ${args.length}.`);
        }

        return callee.call(this, args);
    }

    visitAssignExpr(expr: Assign): Object | null {
        try {
            const value = this.evaluate(expr.value)

            const distance = this.locals.get(expr);

            if (distance !== undefined) {
                this.environment.assignAt(distance, expr.name.lexeme, value);
            } else {
                this.globals.assign(expr.name.lexeme, value);
            }

            return value;
        } catch (e) {
            if (e instanceof Error) {
                throw this.error(expr.name, e.message);
            }

            return unreachable();
        }
    }

    visitVariableExpr(expr: Variable): Object | null {
        return this.lookUpVariable(expr.name, expr);
    }

    visitLogicalExpr(expr: Logical): Object | null {
        const left = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) {
                return left;
            }
        } else {
            if (!this.isTruthy(left)) {
                return left;
            }
        }

        return this.evaluate(expr.right);
    }

    visitBinaryExpr(expr: Binary): Object {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.PLUS:
                this.checkNonNullOperand(expr.operator, left);
                this.checkNonNullOperand(expr.operator, right);

                if (typeof left === "string" || typeof right === "string") {
                    return left.toString() + right.toString();
                }

                if (typeof left === "number" && typeof right === "number") {
                    return left + right;
                }

                throw this.error(expr.operator, `Operands must be two numbers or two strings.`);

            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                return left - right;

            case TokenType.SLASH:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                if (right === 0) {
                    throw this.error(expr.operator, `Cannot divide by zero`);
                }

                return left / right;

            case TokenType.STAR:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                return left / right;

            case TokenType.GREATER:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                return left > right;

            case TokenType.GREATER_EQUAL:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                return left >= right;

            case TokenType.LESS:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                return left < right;

            case TokenType.LESS_EQUAL:
                this.checkNumberOperand(expr.operator, left);
                this.checkNumberOperand(expr.operator, right);

                return left <= right;

            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right)

            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right)
        }

        return unreachable();
    }

    visitGropingExpr(expr: Grouping): Object | null {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: Literal): Object | null {
        return expr.value;
    }

    visitUnaryExpr(expr: Unary): Object | null {
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right)

                return -right;
            case TokenType.BANG:
                return !this.isTruthy(right);
        }

        return unreachable();
    }

    executeBlock(statements: Stmt[], current: Environment) {
        const previous = this.environment;

        try {
            this.environment = current;

            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    private stringify(value: Object | null) {
        if (value === null) {
            return "nil";
        }

        return value.toString();
    }

    private execute(stmt: Stmt) {
        stmt.accept(this);
    }

    private evaluate(expr: Expr): Object | null {
        return expr.accept(this);
    }

    private lookUpVariable(name: Token, expr: Expr) {
        const distance = this.locals.get(expr);

        if (distance !== undefined) {
            return this.environment.getAt(distance, name.lexeme);
        } else {
            return this.globals.get(name.lexeme);
        }
    }

    private isEqual(a: Object | null, b: Object | null) {
        return a === b;
    }

    private isTruthy(value: Object | null) {
        return !(value === null || value === false);
    }

    private checkNumberOperand(operator: Token, value: Object | null): asserts value is number {
        if (typeof value !== "number") {
            throw this.error(operator, "Operand must be a number.");
        }
    }

    private checkNonNullOperand<T extends Object | null>(operator: Token, value: T): asserts value is NonNullable<T> {
        if (typeof value === null) {
            throw this.error(operator, "Operand must be a number.");
        }
    }

    private error(token: Token, message: string): InterpreterError {
        ErrorReporter.reportRuntimeError(token.line, "", message)

        throw new InterpreterError();
    }
}
