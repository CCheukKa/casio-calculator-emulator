import { describe, expect, test } from "bun:test";

import { Error } from "@lib/errors";
import { Token } from "@lib/tokens";
import { VM } from "@lib/vm";

const runProgram = (program: Token[]) => {
    const vm = new VM();
    vm.execute(program);
    return vm;
};

const expectThrowsValue = (fn: () => void, expected: unknown) => {
    try {
        fn();
    } catch (error) {
        expect(error).toBe(expected);
        return;
    }
    throw new globalThis.Error("Expected function to throw.");
};

describe("VM parsing and execution edge cases", () => {
    test("empty program does not throw", () => {
        const vm = runProgram([]);
        expect(vm.state.answer).toBe(0);
        expect(vm.state.shouldDisplay).toBe(false);
    });

    test("DISPLAY alone is syntax error", () => {
        expectThrowsValue(() => runProgram([Token.DISPLAY]), Error.SYNTAX_ERROR);
    });

    test("EXECUTION_DELIMITER alone is syntax error", () => {
        expectThrowsValue(() => runProgram([Token.EXECUTION_DELIMITER]), Error.SYNTAX_ERROR);
    });

    test("double delimiter with no instruction between throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.EXECUTION_DELIMITER,
                Token.EXECUTION_DELIMITER,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("EOF acts like display for shouldDisplay", () => {
        const vm = runProgram([Token.NUMBER_2, Token.PLUS, Token.NUMBER_3]);
        expect(vm.state.answer).toBe(5);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("EXE hides display and still updates answer", () => {
        const vm = runProgram([
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.EXECUTION_DELIMITER,
        ]);
        expect(vm.state.answer).toBe(5);
        expect(vm.state.shouldDisplay).toBe(false);
    });

    test("DISPLAY shows display and updates answer", () => {
        const vm = runProgram([
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(5);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("multi-line program can reuse Ans across lines", () => {
        const vm = runProgram([
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.EXECUTION_DELIMITER,
            Token.ANSWER,
            Token.MULTIPLY,
            Token.NUMBER_4,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(20);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("auto-closes missing parenthesis for parenthetical function", () => {
        const vm = runProgram([
            Token.SINE,
            Token.NUMBER_4,
            Token.NUMBER_5,
            Token.SQUARE,
            Token.PLUS,
            Token.COSINE,
            Token.NUMBER_3,
            Token.NUMBER_0,
            Token.EXECUTION_DELIMITER,
        ]);
        expect(vm.state.answer).toBeCloseTo(Math.sin(Math.PI / 180 * (45 * 45 + Math.cos(Math.PI / 180 * 30))), 14);
        expect(vm.state.shouldDisplay).toBe(false);
    });

    test("explicit and symbol-parenthetical forms both parse", () => {
        const vmA = runProgram([
            Token.SINE,
            Token.NUMBER_4,
            Token.NUMBER_5,
            Token.DISPLAY,
        ]);

        const vmB = runProgram([
            Token.SINE,
            Token.NUMBER_4,
            Token.NUMBER_5,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
        ]);

        expect(vmA.state.answer).toBe(vmB.state.answer);
    });

    test("unbalanced plain parenthesis is auto-closed at end of instruction", () => {
        const vm = runProgram([
            Token.LEFT_PARENTHESIS,
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(7);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("operator precedence: multiply before add", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(7);
    });

    test("parentheses override precedence", () => {
        const vm = runProgram([
            Token.LEFT_PARENTHESIS,
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.RIGHT_PARENTHESIS,
            Token.MULTIPLY,
            Token.NUMBER_3,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(9);
    });

    test("division is left-associative", () => {
        const vm = runProgram([
            Token.NUMBER_8,
            Token.DIVIDE,
            Token.NUMBER_4,
            Token.DIVIDE,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(1);
    });

    test("minus acts as unary operator when preceding a number", () => {
        const vm = runProgram([
            Token.MINUS,
            Token.NUMBER_3,
            Token.MULTIPLY,
            Token.NUMBER_4,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(-12);
    });

    test("postfix priority above unary minus", () => {
        const vm = runProgram([
            Token.NEGATIVE,
            Token.NUMBER_2,
            Token.SQUARE,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(-4);
    });

    test("unary minus gives same answer as negative token", () => {
        const vmUnary = runProgram([
            Token.MINUS,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        const vmNegative = runProgram([
            Token.NEGATIVE,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vmUnary.state.answer).toBe(vmNegative.state.answer);
    });

    test("power token without required parenthetical close throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.MINUS,
                Token.NUMBER_2,
                Token.POWER,
                Token.NUMBER_3,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("decimal number parsing", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
            Token.NUMBER_2,
            Token.NUMBER_5,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(1.25);
    });

    test("decimal point without following number is allowed", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(1);
    });

    test("scientific notation parsing", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(100);
    });

    test("scientific notation with hanging decimal point in base is accepted", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toBe(100);
    });

    test("scientific notation with signed exponent is accepted", () => {
        const vmPos = runProgram([
            Token.MINUS,
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.PLUS,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vmPos.state.answer).toBe(-100);

        const vmNeg = runProgram([
            Token.MINUS,
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.MINUS,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vmNeg.state.answer).toBe(-0.01);
    });

    test("scientific notation without base number is accepted and treated as 1", () => {
        const vm = runProgram([
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(100);
    });

    test("scientific notation does not allow decimal point in exponent", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
                Token.DECIMAL_POINT,
                Token.NUMBER_5,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("scientific notation does not allow non-numeric tokens in base", () => {
        expectThrowsValue(
            () => runProgram([
                Token.LEFT_PARENTHESIS,
                Token.NUMBER_1,
                Token.RIGHT_PARENTHESIS,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram([
                Token.VARIABLE_A,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram([
                Token.PI,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram([
                Token.IMAGINARY_UNIT,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("scientific notation does not allow non-numeric tokens in exponent", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.LEFT_PARENTHESIS,
                Token.NUMBER_2,
                Token.RIGHT_PARENTHESIS,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.VARIABLE_A,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_2,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.IMAGINARY_UNIT,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("invalid numeric token sequence throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.DECIMAL_POINT,
                Token.DECIMAL_POINT,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("explicit multiplication with variable", () => {
        const vm = new VM();
        vm.state.a = 4;
        vm.execute([
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.VARIABLE_A,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(8);
    });

    test("explicit multiplication with answer", () => {
        const vm = runProgram([
            Token.NUMBER_4,
            Token.PLUS,
            Token.NUMBER_5,
            Token.EXECUTION_DELIMITER,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.ANSWER,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(18);
    });

    test("explicit multiplication with constant", () => {
        const vm = runProgram([
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.PI,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBeCloseTo(2 * Math.PI, 15);
    });

    test("implicit multiplication with parenthetical function", () => {
        const vm = runProgram([
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.SINE,
            Token.NUMBER_3,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBeCloseTo(1, 15);
    });

    test("improper implicit multiplication with variable throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.VARIABLE_A,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("improper implicit multiplication with answer throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.ANSWER,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("improper implicit multiplication with constant throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.PI,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("improper implicit multiplication with parenthetical function throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.SINE,
                Token.NUMBER_3,
                Token.NUMBER_0,
                Token.RIGHT_PARENTHESIS,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("explicit multiplication chain across answer/functions/variables/constants works", () => {
        const vmb = new VM();
        vmb.state.a = 45;
        vmb.state.answer = 10;
        vmb.execute([
            Token.ANSWER,
            Token.MULTIPLY,
            Token.COSINE,
            Token.NUMBER_3,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
            Token.MULTIPLY,
            Token.VARIABLE_A,
            Token.MULTIPLY,
            Token.SINE,
            Token.NUMBER_3,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
            Token.MULTIPLY,
            Token.PI,
            Token.MULTIPLY,
            Token.PI,
            Token.DISPLAY,
        ]);
        expect(vmb.state.answer).toBeCloseTo(10 * Math.cos(Math.PI / 180 * 30) * 45 * Math.sin(Math.PI / 180 * 30) * Math.PI * Math.PI, 12);
    });

    test("improper chaining of implicit multiplication throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.COSINE,
                Token.NUMBER_3,
                Token.NUMBER_0,
                Token.RIGHT_PARENTHESIS,
                Token.VARIABLE_A,
                Token.PI,
                Token.NUMBER_2,
                Token.PLANCK_CONSTANT,
            ]),
            Error.SYNTAX_ERROR
        );
    });

    test("two-arg parenthetical call via comma parses", () => {
        const vm = runProgram([
            Token.LOGARITHM,
            Token.NUMBER_2,
            Token.COMMA,
            Token.NUMBER_8,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(3);
    });

    test("comma outside function context throws syntax error", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.COMMA,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("logical and relational operators return numeric truth values", () => {
        const vmRel = runProgram([
            Token.NUMBER_3,
            Token.GREATER_THAN,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vmRel.state.answer).toBe(1);

        const vmAnd = runProgram([
            Token.NUMBER_1,
            Token.AND,
            Token.NUMBER_0,
            Token.DISPLAY,
        ]);
        expect(vmAnd.state.answer).toBe(0);
    });

    test("math domain errors surface from operations", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_0,
                Token.INVERSE,
            ]),
            Error.MATH_ERROR,
        );
    });

    test("state survives and updates across multiple instruction lines", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.EXECUTION_DELIMITER,
            Token.NUMBER_3,
            Token.PLUS,
            Token.NUMBER_4,
            Token.EXECUTION_DELIMITER,
            Token.ANSWER,
            Token.PLUS,
            Token.NUMBER_5,
            Token.DISPLAY,
        ]);

        expect(vm.state.answer).toBe(12);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("answer can be used multiple times across instruction lines", () => {
        const vm = runProgram([
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
            Token.EXECUTION_DELIMITER,
            Token.NUMBER_5,
            Token.MULTIPLY,
            Token.ANSWER,
            Token.MULTIPLY,
            Token.ANSWER,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(5 * 6 * 6);
        expect(vm.state.shouldDisplay).toBe(true);
    });
});

describe("VM positive/negative error generation", () => {
    test("positive: unary math function executes", () => {
        const vm = runProgram([
            Token.SQUARE_ROOT,
            Token.NUMBER_9,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(3);
    });

    test("negative: sqrt of negative throws MathError", () => {
        expectThrowsValue(
            () => runProgram([
                Token.SQUARE_ROOT,
                Token.NEGATIVE,
                Token.NUMBER_1,
                Token.RIGHT_PARENTHESIS,
            ]),
            Error.MATH_ERROR,
        );
    });

    test("positive: logarithm with one argument executes", () => {
        const vm = runProgram([
            Token.LOGARITHM,
            Token.NUMBER_1,
            Token.NUMBER_0,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(2);
    });

    test("negative: logarithm call with unsupported arity throws EMULATOR_ERROR", () => {
        expectThrowsValue(
            () => runProgram([
                Token.LOGARITHM,
                Token.NUMBER_2,
                Token.COMMA,
                Token.NUMBER_8,
                Token.COMMA,
                Token.NUMBER_1,
                Token.RIGHT_PARENTHESIS,
            ]),
            Error.EMULATOR_ERROR,
        );
    });

    test("positive: factorial executes for integer", () => {
        const vm = runProgram([
            Token.NUMBER_5,
            Token.FACTORIAL,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(120);
    });

    test("negative: factorial throws MathError for non-integer", () => {
        expectThrowsValue(
            () => runProgram([
                Token.NUMBER_1,
                Token.DECIMAL_POINT,
                Token.NUMBER_5,
                Token.FACTORIAL,
            ]),
            Error.MATH_ERROR,
        );
    });

    test("positive: parser accepts trailing auto-close for nested expression", () => {
        const vm = runProgram([
            Token.LEFT_PARENTHESIS,
            Token.LEFT_PARENTHESIS,
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(7);
    });

    test("negative: parser rejects malformed token sequence", () => {
        expectThrowsValue(
            () => runProgram([
                Token.PLUS,
                Token.MULTIPLY,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("positive: DISPLAY line updates answer and shouldDisplay", () => {
        const vm = runProgram([
            Token.NUMBER_8,
            Token.DIVIDE,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toBe(4);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("negative: division by zero stays finite or infinite but does not syntax-fail", () => {
        const vm = runProgram([
            Token.NUMBER_1,
            Token.DIVIDE,
            Token.NUMBER_0,
            Token.DISPLAY,
        ]);
        expect(Number.isNaN(vm.state.answer)).toBe(false);
    });
});
