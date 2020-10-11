import { ArgumentsParser, NameArgumentOption } from "./mod.ts";

const parser = new ArgumentsParser({
    target: {
        position: 0,
        parser: String
    },
    mode: {
        names: ["--mode", "-m"],
        parser: String,
        required: true
    },
    dist: new NameArgumentOption({
        names: ["--dist", "-d"],
        parser: s => s.toString(),
        default: "./"
    }),
    timeout: {
        names: ["--timeout"],
        parser: parseInt,
        choices: [10, 20, 30]
    },
    messages: {
        names: ["--messages"],
        parser: String,
        multiple: true
    },
    noColor: {
        names: ["--no-color"],
        parser: Boolean,
        isFlag: true
    }
});

const args = parser.parseArgs();

console.log(args);
