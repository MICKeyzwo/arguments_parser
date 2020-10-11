class ArgumentOptionBase<T> {
    parser: (arg: string) => T;
    choices?: T[];
    required?: boolean;
    default?: T;
    constructor(args: ArgumentOptionBase<T>) {
        this.parser = args.parser;
        Object.assign(this, args);
    }
}

/**
 * Position argument parse option.
 */
export class PositionArgumentOption<T> extends ArgumentOptionBase<T> {
    position: number;
    constructor(args: PositionArgumentOption<T>) {
        super(args);
        this.position = args.position;
    }
    static isPositionArgumentOption<T>(
        option: unknown
    ): option is PositionArgumentOption<T> {
        return "position" in (option as any);
    }
}

/**
 * Name argument parse option.
 */
export class NameArgumentOption<T> extends ArgumentOptionBase<T> {
    names: string[];
    isFlag?: boolean;
    multiple?: boolean;
    constructor(args: NameArgumentOption<T>) {
        super(args);
        this.names = args.names;
    }
    static isNameArgumentOption<T>(
        option: unknown
    ): option is NameArgumentOption<T> {
        return "names" in (option as any);
    }
}

function choicesCheck(value: any, choices: any[]) {
    if (!choices.includes(value)) {
        throw TypeError(
            `given value is not in choices.\n\tgiven value: ${value}` +
            `\n\tchoices: ${choices.join(", ")}`
        );
    }
}

/**
 * Arguments parser
 */
export class ArgumentsParser<T extends {
    [key: string]: PositionArgumentOption<any> | NameArgumentOption<any>
}> {

    /**
     * Set up arguments parser using given options.
     * 
     * example:
     * 
     * ```ts
     * const parser = new ArgumentsParser({
     *   message: {
     *     names: ["-m", "--message"],
     *     parser: String
     *   }
     * });
     * const args = parser.parseArgs(["-m", "hello!"]);
     * console.log(args.message);  // "hello!"
     * ```
     * 
     * @param targets parser options
     */
    constructor(private targets: T) {
        const positions: number[] = [];
        const names: string[] = [];
        for (const target of Object.values(targets)) {
            if (NameArgumentOption.isNameArgumentOption(target)) {
                if (target.names.length === 0) {
                    throw Error("names requires more than equal 1 items");
                }
                for (const name of target.names) {
                    if (names.includes(name)) {
                        throw Error(
                            `every flag must be unique. duplication: "${name}"`
                        );
                    }
                    names.push(name);
                }
            } else if (PositionArgumentOption.isPositionArgumentOption(target)) {
                if (!Number.isInteger(target.position) || target.position < 0) {
                    throw TypeError(
                        `position param must be an integer value bigger than equals 0.` +
                        `given position: ${target.position}`
                    );
                }
                if (positions.includes(target.position)) {
                    throw Error(
                        `every position must be unique. duplication: ${target.position}`
                    );
                }
                positions.push(target.position);
            }
        }
    }

    /**
     * Parse argument strings into result object.
     * 
     * @param args parse target strings
     */
    parseArgs(args?: string[]): {
        [K in keyof T]: T[K] extends NameArgumentOption<any> ?
            (
                T[K]["required"] extends true ?
                    (
                        T[K]["multiple"] extends true ?
                            ReturnType<T[K]["parser"]>[] :
                            ReturnType<T[K]["parser"]>
                    ) :
                    (
                        T[K]["multiple"] extends true ?
                            ReturnType<T[K]["parser"]>[] | undefined :
                            ReturnType<T[K]["parser"]> | undefined
                    )
            ) : (
                T[K]["required"] extends true ?
                    ReturnType<T[K]["parser"]> :
                    ReturnType<T[K]["parser"]> | undefined
            )
    } {
        args = args ?? Deno.args;
        const result: { [k: string]: any } = {};
        const requires = new Map(
            Object.entries(this.targets).filter(([_, v]) => v.required)
        );
        const defaults = Object.entries(this.targets)
            .filter(([_, v]) => "default" in v)
            .map(([k, v]) => ({ key: k, option: v }));
        let position = 0;
        const positions: number[] = [];
        const positionAndOptions: {
            position: number,
            key: string,
            option: PositionArgumentOption<any> | NameArgumentOption<any>
        }[] = [];
        const names: string[] = [];
        const nameAndOptions: {
            name: string,
            key: string,
            option: PositionArgumentOption<any> | NameArgumentOption<any>
        }[] = [];
        for (const [key, option] of Object.entries(this.targets)) {
            if (NameArgumentOption.isNameArgumentOption(option)) {
                for (const name of option.names) {
                    names.push(name);
                    nameAndOptions.push({ name, key, option });
                }
            } else if (PositionArgumentOption.isPositionArgumentOption(option)) {
                positions.push(option.position);
                positionAndOptions.push({ position: option.position, key, option });
            }
        }
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (names.includes(arg)) {
                const nameAndOption = nameAndOptions.find(nao => nao.name === arg)!;
                const option = nameAndOption.option as NameArgumentOption<any>;
                const parser = option.parser;
                const key = nameAndOption.key;
                if (option.isFlag) {
                    result[key] = true;
                } else {
                    if (option.multiple) {
                        if (!(key in result)) {
                            result[key] = [];
                        }
                        for (i = i + 1; i < args.length && !names.includes(args[i]); i++) {
                            const val = parser(args[i]);
                            if (option.choices) {
                                choicesCheck(val, option.choices);
                            }
                            result[key].push(parser(args[i]));
                        }
                        i--;
                    } else {
                        if (key in result) {
                            throw Error(`duplication argument: ${arg}`);
                        }
                        const val = parser(args[i + 1]);
                        if (option.choices) {
                            choicesCheck(val, option.choices);
                        }
                        result[key] = val;
                        i++;
                    }
                    if (requires.has(key)) {
                        requires.delete(key);
                    }
                }
            } else {
                if (positions.includes(position)) {
                    const positionAndOption =
                        positionAndOptions.find(pao => pao.position === position)!;
                    const option = positionAndOption.option;
                    const parser = option.parser;
                    const key = positionAndOption.key;
                    const val = parser(args[i]);
                    if (option.choices) {
                        choicesCheck(val, option.choices);
                    }
                    result[key] = val;
                    if (requires.has(key)) {
                        requires.delete(key);
                    }
                    position++;
                }
            }
        }
        for (const { key, option } of defaults) {
            if (!(key in result)) {
                result[key] = option.default;
            }
        }
        if (requires.size > 0) {
            let msg = "";
            for (const [key, option] of requires) {
                if (NameArgumentOption.isNameArgumentOption(option)) {
                    msg += `\n\t${key}: names are [${option.names.join(", ")}]`;
                } else if (PositionArgumentOption.isPositionArgumentOption(option)) {
                    msg += `\n\t${key}: position is ${option.position}`;
                }
            }
            throw Error(`missing required arguments: ${msg}`);
        }
        return result as any;
    }

}

