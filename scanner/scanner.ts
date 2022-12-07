import {keywords, Token, TokenType} from "../shared/token";
import {ErrorReporter} from "../error-reporter";

export class Scanner {
    private tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    constructor(private source: string) {
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private peek(): string {
        if (this.isAtEnd()) {
            return '\0';
        }

        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';

        return this.source.charAt(this.current + 1);
    }

    private peekPrevious(): string {
        if (this.current - 1 <= 0) return '\0';

        return this.source.charAt(this.current - 1);
    }

    private match(expected: string): boolean {
        if (this.peek() != expected) {
            return false;
        }

        this.current++;

        return true;
    }

    private addToken(type: TokenType, literal: Object | null = null): void {
        const text = this.source.substring(this.start, this.current);

        this.tokens.push(new Token(type, text, literal, this.line));
    }

    private string() {
        while(this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == "\n") {
                this.line++;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            ErrorReporter.reportSyntaxError(this.line, "", "Unterminated string.");
            return;
        }

        // The closing ".
        this.advance();

        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    private isDigit(char: string) {
        return char >= '0' && char <= '9';
    }

    private isAlpha(char: string) {
        return (char >= 'a' && char <= 'z') ||  (char >= 'A' && char <= 'Z') || char === "_";
    }

    private isAlphaNumeric(char: string) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    private identifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const value = this.source.substring(this.start, this.current);

        const type = keywords[value] ?? TokenType.IDENTIFIER;

        this.addToken(type);
    }

    private singleLineComment() {
        while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
        }
    }

    private multiLineComment() {
        while(!(this.peek() === '/' && this.peekPrevious() === "*") && !this.isAtEnd()) {
            if (this.peek() == "\n") {
                this.line++;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            ErrorReporter.reportSyntaxError(this.line, "", "Unterminated multiline comment.");
            return;
        }

        // The closing /.
        this.advance();
    }

    private number() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        if (this.peek() === "." && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();

            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }

        this.addToken(TokenType.NUMBER,
            parseFloat(this.source.substring(this.start, this.current)));
    }

    private scanToken(): void {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;

            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;

            case '/':
                if (this.match('/')) {
                    this.singleLineComment();
                } else  if (this.match('*')) {
                    this.multiLineComment();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;

            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break;

            case '\n':
                this.line++;
                break;

            case '"': this.string(); break;

            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    ErrorReporter.reportSyntaxError(this.line, "", "Unexpected character.");
                }
        }
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line));

        return this.tokens;
    }
}
