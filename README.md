# Arguments parser

A simple arguments parser for Deno.

## Feature

- Inspired by Python's [argparse](https://docs.python.org/3/howto/argparse.html) module
- No dependencies
- Strongly typed APIs

## Usage

Write `example.ts` like below:

```ts
import { ArgumentsParser } from "https://deno.land/x/arguments_parser/mod.ts";

const parser = new ArgumentsParser({
    message: {
        names: ["-m", "--message"],
        parser: String
    }
});
const args = parser.parseArgs();
console.log(args.message);
```

And execute it:

```bash
deno run example.ts -m "hello!"
Check .../example.ts
hello!
```
