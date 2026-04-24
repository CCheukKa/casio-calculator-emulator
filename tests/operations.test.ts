import Decimal from "decimal.js";
import { describe, expect, test } from "bun:test";

import { Error } from "@lib/errors";
import {
    _mathErrorGuard,
    _multiplyFromTo,
    _toDegrees,
    _toGradians,
    _toRadians,
    BaseOperators,
    CommonOperators,
    ComplexOperators,
    E,
    PI,
    StatisticsOperators,
} from "@lib/operations";
import { AngleMode, NumberDisplayMode, RegressionMode } from "@lib/modes";

const d = (value: Decimal.Value) => new Decimal(value);
const c = (re: Decimal.Value, im: Decimal.Value = 0) => ({ re: d(re), im: d(im) });
const TARGET_PRECISION = 15;

const expectThrowsValue = (fn: () => unknown, expected: unknown) => {
    try {
        fn();
    } catch (error) {
        expect(error).toBe(expected);
        return;
    }
    throw new globalThis.Error("Expected function to throw.");
};

describe("operations helpers", () => {
    test("angle conversion helpers", () => {
        expect(_toRadians(d(180), AngleMode.DEGREE).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(_toDegrees(d(Math.PI), AngleMode.RADIAN).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(_toGradians(d(180), AngleMode.DEGREE).toNumber()).toBeCloseTo(200, TARGET_PRECISION);
    });

    test("multiply range helper", () => {
        expect(_multiplyFromTo(d(2), d(4)).toNumber()).toBe(24);
        expect(_multiplyFromTo(d(-2), d(-4)).toNumber()).toBe(-24);
        expect(_multiplyFromTo(d(4), d(2)).toNumber()).toBe(1);
        expect(_multiplyFromTo(d(-2), d(2)).toNumber()).toBe(0);
        expectThrowsValue(() => _multiplyFromTo(d(1.5), d(4)), Error.EMULATOR_ERROR);
        expectThrowsValue(() => _multiplyFromTo(d(2), d(4.5)), Error.EMULATOR_ERROR);
    });

    test("math error guard", () => {
        expect(_mathErrorGuard(d(5)).toNumber()).toBe(5);
        expectThrowsValue(() => _mathErrorGuard(d(Infinity)), Error.MATH_ERROR);
        expectThrowsValue(() => _mathErrorGuard(d(NaN)), Error.MATH_ERROR);
    });
});

describe("CommonOperators", () => {
    test("basic arithmetic", () => {
        expect(CommonOperators.add(d(2), d(3)).toNumber()).toBe(5);

        expect(CommonOperators.subtract(d(5), d(2)).toNumber()).toBe(3);

        expect(CommonOperators.multiply(d(4), d(-3)).toNumber()).toBe(-12);

        expect(CommonOperators.divide(d(10), d(2)).toNumber()).toBe(5);
        expectThrowsValue(() => CommonOperators.divide(d(10), d(0)), Error.MATH_ERROR);

        expect(CommonOperators.sciExp(d("1.23"), d(4)).toNumber()).toBe(12300);
        expect(CommonOperators.sciExp(d("-1.23"), d(-4)).toNumber()).toBe(-0.000123);

        expect(CommonOperators.negative(d(5)).toNumber()).toBe(-5);
        expect(CommonOperators.negative(d(-5)).toNumber()).toBe(5);

        expect(CommonOperators.percent(d(25)).toNumber()).toBe(0.25);

        expect(CommonOperators.abs(d(-5)).toNumber()).toBe(5);
        expect(CommonOperators.abs(d(5)).toNumber()).toBe(5);
    });

    test("trigonometric and hyperbolic", () => {
        expect(CommonOperators.sin(d(30), AngleMode.DEGREE).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(CommonOperators.sin(PI.div(6), AngleMode.RADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(CommonOperators.sin(d(50), AngleMode.GRADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);

        expect(CommonOperators.cos(d(60), AngleMode.DEGREE).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(CommonOperators.cos(PI.div(3), AngleMode.RADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(CommonOperators.cos(d(100), AngleMode.GRADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);

        expect(CommonOperators.tan(d(45), AngleMode.DEGREE).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(CommonOperators.tan(PI.div(4), AngleMode.RADIAN).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(CommonOperators.tan(d(50), AngleMode.GRADIAN).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.tan(d(90), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(CommonOperators.asin(d(0.5), AngleMode.DEGREE).toNumber()).toBeCloseTo(30, TARGET_PRECISION);
        expect(CommonOperators.asin(d(0.5), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI / 6, TARGET_PRECISION);
        expect(CommonOperators.asin(d(0.5), AngleMode.GRADIAN).toNumber()).toBeCloseTo(50, TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.asin(d(2), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(CommonOperators.acos(d(0.5), AngleMode.DEGREE).toNumber()).toBeCloseTo(60, TARGET_PRECISION);
        expect(CommonOperators.acos(d(0.5), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI / 3, TARGET_PRECISION);
        expect(CommonOperators.acos(d(0.5), AngleMode.GRADIAN).toNumber()).toBeCloseTo(100, TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.acos(d(2), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(CommonOperators.atan(d(1), AngleMode.DEGREE).toNumber()).toBeCloseTo(45, TARGET_PRECISION);
        expect(CommonOperators.atan(d(1), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI / 4, TARGET_PRECISION);
        expect(CommonOperators.atan(d(1), AngleMode.GRADIAN).toNumber()).toBeCloseTo(50, TARGET_PRECISION);

        expect(CommonOperators.sinh(d(1)).toNumber()).toBeCloseTo(Math.sinh(1), TARGET_PRECISION);

        expect(CommonOperators.cosh(d(1)).toNumber()).toBeCloseTo(Math.cosh(1), TARGET_PRECISION);

        expect(CommonOperators.tanh(d(1)).toNumber()).toBeCloseTo(Math.tanh(1), TARGET_PRECISION);

        expect(CommonOperators.asinh(d(1)).toNumber()).toBeCloseTo(Math.asinh(1), TARGET_PRECISION);

        expect(CommonOperators.acosh(d(1)).toNumber()).toBeCloseTo(Math.acosh(1), TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.acosh(d(0.5)), Error.MATH_ERROR);

        expect(CommonOperators.atanh(d(0.5)).toNumber()).toBeCloseTo(Math.atanh(0.5), TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.atanh(d(2)), Error.MATH_ERROR);
    });

    test("power and logarithm", () => {
        expect(CommonOperators.square(d(-9)).toNumber()).toBe(81);

        expect(CommonOperators.sqrt(d(81)).toNumber()).toBe(9);
        expectThrowsValue(() => CommonOperators.sqrt(d(-1)), Error.MATH_ERROR);

        expect(CommonOperators.cube(d(-3)).toNumber()).toBe(-27);

        expect(CommonOperators.cubeRoot(d(-27)).toNumber()).toBe(-3);

        expect(CommonOperators.power(d(-2), d(9)).toNumber()).toBe(-512);
        expect(CommonOperators.power(d(9), d(0.5)).toNumber()).toBe(3);
        expect(CommonOperators.power(d(1), d(0)).toNumber()).toBe(1);
        expect(CommonOperators.power(d(-32), d(0.2)).toNumber()).toBe(-2);
        expectThrowsValue(() => CommonOperators.power(d(0), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(d(0), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(d(-1), d(0.25)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(d(-1), d(1).div(d("1.2"))), Error.MATH_ERROR);

        expect(CommonOperators.xRoot(d(2), d(9)).toNumber()).toBe(3);
        expect(CommonOperators.xRoot(d(-2), d(16)).toNumber()).toBe(1 / 4);
        expect(CommonOperators.xRoot(d(2), d(0)).toNumber()).toBe(1 / 4);
        expectThrowsValue(() => CommonOperators.xRoot(d(0), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(d(0), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(d(-1), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(d(2), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.xRoot(d(1.2), d(-1)), Error.MATH_ERROR);

        expect(CommonOperators.log(d(100)).toNumber()).toBe(2);
        expectThrowsValue(() => CommonOperators.log(d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.log(d(-1)), Error.MATH_ERROR);
        expect(CommonOperators.log(d(2), d(8)).toNumber()).toBe(3);
        expect(CommonOperators.log(d(0.5), d(2)).toNumber()).toBe(-1);
        expectThrowsValue(() => CommonOperators.log(d(2), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.log(d(2), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.log(d(-2), d(8)), Error.MATH_ERROR);

        expect(CommonOperators.ln(E).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.ln(d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.ln(d(-1)), Error.MATH_ERROR);

        expect(CommonOperators.exp(d(2)).toNumber()).toBeCloseTo(Math.exp(2), TARGET_PRECISION);

        expect(CommonOperators.inverse(d(4)).toNumber()).toBe(0.25);
        expectThrowsValue(() => CommonOperators.inverse(d(0)), Error.MATH_ERROR);
    });

    test("combinatorics", () => {
        expect(CommonOperators.factorial(d(5)).toNumber()).toBe(120);
        expect(CommonOperators.factorial(d(0)).toNumber()).toBe(1);
        expectThrowsValue(() => CommonOperators.factorial(d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.factorial(d("2.5")), Error.MATH_ERROR);

        expect(CommonOperators.permutation(d(5), d(3)).toNumber()).toBe(60);
        expectThrowsValue(() => CommonOperators.permutation(d(5), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.permutation(d(-5), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.permutation(d(5), d(6)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.permutation(d(5), d("2.5")), Error.MATH_ERROR);

        expect(CommonOperators.combination(d(5), d(3)).toNumber()).toBe(10);
        expectThrowsValue(() => CommonOperators.combination(d(5), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.combination(d(-5), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.combination(d(5), d(6)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.combination(d(5), d("2.5")), Error.MATH_ERROR);
    });

    test("polar and rectangular coordinates", () => {
        const polarDegree = CommonOperators.polar(d(3).sqrt(), d(1), AngleMode.DEGREE);
        expect(polarDegree.x.toNumber()).toBe(2);
        expect(polarDegree.y.toNumber()).toBeCloseTo(30, TARGET_PRECISION);
        const polarRadian = CommonOperators.polar(d(3).sqrt(), d(1), AngleMode.RADIAN);
        expect(polarRadian.x.toNumber()).toBe(2);
        expect(polarRadian.y.toNumber()).toBeCloseTo(Math.PI / 6, TARGET_PRECISION);
        const polarGradian = CommonOperators.polar(d(3).sqrt(), d(1), AngleMode.GRADIAN);
        expect(polarGradian.x.toNumber()).toBe(2);
        expect(polarGradian.y.toNumber()).toBeCloseTo(100 / 3, TARGET_PRECISION);

        const rectDegree = CommonOperators.rectangular(d(2), d(30), AngleMode.DEGREE);
        expect(rectDegree.x.toNumber()).toBeCloseTo(Math.sqrt(3), TARGET_PRECISION);
        expect(rectDegree.y.toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        const rectRadian = CommonOperators.rectangular(d(2), d(Math.PI / 6), AngleMode.RADIAN);
        expect(rectRadian.x.toNumber()).toBeCloseTo(Math.sqrt(3), TARGET_PRECISION);
        expect(rectRadian.y.toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        const rectGradian = CommonOperators.rectangular(d(2), d(100).div(d(3)), AngleMode.GRADIAN);
        expect(rectGradian.x.toNumber()).toBeCloseTo(Math.sqrt(3), TARGET_PRECISION);
        expect(rectGradian.y.toNumber()).toBeCloseTo(1, TARGET_PRECISION);
    });

    test("other functions", () => {
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_0).toNumber()).toBe(12);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_1).toNumber()).toBe(12.3);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_2).toNumber()).toBe(12.35);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_3).toNumber()).toBe(12.346);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_4).toNumber()).toBe(12.3457);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_5).toNumber()).toBe(12.34568);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_6).toNumber()).toBe(12.345679);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_7).toNumber()).toBe(12.3456789);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_8).toNumber()).toBe(12.34567899);
        expect(CommonOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_9).toNumber()).toBe(12.345678988);

        expect(CommonOperators.fromDegree(d(180), AngleMode.DEGREE).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(CommonOperators.fromDegree(d(180), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(CommonOperators.fromDegree(d(180), AngleMode.GRADIAN).toNumber()).toBeCloseTo(200, TARGET_PRECISION);

        expect(CommonOperators.fromRadian(d(Math.PI), AngleMode.DEGREE).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(CommonOperators.fromRadian(d(Math.PI), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(CommonOperators.fromRadian(d(Math.PI), AngleMode.GRADIAN).toNumber()).toBeCloseTo(200, TARGET_PRECISION);

        expect(CommonOperators.fromGradian(d(200), AngleMode.DEGREE).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(CommonOperators.fromGradian(d(200), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(CommonOperators.fromGradian(d(200), AngleMode.GRADIAN).toNumber()).toBeCloseTo(200, TARGET_PRECISION);
    });
});

describe("ComplexOperators", () => {
    test("basic arithmetic", () => {
        expect(ComplexOperators.add(c(1, 2), c(3, 4))).toEqual(c(4, 6));

        expect(ComplexOperators.subtract(c(5, 6), c(2, 3))).toEqual(c(3, 3));

        expect(ComplexOperators.multiply(c(2, 3), c(4, 5))).toEqual(c(-7, 22));

        expect(ComplexOperators.divide(c(-7, 22), c(2, 3))).toEqual(c(4, 5));
        expectThrowsValue(() => ComplexOperators.divide(c(1, 1), c(0, 0)), Error.MATH_ERROR);

        expect(ComplexOperators.sciExp(c("1.23"), c(4))).toBe(c(12300));
        expect(ComplexOperators.sciExp(c("-1.23"), c(-4))).toBe(c(-0.000123));
        expectThrowsValue(() => ComplexOperators.sciExp(c(1, 1), c(4, 5)), Error.EMULATOR_ERROR);

        expect(ComplexOperators.negative(c(-5, 3))).toEqual(c(5, -3));
        expect(ComplexOperators.negative(c(5, -3))).toEqual(c(-5, 3));

        expect(ComplexOperators.abs(c(-3, 4))).toEqual(c(5, 0));

        expect(ComplexOperators.conjugate(c(2, 3))).toEqual(c(2, -3));
    });

    test("trigonometric and hyperbolic", () => {
        expect(ComplexOperators.sin(c(30), AngleMode.DEGREE)).toEqual(c(0.5));
        expect(ComplexOperators.sin(c(PI.div(6)), AngleMode.RADIAN)).toEqual(c(0.5));
        expect(ComplexOperators.sin(c(50), AngleMode.GRADIAN)).toEqual(c(0.5));
        expectThrowsValue(() => ComplexOperators.sin(c(30, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.cos(c(60), AngleMode.DEGREE)).toEqual(c(0.5));
        expect(ComplexOperators.cos(c(PI.div(3)), AngleMode.RADIAN)).toEqual(c(0.5));
        expect(ComplexOperators.cos(c(100), AngleMode.GRADIAN)).toEqual(c(0.5));
        expectThrowsValue(() => ComplexOperators.cos(c(60, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.tan(c(45), AngleMode.DEGREE)).toEqual(c(1));
        expect(ComplexOperators.tan(c(PI.div(4)), AngleMode.RADIAN)).toEqual(c(1));
        expect(ComplexOperators.tan(c(50), AngleMode.GRADIAN)).toEqual(c(1));
        expectThrowsValue(() => ComplexOperators.tan(c(90), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.tan(c(45, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.asin(c(0.5), AngleMode.DEGREE)).toEqual(c(30));
        expect(ComplexOperators.asin(c(0.5), AngleMode.RADIAN)).toEqual(c(Math.PI / 6));
        expect(ComplexOperators.asin(c(0.5), AngleMode.GRADIAN)).toEqual(c(50));
        expectThrowsValue(() => ComplexOperators.asin(c(2), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.asin(c(0.5, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.acos(c(0.5), AngleMode.DEGREE)).toEqual(c(60));
        expect(ComplexOperators.acos(c(0.5), AngleMode.RADIAN)).toEqual(c(Math.PI / 3));
        expect(ComplexOperators.acos(c(0.5), AngleMode.GRADIAN)).toEqual(c(100));
        expectThrowsValue(() => ComplexOperators.acos(c(2), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.acos(c(0.5, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.atan(c(1), AngleMode.DEGREE)).toEqual(c(45));
        expect(ComplexOperators.atan(c(1), AngleMode.RADIAN)).toEqual(c(Math.PI / 4));
        expect(ComplexOperators.atan(c(1), AngleMode.GRADIAN)).toEqual(c(50));
        expectThrowsValue(() => ComplexOperators.atan(c(1, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.sinh(c(1))).toEqual(c(Math.sinh(1)));
        expectThrowsValue(() => ComplexOperators.sinh(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.cosh(c(1))).toEqual(c(Math.cosh(1)));
        expectThrowsValue(() => ComplexOperators.cosh(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.tanh(c(1))).toEqual(c(Math.tanh(1)));
        expectThrowsValue(() => ComplexOperators.tanh(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.asinh(c(1))).toEqual(c(Math.asinh(1)));
        expectThrowsValue(() => ComplexOperators.asinh(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.acosh(c(1))).toEqual(c(Math.acosh(1)));
        expectThrowsValue(() => ComplexOperators.acosh(c(0.5)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.acosh(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.atanh(c(0.5))).toEqual(c(Math.atanh(0.5)));
        expectThrowsValue(() => ComplexOperators.atanh(c(2)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.atanh(c(0.5, 1)), Error.MATH_ERROR);
    });

    test("power and logarithm", () => {
        expect(ComplexOperators.square(c(-9))).toEqual(c(81));
        expect(ComplexOperators.square(c(3, 4))).toEqual(c(-7, 24));

        expect(ComplexOperators.sqrt(c(81))).toEqual(c(9));
        expectThrowsValue(() => ComplexOperators.sqrt(c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.sqrt(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.cube(c(-3))).toEqual(c(-27));
        expect(ComplexOperators.cube(c(2, 3))).toEqual(c(-46, 9));

        expect(ComplexOperators.cubeRoot(c(-27))).toEqual(c(-3));
        expectThrowsValue(() => ComplexOperators.cubeRoot(c(-27, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.power(c(-2), c(9))).toEqual(c(-512));
        expect(ComplexOperators.power(c(9), c(0.5))).toEqual(c(3));
        expect(ComplexOperators.power(c(1), c(0))).toEqual(c(1));
        expect(ComplexOperators.power(c(-32), c(0.2))).toEqual(c(-2));
        expectThrowsValue(() => ComplexOperators.power(c(0), c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(c(0), c(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(c(-1), c(0.25)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(c(-1), c(d(1).div("1.2"))), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(c(-1, 1), c(2)), Error.MATH_ERROR);

        expect(ComplexOperators.xRoot(c(2), c(9))).toEqual(c(3));
        expect(ComplexOperators.xRoot(c(-2), c(16))).toEqual(c(1 / 4));
        expect(ComplexOperators.xRoot(c(2), c(0))).toEqual(c(1 / 4));
        expectThrowsValue(() => ComplexOperators.xRoot(c(0), c(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(c(0), c(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(c(-1), c(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(c(2), c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(c(1.2), c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(c(2, 1), c(3)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(c(2), c(3, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.log(c(100))).toEqual(c(2));
        expectThrowsValue(() => ComplexOperators.log(c(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(c(-1)), Error.MATH_ERROR);
        expect(ComplexOperators.log(c(2), c(8))).toEqual(c(3));
        expect(ComplexOperators.log(c(0.5), c(2))).toEqual(c(-1));
        expectThrowsValue(() => ComplexOperators.log(c(2), c(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(c(2), c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(c(-2), c(8)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(c(2, 1), c(8)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(c(2), c(8, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.ln(c(E))).toEqual(c(1));
        expectThrowsValue(() => ComplexOperators.ln(c(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.ln(c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.ln(c(1, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.exp(c(2))).toEqual(c(Math.exp(2)));
        expectThrowsValue(() => ComplexOperators.exp(c(2, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.inverse(c(1, 1))).toEqual(c(0.5, -0.5));
        expectThrowsValue(() => ComplexOperators.inverse(c(0)), Error.MATH_ERROR);
    });

    test("combinatorics", () => {
        expect(ComplexOperators.factorial(c(5))).toEqual(c(120));
        expect(ComplexOperators.factorial(c(0))).toEqual(c(1));
        expectThrowsValue(() => ComplexOperators.factorial(c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.factorial(c("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.factorial(c(5, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.permutation(c(5), c(3))).toEqual(c(60));
        expectThrowsValue(() => ComplexOperators.permutation(c(5), c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(c(-5), c(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(c(5), c(6)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(c(5), c("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(c(5, 1), c(3)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(c(5), c(3, 1)), Error.MATH_ERROR);

        expect(ComplexOperators.combination(c(5), c(3))).toEqual(c(10));
        expectThrowsValue(() => ComplexOperators.combination(c(5), c(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(c(-5), c(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(c(5), c(6)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(c(5), c("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(c(5, 1), c(3)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(c(5), c(3, 1)), Error.MATH_ERROR);
    });

    test("polar and rectangular coordinates", () => {
        expect(ComplexOperators.polar(c(1, 1))).toEqual(c(1, 1));

        expect(ComplexOperators.rectangular(c(1, 1))).toEqual(c(1, 1));

        expect(ComplexOperators.angle(c(d(2).sqrt()), c(45), AngleMode.DEGREE)).toEqual(c(1, 1));
        expect(ComplexOperators.angle(c(d(2).sqrt()), c(Math.PI / 4), AngleMode.RADIAN)).toEqual(c(1, 1));
        expect(ComplexOperators.angle(c(d(2).sqrt()), c(50), AngleMode.GRADIAN)).toEqual(c(1, 1));
        expectThrowsValue(() => ComplexOperators.angle(c(d(2).sqrt(), 1), c(45), AngleMode.DEGREE), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.angle(c(d(2).sqrt()), c(45, 1), AngleMode.DEGREE), Error.MATH_ERROR);
    });

    test("other functions", () => {
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_0)).toEqual(c(12, 12));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_1)).toEqual(c(12.3, 12.3));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_2)).toEqual(c(12.35, 12.35));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_3)).toEqual(c(12.346, 12.346));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_4)).toEqual(c(12.3457, 12.3457));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_5)).toEqual(c(12.34568, 12.34568));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_6)).toEqual(c(12.345679, 12.345679));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_7)).toEqual(c(12.3456789, 12.3456789));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_8)).toEqual(c(12.34567899, 12.34567899));
        expect(ComplexOperators.round(c("12.345678987654321", "12.345678987654321"), NumberDisplayMode.FIXED_POINT_9)).toEqual(c(12.345678988, 12.345678988));

        expect(ComplexOperators.fromDegree(c(180), AngleMode.DEGREE)).toEqual(c(180));
        expect(ComplexOperators.fromDegree(c(180), AngleMode.RADIAN)).toEqual(c(Math.PI));
        expect(ComplexOperators.fromDegree(c(180), AngleMode.GRADIAN)).toEqual(c(200));
        expectThrowsValue(() => ComplexOperators.fromDegree(c(180, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.fromRadian(c(Math.PI), AngleMode.DEGREE)).toEqual(c(180));
        expect(ComplexOperators.fromRadian(c(Math.PI), AngleMode.RADIAN)).toEqual(c(Math.PI));
        expect(ComplexOperators.fromRadian(c(Math.PI), AngleMode.GRADIAN)).toEqual(c(200));
        expectThrowsValue(() => ComplexOperators.fromRadian(c(Math.PI, 1), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.fromGradian(c(200), AngleMode.DEGREE)).toEqual(c(180));
        expect(ComplexOperators.fromGradian(c(200), AngleMode.RADIAN)).toEqual(c(Math.PI));
        expect(ComplexOperators.fromGradian(c(200), AngleMode.GRADIAN)).toEqual(c(200));
        expectThrowsValue(() => ComplexOperators.fromGradian(c(200, 1), AngleMode.DEGREE), Error.MATH_ERROR);
    });
});

describe("BaseOperators", () => {
    test("bitwise operations", () => {
        expect(BaseOperators.and(d(6), d(3)).toNumber()).toBe(2);

        expect(BaseOperators.or(d(6), d(3)).toNumber()).toBe(7);

        expect(BaseOperators.xnor(d(6), d(3)).toNumber()).toBe(-6);

        expect(BaseOperators.xor(d(6), d(3)).toNumber()).toBe(5);

        expect(BaseOperators.not(d(6)).toNumber()).toBe(-7);

        expect(BaseOperators.negate(d(6)).toNumber()).toBe(-6);
    });
});

describe("StatisticsOperators", () => {
    const x = [d(1), d(2), d(3)];
    const y = [d(2), d(4), d(6)];

    test("basic aggregates", () => {
        expect(StatisticsOperators.numberOfData(x).toNumber()).toBe(3);
        expectThrowsValue(() => StatisticsOperators.numberOfData([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xSum(x).toNumber()).toBe(6);
        expectThrowsValue(() => StatisticsOperators.xSum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.x2Sum(x).toNumber()).toBe(14);
        expectThrowsValue(() => StatisticsOperators.x2Sum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.ySum(y).toNumber()).toBe(12);
        expectThrowsValue(() => StatisticsOperators.ySum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.y2Sum(y).toNumber()).toBe(56);
        expectThrowsValue(() => StatisticsOperators.y2Sum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xySum(x, y).toNumber()).toBe(28);
        expectThrowsValue(() => StatisticsOperators.xySum([d(1)], [d(1), d(2)]), Error.EMULATOR_ERROR);
        expectThrowsValue(() => StatisticsOperators.xySum([], []), Error.MATH_ERROR);

        expect(StatisticsOperators.x2ySum(x, y).toNumber()).toBe(72);
        expectThrowsValue(() => StatisticsOperators.x2ySum([d(1)], [d(1), d(2)]), Error.EMULATOR_ERROR);
        expectThrowsValue(() => StatisticsOperators.x2ySum([], []), Error.MATH_ERROR);

        expect(StatisticsOperators.x3Sum(x).toNumber()).toBe(36);
        expectThrowsValue(() => StatisticsOperators.x3Sum([]), Error.MATH_ERROR);

        expect(StatisticsOperators.x4Sum(x).toNumber()).toBe(98);
        expectThrowsValue(() => StatisticsOperators.x4Sum([]), Error.MATH_ERROR);
    });

    test("means and standard deviations", () => {
        expect(StatisticsOperators.xMean(x).toNumber()).toBe(2);
        expectThrowsValue(() => StatisticsOperators.xMean([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yMean(y).toNumber()).toBe(4);
        expectThrowsValue(() => StatisticsOperators.yMean([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xStandardDeviation(x).toNumber()).toBeCloseTo(Math.sqrt(2 / 3), TARGET_PRECISION);
        expect(StatisticsOperators.xStandardDeviation([d(1)]).toNumber()).toBe(0);
        expect(StatisticsOperators.xStandardDeviation([d(1), d(2)]).toNumber()).toBe(0.5);
        expectThrowsValue(() => StatisticsOperators.xStandardDeviation([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xSampleStandardDeviation(x).toNumber()).toBe(1);
        expect(StatisticsOperators.xSampleStandardDeviation([d(1)]).toNumber()).toBe(0);
        expect(StatisticsOperators.xSampleStandardDeviation([d(1), d(2)]).toNumber()).toBeCloseTo(Math.sqrt(0.5), TARGET_PRECISION);
        expectThrowsValue(() => StatisticsOperators.xSampleStandardDeviation([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yStandardDeviation(y).toNumber()).toBeCloseTo(Math.sqrt(8 / 3), TARGET_PRECISION);
        expect(StatisticsOperators.yStandardDeviation([d(2)]).toNumber()).toBe(0);
        expect(StatisticsOperators.yStandardDeviation([d(2), d(4)]).toNumber()).toBe(1);
        expectThrowsValue(() => StatisticsOperators.yStandardDeviation([]), Error.MATH_ERROR);

        expect(StatisticsOperators.ySampleStandardDeviation(y).toNumber()).toBeCloseTo(Math.sqrt(4), TARGET_PRECISION);
        expect(StatisticsOperators.ySampleStandardDeviation([d(2)]).toNumber()).toBe(0);
        expect(StatisticsOperators.ySampleStandardDeviation([d(2), d(4)]).toNumber()).toBeCloseTo(Math.sqrt(2), TARGET_PRECISION);
        expectThrowsValue(() => StatisticsOperators.ySampleStandardDeviation([]), Error.MATH_ERROR);
    });

    test("extrema", () => {
        expect(StatisticsOperators.xMin(x).toNumber()).toBe(1);
        expectThrowsValue(() => StatisticsOperators.xMin([]), Error.MATH_ERROR);

        expect(StatisticsOperators.xMax(x).toNumber()).toBe(3);
        expectThrowsValue(() => StatisticsOperators.xMax([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yMin(y).toNumber()).toBe(2);
        expectThrowsValue(() => StatisticsOperators.yMin([]), Error.MATH_ERROR);

        expect(StatisticsOperators.yMax(y).toNumber()).toBe(6);
        expectThrowsValue(() => StatisticsOperators.yMax([]), Error.MATH_ERROR);
    });

    test("linear regression", () => {
        // y = 1 + 2x
        const x = [d(1), d(2), d(3)];
        const y = [d(3), d(5), d(7)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.LINEAR, d(7)).toNumber()).toBeCloseTo(3, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.LINEAR, d(4)).toNumber()).toBeCloseTo(9, TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.LINEAR, d(7)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.LINEAR, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(2)], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(2)], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(2)], RegressionMode.LINEAR), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([d(1)], [d(2)], RegressionMode.LINEAR, d(7)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(2)], RegressionMode.LINEAR, d(4)), Error.MATH_ERROR);
    });

    test("logarithmic regression", () => {
        // y = 1 + 2ln(x)
        const x = [d(1), d(2), d(3)];
        const y = [d(1), d(1).add(d(2).ln().times(2)), d(1).add(d(3).ln().times(2))];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.LOGARITHMIC).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.LOGARITHMIC).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.LOGARITHMIC).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.LOGARITHMIC, d(8)).toNumber()).toBeCloseTo(Math.exp(3.5), TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.LOGARITHMIC, d(4)).toNumber()).toBeCloseTo(1 + 2 * Math.log(4), TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.LOGARITHMIC, d(8)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.LOGARITHMIC, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(0)], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(0)], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(0)], RegressionMode.LOGARITHMIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([d(1)], [d(0)], RegressionMode.LOGARITHMIC, d(8)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(0)], RegressionMode.LOGARITHMIC, d(4)), Error.MATH_ERROR);
    });

    test("exponential regression", () => {
        // y = 2 * e^(3x)
        const x = [d(1), d(2), d(3)];
        const y = [d(2).times(d(3).exp()), d(2).times(d(6).exp()), d(2).times(d(9).exp())];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.EXPONENTIAL).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.EXPONENTIAL).toNumber()).toBeCloseTo(3, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.EXPONENTIAL).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.EXPONENTIAL, d(2).times(d(162).exp())).toNumber()).toBeCloseTo(4, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.EXPONENTIAL, d(4)).toNumber()).toBeCloseTo(2 * Math.exp(12), TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.EXPONENTIAL, d(2).times(d(162).exp())), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.EXPONENTIAL, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(6)], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(6)], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(6)], RegressionMode.EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([d(1)], [d(6)], RegressionMode.EXPONENTIAL, d(2).times(d(162).exp())), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(6)], RegressionMode.EXPONENTIAL, d(4)), Error.MATH_ERROR);
    });

    test("power regression", () => {
        // y = 2 * x^3
        const x = [d(1), d(2), d(3)];
        const y = [d(2), d(16), d(54)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.POWER).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.POWER).toNumber()).toBeCloseTo(3, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.POWER).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.POWER, d(162)).toNumber()).toBeCloseTo(4, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.POWER, d(4)).toNumber()).toBeCloseTo(162, TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.POWER, d(162)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.POWER, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(2)], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(2)], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(2)], RegressionMode.POWER), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([d(1)], [d(2)], RegressionMode.POWER, d(162)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(2)], RegressionMode.POWER, d(4)), Error.MATH_ERROR);
    });

    test("inverse regression", () => {
        // y = 1 + 2/x
        const x = [d(1), d(2), d(3)];
        const y = [d(3), d(2), d(7).div(3)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.INVERSE).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.INVERSE).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.INVERSE).toNumber()).toBeCloseTo(-1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.INVERSE, d(2)).toNumber()).toBeCloseTo(4, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.INVERSE, d(4)).toNumber()).toBeCloseTo(1.5, TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.INVERSE, d(2)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.INVERSE, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(2)], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(2)], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(2)], RegressionMode.INVERSE), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([d(1)], [d(2)], RegressionMode.INVERSE, d(2)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(2)], RegressionMode.INVERSE, d(4)), Error.MATH_ERROR);
    });

    test("quadratic regression", () => {
        // y = 1 + 2x + 3x^2
        const x = [d(1), d(2), d(3)];
        const y = [d(6), d(17), d(34)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.regressionC(x, y, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(3, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX1(x, y, RegressionMode.QUADRATIC, d(17)).toNumber()).toBeCloseTo(-1 / 3, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX2(x, y, RegressionMode.QUADRATIC, d(17)).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.QUADRATIC, d(4)).toNumber()).toBeCloseTo(1 + 2 * 4 + 3 * 16, TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionC([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX1([], [], RegressionMode.QUADRATIC, d(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX2([], [], RegressionMode.QUADRATIC, d(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.QUADRATIC, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionC([d(1)], [d(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(6)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX1([d(1)], [d(6)], RegressionMode.QUADRATIC, d(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX2([d(1)], [d(6)], RegressionMode.QUADRATIC, d(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(6)], RegressionMode.QUADRATIC, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionC([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX1([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC, d(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX2([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC, d(17)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1), d(2)], [d(6), d(17)], RegressionMode.QUADRATIC, d(4)), Error.MATH_ERROR);
    });

    test("ab exponential regression", () => {
        // y = 2 * 3^x
        const x = [d(1), d(2), d(3)];
        const y = [d(6), d(18), d(54)];

        expect(StatisticsOperators.regressionA(x, y, RegressionMode.AB_EXPONENTIAL).toNumber()).toBeCloseTo(2, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.AB_EXPONENTIAL).toNumber()).toBeCloseTo(3, TARGET_PRECISION);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.AB_EXPONENTIAL).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.AB_EXPONENTIAL, d(162)).toNumber()).toBeCloseTo(4, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.AB_EXPONENTIAL, d(4)).toNumber()).toBeCloseTo(2 * Math.pow(3, 4), TARGET_PRECISION);

        expectThrowsValue(() => StatisticsOperators.regressionA([], [], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([], [], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([], [], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([], [], RegressionMode.AB_EXPONENTIAL, d(162)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([], [], RegressionMode.AB_EXPONENTIAL, d(4)), Error.MATH_ERROR);

        expectThrowsValue(() => StatisticsOperators.regressionA([d(1)], [d(6)], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.regressionB([d(1)], [d(6)], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient([d(1)], [d(6)], RegressionMode.AB_EXPONENTIAL), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedX([d(1)], [d(6)], RegressionMode.AB_EXPONENTIAL, d(162)), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.estimatedY([d(1)], [d(6)], RegressionMode.AB_EXPONENTIAL, d(4)), Error.MATH_ERROR);
    });
});
