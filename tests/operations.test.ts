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
    StatisticsOperators,
} from "@lib/operations";
import { AngleMode, NumberDisplayMode, RegressionMode } from "@lib/modes";

const d = (value: Decimal.Value) => new Decimal(value);

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
        expect(_toRadians(d(180), AngleMode.DEGREE).toNumber()).toBeCloseTo(Math.PI, 15);
        expect(_toDegrees(d(Math.PI), AngleMode.RADIAN).toNumber()).toBeCloseTo(180, 15);
        expect(_toGradians(d(180), AngleMode.DEGREE).toNumber()).toBeCloseTo(200, 15);
    });

    test("multiply range helper", () => {
        expect(_multiplyFromTo(d(2), d(4)).toNumber()).toBe(24);
        expect(_multiplyFromTo(d(-2), d(-4)).toNumber()).toBe(-24);
        expect(_multiplyFromTo(d(4), d(2)).toNumber()).toBe(1);
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
        expect(CommonOperators.multiply(d(4), d(3)).toNumber()).toBe(12);
        expect(CommonOperators.divide(d(10), d(2)).toNumber()).toBe(5);
        expect(CommonOperators.sciExp(d("1.23"), d(4)).toNumber()).toBe(12300);
        expect(CommonOperators.negative(d(5)).toNumber()).toBe(-5);
    });

    test("roots and powers", () => {
        expect(CommonOperators.square(d(9)).toNumber()).toBe(81);
        expect(CommonOperators.cube(d(3)).toNumber()).toBe(27);
        expect(CommonOperators.sqrt(d(81)).toNumber()).toBe(9);
        expect(CommonOperators.cubeRoot(d(27)).toNumber()).toBe(3);
        expect(CommonOperators.power(d(2), d(10)).toNumber()).toBe(1024);
        expect(CommonOperators.xRoot(d(2), d(9)).toNumber()).toBe(3);
    });

    test("trigonometric and hyperbolic", () => {
        expect(CommonOperators.sin(d(30), AngleMode.DEGREE).toNumber()).toBeCloseTo(0.5, 15);
        expect(CommonOperators.cos(d(60), AngleMode.DEGREE).toNumber()).toBeCloseTo(0.5, 15);
        expect(CommonOperators.tan(d(45), AngleMode.DEGREE).toNumber()).toBeCloseTo(1, 15);
        expect(CommonOperators.sinh(d(1)).toNumber()).toBeCloseTo(Math.sinh(1), 15);
        expect(CommonOperators.cosh(d(1)).toNumber()).toBeCloseTo(Math.cosh(1), 15);
        expect(CommonOperators.tanh(d(1)).toNumber()).toBeCloseTo(Math.tanh(1), 15);
    });

    test("logarithms and inverse", () => {
        expect(CommonOperators.log(d(100)).toNumber()).toBe(2);
        expect(CommonOperators.log(d(2), d(8)).toNumber()).toBe(3);
        expect(CommonOperators.ln(d(Math.E)).toNumber()).toBeCloseTo(1, 14);
        expect(CommonOperators.inverse(d(4)).toNumber()).toBe(0.25);
        expect(CommonOperators.exp(d(2)).toNumber()).toBeCloseTo(Math.exp(2), 14);
    });

    test("formatting and coordinate helpers", () => {
        expect(CommonOperators.round(d("1.2345"), NumberDisplayMode.FIXED_POINT_2).toString()).toBe("1.23");
        expect(CommonOperators.percent(d(25)).toNumber()).toBe(0.25);
        expect(CommonOperators.abs(d(-5)).toNumber()).toBe(5);

        const polar = CommonOperators.polar(d(3), d(4), AngleMode.DEGREE);
        expect(polar.x.toNumber()).toBe(5);

        const rect = CommonOperators.rectangular(d(2), d(30), AngleMode.DEGREE);
        expect(rect.x.toNumber()).toBeCloseTo(Math.sqrt(3), 14);
        expect(rect.y.toNumber()).toBeCloseTo(1, 14);
    });

    test("combinatorics", () => {
        expect(CommonOperators.factorial(d(5)).toNumber()).toBe(120);
        expect(CommonOperators.permutation(d(5), d(3)).toNumber()).toBe(60);
        expect(CommonOperators.combination(d(5), d(3)).toNumber()).toBe(10);
    });

    test("error cases", () => {
        expectThrowsValue(() => CommonOperators.divide(d(10), d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.sqrt(d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.inverse(d(0)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.factorial(d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.factorial(d("2.5")), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.power(d(0), d(-1)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.log(d(1), d(10)), Error.MATH_ERROR);
        expectThrowsValue(() => CommonOperators.tan(d(90), AngleMode.DEGREE), Error.MATH_ERROR);
    });
});

describe("ComplexOperators", () => {
    test("basic complex arithmetic", () => {
        const a = { re: d(1), im: d(2) };
        const b = { re: d(3), im: d(4) };

        const added = ComplexOperators.add(a, b);
        expect(added.re.toNumber()).toBe(4);
        expect(added.im.toNumber()).toBe(6);

        const multiplied = ComplexOperators.multiply(a, b);
        expect(multiplied.re.toNumber()).toBe(-5);
        expect(multiplied.im.toNumber()).toBe(10);
    });

    test("real-only wrappers and abs", () => {
        const real = { re: d(30), im: d(0) };
        const sin = ComplexOperators.sin(real, AngleMode.DEGREE);
        expect(sin.re.toNumber()).toBeCloseTo(0.5, 15);
        expect(sin.im.toNumber()).toBe(0);

        const abs = ComplexOperators.abs({ re: d(3), im: d(4) });
        expect(abs.re.toNumber()).toBe(5);
        expect(abs.im.toNumber()).toBe(0);
    });

    test("complex validation errors", () => {
        expectThrowsValue(
            () => ComplexOperators.sin({ re: d(1), im: d(1) }, AngleMode.DEGREE),
            Error.MATH_ERROR,
        );
        expectThrowsValue(
            () => ComplexOperators.divide({ re: d(1), im: d(0) }, { re: d(0), im: d(0) }),
            Error.MATH_ERROR,
        );
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
        expect(StatisticsOperators.xStandardDeviation(x).toNumber()).toBeCloseTo(Math.sqrt(2 / 3), 15);
        expect(StatisticsOperators.xSampleStandardDeviation(x).toNumber()).toBe(1);
    });

    test("regression helpers", () => {
        expect(StatisticsOperators.regressionA(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(0, 15);
        expect(StatisticsOperators.regressionB(x, y, RegressionMode.LINEAR).toNumber()).toBe(2);
        expect(StatisticsOperators.estimatedY(x, y, RegressionMode.LINEAR, d(4)).toNumber()).toBe(8);
        expect(StatisticsOperators.estimatedX(x, y, RegressionMode.LINEAR, d(8)).toNumber()).toBe(4);
        expect(StatisticsOperators.correlationCoefficient(x, y, RegressionMode.LINEAR).toNumber()).toBeCloseTo(1, 15);
    });

    test("quadratic regression", () => {
        const qx = [d(1), d(2), d(3), d(4)];
        const qy = [d(1), d(4), d(9), d(16)];

        expect(StatisticsOperators.regressionA(qx, qy, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(0, 10);
        expect(StatisticsOperators.regressionB(qx, qy, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(0, 10);
        expect(StatisticsOperators.regressionC(qx, qy, RegressionMode.QUADRATIC).toNumber()).toBeCloseTo(1, 10);
        expect(StatisticsOperators.estimatedY(qx, qy, RegressionMode.QUADRATIC, d(5)).toNumber()).toBeCloseTo(25, 10);
    });

    test("statistics error cases", () => {
        expectThrowsValue(() => StatisticsOperators.xSum([]), Error.MATH_ERROR);
        expectThrowsValue(() => StatisticsOperators.xySum([d(1)], [d(1), d(2)]), Error.EMULATOR_ERROR);
        expectThrowsValue(() => StatisticsOperators.correlationCoefficient(x, y, RegressionMode.QUADRATIC), Error.EMULATOR_ERROR);
    });
});
