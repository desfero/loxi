export enum TokenType {
    // Single-character tokens.
    LEFT_PAREN= "left_parent", RIGHT_PAREN = "right_parent", LEFT_BRACE = "left_brace", RIGHT_BRACE = "right_brace",
    COMMA = "comma", DOT = "dot", MINUS = "minus", PLUS = "plus", SEMICOLON = "semicolon", SLASH = "slash", STAR = "star",

    // One or two character tokens.
    BANG = "bang", BANG_EQUAL = "bang_equal",
    EQUAL = "equal", EQUAL_EQUAL = "equal_equal",
    GREATER = "greater", GREATER_EQUAL = "greater_equal",
    LESS = "less", LESS_EQUAL = "less_equal",

    // Literals.
    IDENTIFIER = "identifier", STRING = "string", NUMBER = "number",

    // Keywords.
    AND = "and", CLASS = "class", ELSE = "else", FALSE = "false", FUN = "fun", FOR = "for", EXTENDS = "extends", IF = "if", NIL = "nil", OR = "or",
    PRINT = "print", RETURN = "return", SUPER = "super", THIS = "this", TRUE = "true", VAR = "var", WHILE = "while",

    EOF = "eof"
}

export const keywords: Record<string, TokenType> = {
    "and":    TokenType.AND,
    "class":  TokenType.CLASS,
    "else":   TokenType.ELSE,
    "false":  TokenType.FALSE,
    "for":    TokenType.FOR,
    "fun":    TokenType.FUN,
    "if":     TokenType.IF,
    "nil":    TokenType.NIL,
    "or":     TokenType.OR,
    "print":  TokenType.PRINT,
    "return": TokenType.RETURN,
    "super":  TokenType.SUPER,
    "extends":TokenType.EXTENDS,
    "this":   TokenType.THIS,
    "true":   TokenType.TRUE,
    "var":    TokenType.VAR,
    "while":  TokenType.WHILE,
}

export class Token {
    constructor(public type: TokenType, public lexeme: string, public literal: Object | null, public line: number) {}

    toString() {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}
