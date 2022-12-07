import {Scanner} from "./scanner/scanner";
import {CodeError, ErrorReporter} from "./error-reporter";
import {Parser} from "./parser/parser";
import {Interpreter} from "./interpreter/interpreter";
import {Result} from "@badrap/result";
import {Resolver} from "./resolver/resolver";

export class Lox {
    run(code: string): Result<void, AggregateError> {
        const scanner = new Scanner(code);
        const tokens = scanner.scanTokens();

        const scannerErrors = ErrorReporter.getErrors();
        if (scannerErrors.length > 0) {
            return Result.err(new AggregateError(scannerErrors));
        }


        const parser = new Parser(tokens);
        const statements = parser.parse();

        const parserErrors = ErrorReporter.getErrors();
        if (parserErrors.length > 0 || statements === null) {
            return Result.err(new AggregateError(parserErrors));
        }

        const interpreter = new Interpreter();

        const resolver = new Resolver(interpreter);
        resolver.resolveStmts(statements);

        const resolverErrors = ErrorReporter.getErrors();
        if (resolverErrors.length > 0) {
            return Result.err(new AggregateError(resolverErrors));
        }

        interpreter.interpret(statements);

        const runtimeErrors = ErrorReporter.getErrors();
        if (runtimeErrors.length > 0) {
            return Result.err(new AggregateError(runtimeErrors));
        }

        return Result.ok(undefined);
    }

    static fromCode(code: string) {
        return new Lox().run(code);
    }
}
