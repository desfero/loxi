export abstract class CodeError extends Error {}

export class SyntaxError extends CodeError {
    constructor(public line: number, public where: string, public mr: string) {
        super(`[SyntaxError on ${line}] Error ${where}: ${mr}`);
    }
}

export class RuntimeError extends CodeError {
    constructor(public line: number, public where: string, public mr: string) {
        super(`[RuntimeError on ${line}] Error ${where}: ${mr}`);
    }
}

export class ErrorReporter {
    private static errors: CodeError[] = []

    static reportSyntaxError(line: number, where: string, message: string) {
        const error = new SyntaxError(line, where, message);

        this.errors.push(error);
    }

    static reportRuntimeError(line: number, where: string, message: string) {
        const error = new RuntimeError(line, where, message);

        this.errors.push(error);
    }

    static getErrors() {
        return this.errors;
    }
}
