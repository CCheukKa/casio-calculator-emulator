import { describe, expect, test } from "bun:test";

import { Error } from "@lib/errors";
import {
    _mathErrorGuard,
    _multiplyFromTo,
    _toDegrees,
    _toGradians,
    _toRadians,
    BaseOperators,
    C,
    CommonOperators,
    ComplexOperators,
    D,
    E,
    PI,
    StatisticsOperators,
} from "@lib/operations";
import { AngleMode, NumberDisplayMode, RegressionMode } from "@lib/modes";
import { expectThrowsValue } from "@test/test";

describe("operations helpers", () => {
    test("angle conversion helpers", () => {
        expect(_toRadians(D(180), AngleMode.DEGREE)).toEqualDecimal(Math.PI);
        expect(_toDegrees(D(Math.PI), AngleMode.RADIAN)).toEqualDecimal(180);
        expect(_toGradians(D(180), AngleMode.DEGREE)).toEqualDecimal(200);
    });

    test("multiply range helper", () => {
        expect(_multiplyFromTo(D(2), D(4))).toEqualDecimal(24);
        expect(_multiplyFromTo(D(-2), D(-4))).toEqualDecimal(-24);
        expect(_multiplyFromTo(D(4), D(2))).toEqualDecimal(1);
        expect(_multiplyFromTo(D(-2), D(2))).toEqualDecimal(0);
        expectThrowsValue(() => _multiplyFromTo(D(1.5), D(4)), Error.EMULATOR_ERROR);
        expectThrowsValue(() => _multiplyFromTo(D(2), D(4.5)), Error.EMULATOR_ERROR);
    });

    test("math error guard", () => {
        expect(_mathErrorGuard(D(5))).toEqualDecimal(5);
        expectThrowsValue(() => _mathErrorGuard(D(Infinity)), Error.MATH_ERROR);
        expectThrowsValue(() => _mathErrorGuard(D(NaN)), Error.MATH_ERROR);
    });
});

describe("CommonOperators", () => {
    test("basic arithmetic", () => {
        expect(CommonOperators.add(D(2), D(3))).toEqualDecimal(5);

        expect(CommonOperators.add(D(2), D(3))).toEqualDecimal(5);

        expect(CommonOperators.subtract(D(5), D(2))).toEqualDecimal(3);

        expect(CommonOperators.multiply(D(4), D(-3))).toEqualDecimal(-12);

        expect(CommonOperators.divide(D(10), D(2))).toEqualDecimal(5);
        expectThrowsValue(() => CommonOperators.divide(D(10), D(0)), Error.MATH_ERROR);

        expect(CommonOperators.sciExp(D("1.23"), D(4))).toEqualDecimal(12300);
        expect(CommonOperators.sciExp(D("-1.23"), D(-4))).toEqualDecimal(-0.000123);

        expect(CommonOperators.negative(D(5))).toEqualDecimal(-5);
        expect(CommonOperators.negative(D(-5))).toEqualDecimal(5);

        expect(CommonOperators.percent(D(25))).toEqualDecimal(0.25);

        expect(CommonOperators.abs(D(-5))).toEqualDecimal(5);
        expect(CommonOperators.abs(D(5))).toEqualDecimal(5);
    });

    test("trigonometric and hyperbolic", () => {
        expect(CommonOperators.sin(D(30), AngleMode.DEGREE)).toEqualDecimal(0.5);
        expect(CommonOperators.sin(PI.div(6), AngleMode.RADIAN)).toEqualDecimal(0.5);
        expect(CommonOperators.sin(D(100).div(3), AngleMode.GRADIAN)).toEqualDecimal(0.5);

        expect(CommonOperators.cos(D(60), AngleMode.DEGREE)).toEqualDecimal(0.5);
        expect(CommonOperators.cos(PI.div(3), AngleMode.RADIAN)).toEqualDecimal(0.5);
        expect(CommonOperators.cos(D(200).div(3), AngleMode.GRADIAN)).toEqualDecimal(0.5);

        expect(CommonOperators.tan(D(45), AngleMode.DEGREE)).toEqualDecimal(1);
        expect(CommonOperators.tan(PI.div(4), AngleMode.RADIAN)).toEqualDecimal(1);
        expect(CommonOperators.tan(D(50), AngleMode.GRADIAN)).toEqualDecimal(1);
        expectThrowsValue(() => CommonOperators.tan(D(90), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(CommonOperators.asin(D(0.5), AngleMode.DEGREE)).toEqualDecimal(30);
        expect(CommonOperators.asin(D(0.5), AngleMode.RADIAN)).toEqualDecimal(Math.PI / 6);
        expect(CommonOperators.asin(D(0.5), AngleMode.GRADIAN)).toEqualDecimal(D(100).div(3));
        expectThrowsValue(() => CommonOperators.asin(D(2), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(CommonOperators.acos(D(0.5), AngleMode.DEGREE)).toEqualDecimal(60);
        expect(CommonOperators.acos(D(0.5), AngleMode.RADIAN)).toEqualDecimal(Math.PI / 3);
        expect(CommonOperators.acos(D(0.5), AngleMode.GRADIAN)).toEqualDecimal(D(200).div(3));
        expectThrowsValue(() => CommonOperators.acos(D(2), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(CommonOperators.atan(D(1), AngleMode.DEGREE)).toEqualDecimal(45);
        expect(CommonOperators.atan(D(1), AngleMode.RADIAN)).toEqualDecimal(Math.PI / 4);
        expect(CommonOperators.atan(D(1), AngleMode.GRADIAN)).toEqualDecimal(50);

        expect(CommonOperators.sinh(D(1))).toEqualDecimal(Math.sinh(1));

        expect(CommonOperators.cosh(D(1))).toEqualDecimal(Math.cosh(1));

        expect(CommonOperators.tanh(D(1))).toEqualDecimal(Math.tanh(1));

        expect(CommonOperators.asinh(D(1))).toEqualDecimal(Math.asinh(1));

        expect(CommonOperators.acosh(D(1))).toEqualDecimal(Math.acosh(1));
        expectThrowsValue(() => CommonOperators.acosh(D(0.5)), Error.MATH_ERROR);

        expect(CommonOperators.atanh(D(0.5))).toEqualDecimal(Math.atanh(0.5));
        expectThrowsValue(() => CommonOperators.atanh(D(2)), Error.MATH_ERROR);
    });

    test("power and logarithm", () => {
        expect(CommonOperators.square(D(-9))).toEqualDecimal(81);

        expect(CommonOperators.sqrt(D(81))).toEqualDecimal(9);
        expectThrowsValue(() => CommonOperators.sqrt(D(-1)), Error.MATH_ERROR);

        expect(CommonOperators.cube(D(-3))).toEqualDecimal(-27);

        expect(CommonOperators.cubeRoot(D(-27))).toEqualDecimal(-3);

        expect(CommonOperators.power(D(-2), D(9))).toEqualDecimal(-512);
        expect(CommonOperators.power(D(9), D(0.5))).toEqualDecimal(3);
        expect(CommonOperators.power(D(1), D(0))).toEqualDecimal(1);
        expect(CommonOperators.power(D(-32), D(0.2))).toEqualDecimal(-2);
        expect(CommonOperators.power(D(1), PI)).toEqualDecimal(1);
        expect(CommonOperators.power(D(2), PI)).toEqualDecimal(D(2).pow(PI));
        expect(CommonOperators.power(PI, E)).toEqualDecimal(PI.pow(E));
        expect(CommonOperators.power(E, PI)).toEqualDecimal(E.pow(PI));
        expectThrowsValue(() => CommonOperators.power(D(0), D(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(D(0), D(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(D(-1), D(0.25)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(D(-1), PI), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(D(-1), D(1).div(D("1.2"))), Error.MATH_ERROR);

        expect(CommonOperators.xRoot(D(2), D(9))).toEqualDecimal(3);
        expect(CommonOperators.xRoot(D(-2), D(16))).toEqualDecimal(1 / 4);
        expect(CommonOperators.xRoot(D(2), D(0))).toEqualDecimal(0);
        expect(CommonOperators.xRoot(PI, D(2))).toEqualDecimal(D(2).pow(D(1).div(PI)));
        expectThrowsValue(() => CommonOperators.xRoot(D(0), D(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(D(0), D(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(D(-1), D(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(D(2), D(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(D(1.2), D(-1)), Error.MATH_ERROR);

        expect(CommonOperators.log(D(100))).toEqualDecimal(2);
        expectThrowsValue(() => CommonOperators.log(D(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.log(D(-1)), Error.MATH_ERROR);
        expect(CommonOperators.log(D(2), D(1))).toEqualDecimal(0);
        expect(CommonOperators.log(D(2), D(8))).toEqualDecimal(3);
        expect(CommonOperators.log(D(0.5), D(2))).toEqualDecimal(-1);
        expectThrowsValue(() => CommonOperators.log(D(2), D(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.log(D(-2), D(8)), Error.MATH_ERROR);

        expect(CommonOperators.ln(E)).toEqualDecimal(1);
        expectThrowsValue(() => CommonOperators.ln(D(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.ln(D(-1)), Error.MATH_ERROR);

        expect(CommonOperators.exp(D(2))).toEqualDecimal(Math.exp(2));

        expect(CommonOperators.inverse(D(4))).toEqualDecimal(0.25);
        expectThrowsValue(() => CommonOperators.inverse(D(0)), Error.MATH_ERROR);
    });

    test("combinatorics", () => {
        expect(CommonOperators.factorial(D(5))).toEqualDecimal(120);
        expect(CommonOperators.factorial(D(0))).toEqualDecimal(1);
        expectThrowsValue(() => CommonOperators.factorial(D(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.factorial(D("2.5")), Error.MATH_ERROR);

        expect(CommonOperators.permutation(D(5), D(3))).toEqualDecimal(60);
        expectThrowsValue(() => CommonOperators.permutation(D(5), D(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.permutation(D(-5), D(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.permutation(D(5), D(6)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.permutation(D(5), D("2.5")), Error.MATH_ERROR);

        expect(CommonOperators.combination(D(5), D(3))).toEqualDecimal(10);
        expectThrowsValue(() => CommonOperators.combination(D(5), D(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.combination(D(-5), D(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.combination(D(5), D(6)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.combination(D(5), D("2.5")), Error.MATH_ERROR);
    });

    test("polar and rectangular coordinates", () => {
        const polarDegree = CommonOperators.polar(D(3).sqrt(), D(1), AngleMode.DEGREE);
        expect(polarDegree.x).toEqualDecimal(2);
        expect(polarDegree.y).toEqualDecimal(30);
        const polarRadian = CommonOperators.polar(D(3).sqrt(), D(1), AngleMode.RADIAN);
        expect(polarRadian.x).toEqualDecimal(2);
        expect(polarRadian.y).toEqualDecimal(Math.PI / 6);
        const polarGradian = CommonOperators.polar(D(3).sqrt(), D(1), AngleMode.GRADIAN);
        expect(polarGradian.x).toEqualDecimal(2);
        expect(polarGradian.y).toEqualDecimal(100 / 3);

        const rectDegree = CommonOperators.rectangular(D(2), D(30), AngleMode.DEGREE);
        expect(rectDegree.x).toEqualDecimal(Math.sqrt(3));
        expect(rectDegree.y).toEqualDecimal(1);
        const rectRadian = CommonOperators.rectangular(D(2), D(Math.PI / 6), AngleMode.RADIAN);
        expect(rectRadian.x).toEqualDecimal(Math.sqrt(3));
        expect(rectRadian.y).toEqualDecimal(1);
        const rectGradian = CommonOperators.rectangular(D(2), D(100).div(D(3)), AngleMode.GRADIAN);
        expect(rectGradian.x).toEqualDecimal(Math.sqrt(3));
        expect(rectGradian.y).toEqualDecimal(1);
    });

    test("other functions", () => {
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_0)).toEqualDecimal(12);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_1)).toEqualDecimal(12.3);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_2)).toEqualDecimal(12.35);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_3)).toEqualDecimal(12.346);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_4)).toEqualDecimal(12.3457);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_5)).toEqualDecimal(12.34568);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_6)).toEqualDecimal(12.345679);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_7)).toEqualDecimal(12.3456788);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_8)).toEqualDecimal(12.34567877);
        expect(CommonOperators.round(D("12.3456787654321"), NumberDisplayMode.FIXED_POINT_9)).toEqualDecimal(12.345678765);

        expect(CommonOperators.fromDegree(D(180), AngleMode.DEGREE)).toEqualDecimal(180);
        expect(CommonOperators.fromDegree(D(180), AngleMode.RADIAN)).toEqualDecimal(Math.PI);
        expect(CommonOperators.fromDegree(D(180), AngleMode.GRADIAN)).toEqualDecimal(200);

        expect(CommonOperators.fromRadian(D(Math.PI), AngleMode.DEGREE)).toEqualDecimal(180);
        expect(CommonOperators.fromRadian(D(Math.PI), AngleMode.RADIAN)).toEqualDecimal(Math.PI);
        expect(CommonOperators.fromRadian(D(Math.PI), AngleMode.GRADIAN)).toEqualDecimal(200);

        expect(CommonOperators.fromGradian(D(200), AngleMode.DEGREE)).toEqualDecimal(180);
        expect(CommonOperators.fromGradian(D(200), AngleMode.RADIAN)).toEqualDecimal(Math.PI);
        expect(CommonOperators.fromGradian(D(200), AngleMode.GRADIAN)).toEqualDecimal(200);
    });
});

describe("ComplexOperators", () => {
    test("basic arithmetic", () => {
        expect(ComplexOperators.add(C(1, 2), C(3, 4))).toEqualComplex(C(4, 6));

        expect(ComplexOperators.subtract(C(5, 6), C(2, 3))).toEqualComplex(C(3, 3));

        expect(ComplexOperators.multiply(C(2, 3), C(4, 5))).toEqualComplex(C(-7, 22));

        expect(ComplexOperators.divide(C(-7, 22), C(2, 3))).toEqualComplex(C(4, 5));
        expectThrowsValue(() => ComplexOperators.divide(C(1, 1), C(0, 0)), Error.MATH_ERROR);

        expect(ComplexOperators.sciExp(C("1.23"), C(4))).toEqualComplex(12300);
        expect(ComplexOperators.sciExp(C("-1.23"), C(-4))).toEqualComplex(-0.000123);
        expectThrowsValue(() => ComplexOperators.sciExp(C(1, 1), C(4, 5)), Error.EMULATOR_ERROR);

        expect(ComplexOperators.negative(C(-5, 3))).toEqualComplex(C(5, -3));
        expect(ComplexOperators.negative(C(5, -3))).toEqualComplex(C(-5, 3));

        expect(ComplexOperators.abs(C(-3, 4))).toEqualComplex(5);

        expect(ComplexOperators.conjugate(C(2, 3))).toEqualComplex(C(2, -3));
    });

    test("trigonometric and hyperbolic", () => {
        expect(ComplexOperators.sin(C(30), AngleMode.DEGREE)).toEqualComplex(0.5);
        expect(ComplexOperators.sin(C(PI.div(6)), AngleMode.RADIAN)).toEqualComplex(0.5);
        expect(ComplexOperators.sin(C(D(100).div(3)), AngleMode.GRADIAN)).toEqualComplex(0.5);
        expectThrowsValue(() => ComplexOperators.sin(C(30, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.cos(C(60), AngleMode.DEGREE)).toEqualComplex(0.5);
        expect(ComplexOperators.cos(C(PI.div(3)), AngleMode.RADIAN)).toEqualComplex(0.5);
        expect(ComplexOperators.cos(C(D(200).div(3)), AngleMode.GRADIAN)).toEqualComplex(0.5);
        expectThrowsValue(() => ComplexOperators.cos(C(60, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.tan(C(45), AngleMode.DEGREE)).toEqualComplex(1);
        expect(ComplexOperators.tan(C(PI.div(4)), AngleMode.RADIAN)).toEqualComplex(1);
        expect(ComplexOperators.tan(C(50), AngleMode.GRADIAN)).toEqualComplex(1);
        expectThrowsValue(() => ComplexOperators.tan(C(90), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.tan(C(45, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.asin(C(0.5), AngleMode.DEGREE)).toEqualComplex(30);
        expect(ComplexOperators.asin(C(0.5), AngleMode.RADIAN)).toEqualComplex(Math.PI / 6);
        expect(ComplexOperators.asin(C(0.5), AngleMode.GRADIAN)).toEqualComplex(D(100).div(3));
        expectThrowsValue(() => ComplexOperators.asin(C(2), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.asin(C(0.5, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.acos(C(0.5), AngleMode.DEGREE)).toEqualComplex(60);
        expect(ComplexOperators.acos(C(0.5), AngleMode.RADIAN)).toEqualComplex(Math.PI / 3);
        expect(ComplexOperators.acos(C(0.5), AngleMode.GRADIAN)).toEqualComplex(D(200).div(3));
        expectThrowsValue(() => ComplexOperators.acos(C(2), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.acos(C(0.5, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.atan(C(1), AngleMode.DEGREE)).toEqualComplex(45);
        expect(ComplexOperators.atan(C(1), AngleMode.RADIAN)).toEqualComplex(Math.PI / 4);
        expect(ComplexOperators.atan(C(1), AngleMode.GRADIAN)).toEqualComplex(50);
        expectThrowsValue(() => ComplexOperators.atan(C(1, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.sinh(C(1))).toEqualComplex(Math.sinh(1));
        expectThrowsValue(() => ComplexOperators.sinh(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.cosh(C(1))).toEqualComplex(Math.cosh(1));
        expectThrowsValue(() => ComplexOperators.cosh(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.tanh(C(1))).toEqualComplex(Math.tanh(1));
        expectThrowsValue(() => ComplexOperators.tanh(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.asinh(C(1))).toEqualComplex(Math.asinh(1));
        expectThrowsValue(() => ComplexOperators.asinh(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.acosh(C(1))).toEqualComplex(Math.acosh(1));
        expectThrowsValue(() => ComplexOperators.acosh(C(0.5)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.acosh(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.atanh(C(0.5))).toEqualComplex(Math.atanh(0.5));
        expectThrowsValue(() => ComplexOperators.atanh(C(2)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.atanh(C(0.5, 1)), Error.MATH_ERROR);
    });

    test("power and logarithm", () => {
        expect(ComplexOperators.square(C(-9))).toEqualComplex(C(81));
        expect(ComplexOperators.square(C(3, 4))).toEqualComplex(C(-7, 24));

        expect(ComplexOperators.sqrt(C(81))).toEqualComplex(9);
        expect(ComplexOperators.sqrt(C(-9))).toEqualComplex(C(0, 3));
        expectThrowsValue(() => ComplexOperators.sqrt(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.cube(C(-3))).toEqualComplex(C(-27));
        expect(ComplexOperators.cube(C(2, 3))).toEqualComplex(C(-46, 9));

        expect(ComplexOperators.cubeRoot(C(-27))).toEqualComplex(-3);
        expectThrowsValue(() => ComplexOperators.cubeRoot(C(-27, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.power(C(-2), C(9))).toEqualComplex(-512);
        expect(ComplexOperators.power(C(9), C(0.5))).toEqualComplex(3);
        expect(ComplexOperators.power(C(1), C(0))).toEqualComplex(1);
        expect(ComplexOperators.power(C(-32), C(0.2))).toEqualComplex(-2);
        expect(ComplexOperators.power(C(1, -2), C(2))).toEqualComplex(C(-3, -4));
        expectThrowsValue(() => ComplexOperators.power(C(0), C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(C(0), C(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(C(-1), C(0.25)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(C(-1), C(D(1).div("1.2"))), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(C(1, -2), C(-2)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(C(1, -2), C(2, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.xRoot(C(2), C(9))).toEqualComplex(3);
        expect(ComplexOperators.xRoot(C(-2), C(16))).toEqualComplex(1 / 4);
        expect(ComplexOperators.xRoot(C(2), C(0))).toEqualComplex(0);
        expectThrowsValue(() => ComplexOperators.xRoot(C(0), C(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(C(0), C(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(C(-1), C(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(C(2), C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(C(1.2), C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(C(2, 1), C(3)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(C(2), C(3, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.log(C(100))).toEqualComplex(2);
        expectThrowsValue(() => ComplexOperators.log(C(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(C(-1)), Error.MATH_ERROR);
        expect(ComplexOperators.log(C(2), C(8))).toEqualComplex(3);
        expect(ComplexOperators.log(C(0.5), C(2))).toEqualComplex(-1);
        expect(ComplexOperators.log(C(2), C(1))).toEqualComplex(0);
        expectThrowsValue(() => ComplexOperators.log(C(2), C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(C(-2), C(8)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(C(2, 1), C(8)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(C(2), C(8, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.ln(C(E))).toEqualComplex(1);
        expectThrowsValue(() => ComplexOperators.ln(C(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.ln(C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.ln(C(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.exp(C(2))).toEqualComplex(Math.exp(2));
        expectThrowsValue(() => ComplexOperators.exp(C(2, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.inverse(C(1, 1))).toEqualComplex(C(0.5, -0.5));
        expectThrowsValue(() => ComplexOperators.inverse(C(0)), Error.MATH_ERROR);
    });

    test("combinatorics", () => {
        expect(ComplexOperators.factorial(C(5))).toEqualComplex(120);
        expect(ComplexOperators.factorial(C(0))).toEqualComplex(1);
        expectThrowsValue(() => ComplexOperators.factorial(C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.factorial(C("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.factorial(C(5, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.permutation(C(5), C(3))).toEqualComplex(60);
        expectThrowsValue(() => ComplexOperators.permutation(C(5), C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(C(-5), C(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(C(5), C(6)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(C(5), C("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(C(5, 1), C(3)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(C(5), C(3, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.combination(C(5), C(3))).toEqualComplex(10);
        expectThrowsValue(() => ComplexOperators.combination(C(5), C(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(C(-5), C(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(C(5), C(6)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(C(5), C("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(C(5, 1), C(3)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(C(5), C(3, 1)), Error.MATH_ERROR);
    });

    test("polar and rectangular coordinates", () => {
        expect(ComplexOperators.polar(C(1, 1))).toEqualComplex(C(1, 1));

        expect(ComplexOperators.rectangular(C(1, 1))).toEqualComplex(C(1, 1));

        expect(ComplexOperators.angle(C(D(2).sqrt()), C(45), AngleMode.DEGREE)).toEqualComplex(C(1, 1));
        expect(ComplexOperators.angle(C(D(2).sqrt()), C(Math.PI / 4), AngleMode.RADIAN)).toEqualComplex(C(1, 1));
        expect(ComplexOperators.angle(C(D(2).sqrt()), C(50), AngleMode.GRADIAN)).toEqualComplex(C(1, 1));
        expectThrowsValue(() => ComplexOperators.angle(C(D(2).sqrt(), 1), C(45), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.angle(C(D(2).sqrt()), C(45, 1), AngleMode.DEGREE), Error.MATH_ERROR);
    });

    test("other functions", () => {
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_0)).toEqualComplex(C(12, 12));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_1)).toEqualComplex(C(12.3, 12.3));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_2)).toEqualComplex(C(12.35, 12.35));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_3)).toEqualComplex(C(12.346, 12.346));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_4)).toEqualComplex(C(12.3457, 12.3457));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_5)).toEqualComplex(C(12.34568, 12.34568));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_6)).toEqualComplex(C(12.345679, 12.345679));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_7)).toEqualComplex(C(12.3456788, 12.3456788));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_8)).toEqualComplex(C(12.34567877, 12.34567877));
        expect(ComplexOperators.round(C("12.3456787654321", "12.3456787654321"), NumberDisplayMode.FIXED_POINT_9)).toEqualComplex(C(12.345678765, 12.345678765));

        expect(ComplexOperators.fromDegree(C(180), AngleMode.DEGREE)).toEqualComplex(180);
        expect(ComplexOperators.fromDegree(C(180), AngleMode.RADIAN)).toEqualComplex(Math.PI);
        expect(ComplexOperators.fromDegree(C(180), AngleMode.GRADIAN)).toEqualComplex(200);
        expectThrowsValue(() => ComplexOperators.fromDegree(C(180, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.fromRadian(C(Math.PI), AngleMode.DEGREE)).toEqualComplex(180);
        expect(ComplexOperators.fromRadian(C(Math.PI), AngleMode.RADIAN)).toEqualComplex(Math.PI);
        expect(ComplexOperators.fromRadian(C(Math.PI), AngleMode.GRADIAN)).toEqualComplex(200);
        expectThrowsValue(() => ComplexOperators.fromRadian(C(Math.PI, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.fromGradian(C(200), AngleMode.DEGREE)).toEqualComplex(180);
        expect(ComplexOperators.fromGradian(C(200), AngleMode.RADIAN)).toEqualComplex(Math.PI);
        expect(ComplexOperators.fromGradian(C(200), AngleMode.GRADIAN)).toEqualComplex(200);
        expectThrowsValue(() => ComplexOperators.fromGradian(C(200, 1), AngleMode.DEGREE), Error.MATH_ERROR);
    });
});

describe("BaseOperators", () => {
    test("bitwise operations", () => {
        expect(BaseOperators.and(D(6), D(3))).toEqualDecimal(2);

        expect(BaseOperators.or(D(6), D(3))).toEqualDecimal(7);

        expect(BaseOperators.xnor(D(6), D(3))).toEqualDecimal(-6);

        expect(BaseOperators.xor(D(6), D(3))).toEqualDecimal(5);

        expect(BaseOperators.not(D(6))).toEqualDecimal(-7);

        expect(BaseOperators.negate(D(6))).toEqualDecimal(-6);
    });
});

describe("StatisticsOperators", () => {
    const x = [D(1), D(2), D(3)];
    const y = [D(2), D(4), D(6)];

    test("basic aggregates", () => {
        expect(StatisticsOperators.numberOfData(x)).toEqualDecimal(3);
        expectThrowsValue(() => StatisticsOperators.numberOfData([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xSum(x)).toEqualDecimal(6);
        expectThrowsValue(() => StatisticsOperators.xSum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.x2Sum(x)).toEqualDecimal(14);
        expectThrowsValue(() => StatisticsOperators.x2Sum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.ySum(y)).toEqualDecimal(12);
        expectThrowsValue(() => StatisticsOperators.ySum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.y2Sum(y)).toEqualDecimal(56);
        expectThrowsValue(() => StatisticsOperators.y2Sum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xySum(x, y)).toEqualDecimal(28);
        expectThrowsValue(() => StatisticsOperators.xySum([D(1)], [D(1), D(2)]), Error.EMULATOR_ERROR);
        expectThrowsValue(() => StatisticsOperators.xySum([], []), Error.MATH_ERROR);

        expect(StatisticsOperators.x2ySum(x, y)).toEqualDecimal(72);
        expectThrowsValue(() => StatisticsOperators.x2ySum([D(1)], [D(1), D(2)]), Error.EMULATOR_ERROR);
        expectThrowsValue(() => StatisticsOperators.x2ySum([], []), Error.MATH_ERROR);

        expect(StatisticsOperators.x3Sum(x)).toEqualDecimal(36);
        expectThrowsValue(() => StatisticsOperators.x3Sum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.x4Sum(x)).toEqualDecimal(98);
        expectThrowsValue(() => StatisticsOperators.x4Sum([]), Error.MATH_ERROR);
    });

    test("means and standard deviations", () => {
        expect(StatisticsOperators.xMean(x)).toEqualDecimal(2);
        expectThrowsValue(() => StatisticsOperators.xMean([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yMean(y)).toEqualDecimal(4);
        expectThrowsValue(() => StatisticsOperators.yMean([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xStandardDeviation(x)).toEqualDecimal(Math.sqrt(2 / 3));
        expect(StatisticsOperators.xStandardDeviation([D(1)])).toEqualDecimal(0);
        expect(StatisticsOperators.xStandardDeviation([D(1), D(2)])).toEqualDecimal(0.5);
        expectThrowsValue(() => StatisticsOperators.xStandardDeviation([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xSampleStandardDeviation(x)).toEqualDecimal(1);
        expect(StatisticsOperators.xSampleStandardDeviation([D(1)])).toEqualDecimal(0);
        expect(StatisticsOperators.xSampleStandardDeviation([D(1), D(2)])).toEqualDecimal(Math.sqrt(0.5));
        expectThrowsValue(() => StatisticsOperators.xSampleStandardDeviation([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yStandardDeviation(y)).toEqualDecimal(Math.sqrt(8 / 3));
        expect(StatisticsOperators.yStandardDeviation([D(2)])).toEqualDecimal(0);
        expect(StatisticsOperators.yStandardDeviation([D(2), D(4)])).toEqualDecimal(1);
        expectThrowsValue(() => StatisticsOperators.yStandardDeviation([]), Error.MATH_ERROR);

        expect(StatisticsOperators.ySampleStandardDeviation(y)).toEqualDecimal(Math.sqrt(4));
        expect(StatisticsOperators.ySampleStandardDeviation([D(2)])).toEqualDecimal(0);
        expect(StatisticsOperators.ySampleStandardDeviation([D(2), D(4)])).toEqualDecimal(Math.sqrt(2));
        expectThrowsValue(() => StatisticsOperators.ySampleStandardDeviation([]), Error.MATH_ERROR);
    });

    test("extrema", () => {
        expect(StatisticsOperators.xMin(x)).toEqualDecimal(1);
        expectThrowsValue(() => StatisticsOperators.xMin([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xMax(x)).toEqualDecimal(3);
        expectThrowsValue(() => StatisticsOperators.xMax([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yMin(y)).toEqualDecimal(2);
        expectThrowsValue(() => StatisticsOperators.yMin([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yMax(y)).toEqualDecimal(6);
        expectThrowsValue(() => StatisticsOperators.yMax([]), Error.MATH_ERROR);
    });

    test("linear regression", () => {
        // y = 1 + 2x
        const x = [D(1), D(2)];
        const y = [D(3), D(5)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.LINEAR)).toEqualDecimal(1);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.LINEAR)).toEqualDecimal(2);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.LINEAR)).toEqualDecimal(1);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.LINEAR, D(7))).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.LINEAR, D(3))).toEqualDecimal(7);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.LINEAR, D(7)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.LINEAR, D(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(2)], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(2)], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([D(1)], [D(2)], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([D(1)], [D(2)], RegressionMode.LINEAR, D(7)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(2)], RegressionMode.LINEAR, D(3)), Error.MATH_ERROR);
    });

    test("logarithmic regression", () => {
        // y = 1 + 2ln(x)
        const x = [D(1), D(2)];
        const y = [D(1), D(1).add(D(2).ln().times(2))];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.LOGARITHMIC)).toEqualDecimal(1);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.LOGARITHMIC)).toEqualDecimal(2);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.LOGARITHMIC)).toEqualDecimal(1);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.LOGARITHMIC, D(D(1).add(D(3).ln().times(2))))).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.LOGARITHMIC, D(3))).toEqualDecimal(D(1).add(D(3).ln().times(2)));

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.LOGARITHMIC, D(D(1).add(D(3).ln().times(2)))), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.LOGARITHMIC, D(3)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(0)], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(0)], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([D(1)], [D(0)], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([D(1)], [D(0)], RegressionMode.LOGARITHMIC, D(D(1).add(D(3).ln().times(2)))), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(0)], RegressionMode.LOGARITHMIC, D(3)), Error.MATH_ERROR);
    });

    test("exponential regression", () => {
        // y = 2 * e^(3x)
        const x = [D(1), D(2)];
        const y = [D(2).times(D(3).exp()), D(2).times(D(6).exp())];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.EXPONENTIAL)).toEqualDecimal(2);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.EXPONENTIAL)).toEqualDecimal(3);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.EXPONENTIAL)).toEqualDecimal(1);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.EXPONENTIAL, D(2).times(D(9).exp()))).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.EXPONENTIAL, D(3))).toEqualDecimal(D(2).times(D(9).exp()));

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.EXPONENTIAL, D(2).times(D(9).exp())), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.EXPONENTIAL, D(3)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(6)], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(6)], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([D(1)], [D(6)], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([D(1)], [D(6)], RegressionMode.EXPONENTIAL, D(2).times(D(9).exp())), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(6)], RegressionMode.EXPONENTIAL, D(3)), Error.MATH_ERROR);
    });

    test("power regression", () => {
        // y = 2 * x^3
        const x = [D(1), D(2)];
        const y = [D(2), D(16)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.POWER)).toEqualDecimal(2);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.POWER)).toEqualDecimal(3);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.POWER)).toEqualDecimal(1);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.POWER, D(54))).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.POWER, D(3))).toEqualDecimal(54);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.POWER, D(54)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.POWER, D(3)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(2)], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(2)], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([D(1)], [D(2)], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([D(1)], [D(2)], RegressionMode.POWER, D(54)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(2)], RegressionMode.POWER, D(3)), Error.MATH_ERROR);
    });

    test("inverse regression", () => {
        // y = 1 + 2/x
        const x = [D(1), D(2)];
        const y = [D(3), D(2)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.INVERSE)).toEqualDecimal(1);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.INVERSE)).toEqualDecimal(2);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.INVERSE)).toEqualDecimal(1);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.INVERSE, D(5 / 3))).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.INVERSE, D(3))).toEqualDecimal(5 / 3);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.INVERSE, D(5 / 3)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.INVERSE, D(3)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(2)], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(2)], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([D(1)], [D(2)], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([D(1)], [D(2)], RegressionMode.INVERSE, D(5 / 3)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(2)], RegressionMode.INVERSE, D(3)), Error.MATH_ERROR);
    });

    test("quadratic regression", () => {
        // y = 1 + 2x + 3x^2
        const x = [D(1), D(2), D(3)];
        const y = [D(6), D(17), D(34)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.QUADRATIC)).toEqualDecimal(1);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.QUADRATIC)).toEqualDecimal(2);
        expect(StatisticsOperators.regressionC(x, y, RegressionMode.QUADRATIC)).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedX1(x, y, RegressionMode.QUADRATIC, D(17))).toEqualDecimal(2);
        expect(StatisticsOperators.estimatedX2(x, y, RegressionMode.QUADRATIC, D(17))).toEqualDecimal(-8 / 3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.QUADRATIC, D(4))).toEqualDecimal(1 + 2 * 4 + 3 * 16);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionC([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX1([], [], RegressionMode.QUADRATIC, D(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX2([], [], RegressionMode.QUADRATIC, D(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.QUADRATIC, D(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionC([D(1)], [D(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX1([D(1)], [D(6)], RegressionMode.QUADRATIC, D(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX2([D(1)], [D(6)], RegressionMode.QUADRATIC, D(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(6)], RegressionMode.QUADRATIC, D(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1), D(2)], [D(6), D(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1), D(2)], [D(6), D(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionC([D(1), D(2)], [D(6), D(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX1([D(1), D(2)], [D(6), D(17)], RegressionMode.QUADRATIC, D(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX2([D(1), D(2)], [D(6), D(17)], RegressionMode.QUADRATIC, D(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1), D(2)], [D(6), D(17)], RegressionMode.QUADRATIC, D(4)), Error.MATH_ERROR);
    });

    test("ab exponential regression", () => {
        // y = 2 * 3^x
        const x = [D(1), D(2)];
        const y = [D(6), D(18)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.AB_EXPONENTIAL)).toEqualDecimal(2);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.AB_EXPONENTIAL)).toEqualDecimal(3);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.AB_EXPONENTIAL)).toEqualDecimal(1);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.AB_EXPONENTIAL, D(54))).toEqualDecimal(3);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.AB_EXPONENTIAL, D(3))).toEqualDecimal(54);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.AB_EXPONENTIAL, D(54)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.AB_EXPONENTIAL, D(3)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([D(1)], [D(6)], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([D(1)], [D(6)], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([D(1)], [D(6)], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([D(1)], [D(6)], RegressionMode.AB_EXPONENTIAL, D(54)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([D(1)], [D(6)], RegressionMode.AB_EXPONENTIAL, D(3)), Error.MATH_ERROR);
    });
});
