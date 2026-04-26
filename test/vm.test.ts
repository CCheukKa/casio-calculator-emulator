import { describe, expect, test } from "bun:test";

import { Error } from "@lib/errors";
import { Token } from "@lib/tokens";
import { State, VM } from "@lib/vm";
import { CalculatorMode, RegressionMode } from "@lib/modes";
import { expectThrowsValue } from "@test/test";
import { D, PI } from "@lib/operations";
import Decimal from "decimal.js";
import { CONSTANTS } from "@lib/constants";

const runProgram = (calculatorMode: CalculatorMode, program: Token[]) => {
    const vm = new VM(new State({ calculatorMode }));
    vm.execute(program);
    return vm;
};

describe("VM core parser and execution coverage", () => {
    test("empty program does not throw", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, []);
        expect(vm.state.answer).toEqualDecimal(0);
        expect(vm.state.shouldDisplay).toBe(false);
    });

    test("DISPLAY alone is syntax error", () => {
        expectThrowsValue(() => runProgram(CalculatorMode.COMPUTATION, [Token.DISPLAY]), Error.SYNTAX_ERROR);
    });

    test("EXECUTION_DELIMITER alone is syntax error", () => {
        expectThrowsValue(() => runProgram(CalculatorMode.COMPUTATION, [Token.EXECUTION_DELIMITER]), Error.SYNTAX_ERROR);
    });

    test("double delimiter with no instruction between throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.EXECUTION_DELIMITER,
                Token.EXECUTION_DELIMITER,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("EOF acts like display for shouldDisplay", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [Token.NUMBER_2, Token.PLUS, Token.NUMBER_3]);
        expect(vm.state.answer).toEqualDecimal(5);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("EXE hides display and still updates answer", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.EXECUTION_DELIMITER,
        ]);
        expect(vm.state.answer).toEqualDecimal(5);
        expect(vm.state.shouldDisplay).toBe(false);
    });

    test("DISPLAY shows display and updates answer", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
        ]);
        expect(vm.state.answer).toEqualDecimal(5);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("multi-line program can reuse Ans across lines", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.EXECUTION_DELIMITER,
            Token.ANSWER,
            Token.MULTIPLY,
            Token.NUMBER_4,
        ]);
        expect(vm.state.answer).toEqualDecimal(20);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("auto-closes missing parenthesis for parenthetical function", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
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
        expect(vm.state.answer).toEqualDecimal(Decimal.sin(PI.div(180).mul(Decimal.cos(PI.mul(30 / 180)).add(45 * 45))));
        expect(vm.state.shouldDisplay).toBe(false);
    });

    test("explicit and symbol-parenthetical forms both parse", () => {
        const vmA = runProgram(CalculatorMode.COMPUTATION, [
            Token.SINE,
            Token.NUMBER_4,
            Token.NUMBER_5,
        ]);

        const vmB = runProgram(CalculatorMode.COMPUTATION, [
            Token.SINE,
            Token.NUMBER_4,
            Token.NUMBER_5,
            Token.RIGHT_PARENTHESIS,
        ]);

        expect(vmA.state.answer).toEqualDecimal(vmB.state.answer);
    });

    test("unbalanced plain parenthesis is auto-closed at end of instruction", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.LEFT_PARENTHESIS,
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
        ]);
        expect(vm.state.answer).toEqualDecimal(7);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("operator precedence: multiply before add", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
        ]);
        expect(vm.state.answer).toEqualDecimal(7);
    });

    test("parentheses override precedence", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.LEFT_PARENTHESIS,
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.RIGHT_PARENTHESIS,
            Token.MULTIPLY,
            Token.NUMBER_3,
        ]);
        expect(vm.state.answer).toEqualDecimal(9);
    });

    test("division is left-associative", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_8,
            Token.DIVIDE,
            Token.NUMBER_4,
            Token.DIVIDE,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(1);
    });

    test("minus acts as unary operator when preceding a number", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_3,
            Token.MULTIPLY,
            Token.NUMBER_4,
        ]);
        expect(vm.state.answer).toEqualDecimal(-12);
    });

    test("postfix priority above unary minus", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NEGATIVE,
            Token.NUMBER_2,
            Token.SQUARE,
        ]);
        expect(vm.state.answer).toEqualDecimal(-4);
    });

    test("unary minus gives same answer as negative token", () => {
        const vmUnary = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_2,
        ]);
        const vmNegative = runProgram(CalculatorMode.COMPUTATION, [
            Token.NEGATIVE,
            Token.NUMBER_2,
        ]);
        expect(vmUnary.state.answer).toEqualDecimal(vmNegative.state.answer);
    });

    test("power token without required parenthetical close throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.MINUS,
                Token.NUMBER_2,
                Token.POWER,
                Token.NUMBER_3,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("decimal number parsing", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
            Token.NUMBER_2,
            Token.NUMBER_5,
        ]);
        expect(vm.state.answer).toEqualDecimal(1.25);
    });

    test("decimal point without following number is allowed", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
        ]);
        expect(vm.state.answer).toEqualDecimal(1);
    });

    test("scientific notation parsing", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(100);
    });

    test("scientific notation with hanging decimal point in base is accepted", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(100);
    });

    test("scientific notation with signed exponent is accepted", () => {
        const vmPos = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.PLUS,
            Token.NUMBER_2,
        ]);
        expect(vmPos.state.answer).toEqualDecimal(-100);

        const vmNeg = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.MINUS,
            Token.NUMBER_2,
        ]);
        expect(vmNeg.state.answer).toEqualDecimal(-0.01);
    });

    test("scientific notation without base number is accepted and treated as 1", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(100);
    });

    test("scientific notation does not allow decimal point in exponent", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
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
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.LEFT_PARENTHESIS,
                Token.NUMBER_1,
                Token.RIGHT_PARENTHESIS,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.VARIABLE_A,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.PI,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.IMAGINARY_UNIT,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("scientific notation does not allow non-numeric tokens in exponent", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.LEFT_PARENTHESIS,
                Token.NUMBER_2,
                Token.RIGHT_PARENTHESIS,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.VARIABLE_A,
            ]),
            Error.SYNTAX_ERROR,
        );
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_2,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.IMAGINARY_UNIT,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("invalid numeric token sequence throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
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
        vm.state.a = D(4);
        vm.execute([
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.VARIABLE_A,
        ]);
        expect(vm.state.answer).toEqualDecimal(8);
    });

    test("explicit multiplication with answer", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_4,
            Token.PLUS,
            Token.NUMBER_5,
            Token.EXECUTION_DELIMITER,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.ANSWER,
        ]);
        expect(vm.state.answer).toEqualDecimal(18);
    });

    test("explicit multiplication with constant", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.PI,
        ]);
        expect(vm.state.answer).toEqualDecimal(D(2).times(PI));
    });

    test("implicit multiplication with parenthetical function", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.SINE,
            Token.NUMBER_3,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(1);
    });

    test("improper implicit multiplication with variable throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.VARIABLE_A,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("improper implicit multiplication with answer throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.ANSWER,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("improper implicit multiplication with constant throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.PI,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("improper implicit multiplication with parenthetical function throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
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
        vmb.state.a = D(45);
        vmb.state.answer = D(10);
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
        ]);
        expect(vmb.state.answer).toEqualDecimal(
            D(10)
                .times(D(Math.cos(PI.div(180).times(30).toNumber())))
                .times(45)
                .times(D(Math.sin(PI.div(180).times(30).toNumber())))
                .times(PI)
                .times(PI),
        );
    });

    test("improper chaining of implicit multiplication throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
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

    describe("implicit multiplication precedence and behavior", () => {
        test("implicit multiplication with variable before division", () => {
            const vm = new VM();
            vm.state.a = D(2);
            vm.execute([
                Token.NUMBER_1,
                Token.NUMBER_2,
                Token.DIVIDE,
                Token.NUMBER_2,
                Token.VARIABLE_A,
            ]);
            expect(vm.state.answer).toEqualDecimal(3);
        });

        test("implicit multiplication with pi before division", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_2,
                Token.NUMBER_0,
                Token.DIVIDE,
                Token.NUMBER_4,
                Token.PI,
            ]);
            expect(vm.state.answer).toEqualDecimal(D(20).div(D(4).times(PI)));
        });

        test("implicit multiplication with pi before addition", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_5,
                Token.PLUS,
                Token.NUMBER_2,
                Token.PI,
            ]);
            expect(vm.state.answer).toEqualDecimal(D(5).plus(D(2).times(PI)));
        });

        test("implicit multiplication with pi before subtraction", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.NUMBER_0,
                Token.MINUS,
                Token.NUMBER_3,
                Token.PI,
            ]);
            expect(vm.state.answer).toEqualDecimal(D(10).minus(D(3).times(PI)));
        });

        test("implicit multiplication with variable before multiplication", () => {
            const vm = new VM();
            vm.state.a = D(4);
            vm.execute([
                Token.NUMBER_5,
                Token.MULTIPLY,
                Token.NUMBER_3,
                Token.VARIABLE_A,
            ]);
            expect(vm.state.answer).toEqualDecimal(60);
        });

        test("implicit multiplication with square root function", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_2,
                Token.SQUARE_ROOT,
                Token.NUMBER_9,
                Token.RIGHT_PARENTHESIS,
            ]);
            expect(vm.state.answer).toEqualDecimal(6);
        });

        test("implicit multiplication with parenthetical function before addition", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_3,
                Token.PLUS,
                Token.NUMBER_2,
                Token.SINE,
                Token.NUMBER_3,
                Token.NUMBER_0,
                Token.RIGHT_PARENTHESIS,
            ]);
            expect(vm.state.answer).toEqualDecimal(4);
        });

        test("implicit multiplication with parenthetical function before division", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.NUMBER_0,
                Token.DIVIDE,
                Token.NUMBER_2,
                Token.SQUARE_ROOT,
                Token.NUMBER_4,
                Token.RIGHT_PARENTHESIS,
            ]);
            expect(vm.state.answer).toEqualDecimal(2.5);
        });

        test("chain of implicit multiplications with numbers and variables", () => {
            const vm = new VM();
            vm.state.a = D(3);
            vm.execute([
                Token.NUMBER_2,
                Token.PLUS,
                Token.NUMBER_4,
                Token.VARIABLE_A,
            ]);
            expect(vm.state.answer).toEqualDecimal(14);
        });

        test("implicit multiplication with answer variable", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_5,
                Token.EXECUTION_DELIMITER,
                Token.NUMBER_3,
                Token.ANSWER,
            ]);
            expect(vm.state.answer).toEqualDecimal(15);
        });

        test("implicit multiplication with answer before operator", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_4,
                Token.EXECUTION_DELIMITER,
                Token.NUMBER_2,
                Token.PLUS,
                Token.NUMBER_3,
                Token.ANSWER,
            ]);
            expect(vm.state.answer).toEqualDecimal(14);
        });

        test("implicit multiplication with constants", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_2,
                Token.DIVIDE,
                Token.NUMBER_5,
                Token.PLANCK_CONSTANT,
            ]);
            expect(vm.state.answer).toEqualDecimal(D(2).div(D(5).times(CONSTANTS.PLANCK_CONSTANT!)));
        });

        test("implicit multiplication preserves correct precedence with explicit operators", () => {
            const vm = new VM();
            vm.state.a = D(2);
            vm.state.b = D(3);
            vm.execute([
                Token.NUMBER_1,
                Token.PLUS,
                Token.NUMBER_2,
                Token.VARIABLE_A,
                Token.DIVIDE,
                Token.VARIABLE_B,
            ]);
            expect(vm.state.answer).toEqualDecimal(1 + 2 * 2 / 3);
        });

        test("implicit multiplication with nested function", () => {
            const vm = runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_6,
                Token.DIVIDE,
                Token.NUMBER_2,
                Token.SINE,
                Token.SINE,
                Token.NUMBER_3,
                Token.NUMBER_0,
                Token.RIGHT_PARENTHESIS,
                Token.RIGHT_PARENTHESIS,
            ]);
            expect(vm.state.answer).toEqualDecimal(D(6).div(D(2).times(Decimal.sin(PI.div(180).times((Decimal.sin(PI.div(180).times(30))))))));
        });
    });

    test("two-arg parenthetical call via comma parses", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.LOGARITHM,
            Token.NUMBER_2,
            Token.COMMA,
            Token.NUMBER_8,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(3);
    });

    test("comma outside function context throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.COMMA,
                Token.NUMBER_2,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("logical and relational operators return numeric truth values", () => {
        const vmRel = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_3,
            Token.GREATER_THAN,
            Token.NUMBER_2,
        ]);
        expect(vmRel.state.answer).toEqualDecimal(1);

        const vmAnd = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.AND,
            Token.NUMBER_0,
        ]);
        expect(vmAnd.state.answer).toEqualDecimal(0);
    });

    test("math domain errors surface from operations", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_0,
                Token.INVERSE,
            ]),
            Error.MATH_ERROR,
        );
    });

    test("state survives and updates across multiple instruction lines", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
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
        ]);

        expect(vm.state.answer).toEqualDecimal(12);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("answer can be used multiple times across instruction lines", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
            Token.EXECUTION_DELIMITER,
            Token.NUMBER_5,
            Token.MULTIPLY,
            Token.ANSWER,
            Token.MULTIPLY,
            Token.ANSWER,
        ]);
        expect(vm.state.answer).toEqualDecimal(5 * 6 * 6);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("unary math function executes", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.SQUARE_ROOT,
            Token.NUMBER_9,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(3);
    });

    test("sqrt of negative throws MathError", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.SQUARE_ROOT,
                Token.NEGATIVE,
                Token.NUMBER_1,
                Token.RIGHT_PARENTHESIS,
            ]),
            Error.MATH_ERROR,
        );
    });

    test("logarithm with one argument executes", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.LOGARITHM,
            Token.NUMBER_1,
            Token.NUMBER_0,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(2);
    });

    test("logarithm call with unsupported arity throws EMULATOR_ERROR", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
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

    test("factorial executes for integer", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_5,
            Token.FACTORIAL,
        ]);
        expect(vm.state.answer).toEqualDecimal(120);
    });

    test("factorial throws MathError for non-integer", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.DECIMAL_POINT,
                Token.NUMBER_5,
                Token.FACTORIAL,
            ]),
            Error.MATH_ERROR,
        );
    });

    test("parser accepts trailing auto-close for nested expression", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.LEFT_PARENTHESIS,
            Token.LEFT_PARENTHESIS,
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_3,
        ]);
        expect(vm.state.answer).toEqualDecimal(7);
    });

    test("parser rejects malformed token sequence", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.PLUS,
                Token.MULTIPLY,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("DISPLAY line updates answer and shouldDisplay", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_8,
            Token.DIVIDE,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(4);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("division by zero stays finite or infinite but does not syntax-fail", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.DIVIDE,
                Token.NUMBER_0,
                Token.DISPLAY,
            ]),
            Error.MATH_ERROR
        );
    });
});

describe("Complex mode operations", () => {
    test("complex polar to rectangular conversion with proceeding tokens throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPLEX_NUMBER, [
                Token.NUMBER_2,
                Token.PLUS,
                Token.IMAGINARY_UNIT,
                Token.POLAR_COMPLEX,
                Token.PLUS,
                Token.NUMBER_3,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("complex polar to rectangular conversion with proceeding EXECUTION_DELIMITER does not throw syntax error", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_2,
            Token.POLAR_COMPLEX,
            Token.EXECUTION_DELIMITER,
        ]);
        expect(vm.state.answer).toEqualDecimal(2);
    });

    test("complex polar to rectangular conversion with proceeding DISPLAY does not throw syntax error", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_2,
            Token.POLAR_COMPLEX,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(2);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("complex polar to rectangular conversion", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.POLAR_COMPLEX,
        ]);
        expect(vm.state.answer).toEqualDecimal(3);
    });

    test("complex rectangular to polar conversion with proceeding tokens throws syntax error", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPLEX_NUMBER, [
                Token.NUMBER_2,
                Token.PLUS,
                Token.IMAGINARY_UNIT,
                Token.RECTANGULAR_COMPLEX,
                Token.PLUS,
                Token.NUMBER_3,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("complex rectangular to polar conversion with proceeding EXECUTION_DELIMITER does not throw syntax error", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.IMAGINARY_UNIT,
            Token.RECTANGULAR_COMPLEX,
            Token.EXECUTION_DELIMITER,
        ]);
        expect(vm.state.answer).toEqualDecimal(2);
    });

    test("complex rectangular to polar conversion with proceeding DISPLAY does not throw syntax error", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.IMAGINARY_UNIT,
            Token.RECTANGULAR_COMPLEX,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(2);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("complex rectangular to polar conversion", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.RECTANGULAR_COMPLEX,
        ]);
        expect(vm.state.answer).toEqualDecimal(3);
    });
});

describe("Precedence conformance matrix", () => {
    test("nCr currently associates with same tier as multiply/divide", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.NUMBER_0,
            Token.MULTIPLY,
            Token.NUMBER_5,
            Token.COMBINATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(100);
    });

    test("nPr currently associates with same tier as multiply/divide", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.NUMBER_5,
            Token.PERMUTATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(40);
    });

    test("angle precedence is above addition", () => {
        const vm = runProgram(CalculatorMode.COMPLEX_NUMBER, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.ANGLE,
            Token.NUMBER_6,
            Token.NUMBER_0,
        ]);
        expect(vm.state.answer).toEqualDecimal(3.5);
    });

    test("relational operators are lower precedence than arithmetic", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.PLUS,
            Token.NUMBER_2,
            Token.GREATER_THAN,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(1);
    });

    test("AND has higher precedence than OR", () => {
        const vm = runProgram(CalculatorMode.BASE, [
            Token.NUMBER_0,
            Token.OR,
            Token.NUMBER_1,
            Token.AND,
            Token.NUMBER_0,
        ]);
        expect(vm.state.answer).toEqualDecimal(0);
    });

    test("OR/XOR/XNOR are left-associative within same precedence tier", () => {
        const vm = runProgram(CalculatorMode.BASE, [
            Token.NUMBER_1,
            Token.XOR,
            Token.NUMBER_1,
            Token.XNOR,
            Token.NUMBER_0,
        ]);
        expect(vm.state.answer).toEqualDecimal(-1);
    });

    test("power outranks multiply/divide", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.POWER,
            Token.NUMBER_2,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(11);
    });

    test("x-root outranks multiply/divide", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_2,
            Token.X_ROOT,
            Token.NUMBER_9,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(5);
    });

    test("fraction tier is below power/root", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.FRACTION,
            Token.NUMBER_3,
            Token.POWER,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(D(2).div(9));
    });

    test("nPr/nCr outrank multiply/divide", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.NUMBER_0,
            Token.MULTIPLY,
            Token.NUMBER_5,
            Token.COMBINATION,
            Token.NUMBER_2,
        ]);
        expect(vm.state.answer).toEqualDecimal(100);
    });
});

describe("Additional parser and runtime edge cases", () => {
    test("scientific notation sign must be followed by exponent digit", () => {
        expectThrowsValue(
            () => runProgram(CalculatorMode.COMPUTATION, [
                Token.NUMBER_1,
                Token.SCIENTIFIC_EXPONENTIATION,
                Token.PLUS,
            ]),
            Error.SYNTAX_ERROR,
        );
    });

    test("postfix operators chain left-to-right", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_3,
            Token.SQUARE,
            Token.INVERSE,
        ]);
        expect(vm.state.answer).toEqualDecimal(D(1).div(9));
    });

    test("Not function composes with arithmetic", () => {
        const vm = runProgram(CalculatorMode.BASE, [
            Token.NOT,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
            Token.PLUS,
            Token.NUMBER_1,
        ]);
        expect(vm.state.answer).toEqualDecimal(0);
    });

    test("Neg function works on parenthesized expression", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NEGATE,
            Token.NUMBER_2,
            Token.PLUS,
            Token.NUMBER_3,
            Token.RIGHT_PARENTHESIS,
        ]);
        expect(vm.state.answer).toEqualDecimal(-5);
    });

    test("base-prefix tokens parse as unary prefixes", () => {
        const vmBin = runProgram(CalculatorMode.BASE, [
            Token.BINARY_NUMBER,
            Token.NUMBER_1,
            Token.NUMBER_0,
            Token.NUMBER_1,
        ]);
        expect(vmBin.state.answer).toEqualDecimal(5);

        const vmOct = runProgram(CalculatorMode.BASE, [
            Token.OCTAL_NUMBER,
            Token.NUMBER_1,
            Token.NUMBER_7,
        ]);
        expect(vmOct.state.answer).toEqualDecimal(15);

        const vmDec = runProgram(CalculatorMode.BASE, [
            Token.DECIMAL_NUMBER,
            Token.NUMBER_1,
            Token.NUMBER_2,
        ]);
        expect(vmDec.state.answer).toEqualDecimal(12);

        const vmHex = runProgram(CalculatorMode.BASE, [
            Token.HEXADECIMAL_NUMBER,
            Token.HEXADECIMAL_A,
            Token.NUMBER_1,
        ]);
        expect(vmHex.state.answer).toEqualDecimal(161);
    });

    test("Y-estimated value works", () => {
        const vm = new VM(new State({
            calculatorMode: CalculatorMode.PAIRED_VARIABLE_STATISTICS,
            regressionMode: RegressionMode.LINEAR,
            xData: [D(1), D(2)],
            yData: [D(3), D(5)],
        }));

        vm.execute([
            Token.NUMBER_3,
            Token.Y_ESTIMATED_VALUE,
        ]);

        expect(vm.state.answer).toEqualDecimal(7);
    });

    test("Y-estimated value binds to preceding number", () => {
        const vm = new VM(new State({
            calculatorMode: CalculatorMode.PAIRED_VARIABLE_STATISTICS,
            regressionMode: RegressionMode.LINEAR,
            xData: [D(1), D(2)],
            yData: [D(3), D(5)],
        }));

        vm.execute([
            Token.MINUS,
            Token.NUMBER_3,
            Token.Y_ESTIMATED_VALUE,
        ]);

        expect(vm.state.answer).toEqualDecimal(-5);
    });

    test("X-estimated values return both quadratic roots", () => {
        const vm = new VM(new State({
            calculatorMode: CalculatorMode.PAIRED_VARIABLE_STATISTICS,
            regressionMode: RegressionMode.QUADRATIC,
            xData: [D(1), D(2), D(3)],
            yData: [D(6), D(17), D(34)],
        }));

        vm.execute([
            Token.NUMBER_2,
            Token.X1_ESTIMATED_VALUE,
        ]);

        expect(vm.state.answer).toEqualDecimal(1 / 3);

        vm.execute([
            Token.NUMBER_2,
            Token.X2_ESTIMATED_VALUE,
        ]);

        expect(vm.state.answer).toEqualDecimal(-1);
    });
});