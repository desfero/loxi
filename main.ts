import * as fs from "fs/promises";
import * as readline from "readline";

import { Lox } from "./lox";
import {RuntimeError} from "./error-reporter";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

async function ask(question: string) {
    return new Promise<string>(resolve => rl.question(question, (answer: string) => resolve(answer)));
}

async function runFile(filePath: string) {
    const code = await fs.readFile(filePath, { encoding: 'utf8' });

    const result = Lox.fromCode(code);

    if (result.isErr) {
        const errors = result.error.errors;

        errors.forEach(error => process.stdout.write(error.message + "\n"));

        if (errors.some(error => error instanceof RuntimeError)) {
            process.exit(70);
        } else {
            process.exit(65);
        }
    }
}

async function runPrompt() {
    while (true) {
        const line = await ask("> ");

        const result = Lox.fromCode(line)

        if (result.isErr) {
            result.error.errors.forEach(error => process.stdout.write(error.message + "\n"));
        }

        process.stdout.write(result.unwrap() + "\n");
    }
}


async function main(args: string[]) {
    if (args.length > 1) {
        process.stdout.write("Usage: loxi [script]\n");
        process.exit(64);
    } else if (args.length === 1) {
        await runFile(args[0])
    } else {
        await runPrompt();
    }
}



void main(process.argv.slice(2))
