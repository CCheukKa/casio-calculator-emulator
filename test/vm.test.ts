import { describe, expect, test } from "bun:test";

import { Error } from "@lib/errors";
import { Token } from "@lib/tokens";
import { State, VM } from "@lib/vm";
import { CalculatorMode } from "@lib/modes";
import { expectThrowsValue } from "@test/test";
import { D, PI } from "@lib/operations";
import Decimal from "decimal.js";

const runProgram = (calculatorMode: CalculatorMode, program: Token[]) => {
    const vm = new VM(new State({ calculatorMode }));
    vm.execute(program);
    return vm;
};

describe("VM parsing and execution edge cases", () => {
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
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);

        const vmB = runProgram(CalculatorMode.COMPUTATION, [
            Token.SINE,
            Token.NUMBER_4,
            Token.NUMBER_5,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(1);
    });

    test("minus acts as unary operator when preceding a number", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_3,
            Token.MULTIPLY,
            Token.NUMBER_4,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(-12);
    });

    test("postfix priority above unary minus", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NEGATIVE,
            Token.NUMBER_2,
            Token.SQUARE,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(-4);
    });

    test("unary minus gives same answer as negative token", () => {
        const vmUnary = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        const vmNegative = runProgram(CalculatorMode.COMPUTATION, [
            Token.NEGATIVE,
            Token.NUMBER_2,
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(1.25);
    });

    test("decimal point without following number is allowed", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.DECIMAL_POINT,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(1);
    });

    test("scientific notation parsing", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vmPos.state.answer).toEqualDecimal(-100);

        const vmNeg = runProgram(CalculatorMode.COMPUTATION, [
            Token.MINUS,
            Token.NUMBER_1,
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.MINUS,
            Token.NUMBER_2,
            Token.DISPLAY,
        ]);
        expect(vmNeg.state.answer).toEqualDecimal(-0.01);
    });

    test("scientific notation without base number is accepted and treated as 1", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.SCIENTIFIC_EXPONENTIATION,
            Token.NUMBER_2,
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(18);
    });

    test("explicit multiplication with constant", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.PI,
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(2 * PI);
    });

    test("implicit multiplication with parenthetical function", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_2,
            Token.MULTIPLY,
            Token.SINE,
            Token.NUMBER_3,
            Token.NUMBER_0,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vmb.state.answer).toEqualDecimal(10 * Math.cos(PI / 180 * 30) * 45 * Math.sin(PI / 180 * 30) * PI * PI);
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

    test("two-arg parenthetical call via comma parses", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.LOGARITHM,
            Token.NUMBER_2,
            Token.COMMA,
            Token.NUMBER_8,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vmRel.state.answer).toEqualDecimal(1);

        const vmAnd = runProgram(CalculatorMode.COMPUTATION, [
            Token.NUMBER_1,
            Token.AND,
            Token.NUMBER_0,
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
        ]);
        expect(vm.state.answer).toEqualDecimal(5 * 6 * 6);
        expect(vm.state.shouldDisplay).toBe(true);
    });

    test("unary math function executes", () => {
        const vm = runProgram(CalculatorMode.COMPUTATION, [
            Token.SQUARE_ROOT,
            Token.NUMBER_9,
            Token.RIGHT_PARENTHESIS,
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
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
            Token.DISPLAY,
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