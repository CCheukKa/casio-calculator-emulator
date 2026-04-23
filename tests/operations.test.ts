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

        expect(CommonOperators.exp(d(2)).toNumber()).toBeCloseTo(Math.exp(2), TARGET_PRECISION);

        expect(CommonOperators.ln(E).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expectThrowsValue(() => CommonOperators.ln(d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.ln(d(-1)), Error.MATH_ERROR);

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
        expect(ComplexOperators.add(d(2), d(3)).toNumber()).toBe(5);

        expect(ComplexOperators.subtract(d(5), d(2)).toNumber()).toBe(3);

        expect(ComplexOperators.multiply(d(4), d(-3)).toNumber()).toBe(-12);

        expect(ComplexOperators.divide(d(10), d(2)).toNumber()).toBe(5);
        expectThrowsValue(() => ComplexOperators.divide(d(10), d(0)), Error.MATH_ERROR);

        expect(ComplexOperators.sciExp(d("1.23"), d(4)).toNumber()).toBe(12300);
        expect(ComplexOperators.sciExp(d("-1.23"), d(-4)).toNumber()).toBe(-0.000123);

        expect(ComplexOperators.negative(d(5)).toNumber()).toBe(-5);
        expect(ComplexOperators.negative(d(-5)).toNumber()).toBe(5);

        expect(ComplexOperators.percent(d(25)).toNumber()).toBe(0.25);

        expect(ComplexOperators.abs(d(-5)).toNumber()).toBe(5);
        expect(ComplexOperators.abs(d(5)).toNumber()).toBe(5);
    });

    test("trigonometric and hyperbolic", () => {
        expect(ComplexOperators.sin(d(30), AngleMode.DEGREE).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(ComplexOperators.sin(PI.div(6), AngleMode.RADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(ComplexOperators.sin(d(50), AngleMode.GRADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);

        expect(ComplexOperators.cos(d(60), AngleMode.DEGREE).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(ComplexOperators.cos(PI.div(3), AngleMode.RADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);
        expect(ComplexOperators.cos(d(100), AngleMode.GRADIAN).toNumber()).toBeCloseTo(0.5, TARGET_PRECISION);

        expect(ComplexOperators.tan(d(45), AngleMode.DEGREE).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(ComplexOperators.tan(PI.div(4), AngleMode.RADIAN).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(ComplexOperators.tan(d(50), AngleMode.GRADIAN).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expectThrowsValue(() => ComplexOperators.tan(d(90), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.asin(d(0.5), AngleMode.DEGREE).toNumber()).toBeCloseTo(30, TARGET_PRECISION);
        expect(ComplexOperators.asin(d(0.5), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI / 6, TARGET_PRECISION);
        expect(ComplexOperators.asin(d(0.5), AngleMode.GRADIAN).toNumber()).toBeCloseTo(50, TARGET_PRECISION);
        expectThrowsValue(() => ComplexOperators.asin(d(2), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.acos(d(0.5), AngleMode.DEGREE).toNumber()).toBeCloseTo(60, TARGET_PRECISION);
        expect(ComplexOperators.acos(d(0.5), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI / 3, TARGET_PRECISION);
        expect(ComplexOperators.acos(d(0.5), AngleMode.GRADIAN).toNumber()).toBeCloseTo(100, TARGET_PRECISION);
        expectThrowsValue(() => ComplexOperators.acos(d(2), AngleMode.DEGREE), Error.MATH_ERROR);

        expect(ComplexOperators.atan(d(1), AngleMode.DEGREE).toNumber()).toBeCloseTo(45, TARGET_PRECISION);
        expect(ComplexOperators.atan(d(1), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI / 4, TARGET_PRECISION);
        expect(ComplexOperators.atan(d(1), AngleMode.GRADIAN).toNumber()).toBeCloseTo(50, TARGET_PRECISION);

        expect(ComplexOperators.sinh(d(1)).toNumber()).toBeCloseTo(Math.sinh(1), TARGET_PRECISION);

        expect(ComplexOperators.cosh(d(1)).toNumber()).toBeCloseTo(Math.cosh(1), TARGET_PRECISION);

        expect(ComplexOperators.tanh(d(1)).toNumber()).toBeCloseTo(Math.tanh(1), TARGET_PRECISION);

        expect(ComplexOperators.asinh(d(1)).toNumber()).toBeCloseTo(Math.asinh(1), TARGET_PRECISION);

        expect(ComplexOperators.acosh(d(1)).toNumber()).toBeCloseTo(Math.acosh(1), TARGET_PRECISION);
        expectThrowsValue(() => ComplexOperators.acosh(d(0.5)), Error.MATH_ERROR);

        expect(ComplexOperators.atanh(d(0.5)).toNumber()).toBeCloseTo(Math.atanh(0.5), TARGET_PRECISION);
        expectThrowsValue(() => ComplexOperators.atanh(d(2)), Error.MATH_ERROR);
    });

    test("power and logarithm", () => {
        expect(ComplexOperators.square(d(-9)).toNumber()).toBe(81);

        expect(ComplexOperators.sqrt(d(81)).toNumber()).toBe(9);
        expectThrowsValue(() => ComplexOperators.sqrt(d(-1)), Error.MATH_ERROR);

        expect(ComplexOperators.cube(d(-3)).toNumber()).toBe(-27);

        expect(ComplexOperators.cubeRoot(d(-27)).toNumber()).toBe(-3);

        expect(ComplexOperators.power(d(-2), d(9)).toNumber()).toBe(-512);
        expect(ComplexOperators.power(d(9), d(0.5)).toNumber()).toBe(3);
        expect(ComplexOperators.power(d(1), d(0)).toNumber()).toBe(1);
        expect(ComplexOperators.power(d(-32), d(0.2)).toNumber()).toBe(-2);
        expectThrowsValue(() => ComplexOperators.power(d(0), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(d(0), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(d(-1), d(0.25)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.power(d(-1), d(1).div(d("1.2"))), Error.MATH_ERROR);

        expect(ComplexOperators.xRoot(d(2), d(9)).toNumber()).toBe(3);
        expect(ComplexOperators.xRoot(d(-2), d(16)).toNumber()).toBe(1 / 4);
        expect(ComplexOperators.xRoot(d(2), d(0)).toNumber()).toBe(1 / 4);
        expectThrowsValue(() => ComplexOperators.xRoot(d(0), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(d(0), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(d(-1), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(d(2), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.xRoot(d(1.2), d(-1)), Error.MATH_ERROR);

        expect(ComplexOperators.log(d(100)).toNumber()).toBe(2);
        expectThrowsValue(() => ComplexOperators.log(d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(d(-1)), Error.MATH_ERROR);
        expect(ComplexOperators.log(d(2), d(8)).toNumber()).toBe(3);
        expect(ComplexOperators.log(d(0.5), d(2)).toNumber()).toBe(-1);
        expectThrowsValue(() => ComplexOperators.log(d(2), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(d(2), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.log(d(-2), d(8)), Error.MATH_ERROR);

        expect(ComplexOperators.exp(d(2)).toNumber()).toBeCloseTo(Math.exp(2), TARGET_PRECISION);

        expect(ComplexOperators.ln(E).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expectThrowsValue(() => ComplexOperators.ln(d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.ln(d(-1)), Error.MATH_ERROR);

        expect(ComplexOperators.inverse(d(4)).toNumber()).toBe(0.25);
        expectThrowsValue(() => ComplexOperators.inverse(d(0)), Error.MATH_ERROR);
    });

    test("combinatorics", () => {
        expect(ComplexOperators.factorial(d(5)).toNumber()).toBe(120);
        expect(ComplexOperators.factorial(d(0)).toNumber()).toBe(1);
        expectThrowsValue(() => ComplexOperators.factorial(d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.factorial(d("2.5")), Error.MATH_ERROR);
        expect(ComplexOperators.permutation(d(5), d(3)).toNumber()).toBe(60);
        expectThrowsValue(() => ComplexOperators.permutation(d(5), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(d(-5), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(d(5), d(6)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.permutation(d(5), d("2.5")), Error.MATH_ERROR);
        expect(ComplexOperators.combination(d(5), d(3)).toNumber()).toBe(10);
        expectThrowsValue(() => ComplexOperators.combination(d(5), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(d(-5), d(1)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(d(5), d(6)), Error.MATH_ERROR);
        expectThrowsValue(() => ComplexOperators.combination(d(5), d("2.5")), Error.MATH_ERROR);
    });

    test("polar and rectangular coordinates", () => {
        const polarDegree = ComplexOperators.polar(d(3).sqrt(), d(1), AngleMode.DEGREE);
        expect(polarDegree.x.toNumber()).toBe(2);
        expect(polarDegree.y.toNumber()).toBeCloseTo(30, TARGET_PRECISION);
        const polarRadian = ComplexOperators.polar(d(3).sqrt(), d(1), AngleMode.RADIAN);
        expect(polarRadian.x.toNumber()).toBe(2);
        expect(polarRadian.y.toNumber()).toBeCloseTo(Math.PI / 6, TARGET_PRECISION);
        const polarGradian = ComplexOperators.polar(d(3).sqrt(), d(1), AngleMode.GRADIAN);
        expect(polarGradian.x.toNumber()).toBe(2);
        expect(polarGradian.y.toNumber()).toBeCloseTo(100 / 3, TARGET_PRECISION);

        const rectDegree = ComplexOperators.rectangular(d(2), d(30), AngleMode.DEGREE);
        expect(rectDegree.x.toNumber()).toBeCloseTo(Math.sqrt(3), TARGET_PRECISION);
        expect(rectDegree.y.toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        const rectRadian = ComplexOperators.rectangular(d(2), d(Math.PI / 6), AngleMode.RADIAN);
        expect(rectRadian.x.toNumber()).toBeCloseTo(Math.sqrt(3), TARGET_PRECISION);
        expect(rectRadian.y.toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        const rectGradian = ComplexOperators.rectangular(d(2), d(100).div(d(3)), AngleMode.GRADIAN);
        expect(rectGradian.x.toNumber()).toBeCloseTo(Math.sqrt(3), TARGET_PRECISION);
        expect(rectGradian.y.toNumber()).toBeCloseTo(1, TARGET_PRECISION);
    });

    test("other functions", () => {
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_0).toNumber()).toBe(12);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_1).toNumber()).toBe(12.3);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_2).toNumber()).toBe(12.35);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_3).toNumber()).toBe(12.346);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_4).toNumber()).toBe(12.3457);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_5).toNumber()).toBe(12.34568);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_6).toNumber()).toBe(12.345679);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_7).toNumber()).toBe(12.3456789);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_8).toNumber()).toBe(12.34567899);
        expect(ComplexOperators.round(d("12.345678987654321"), NumberDisplayMode.FIXED_POINT_9).toNumber()).toBe(12.345678988);

        expect(ComplexOperators.fromDegree(d(180), AngleMode.DEGREE).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(ComplexOperators.fromDegree(d(180), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(ComplexOperators.fromDegree(d(180), AngleMode.GRADIAN).toNumber()).toBeCloseTo(200, TARGET_PRECISION);

        expect(ComplexOperators.fromRadian(d(Math.PI), AngleMode.DEGREE).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(ComplexOperators.fromRadian(d(Math.PI), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(ComplexOperators.fromRadian(d(Math.PI), AngleMode.GRADIAN).toNumber()).toBeCloseTo(200, TARGET_PRECISION);

        expect(ComplexOperators.fromGradian(d(200), AngleMode.DEGREE).toNumber()).toBeCloseTo(180, TARGET_PRECISION);
        expect(ComplexOperators.fromGradian(d(200), AngleMode.RADIAN).toNumber()).toBeCloseTo(Math.PI, TARGET_PRECISION);
        expect(ComplexOperators.fromGradian(d(200), AngleMode.GRADIAN).toNumber()).toBeCloseTo(200, TARGET_PRECISION);
    });
});

describe("BaseOperators", () => {
    test("bitwise operations", () => {
        expect(BaseOperators.and(d(6), d(3)).toNumber()).toBe(2);
        expect(BaseOperators.or(d(6), d(3)).toNumber()).toBe(7);
        expect(BaseOperators.xor(d(6), d(3)).toNumber()).toBe(5);
        expect(BaseOperators.xnor(d(6), d(3)).toNumber()).toBe(~(6 ^ 3));
        expect(BaseOperators.not(d(6)).toNumber()).toBe(~6);
        expect(BaseOperators.negate(d(6)).toNumber()).toBe(-6);
    });
});

describe("StatisticsOperators", () => {
    const x = [d(1), d(2), d(3)];
    const y = [d(2), d(4), d(6)];

    test("basic aggregates", () => {
        expect(StatisticsOperators.numberOfData(x).toNumber()).toBe(3);
        expect(StatisticsOperators.xSum(x).toNumber()).toBe(6);
        expect(StatisticsOperators.x2Sum(x).toNumber()).toBe(14);
        expect(StatisticsOperators.xySum(x, y).toNumber()).toBe(28);
    });

    test("means and standard deviations", () => {
        expect(StatisticsOperators.xMean(x).toNumber()).toBe(2);
        expect(StatisticsOperators.yMean(y).toNumber()).toBe(4);
        expect(StatisticsOperators.xStandardDeviation(x).toNumber()).toBeCloseTo(Math.sqrt(2 / 3), TARGET_PRECISION);
        expect(StatisticsOperators.xSampleStandardDeviation(x).toNumber()).toBe(1);
    });

    test("regression helpers", () => {
        expect(StatisticsOperators.regressionA(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(0, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.LINEAR).toNumber()).toBe(2);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.LINEAR, d(4)).toNumber()).toBe(8);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.LINEAR, d(8)).toNumber()).toBe(4);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
    });

    test("quadratic regression", () => {
        const qx = [d(1), d(2), d(3), d(4)];
        const qy = [d(1), d(4), d(9), d(16)];

        expect(StatisticsOperators.regressionA(qx, qy, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(0, TARGET_PRECISION);
        expect(StatisticsOperators.regressionB(qx, qy, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(0, TARGET_PRECISION);
        expect(StatisticsOperators.regressionC(qx, qy, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(1, TARGET_PRECISION);
        expect(StatisticsOperators.estimatedY(qx, qy, RegressionMode.QUADRATIC, d(5)).toNumber()).toBeCloseTo(25, TARGET_PRECISION);
    });

    test("statistics error cases", () => {
        expectThrowsValue(() => StatisticsOperators.xSum([]), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.xySum([d(1)], [d(1), d(2)]), Error.EMULATOR_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient(x, y, RegressionMode.QUADRATIC), Error.EMULATOR_ERROR);
    });
});
