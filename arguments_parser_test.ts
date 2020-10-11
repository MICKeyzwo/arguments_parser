import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";

import { ArgumentsParser } from "./arguments_parser.ts";


Deno.test({
    name: "legal function",
    fn() {
        const parser = new ArgumentsParser({
            pos1: {
                position: 0,
                parser: String
            },
            pos2: {
                position: 1,
                parser: String
            },
            name1: {
                names: ["--name1"],
                parser: String,
                required: true
            },
            name2: {
                names: ["--name2", "-n2"],
                parser: Number
            },
            name3: {
                names: ["--name3"],
                parser: String
            },
            name4: {
                names: ["--name4"],
                parser: String,
                multiple: true
            },
            name5: {
                names: ["--name5"],
                parser: Boolean,
                isFlag: true
            }
        });
        
        const result = parser.parseArgs([
            "posArg1",
            "--name1",
            "hoge",
            "-n2",
            "4649",
            "--name4",
            "foo",
            "bar",
            "baz",
            "--name5",
            "posArg2"
        ]);

        assertEquals(result.pos1, "posArg1");
        assertEquals(result.pos2, "posArg2");
        assertEquals(result.name1, "hoge");
        assertEquals(result.name2, 4649);
        assertEquals(result.name3, undefined);
        assertEquals(result.name4, ["foo", "bar", "baz"]);
        assertEquals(result.name5, true);
    }
});

Deno.test({
    name: "duplication name option",
    fn() {
        assertThrows(() => {
            new ArgumentsParser({
                arg1: {
                    names: ["--arg"],
                    parser: String
                },
                arg2: {
                    names: ["--arg"],
                    parser: String
                }
            });
        }, Error);
    }
});

Deno.test({
    name: "no name",
    fn() {
        assertThrows(() => {
            new ArgumentsParser({
                arg: {
                    names: [],
                    parser: String
                }
            });
        }, Error);
    }
});

Deno.test({
    name: "duplication position option",
    fn() {
        assertThrows(() => {
            new ArgumentsParser({
                arg1: {
                    position: 0,
                    parser: String
                },
                arg2: {
                    position: 0,
                    parser: String
                }
            });
        }, Error);
    }
});

Deno.test({
    name: "no integer position",
    fn() {
        assertThrows(() => {
            new ArgumentsParser({
                arg: {
                    position: 1.5,
                    parser: String
                }
            });
        }, Error);
    }
});

Deno.test({
    name: "position less than 0",
    fn() {
        assertThrows(() => {
            new ArgumentsParser({
                arg: {
                    position: -1,
                    parser: String
                }
            });
        }, Error);
    }
});

Deno.test({
    name: "out of choices",
    fn() {
        assertThrows(() => {
            const parser = new ArgumentsParser({
                arg: {
                    names: ["-a"],
                    parser: String,
                    choices: ["a", "b", "c"]
                }
            });
            parser.parseArgs([
                "-a",
                "d"
            ]);
        }, TypeError);
    }
});

Deno.test({
    name: "required",
    fn() {
        assertThrows(() => {
            const parser = new ArgumentsParser({
                arg1: {
                    position: 0,
                    parser: String,
                    required: true
                },
                arg2: {
                    names: ["-n", "--name"],
                    parser: String,
                    required: true
                }
            });
            parser.parseArgs([]);
        }, Error);
    }
});

Deno.test({
    name: "duplication args",
    fn() {
        assertThrows(() => {
            const parser = new ArgumentsParser({
                unique: {
                    names: ["--unique", "-u"],
                    parser: String
                }
            });
            parser.parseArgs([
                "--unique",
                "foo",
                "-u",
                "bar"
            ]);
        }, Error);
    }
});
