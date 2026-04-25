import { Error } from "@lib/errors";
import { AngleMode, NumberDisplayMode, RegressionMode } from "@lib/modes";
import Decimal from "decimal.js";

export const TARGET_PRECISION = 15;
const INTERNAL_PRECISION = TARGET_PRECISION + 5;

Decimal.set({
    precision: INTERNAL_PRECISION,
    rounding: Decimal.ROUND_HALF_UP,
});

export const PI = Decimal.acos(-1);
export const E = Decimal.exp(1);

export const D = (value: Decimal.Value) => new Decimal(value);
export const C = (re: Decimal.Value, im: Decimal.Value = 0) => ({ re: D(re), im: D(im) });

// meta
export const _toRadians = (a: Decimal, angleMode: AngleMode) => {
    switch (angleMode) {
        case AngleMode.DEGREE: return a.times(PI).div(180);
        case AngleMode.RADIAN: return a;
        case AngleMode.GRADIAN: return a.times(PI).div(200);
        default:
            throw Error.EMULATOR_ERROR;
    }
}
export const _toDegrees = (a: Decimal, angleMode: AngleMode) => {
    switch (angleMode) {
        case AngleMode.DEGREE: return a;
        case AngleMode.RADIAN: return a.times(180).div(PI);
        case AngleMode.GRADIAN: return a.times(180).div(200);
        default:
            throw Error.EMULATOR_ERROR;
    }
}
export const _toGradians = (a: Decimal, angleMode: AngleMode) => {
    switch (angleMode) {
        case AngleMode.DEGREE: return a.times(200).div(180);
        case AngleMode.RADIAN: return a.times(200).div(PI);
        case AngleMode.GRADIAN: return a;
        default:
            throw Error.EMULATOR_ERROR;
    }
}
export const _multiplyFromTo = (a: Decimal, b: Decimal) => {
    if (!a.isInteger() || !b.isInteger()) { throw Error.EMULATOR_ERROR; }
    if (a.gt(b) && !(a.isNegative() && b.isNegative())) { return D(1); }
    let result = D(1);
    const step = a.lte(b) ? D(1) : D(-1);
    for (let i = a; (step.gt(0) ? i.lte(b) : i.gte(b)); i = i.plus(step)) {
        result = result.times(i);
    }
    return result;
}
export const _mathErrorGuard = (a: Decimal) => {
    if (!a.isFinite() || a.isNaN()) { throw Error.MATH_ERROR; }
    return a;
}

// simple operators
export class CommonOperators {
    // basic arithmetic
    public static add = (a: Decimal, b: Decimal) => a.plus(b);
    public static subtract = (a: Decimal, b: Decimal) => a.minus(b);
    public static multiply = (a: Decimal, b: Decimal) => a.times(b);
    public static divide = (a: Decimal, b: Decimal) => {
        if (b.isZero()) { return _mathErrorGuard(a.div(b)); }
        return _mathErrorGuard(a.div(b));
    };
    public static sciExp = (a: Decimal, b: Decimal) => a.times(D(10).pow(b));
    public static negative = (a: Decimal) => a.negated();
    public static percent = (a: Decimal) => a.div(100);
    public static abs = (a: Decimal) => a.abs();

    // trigonometric functions
    public static sin = (a: Decimal, angleMode: AngleMode) => _toRadians(a, angleMode).sin();
    public static cos = (a: Decimal, angleMode: AngleMode) => _toRadians(a, angleMode).cos();
    public static tan = (a: Decimal, angleMode: AngleMode) => {
        const radians = _toRadians(a, angleMode);
        if (radians.cos().abs().lte(D("1e-18"))) { throw Error.MATH_ERROR; }
        return radians.tan();
    };
    public static asin = (a: Decimal, angleMode: AngleMode) => _mathErrorGuard(this.fromRadian(a.asin(), angleMode));
    public static acos = (a: Decimal, angleMode: AngleMode) => _mathErrorGuard(this.fromRadian(a.acos(), angleMode));
    public static atan = (a: Decimal, angleMode: AngleMode) => this.fromRadian(a.atan(), angleMode);
    public static sinh = (a: Decimal) => a.sinh();
    public static cosh = (a: Decimal) => a.cosh();
    public static tanh = (a: Decimal) => a.tanh();
    public static asinh = (a: Decimal) => a.asinh();
    public static acosh = (a: Decimal) => _mathErrorGuard(a.acosh());
    public static atanh = (a: Decimal) => _mathErrorGuard(a.atanh());

    // power and logarithm
    public static square = (a: Decimal) => a.times(a);
    public static sqrt = (a: Decimal) => {
        if (a.lt(0)) { throw Error.MATH_ERROR; }
        return a.sqrt();
    }
    public static cube = (a: Decimal) => a.pow(3);
    public static cubeRoot = (a: Decimal) => a.cubeRoot();
    public static power = (a: Decimal, b: Decimal) => {
        if (a.isZero() && b.lte(0)) { throw Error.MATH_ERROR; }
        if (a.gte(0)) { return _mathErrorGuard(a.pow(b)); }

        // a<0
        const [bNominator, bDenominator] = _mathErrorGuard(b).toFraction() as [Decimal, Decimal];
        if (bDenominator.mod(2).eq(0)) { throw Error.MATH_ERROR; }
        return _mathErrorGuard(a.abs().pow(b).mul(bNominator.mod(2).eq(0) ? 1 : -1));
    }
    public static xRoot = (a: Decimal, b: Decimal) => {
        if (a.isZero()) { throw Error.MATH_ERROR; }
        if (a.lt(0)) { return _mathErrorGuard(D(1).div(this.power(b, D(1).div(a.abs())))); }
        return _mathErrorGuard(this.power(b, D(1).div(a)));
    }
    public static log = (a: Decimal, b?: Decimal) => {
        if (b === undefined) {
            if (a.lte(0)) { throw Error.MATH_ERROR; }
            return a.log(10);
        } else {
            if (a.lte(0) || b.lte(0) || a.eq(1)) { throw Error.MATH_ERROR; }
            return b.log(10).div(a.log(10));
        }
    }
    public static ln = (a: Decimal) => {
        if (a.lte(0)) { throw Error.MATH_ERROR; }
        return a.ln();
    }
    public static exp = (a: Decimal) => a.exp();
    public static inverse = (a: Decimal) => {
        if (a.isZero()) { throw Error.MATH_ERROR; }
        return D(1).div(a);
    }

    // combinatorics
    public static factorial = (a: Decimal): Decimal => {
        if (a.lt(0)) { throw Error.MATH_ERROR; }
        if (!a.isInteger()) { throw Error.MATH_ERROR; }
        return _multiplyFromTo(D(1), a);
    }
    public static permutation = (n: Decimal, r: Decimal) => {
        if (n.lt(0) || r.lt(0) || n.lt(r)) { throw Error.MATH_ERROR; }
        if (!n.isInteger() || !r.isInteger()) { throw Error.MATH_ERROR; }
        if (r.isZero()) { return D(1); }
        const tfac = _multiplyFromTo(D(1), n.minus(r));
        const nfac = tfac.times(_multiplyFromTo(n.minus(r).plus(1), n));
        return nfac.div(tfac);
    }
    public static combination = (n: Decimal, r: Decimal) => {
        if (n.lt(0) || r.lt(0) || n.lt(r)) { throw Error.MATH_ERROR; }
        if (!n.isInteger() || !r.isInteger()) { throw Error.MATH_ERROR; }
        if (r.isZero()) { return D(1); }
        let t1 = r;
        let t2 = n.minus(r);
        if (t1.gt(t2)) { [t1, t2] = [t2, t1]; }
        const t1fac = _multiplyFromTo(D(1), t1);
        const t2fac = t1fac.times(_multiplyFromTo(t1.plus(1), t2));
        const nfac = t2fac.times(_multiplyFromTo(t2.plus(1), n));
        return nfac.div(t2fac).div(t1fac);
    }

    // polar and rectangular coordinates
    public static polar = (a: Decimal, b: Decimal, angleMode: AngleMode) => ({
        x: a.pow(2).plus(b.pow(2)).sqrt(),
        y: this.fromRadian(D(Math.atan2(b.toNumber(), a.toNumber())), angleMode)
    });
    public static rectangular = (a: Decimal, b: Decimal, angleMode: AngleMode) => ({
        x: a.times(_toRadians(b, angleMode).cos()),
        y: a.times(_toRadians(b, angleMode).sin())
    });

    // other functions
    public static round = (a: Decimal, numberDisplayMode: NumberDisplayMode) => {
        switch (numberDisplayMode) {
            case NumberDisplayMode.FIXED_POINT_0: return a.toDecimalPlaces(0);
            case NumberDisplayMode.FIXED_POINT_1: return a.toDecimalPlaces(1);
            case NumberDisplayMode.FIXED_POINT_2: return a.toDecimalPlaces(2);
            case NumberDisplayMode.FIXED_POINT_3: return a.toDecimalPlaces(3);
            case NumberDisplayMode.FIXED_POINT_4: return a.toDecimalPlaces(4);
            case NumberDisplayMode.FIXED_POINT_5: return a.toDecimalPlaces(5);
            case NumberDisplayMode.FIXED_POINT_6: return a.toDecimalPlaces(6);
            case NumberDisplayMode.FIXED_POINT_7: return a.toDecimalPlaces(7);
            case NumberDisplayMode.FIXED_POINT_8: return a.toDecimalPlaces(8);
            case NumberDisplayMode.FIXED_POINT_9: return a.toDecimalPlaces(9);
            default:
                return a;
        }
    }
    public static random = () => Decimal.random();
    public static fromDegree = (a: Decimal, angleMode: AngleMode) => {
        switch (angleMode) {
            case AngleMode.DEGREE: return a;
            case AngleMode.RADIAN: return _toRadians(a, AngleMode.DEGREE);
            case AngleMode.GRADIAN: return _toGradians(a, AngleMode.DEGREE);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromRadian = (a: Decimal, angleMode: AngleMode) => {
        switch (angleMode) {
            case AngleMode.DEGREE: return a.times(180).div(PI).toDecimalPlaces(14);
            case AngleMode.RADIAN: return a;
            case AngleMode.GRADIAN: return a.times(200).div(PI).toDecimalPlaces(14);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromGradian = (a: Decimal, angleMode: AngleMode) => {
        switch (angleMode) {
            case AngleMode.DEGREE: return _toDegrees(a, AngleMode.GRADIAN);
            case AngleMode.RADIAN: return _toRadians(a, AngleMode.GRADIAN);
            case AngleMode.GRADIAN: return a;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
}
// complex-compatible operators
export type Complex = { re: Decimal, im: Decimal }
export class ComplexOperators {
    public static equal = (a: Complex, b: Complex) => a.re.eq(b.re) && a.im.eq(b.im);
    private static assertReal = (a: Complex, error = Error.MATH_ERROR) => {
        if (!a.im.isZero()) { throw error; }
    };

    // basic arithmetic
    public static add = (a: Complex, b: Complex): Complex => ({
        re: a.re.plus(b.re),
        im: a.im.plus(b.im)
    });
    public static subtract = (a: Complex, b: Complex): Complex => ({
        re: a.re.minus(b.re),
        im: a.im.minus(b.im)
    });
    public static multiply = (a: Complex, b: Complex): Complex => ({
        re: a.re.times(b.re).minus(a.im.times(b.im)),
        im: a.re.times(b.im).plus(a.im.times(b.re))
    });
    public static divide = (a: Complex, b: Complex) => {
        if (this.equal(b, C(D(0)))) { throw Error.MATH_ERROR; }
        const conjugateB = this.conjugate(b);
        const nominator = this.multiply(a, conjugateB);
        const denominator = b.re.pow(2).plus(b.im.pow(2));
        return {
            re: nominator.re.div(denominator),
            im: nominator.im.div(denominator)
        }
    }
    public static sciExp = (a: Complex, b: Complex): Complex => {
        this.assertReal(a, Error.EMULATOR_ERROR);
        this.assertReal(b, Error.EMULATOR_ERROR);
        return this.multiply(a, C(D(10).pow(b.re)));
    }
    public static negative = (a: Complex): Complex => ({ re: a.re.negated(), im: a.im.negated() });
    public static abs = (a: Complex): Complex => ({ re: a.re.pow(2).plus(a.im.pow(2)).sqrt(), im: D(0) });
    public static conjugate = (a: Complex): Complex => ({ re: a.re, im: a.im.negated() });

    // trigonometric functions
    public static sin = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        return C(CommonOperators.sin(a.re, angleMode));
    }
    public static cos = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        return C(CommonOperators.cos(a.re, angleMode));
    }
    public static tan = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        return C(CommonOperators.tan(a.re, angleMode));
    }
    public static asin = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        return C(CommonOperators.asin(a.re, angleMode));
    }
    public static acos = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        return C(CommonOperators.acos(a.re, angleMode));
    }
    public static atan = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        return C(CommonOperators.atan(a.re, angleMode));
    }
    public static sinh = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.sinh(a.re));
    }
    public static cosh = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.cosh(a.re));
    }
    public static tanh = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.tanh(a.re));
    }
    public static asinh = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.asinh(a.re));
    }
    public static acosh = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.acosh(a.re));
    }
    public static atanh = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.atanh(a.re));
    }

    // power and logarithm
    public static square = (a: Complex): Complex => this.multiply(a, a);
    public static sqrt = (a: Complex): Complex => {
        this.assertReal(a);
        if (a.re.gte(0)) {
            return C(a.re.sqrt());
        } else {
            return { re: D(0), im: a.re.negated().sqrt() };
        }
    }
    public static cube = (a: Complex): Complex => this.multiply(this.multiply(a, a), a);
    public static cubeRoot = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.cubeRoot(a.re));
    }
    public static power = (a: Complex, b: Complex): Complex => {
        this.assertReal(b);
        if (this.equal(a, C(D(0))) && b.re.lte(0)) { throw Error.MATH_ERROR; }
        if (a.im.isZero()) { return C(CommonOperators.power(a.re, b.re)) }
        if (!b.re.isInteger()) { throw Error.MATH_ERROR; }

        if (b.re.eq(-1)) { return this.inverse(a); }
        if (b.re.lt(0)) { throw Error.MATH_ERROR; }
        if (b.re.isZero()) { return C(D(1)); }

        let result = a;
        for (let i = D(1); i.lt(b.re); i = i.plus(1)) {
            result = this.multiply(result, a);
        }
        return result;
    }
    public static xRoot = (a: Complex, b: Complex): Complex => {
        if (this.equal(a, C(D(0)))) { throw Error.MATH_ERROR; }
        this.assertReal(a);
        this.assertReal(b);
        return C(CommonOperators.xRoot(a.re, b.re));
    }
    public static log = (a: Complex, b?: Complex): Complex => {
        this.assertReal(a);
        if (b !== undefined) { this.assertReal(b); }
        return C(CommonOperators.log(a.re, b ? b.re : undefined));
    }
    public static ln = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.ln(a.re));
    }
    public static exp = (a: Complex): Complex => {
        this.assertReal(a);
        return this.power(C(E), a);
    }
    public static inverse = (a: Complex): Complex => {
        if (this.equal(a, C(D(0)))) { throw Error.MATH_ERROR; }
        return this.divide(C(D(1)), a);
    }

    // combinatorics
    public static factorial = (a: Complex): Complex => {
        this.assertReal(a);
        return C(CommonOperators.factorial(a.re));
    }
    public static permutation = (n: Complex, r: Complex): Complex => {
        this.assertReal(n);
        this.assertReal(r);
        return C(CommonOperators.permutation(n.re, r.re));
    }
    public static combination = (n: Complex, r: Complex): Complex => {
        this.assertReal(n);
        this.assertReal(r);
        return C(CommonOperators.combination(n.re, r.re));
    }

    // polar and rectangular coordinates
    public static polar = (a: Complex): Complex => a;
    public static rectangular = (a: Complex): Complex => a;
    public static angle = (r: Complex, θ: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(r);
        this.assertReal(θ);
        let radianθ: Decimal;
        switch (angleMode) {
            case AngleMode.DEGREE:
                radianθ = D(_toRadians(θ.re, AngleMode.DEGREE));
                break;
            case AngleMode.RADIAN:
                radianθ = θ.re;
                break;
            case AngleMode.GRADIAN:
                radianθ = D(_toRadians(θ.re, AngleMode.GRADIAN));
                break;
            default:
                throw Error.EMULATOR_ERROR;
        }
        return { re: radianθ.cos().times(r.re), im: radianθ.sin().times(r.re) };
    }

    // other functions
    public static round = (a: Complex, numberDisplayMode: NumberDisplayMode): Complex => {
        switch (numberDisplayMode) {
            case NumberDisplayMode.FIXED_POINT_0: return { re: a.re.toDecimalPlaces(0), im: a.im.toDecimalPlaces(0) };
            case NumberDisplayMode.FIXED_POINT_1: return { re: a.re.toDecimalPlaces(1), im: a.im.toDecimalPlaces(1) };
            case NumberDisplayMode.FIXED_POINT_2: return { re: a.re.toDecimalPlaces(2), im: a.im.toDecimalPlaces(2) };
            case NumberDisplayMode.FIXED_POINT_3: return { re: a.re.toDecimalPlaces(3), im: a.im.toDecimalPlaces(3) };
            case NumberDisplayMode.FIXED_POINT_4: return { re: a.re.toDecimalPlaces(4), im: a.im.toDecimalPlaces(4) };
            case NumberDisplayMode.FIXED_POINT_5: return { re: a.re.toDecimalPlaces(5), im: a.im.toDecimalPlaces(5) };
            case NumberDisplayMode.FIXED_POINT_6: return { re: a.re.toDecimalPlaces(6), im: a.im.toDecimalPlaces(6) };
            case NumberDisplayMode.FIXED_POINT_7: return { re: a.re.toDecimalPlaces(7), im: a.im.toDecimalPlaces(7) };
            case NumberDisplayMode.FIXED_POINT_8: return { re: a.re.toDecimalPlaces(8), im: a.im.toDecimalPlaces(8) };
            case NumberDisplayMode.FIXED_POINT_9: return { re: a.re.toDecimalPlaces(9), im: a.im.toDecimalPlaces(9) };
            default:
                return a;
        }
    }
    public static random = (): Complex => C(Decimal.random());
    public static fromDegree = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        switch (angleMode) {
            case AngleMode.DEGREE: return a;
            case AngleMode.RADIAN: return C(_toRadians(a.re, AngleMode.DEGREE));
            case AngleMode.GRADIAN: return C(_toGradians(a.re, AngleMode.DEGREE));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromRadian = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        switch (angleMode) {
            case AngleMode.DEGREE: return C(_toDegrees(a.re, AngleMode.RADIAN));
            case AngleMode.RADIAN: return a;
            case AngleMode.GRADIAN: return C(_toGradians(a.re, AngleMode.RADIAN));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromGradian = (a: Complex, angleMode: AngleMode): Complex => {
        this.assertReal(a);
        switch (angleMode) {
            case AngleMode.DEGREE: return C(_toDegrees(a.re, AngleMode.GRADIAN));
            case AngleMode.RADIAN: return C(_toRadians(a.re, AngleMode.GRADIAN));
            case AngleMode.GRADIAN: return a;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
}

// base operators
export class BaseOperators {
    // TODO: implement negative values for 2's complement
    public static and = (a: Decimal, b: Decimal) => D(a.toNumber() & b.toNumber());
    public static or = (a: Decimal, b: Decimal) => D(a.toNumber() | b.toNumber());
    public static xnor = (a: Decimal, b: Decimal) => D(~(a.toNumber() ^ b.toNumber()));
    public static xor = (a: Decimal, b: Decimal) => D(a.toNumber() ^ b.toNumber());
    public static not = (a: Decimal) => D(~a.toNumber());
    public static negate = (a: Decimal) => a.negated();
}

// statistics operators
export class StatisticsOperators {
    private static sum = (values: Decimal[]) => values.reduce((sum, value) => sum.plus(value), D(0));

    // basic aggregates
    public static numberOfData = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return D(xData.length);
    }
    public static xSum = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return this.sum(xData);
    }
    public static x2Sum = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum.plus(x.pow(2)), D(0));
    }
    public static ySum = (yData: Decimal[]) => this.xSum(yData);
    public static y2Sum = (yData: Decimal[]) => this.x2Sum(yData);
    public static xySum = (xData: Decimal[], yData: Decimal[]) => {
        if (xData.length !== yData.length) { throw Error.EMULATOR_ERROR; }
        if (xData.length === 0 || yData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x, i) => sum.plus(x.times(yData[i]!)), D(0));
    }
    public static x2ySum = (xData: Decimal[], yData: Decimal[]) => {
        if (xData.length !== yData.length) { throw Error.EMULATOR_ERROR; }
        if (xData.length === 0 || yData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x, i) => sum.plus(x.pow(2).times(yData[i]!)), D(0));
    }
    public static x3Sum = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum.plus(x.pow(3)), D(0));
    }
    public static x4Sum = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum.plus(x.pow(4)), D(0));
    }
    private static lnSum = (data: Decimal[]) => data.reduce((sum, x) => sum.plus(x.ln()), D(0));
    private static ln2Sum = (data: Decimal[]) => data.reduce((sum, x) => sum.plus(x.ln().pow(2)), D(0));
    private static lnxySum = (xData: Decimal[], yData: Decimal[]) => xData.reduce((sum, x, i) => sum.plus(x.ln().times(yData[i]!)), D(0));
    private static xn1Sum = (xData: Decimal[]) => xData.reduce((sum, x) => sum.plus(x.isZero() ? D(Infinity) : x.pow(-1)), D(0));
    private static xn2Sum = (xData: Decimal[]) => xData.reduce((sum, x) => sum.plus(x.isZero() ? D(Infinity) : x.pow(-2)), D(0));
    private static xn1ySum = (xData: Decimal[], yData: Decimal[]) => xData.reduce((sum, x, i) => sum.plus(x.pow(-1).times(yData[i]!)), D(0));
    private static lnxlnySum = (xData: Decimal[], yData: Decimal[]) => xData.reduce((sum, x, i) => sum.plus(x.ln().times(yData[i]!.ln())), D(0));

    // means and standard deviations
    public static xMean = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return this.xSum(xData).div(this.numberOfData(xData));
    }
    public static xStandardDeviation = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        if (xData.length === 1) { return D(0); }
        const mean = this.xMean(xData);
        return xData.reduce((sum, x) => sum.plus(x.minus(mean).pow(2)), D(0)).div(this.numberOfData(xData)).sqrt();
    }
    public static xSampleStandardDeviation = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        if (xData.length === 1) { return D(0); }
        const mean = this.xMean(xData);
        return xData.reduce((sum, x) => sum.plus(x.minus(mean).pow(2)), D(0)).div(this.numberOfData(xData).minus(1)).sqrt();
    }
    public static yMean = (yData: Decimal[]) => this.xMean(yData);
    public static yStandardDeviation = (yData: Decimal[]) => this.xStandardDeviation(yData)
    public static ySampleStandardDeviation = (yData: Decimal[]) => this.xSampleStandardDeviation(yData);

    // extrema
    public static xMin = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((min, x) => x.lt(min) ? x : min);
    }
    public static xMax = (xData: Decimal[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((max, x) => x.gt(max) ? x : max);
    }
    public static yMin = (yData: Decimal[]) => this.xMin(yData);
    public static yMax = (yData: Decimal[]) => this.xMax(yData);

    // linear regression
    private static linearRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const xySum = this.xySum(xData, yData);
        const xSum = this.xSum(xData);
        const ySum = this.ySum(yData);
        const x2Sum = this.x2Sum(xData);

        const b = n.times(xySum).minus(xSum.times(ySum)).div(n.times(x2Sum).minus(xSum.pow(2)));
        const a = ySum.minus(b.times(xSum)).div(n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a.plus(b.times(x));
        } else if (y !== undefined) {
            x = y.minus(a).div(b);
        }
        return { a, b, x, y };
    }
    private static linearRegressionCorrelationCoefficient = (xData: Decimal[], yData: Decimal[]) => {
        const n = this.numberOfData(xData);
        const xySum = this.xySum(xData, yData);
        const xSum = this.xSum(xData);
        const ySum = this.ySum(yData);
        const x2Sum = this.x2Sum(xData);
        const y2Sum = this.y2Sum(yData);
        return n.times(xySum).minus(xSum.times(ySum)).div(n.times(x2Sum).minus(xSum.pow(2)).times(n.times(y2Sum).minus(ySum.pow(2))).sqrt());
    }
    // logarithmic regression
    private static logarithmicRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const lnxySum = this.lnxySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const ySum = this.ySum(yData);
        const lnx2Sum = this.ln2Sum(xData);

        const b = n.times(lnxySum).minus(lnxSum.times(ySum)).div(n.times(lnx2Sum).minus(lnxSum.pow(2)));
        const a = ySum.minus(b.times(lnxSum)).div(n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a.plus(b.times(CommonOperators.ln(x)));
        } else if (y !== undefined) {
            x = CommonOperators.exp(y.minus(a).div(b));
        }
        return { a, b, x, y };
    }
    private static logarithmicRegressionCorrelationCoefficient = (xData: Decimal[], yData: Decimal[]) => {
        const n = this.numberOfData(xData);
        const lnxySum = this.lnxySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const ySum = this.ySum(yData);
        const lnx2Sum = this.ln2Sum(xData);
        const y2Sum = this.y2Sum(yData);
        return n.times(lnxySum).minus(lnxSum.times(ySum)).div(n.times(lnx2Sum).minus(lnxSum.pow(2)).times(n.times(y2Sum).minus(ySum.pow(2))).sqrt());
    }
    // exponential regression
    private static exponentialRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const lnyxSum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);

        const b = n.times(lnyxSum).minus(xSum.times(lnySum)).div(n.times(x2Sum).minus(xSum.pow(2)));
        const a = CommonOperators.exp(lnySum.minus(b.times(xSum)).div(n));
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a.times(CommonOperators.exp(b.times(x)));
        } else if (y !== undefined) {
            x = CommonOperators.ln(y.div(a)).div(b);
        }
        return { a, b, x, y };
    }
    private static exponentialRegressionCorrelationCoefficient = (xData: Decimal[], yData: Decimal[]) => {
        const n = this.numberOfData(xData);
        const lnyxSum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);
        const lny2Sum = this.ln2Sum(yData);
        return n.times(lnyxSum).minus(xSum.times(lnySum)).div(n.times(x2Sum).minus(xSum.pow(2)).times(n.times(lny2Sum).minus(lnySum.pow(2))).sqrt());
    }
    // power regression
    private static powerRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const lnxlnySum = this.lnxlnySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const lnySum = this.lnSum(yData);
        const lnx2Sum = this.ln2Sum(xData);

        const b = n.times(lnxlnySum).minus(lnxSum.times(lnySum)).div(n.times(lnx2Sum).minus(lnxSum.pow(2)));
        const a = CommonOperators.exp(lnySum.minus(b.times(lnxSum)).div(n));
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a.times(CommonOperators.power(x, b));
        } else if (y !== undefined) {
            x = CommonOperators.power(y.div(a), D(1).div(b));
        }
        return { a, b, x, y };
    }
    private static powerRegressionCorrelationCoefficient = (xData: Decimal[], yData: Decimal[]) => {
        const n = this.numberOfData(xData);
        const lnxlnySum = this.lnxlnySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const lnySum = this.lnSum(yData);
        const lnx2Sum = this.ln2Sum(xData);
        const lny2Sum = this.ln2Sum(yData);
        return n.times(lnxlnySum).minus(lnxSum.times(lnySum)).div(n.times(lnx2Sum).minus(lnxSum.pow(2)).times(n.times(lny2Sum).minus(lnySum.pow(2))).sqrt());
    }
    // inverse regression
    private static inverseRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const xn1ySum = this.xn1ySum(xData, yData);
        const xn1Sum = this.xn1Sum(xData);
        const ySum = this.ySum(yData);
        const xn2Sum = this.xn2Sum(xData);

        const b = n.times(xn1ySum).minus(xn1Sum.times(ySum)).div(n.times(xn2Sum).minus(xn1Sum.pow(2)));
        const a = ySum.minus(b.times(xn1Sum)).div(n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a.plus(b.times(CommonOperators.inverse(x)));
        } else if (y !== undefined) {
            x = CommonOperators.inverse(y.minus(a).div(b));
        }
        return { a, b, x, y };
    }
    private static inverseRegressionCorrelationCoefficient = (xData: Decimal[], yData: Decimal[]) => {
        const n = this.numberOfData(xData);
        const xn1ySum = this.xn1ySum(xData, yData);
        const xn1Sum = this.xn1Sum(xData);
        const ySum = this.ySum(yData);
        const xn2Sum = this.xn2Sum(xData);
        const y2Sum = this.y2Sum(yData);
        return n.times(xn1ySum).minus(xn1Sum.times(ySum)).div(n.times(xn2Sum).minus(xn1Sum.pow(2)).times(n.times(y2Sum).minus(ySum.pow(2))).sqrt());
    }
    // quadratic regression
    private static quadraticRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const x4Sum = this.x4Sum(xData);
        const x3Sum = this.x3Sum(xData);
        const x2Sum = this.x2Sum(xData);
        const xySum = this.xySum(xData, yData);
        const x2ySum = this.x2ySum(xData, yData);
        const xSum = this.xSum(xData);
        const ySum = this.ySum(yData);

        const sxx = x2Sum.minus(xSum.pow(2).div(n));
        const sxy = xySum.minus(xSum.times(ySum).div(n));
        const sxx2 = x3Sum.minus(xSum.times(x2Sum).div(n));
        const sx2x2 = x4Sum.minus(x2Sum.pow(2).div(n));
        const sx2y = x2ySum.minus(x2Sum.times(ySum).div(n));

        const b = sxy.times(sx2x2).minus(sx2y.times(sxx2)).div(sxx.times(sx2x2).minus(sxx2.pow(2)));
        const c = sx2y.times(sxx).minus(sxy.times(sxx2)).div(sxx.times(sx2x2).minus(sxx2.pow(2)));
        const a = ySum.minus(b.times(xSum)).minus(c.times(x2Sum)).div(n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        let x1 = x;
        let x2 = x;
        if (x !== undefined) {
            y = a.plus(b.times(x)).plus(c.times(x.pow(2)));
        } else if (y !== undefined) {
            const discriminant = b.pow(2).minus(D(4).times(c).times(a.minus(y)));
            if (discriminant.lt(0)) { throw Error.MATH_ERROR; }
            const sqrtDiscriminant = CommonOperators.sqrt(discriminant);
            x1 = b.negated().plus(sqrtDiscriminant).div(D(2).times(c));
            x2 = b.negated().minus(sqrtDiscriminant).div(D(2).times(c));
        }
        return { a, b, c, x1, x2, y };
    }
    // ab exponential regression
    private static abExponentialRegression = (xData: Decimal[], yData: Decimal[], { x, y }: { x?: Decimal, y?: Decimal }) => {
        const n = this.numberOfData(xData);
        const xlnySum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);

        const b = CommonOperators.exp(n.times(xlnySum).minus(xSum.times(lnySum)).div(n.times(x2Sum).minus(xSum.pow(2))));
        const a = CommonOperators.exp(lnySum.minus(CommonOperators.ln(b).times(xSum)).div(n));
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a.times(CommonOperators.power(b, x));
        } else if (y !== undefined) {
            x = CommonOperators.ln(y.div(a)).div(CommonOperators.ln(b));
        }
        return { a, b, x, y };
    }
    private static abExponentialRegressionCorrelationCoefficient = (xData: Decimal[], yData: Decimal[]) => {
        const n = this.numberOfData(xData);
        const xlnySum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);
        const lny2Sum = this.ln2Sum(yData);
        return n.times(xlnySum).minus(xSum.times(lnySum)).div(n.times(x2Sum).minus(xSum.pow(2)).times(n.times(lny2Sum).minus(lnySum.pow(2))).sqrt());
    }
    //
    public static regressionA = (xData: Decimal[], yData: Decimal[], regressionMode: RegressionMode) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return _mathErrorGuard(this.linearRegression(xData, yData, {}).a!);
            case RegressionMode.LOGARITHMIC: return _mathErrorGuard(this.logarithmicRegression(xData, yData, {}).a!);
            case RegressionMode.EXPONENTIAL: return _mathErrorGuard(this.exponentialRegression(xData, yData, {}).a!);
            case RegressionMode.POWER: return _mathErrorGuard(this.powerRegression(xData, yData, {}).a!);
            case RegressionMode.INVERSE: return _mathErrorGuard(this.inverseRegression(xData, yData, {}).a!);
            case RegressionMode.QUADRATIC: return _mathErrorGuard(this.quadraticRegression(xData, yData, {}).a);
            case RegressionMode.AB_EXPONENTIAL: return _mathErrorGuard(this.abExponentialRegression(xData, yData, {}).a!);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static regressionB = (xData: Decimal[], yData: Decimal[], regressionMode: RegressionMode) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return _mathErrorGuard(this.linearRegression(xData, yData, {}).b!);
            case RegressionMode.LOGARITHMIC: return _mathErrorGuard(this.logarithmicRegression(xData, yData, {}).b!);
            case RegressionMode.EXPONENTIAL: return _mathErrorGuard(this.exponentialRegression(xData, yData, {}).b!);
            case RegressionMode.POWER: return _mathErrorGuard(this.powerRegression(xData, yData, {}).b!);
            case RegressionMode.INVERSE: return _mathErrorGuard(this.inverseRegression(xData, yData, {}).b!);
            case RegressionMode.QUADRATIC: return _mathErrorGuard(this.quadraticRegression(xData, yData, {}).b);
            case RegressionMode.AB_EXPONENTIAL: return _mathErrorGuard(this.abExponentialRegression(xData, yData, {}).b!);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static regressionC = (xData: Decimal[], yData: Decimal[], regressionMode: RegressionMode.QUADRATIC) => {
        if (regressionMode !== RegressionMode.QUADRATIC) { throw Error.EMULATOR_ERROR; }
        return _mathErrorGuard(this.quadraticRegression(xData, yData, {}).c);
    }
    public static estimatedX = (xData: Decimal[], yData: Decimal[], regressionMode: Exclude<RegressionMode, RegressionMode.QUADRATIC>, y: Decimal) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return _mathErrorGuard(this.linearRegression(xData, yData, { y }).x!);
            case RegressionMode.LOGARITHMIC: return _mathErrorGuard(this.logarithmicRegression(xData, yData, { y }).x!);
            case RegressionMode.EXPONENTIAL: return _mathErrorGuard(this.exponentialRegression(xData, yData, { y }).x!);
            case RegressionMode.POWER: return _mathErrorGuard(this.powerRegression(xData, yData, { y }).x!);
            case RegressionMode.INVERSE: return _mathErrorGuard(this.inverseRegression(xData, yData, { y }).x!);
            // case RegressionMode.QUADRATIC: throw Error.EMULATOR_ERROR;
            case RegressionMode.AB_EXPONENTIAL: return _mathErrorGuard(this.abExponentialRegression(xData, yData, { y }).x!);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static estimatedX1 = (xData: Decimal[], yData: Decimal[], regressionMode: RegressionMode.QUADRATIC, y: Decimal) => {
        if (regressionMode !== RegressionMode.QUADRATIC) { throw Error.EMULATOR_ERROR; }
        return _mathErrorGuard(this.quadraticRegression(xData, yData, { y }).x1!);
    }
    public static estimatedX2 = (xData: Decimal[], yData: Decimal[], regressionMode: RegressionMode.QUADRATIC, y: Decimal) => {
        if (regressionMode !== RegressionMode.QUADRATIC) { throw Error.EMULATOR_ERROR; }
        return _mathErrorGuard(this.quadraticRegression(xData, yData, { y }).x2!);
    }
    public static estimatedY = (xData: Decimal[], yData: Decimal[], regressionMode: RegressionMode, x: Decimal) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return _mathErrorGuard(this.linearRegression(xData, yData, { x }).y!);
            case RegressionMode.LOGARITHMIC: return _mathErrorGuard(this.logarithmicRegression(xData, yData, { x }).y!);
            case RegressionMode.EXPONENTIAL: return _mathErrorGuard(this.exponentialRegression(xData, yData, { x }).y!);
            case RegressionMode.POWER: return _mathErrorGuard(this.powerRegression(xData, yData, { x }).y!);
            case RegressionMode.INVERSE: return _mathErrorGuard(this.inverseRegression(xData, yData, { x }).y!);
            case RegressionMode.QUADRATIC: return _mathErrorGuard(this.quadraticRegression(xData, yData, { x }).y!);
            case RegressionMode.AB_EXPONENTIAL: return _mathErrorGuard(this.abExponentialRegression(xData, yData, { x }).y!);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static correlationCoefficient = (xData: Decimal[], yData: Decimal[], regressionMode: Exclude<RegressionMode, RegressionMode.QUADRATIC>) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return _mathErrorGuard(this.linearRegressionCorrelationCoefficient(xData, yData));
            case RegressionMode.LOGARITHMIC: return _mathErrorGuard(this.logarithmicRegressionCorrelationCoefficient(xData, yData));
            case RegressionMode.EXPONENTIAL: return _mathErrorGuard(this.exponentialRegressionCorrelationCoefficient(xData, yData));
            case RegressionMode.POWER: return _mathErrorGuard(this.powerRegressionCorrelationCoefficient(xData, yData));
            case RegressionMode.INVERSE: return _mathErrorGuard(this.inverseRegressionCorrelationCoefficient(xData, yData));
            // case RegressionMode.QUADRATIC: throw Error.EMULATOR_ERROR;
            case RegressionMode.AB_EXPONENTIAL: return _mathErrorGuard(this.abExponentialRegressionCorrelationCoefficient(xData, yData));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
}