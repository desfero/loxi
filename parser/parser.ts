import {Token, TokenType} from "../shared/token";
import {Expr} from "../shared/expr/expr";
import {Binary} from "../shared/expr/binary";
import {Unary} from "../shared/expr/unary";
import {Literal} from "../shared/expr/literal";
import {Grouping} from "../shared/expr/grouping";
import {ErrorReporter} from "../error-reporter";
import {Stmt} from "../shared/stmt/stmt";
import {PrintStmt} from "../shared/stmt/print-stmt";
import {ExpressionStmt} from "../shared/stmt/expression-stmt";
import {VarStmt} from "../shared/stmt/var-stmt";
import {Variable} from "../shared/expr/variable";
import {isNonNullable} from "../shared/utils";
import {Assign} from "../shared/expr/assign";
import {BlockStmt} from "../shared/stmt/block-stmt";
import {IfStmt} from "../shared/stmt/if-stmt";
import {Logical} from "../shared/expr/logical";
import {WhileStmt} from "../shared/stmt/while-stmt";
import {Call} from "../shared/expr/call";
import {FunctionStmt} from "../shared/stmt/function-stmt";
import {ReturnStmt} from "../shared/stmt/return-stmt";
import {ClassStmt} from "../shared/stmt/class-stmt";
import {Get} from "../shared/expr/get";
import {Set} from "../shared/expr/set";
import {This} from "../shared/expr/this";
import {Super} from "../shared/expr/super";

class ParseError extends Error {}

type NullableStmt = Stmt | null;

export class Parser {
    private current: number = 0;

    constructor(private readonly tokens: readonly Token[]) {}

    parse(): Stmt[] {
        const statements: NullableStmt[] = []

        while(!this.isAtEnd()) {
            statements.push(this.declaration());
        }

        return statements.filter(isNonNullable);
    }

    declaration(): Stmt | null {
        try {
            if (this.match(TokenType.FUN)) {
                return this.function("function");
            }

            if (this.match(TokenType.VAR)) {
                return this.varDeclaration();
            }

            if (this.match(TokenType.CLASS)) {
                return this.classDeclaration();
            }

            return this.statement();
        } catch {
            this.synchronize();

            return null;
        }
    }

    function(kind: string): FunctionStmt {
        const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);

        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);

        const params = [];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (params.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }
                params.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."))
            } while(this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);

        const body = this.block();

        return new FunctionStmt(name, params, body);
    }

    classDeclaration(): Stmt {
        const name = this.consume(TokenType.IDENTIFIER, "Expect a class name.");

        let superClass: Variable | null = null;

        if (this.match(TokenType.EXTENDS)) {
            const token = this.consume(TokenType.IDENTIFIER, "Expect superclass name.");
            superClass = new Variable(token);
        }

        this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

        const methods: FunctionStmt[] = [];

        while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            methods.push(this.function("method"));
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

        return new ClassStmt(name, superClass, methods);
    }

    varDeclaration(): Stmt {
        const name = this.consume(TokenType.IDENTIFIER, "Expected a variable name");

        let initializer = null;

        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

        return new VarStmt(name, initializer);
    }

    statement(): Stmt {
       if (this.match(TokenType.FOR)) {
           return this.forStatement();
       }

       if (this.match(TokenType.IF)) {
           return this.ifStatement();
       }

       if (this.match(TokenType.PRINT)) {
           return this.printStatement();
       }

       if (this.match(TokenType.WHILE)) {
           return this.whileStatement();
       }

       if (this.match(TokenType.LEFT_BRACE)) {
           return new BlockStmt(this.block());
       }

       if (this.match(TokenType.RETURN)) {
           return this.returnStatement();
       }

       return this.expressionStatement();
    }

    returnStatement(): Stmt {
        const keyword = this.previous();

        let value = null;
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression();
        }

        this.consume(TokenType.SEMICOLON, " Expect ';' after return value.");

        return new ReturnStmt(keyword, value);
    }

    forStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

        let initializer: Stmt | null = null;
        if (this.match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.match(TokenType.VAR)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment: Expr = null;
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body = this.statement();

       if (increment !== null) {
           body = new BlockStmt([body, new ExpressionStmt(increment)]);
       }

       body = new WhileStmt(condition ?? new Literal(true), body)

        if (initializer) {
            body = new BlockStmt([initializer, body]);
        }

        return body;
    }

    block(): Stmt[] {
        const statements: Stmt[] = [];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")

        return statements;
    }

    ifStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect '(' after 'if'.");

        const thenBranch = this.statement();
        const elseBranch = this.match(TokenType.ELSE) ? this.statement() : null;

        return new IfStmt(condition, thenBranch, elseBranch);
    }

    printStatement(): Stmt {
        const value = this.expression();

        this.consume(TokenType.SEMICOLON, "Expect ';' after value.")

        return new PrintStmt(value);
    }

    whileStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after while.");

        const condition = this.expression();

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");

        const body = this.statement();

        return new WhileStmt(condition, body);
    }

    expressionStatement(): Stmt {
        const value = this.expression();

        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.")

        return new ExpressionStmt(value);
    }

    expression(): Expr {
        return this.assignment();
    }

    assignment(): Expr {
        const expr = this.or();

        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();

            if (expr instanceof Variable) {
                return new Assign(expr.name, value);
            } else if (expr instanceof Get) {
                return new Set(expr.object, expr.name, value);
            }

            this.error(equals, "Invalid assignment target.")
        }

        return expr;
    }

    or(): Expr {
        let expr = this.and();

        while(this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.and();

            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    and(): Expr {
        let expr = this.equality();

        while(this.match(TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();

            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    equality(): Expr {
        let expr = this.comparison();

        while(this.match(TokenType.BANG, TokenType.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();

            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    comparison(): Expr {
        let expr = this.term();

        while(this.match(TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER, TokenType.GREATER_EQUAL)) {
            const operator = this.previous();
            const right = this.term();

            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    term(): Expr {
        let expr = this.factor();

        while(this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();

            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    factor(): Expr {
        let expr = this.unary();

        while(this.match(TokenType.STAR, TokenType.SLASH)) {
            const operator = this.previous();
            const right = this.unary();

            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();

            return new Unary(operator, right);
        }

        return this.call();
    }

    call(): Expr {
        let expr = this.primary();

        while(true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else if(this.match(TokenType.DOT)) {
                const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = new Get(expr, name);
            } else {
                break;
            }
        }

        return expr;
    }

    primary(): Expr {
        if (this.match(TokenType.FALSE)) return new Literal(false);
        if (this.match(TokenType.TRUE)) return new Literal(true);
        if (this.match(TokenType.NIL)) return new Literal(null);
        if (this.match(TokenType.IDENTIFIER)) return new Variable(this.previous());
        if (this.match(TokenType.THIS)) return new This(this.previous());

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Literal(this.previous().literal);
        }

        if (this.match(TokenType.SUPER)) {
            const keyword = this.previous();

            this.consume(TokenType.DOT, "Expect '.' after 'super'.");
            const method = this.consume(TokenType.IDENTIFIER, "Expect superclass method name.");

            return new Super(keyword, method);
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();

            if (!this.check(TokenType.RIGHT_PAREN)) {
                const token = this.peek();

                throw this.error(token, "Expect ')' after expression.")
            }

            this.advance();

            return new Grouping(expr);
        }

        throw this.error(this.peek(), "Expect expression.")
    }

    error(token: Token, message: string): ParseError {
        ErrorReporter.reportSyntaxError(token.line, "", message)

        throw new ParseError();
    }

    private finishCall(callee: Expr): Expr {
        const args: Expr[] = [];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments.")
                }

                args.push(this.expression());
            } while(this.match(TokenType.COMMA));
        }

        const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

        return new Call(callee, paren, args);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) {
            return false;
        }

        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }

        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();

                return true;
            }
        }

        return false;
    }

    private synchronize(): void {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.SEMICOLON) return;

            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }

            this.advance();
        }
    }

    private consume(type: TokenType, message: string) {
        if (!this.check(type)) {
            const token = this.peek();

            throw this.error(token, message)
        }

        return this.advance();
    }
}
