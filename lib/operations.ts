import { Error } from "./errors";
import { AngleMode, NumberDisplayMode, RegressionMode } from "./modes";

// meta
const toRadians = (a: number, angleMode: AngleMode) => {
    switch (angleMode) {
        case AngleMode.DEGREE: return a * Math.PI / 180;
        case AngleMode.RADIAN: return a;
        case AngleMode.GRADIAN: return a * Math.PI / 200;
        default:
            throw Error.EMULATOR_ERROR;
    }
}
const toDegrees = (a: number, angleMode: AngleMode) => {
    switch (angleMode) {
        case AngleMode.DEGREE: return a;
        case AngleMode.RADIAN: return a * 180 / Math.PI;
        case AngleMode.GRADIAN: return a * 200 / Math.PI;
        default:
            throw Error.EMULATOR_ERROR;
    }
}
const toGradians = (a: number, angleMode: AngleMode) => {
    switch (angleMode) {
        case AngleMode.DEGREE: return a * 200 / 180;
        case AngleMode.RADIAN: return a * 200 / Math.PI;
        case AngleMode.GRADIAN: return a;
        default:
            throw Error.EMULATOR_ERROR;
    }
}
const multiplyFromTo = (a: number, b: number) => {
    let result = 1;
    for (let i = a; i <= b; i++) {
        result *= i;
    }
    return result;
}
const isInteger = (a: number) => Number.isInteger(a);

// simple operators
export class CommonOperators {
    public static add = (a: number, b: number) => a + b;
    public static subtract = (a: number, b: number) => a - b;
    public static multiply = (a: number, b: number) => a * b;
    public static divide = (a: number, b: number) => a / b;
    public static sciExp = (a: number, b: number) => a * Math.pow(10, b);
    public static negative = (a: number) => -a;
    public static factorial = (a: number): number => {
        if (a < 0) { throw Error.MATH_ERROR; }
        if (!isInteger(a)) { throw Error.MATH_ERROR; }
        return multiplyFromTo(1, a);
    }
    public static sin = (a: number, angleMode: AngleMode) => Math.sin(toRadians(a, angleMode));
    public static cos = (a: number, angleMode: AngleMode) => Math.cos(toRadians(a, angleMode));
    public static tan = (a: number, angleMode: AngleMode) => Math.tan(toRadians(a, angleMode));
    public static sinh = (a: number, angleMode: AngleMode) => Math.sinh(toRadians(a, angleMode));
    public static cosh = (a: number, angleMode: AngleMode) => Math.cosh(toRadians(a, angleMode));
    public static tanh = (a: number, angleMode: AngleMode) => Math.tanh(toRadians(a, angleMode));
    public static asin = (a: number, angleMode: AngleMode) => toDegrees(Math.asin(a), angleMode);
    public static acos = (a: number, angleMode: AngleMode) => toDegrees(Math.acos(a), angleMode);
    public static atan = (a: number, angleMode: AngleMode) => toDegrees(Math.atan(a), angleMode);
    public static asinh = (a: number, angleMode: AngleMode) => toDegrees(Math.asinh(a), angleMode);
    public static acosh = (a: number, angleMode: AngleMode) => toDegrees(Math.acosh(a), angleMode);
    public static atanh = (a: number, angleMode: AngleMode) => toDegrees(Math.atanh(a), angleMode);
    public static square = (a: number) => a * a;
    public static sqrt = (a: number) => {
        if (a < 0) { throw Error.MATH_ERROR; }
        return Math.sqrt(a);
    }
    public static power = (a: number, b: number) => {
        if (a === 0 && b <= 0) { throw Error.MATH_ERROR; }
        if (a > 0) { return Math.pow(a, b); }
        const bdenominator = 1 / b;
        while (!isInteger(bdenominator)) { b *= 10; }
        if (b % 2 === 0) { throw Error.MATH_ERROR; }
        return -Math.pow(-a, b);
    }
    public static log = (a: number, b?: number) => {
        if (b === undefined) {
            if (a <= 0) { throw Error.MATH_ERROR; }
            return Math.log10(a);
        } else {
            if (a <= 0 || b <= 0 || a === 1) { throw Error.MATH_ERROR; }
            return Math.log(b) / Math.log(a);
        }
    }
    public static ln = (a: number) => {
        if (a <= 0) { throw Error.MATH_ERROR; }
        return Math.log(a);
    }
    public static exp = (a: number) => Math.exp(a);
    public static inverse = (a: number) => {
        if (a === 0) { throw Error.MATH_ERROR; }
        return 1 / a;
    }
    public static cube = (a: number) => a * a * a;
    public static cubeRoot = (a: number) => Math.pow(a, 1 / 3);
    public static xRoot = (a: number, b: number) => {
        if (a === 0) { throw Error.MATH_ERROR; }
        if (b < 0 && a % 2 === 0) { throw Error.MATH_ERROR; }
        return Math.pow(b, 1 / a); ``
    }
    public static round = (a: number, numberDisplayMode: NumberDisplayMode) => {
        switch (numberDisplayMode) {
            case NumberDisplayMode.FIXED_POINT_0: return parseFloat(a.toFixed(0));
            case NumberDisplayMode.FIXED_POINT_1: return parseFloat(a.toFixed(1));
            case NumberDisplayMode.FIXED_POINT_2: return parseFloat(a.toFixed(2));
            case NumberDisplayMode.FIXED_POINT_3: return parseFloat(a.toFixed(3));
            case NumberDisplayMode.FIXED_POINT_4: return parseFloat(a.toFixed(4));
            case NumberDisplayMode.FIXED_POINT_5: return parseFloat(a.toFixed(5));
            case NumberDisplayMode.FIXED_POINT_6: return parseFloat(a.toFixed(6));
            case NumberDisplayMode.FIXED_POINT_7: return parseFloat(a.toFixed(7));
            case NumberDisplayMode.FIXED_POINT_8: return parseFloat(a.toFixed(8));
            case NumberDisplayMode.FIXED_POINT_9: return parseFloat(a.toFixed(9));
            default:
                return a;
        }
    }
    public static random = () => Math.random();
    public static fromDegree = (a: number, angleMode: AngleMode) => {
        switch (angleMode) {
            case AngleMode.DEGREE: return a;
            case AngleMode.RADIAN: return toRadians(a, AngleMode.DEGREE);
            case AngleMode.GRADIAN: return toGradians(a, AngleMode.DEGREE);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromRadian = (a: number, angleMode: AngleMode) => {
        switch (angleMode) {
            case AngleMode.DEGREE: return toDegrees(a, AngleMode.RADIAN);
            case AngleMode.RADIAN: return a;
            case AngleMode.GRADIAN: return toGradians(a, AngleMode.RADIAN);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromGradian = (a: number, angleMode: AngleMode) => {
        switch (angleMode) {
            case AngleMode.DEGREE: return toDegrees(a, AngleMode.GRADIAN);
            case AngleMode.RADIAN: return toRadians(a, AngleMode.GRADIAN);
            case AngleMode.GRADIAN: return a;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static polar = (a: number, b: number, angleMode: AngleMode) => ({
        x: Math.sqrt(a * a + b * b),
        y: this.fromRadian(Math.atan2(b, a), angleMode)
    });
    public static rectangular = (a: number, b: number, angleMode: AngleMode) => ({
        x: a * Math.cos(toRadians(b, angleMode)),
        y: a * Math.sin(toRadians(b, angleMode))
    });
    public static permutation = (n: number, r: number) => {
        if (n < 0 || r < 0 || n < r) { throw Error.MATH_ERROR; }
        if (!isInteger(n) || !isInteger(r)) { throw Error.MATH_ERROR; }
        if (r === 0) { return 1; }
        let tfac = multiplyFromTo(1, n - r);
        let nfac = tfac * multiplyFromTo(n - r + 1, n);
        return nfac / tfac;
    }
    public static combination = (n: number, r: number) => {
        if (n < 0 || r < 0 || n < r) { throw Error.MATH_ERROR; }
        if (!isInteger(n) || !isInteger(r)) { throw Error.MATH_ERROR; }
        if (r === 0) { return 1; }
        let t1 = r;
        let t2 = n - r;
        if (t1 > t2) { [t1, t2] = [t2, t1]; }
        // t1 <= t2
        let t1fac = multiplyFromTo(1, t1);
        let t2fac = t1fac * multiplyFromTo(t1 + 1, t2);
        let nfac = t2fac * multiplyFromTo(t2 + 1, n);
        return nfac / t2fac / t1fac;
    }
    public static percent = (a: number) => a / 100;
    public static abs = (a: number) => Math.abs(a);
}

// complex-compatible operators
type complex = { re: number, im: number }
export class ComplexOperators {
    private static toComplex = (a: number): complex => (this.toComplex(a));
    private static equal = (a: complex, b: complex) => a.re === b.re && a.im === b.im;

    public static conjugate = (a: complex): complex => ({ re: a.re, im: -a.im });
    public static add = (a: complex, b: complex): complex => ({
        re: a.re + b.re,
        im: a.im + b.im
    });
    public static subtract = (a: complex, b: complex): complex => ({
        re: a.re - b.re,
        im: a.im - b.im
    });
    public static multiply = (a: complex, b: complex): complex => ({
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
    });
    public static divide = (a: complex, b: complex) => {
        if (this.equal(b, this.toComplex(0))) { throw Error.MATH_ERROR; }
        const conjugateB = this.conjugate(b);
        const nominator = this.multiply(a, conjugateB);
        const denominator = b.re * b.re + b.im * b.im;
        return {
            re: nominator.re / denominator,
            im: nominator.im / denominator
        }
    }
    public static negative = (a: complex): complex => ({ re: -a.re, im: -a.im });
    public static sin = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.sin(a.re, angleMode));
    }
    public static cos = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.cos(a.re, angleMode));
    }
    public static tan = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.tan(a.re, angleMode));
    }
    public static sinh = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.sinh(a.re, angleMode));
    }
    public static cosh = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.cosh(a.re, angleMode));
    }
    public static tanh = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.tanh(a.re, angleMode));
    }
    public static asin = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.asin(a.re, angleMode));
    }
    public static acos = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.acos(a.re, angleMode));
    }
    public static atan = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.atan(a.re, angleMode));
    }
    public static asinh = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.asinh(a.re, angleMode));
    }
    public static acosh = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.acosh(a.re, angleMode));
    }
    public static atanh = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.atanh(a.re, angleMode));
    }
    public static square = (a: complex): complex => this.multiply(a, a);
    public static sqrt = (a: complex): complex => {
        if (a.im != 0) { throw Error.MATH_ERROR; }
        if (a.re >= 0) {
            return this.toComplex(Math.sqrt(a.re));
        } else {
            return { re: 0, im: Math.sqrt(-a.re) };
        }
    }
    public static power = (a: complex, b: complex): complex => {
        if (b.im !== 0) { throw Error.MATH_ERROR; }
        if (this.equal(a, this.toComplex(0)) && b.re <= 0) { throw Error.MATH_ERROR; }
        if (a.im === 0) { return this.toComplex(CommonOperators.power(a.re, b.re)) }
        if (!isInteger(b.re)) { throw Error.MATH_ERROR; }

        if (b.re === -1) { return this.inverse(a); }
        if (b.re < 0) { throw Error.MATH_ERROR; }

        for (let i = 1; i < b.re; i++) {
            a = this.multiply(a, a);
        }
        return a;
    }
    public static log = (a: complex): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.log(a.re));
    }
    public static ln = (a: complex): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.ln(a.re));
    }
    public static exp = (a: complex): complex => this.power(this.toComplex(Math.E), a);
    public static inverse = (a: complex): complex => {
        if (this.equal(a, this.toComplex(0))) { throw Error.MATH_ERROR; }
        return this.divide(this.toComplex(1), a);
    }
    public static cube = (a: complex): complex => this.multiply(this.multiply(a, a), a);
    public static cubeRoot = (a: complex): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.cubeRoot(a.re));
    }
    public static xRoot = (a: complex, b: complex): complex => {
        if (this.equal(a, this.toComplex(0))) { throw Error.MATH_ERROR; }
        if (a.im !== 0 || b.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(Math.pow(b.re, 1 / a.re));
    }
    public static round = (a: complex, numberDisplayMode: NumberDisplayMode): complex => {
        switch (numberDisplayMode) {
            case NumberDisplayMode.FIXED_POINT_0: return { re: parseFloat(a.re.toFixed(0)), im: parseFloat(a.im.toFixed(0)) };
            case NumberDisplayMode.FIXED_POINT_1: return { re: parseFloat(a.re.toFixed(1)), im: parseFloat(a.im.toFixed(1)) };
            case NumberDisplayMode.FIXED_POINT_2: return { re: parseFloat(a.re.toFixed(2)), im: parseFloat(a.im.toFixed(2)) };
            case NumberDisplayMode.FIXED_POINT_3: return { re: parseFloat(a.re.toFixed(3)), im: parseFloat(a.im.toFixed(3)) };
            case NumberDisplayMode.FIXED_POINT_4: return { re: parseFloat(a.re.toFixed(4)), im: parseFloat(a.im.toFixed(4)) };
            case NumberDisplayMode.FIXED_POINT_5: return { re: parseFloat(a.re.toFixed(5)), im: parseFloat(a.im.toFixed(5)) };
            case NumberDisplayMode.FIXED_POINT_6: return { re: parseFloat(a.re.toFixed(6)), im: parseFloat(a.im.toFixed(6)) };
            case NumberDisplayMode.FIXED_POINT_7: return { re: parseFloat(a.re.toFixed(7)), im: parseFloat(a.im.toFixed(7)) };
            case NumberDisplayMode.FIXED_POINT_8: return { re: parseFloat(a.re.toFixed(8)), im: parseFloat(a.im.toFixed(8)) };
            case NumberDisplayMode.FIXED_POINT_9: return { re: parseFloat(a.re.toFixed(9)), im: parseFloat(a.im.toFixed(9)) };
            default:
                return a;
        }
    }
    public static random = (): complex => { return this.toComplex(CommonOperators.random()); };
    public static fromDegree = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        switch (angleMode) {
            case AngleMode.DEGREE: return a;
            case AngleMode.RADIAN: return this.toComplex(toRadians(a.re, AngleMode.DEGREE));
            case AngleMode.GRADIAN: return this.toComplex(toGradians(a.re, AngleMode.DEGREE));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromRadian = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        switch (angleMode) {
            case AngleMode.DEGREE: return this.toComplex(toDegrees(a.re, AngleMode.RADIAN));
            case AngleMode.RADIAN: return a;
            case AngleMode.GRADIAN: return this.toComplex(toGradians(a.re, AngleMode.RADIAN));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static fromGradian = (a: complex, angleMode: AngleMode): complex => {
        if (a.im !== 0) { throw Error.MATH_ERROR; }
        switch (angleMode) {
            case AngleMode.DEGREE: return this.toComplex(toDegrees(a.re, AngleMode.GRADIAN));
            case AngleMode.RADIAN: return this.toComplex(toRadians(a.re, AngleMode.GRADIAN));
            case AngleMode.GRADIAN: return a;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static polar = (a: complex): complex => a;
    public static rectangular = (a: complex): complex => a;
    public static angle = (r: complex, θ: complex, angleMode: AngleMode): complex => {
        if (r.im !== 0 || θ.im !== 0) { throw Error.MATH_ERROR; }
        let radianθ: number;
        switch (angleMode) {
            case AngleMode.DEGREE:
                radianθ = toRadians(θ.re, AngleMode.DEGREE);
                break;
            case AngleMode.RADIAN:
                radianθ = θ.re;
                break;
            case AngleMode.GRADIAN:
                radianθ = toRadians(θ.re, AngleMode.GRADIAN);
                break;
            default:
                throw Error.EMULATOR_ERROR;
        }
        return { re: Math.cos(radianθ) * r.re, im: Math.sin(radianθ) * r.re };
    }
    public static permutation = (n: complex, r: complex): complex => {
        if (n.im !== 0 || r.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.permutation(n.re, r.re));
    }
    public static combination = (n: complex, r: complex): complex => {
        if (n.im !== 0 || r.im !== 0) { throw Error.MATH_ERROR; }
        return this.toComplex(CommonOperators.combination(n.re, r.re));
    }
    public static abs = (a: complex): complex => this.toComplex(Math.hypot(a.re, a.im));
}

// base operators
export class BaseOperators {
    // TODO: implement negative values for 2's complement
    public static and = (a: number, b: number) => a & b;
    public static or = (a: number, b: number) => a | b;
    public static xnor = (a: number, b: number) => ~(a ^ b);
    public static xor = (a: number, b: number) => a ^ b;
    public static not = (a: number) => ~a;
    public static negate = (a: number) => -a;
}

// statistics operators
export class StatisticsOperators {
    public static x2Sum = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum + x * x, 0);
    }
    public static xSum = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum + x, 0);
    }
    public static numberOfData = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.length;
    }
    public static y2Sum = (yData: number[]) => this.x2Sum(yData);
    public static ySum = (yData: number[]) => this.xSum(yData);
    public static xySum = (xData: number[], yData: number[]) => {
        if (xData.length !== yData.length) { throw Error.EMULATOR_ERROR; }
        if (xData.length === 0 || yData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x, i) => sum + x * yData[i]!, 0);
    }
    public static x2ySum = (xData: number[], yData: number[]) => {
        if (xData.length !== yData.length) { throw Error.EMULATOR_ERROR; }
        if (xData.length === 0 || yData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x, i) => sum + x * x * yData[i]!, 0);
    }
    public static x3Sum = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum + x * x * x, 0);
    }
    public static x4Sum = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return xData.reduce((sum, x) => sum + x * x * x * x, 0);
    }
    private static lnSum = (data: number[]) => data.reduce((sum, x) => sum + CommonOperators.ln(x), 0);
    private static ln2Sum = (data: number[]) => data.reduce((sum, x) => sum + CommonOperators.ln(x) * CommonOperators.ln(x), 0);
    private static lnxySum = (xData: number[], yData: number[]) => xData.reduce((sum, x, i) => sum + CommonOperators.ln(x) * yData[i]!, 0);
    private static xn1Sum = (xData: number[]) => xData.reduce((sum, x) => sum + CommonOperators.inverse(x), 0);
    private static xn2Sum = (xData: number[]) => xData.reduce((sum, x) => sum + CommonOperators.inverse(x) * CommonOperators.inverse(x), 0);
    private static xn1ySum = (xData: number[], yData: number[]) => xData.reduce((sum, x, i) => sum + CommonOperators.inverse(x) * yData[i]!, 0);
    private static lnxlnySum = (xData: number[], yData: number[]) => xData.reduce((sum, x, i) => sum + CommonOperators.ln(x) * CommonOperators.ln(yData[i]!), 0);

    public static xMean = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return this.xSum(xData) / this.numberOfData(xData);
    }
    public static xStandardDeviation = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        if (xData.length === 1) { return 0; }
        const mean = this.xMean(xData);
        return Math.sqrt(xData.reduce((sum, x) => sum + (x - mean) * (x - mean), 0) / this.numberOfData(xData));
    }
    public static xSampleStandardDeviation = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        if (xData.length === 1) { return 0; }
        const mean = this.xMean(xData);
        return Math.sqrt(xData.reduce((sum, x) => sum + (x - mean) * (x - mean), 0) / (this.numberOfData(xData) - 1));
    }
    public static yMean = (yData: number[]) => this.xMean(yData);
    public static yStandardDeviation = (yData: number[]) => this.xStandardDeviation(yData)
    public static ySampleStandardDeviation = (yData: number[]) => this.xSampleStandardDeviation(yData);
    public static xMin = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return Math.min(...xData);
    }
    public static xMax = (xData: number[]) => {
        if (xData.length === 0) { throw Error.MATH_ERROR; }
        return Math.max(...xData);
    }
    public static yMin = (yData: number[]) => this.xMin(yData);
    public static yMax = (yData: number[]) => this.xMax(yData);

    // linear regression
    private static linearRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const xySum = this.xySum(xData, yData);
        const xSum = this.xSum(xData);
        const ySum = this.ySum(yData);
        const x2Sum = this.x2Sum(xData);

        const b = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
        const a = (ySum - b * xSum) / n;
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a + b * x;
        } else if (y !== undefined) {
            x = (y - a) / b;
        }
        return { a, b, x, y };
    }
    private static linearRegressionCorrelationCoefficient = (xData: number[], yData: number[]) => {
        const n = this.numberOfData(xData);
        const xySum = this.xySum(xData, yData);
        const xSum = this.xSum(xData);
        const ySum = this.ySum(yData);
        const x2Sum = this.x2Sum(xData);
        const y2Sum = this.y2Sum(yData);
        return (n * xySum - xSum * ySum) / CommonOperators.sqrt((n * x2Sum - xSum * xSum) * (n * y2Sum - ySum * ySum));
    }
    // logarithmic regression
    private static logarithmicRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const lnxySum = this.lnxySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const ySum = this.ySum(yData);
        const lnx2Sum = this.ln2Sum(xData);

        const b = (n * lnxySum - lnxSum * ySum) / (n * lnx2Sum - lnxSum * lnxSum);
        const a = (ySum - b * lnxSum) / n;
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a + b * CommonOperators.ln(x);
        } else if (y !== undefined) {
            x = CommonOperators.exp((y - a) / b);
        }
        return { a, b, x, y };
    }
    private static logarithmicRegressionCorrelationCoefficient = (xData: number[], yData: number[]) => {
        const n = this.numberOfData(xData);
        const lnxySum = this.lnxySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const ySum = this.ySum(yData);
        const lnx2Sum = this.ln2Sum(xData);
        const y2Sum = this.y2Sum(yData);
        return (n * lnxySum - lnxSum * ySum) / CommonOperators.sqrt((n * lnx2Sum - lnxSum * lnxSum) * (n * y2Sum - ySum * ySum));
    }
    // exponential regression
    private static exponentialRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const lnyxSum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);

        const b = (n * lnyxSum - xSum * lnySum) / (n * x2Sum - xSum * xSum);
        const a = CommonOperators.exp((lnySum - b * xSum) / n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a * CommonOperators.exp(b * x);
        } else if (y !== undefined) {
            x = CommonOperators.ln(y / a) / b;
        }
        return { a, b, x, y };
    }
    private static exponentialRegressionCorrelationCoefficient = (xData: number[], yData: number[]) => {
        const n = this.numberOfData(xData);
        const lnyxSum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);
        const lny2Sum = this.ln2Sum(yData);
        return (n * lnyxSum - xSum * lnySum) / CommonOperators.sqrt((n * x2Sum - xSum * xSum) * (n * lny2Sum - lnySum * lnySum));
    }
    // power regression
    private static powerRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const lnxlnySum = this.lnxlnySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const lnySum = this.lnSum(yData);
        const lnx2Sum = this.ln2Sum(xData);

        const b = (n * lnxlnySum - lnxSum * lnySum) / (n * lnx2Sum - lnxSum * lnxSum);
        const a = CommonOperators.exp((lnySum - b * lnxSum) / n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a * CommonOperators.power(x, b);
        } else if (y !== undefined) {
            x = CommonOperators.power(y / a, 1 / b);
        }
        return { a, b, x, y };
    }
    private static powerRegressionCorrelationCoefficient = (xData: number[], yData: number[]) => {
        const n = this.numberOfData(xData);
        const lnxlnySum = this.lnxlnySum(xData, yData);
        const lnxSum = this.lnSum(xData);
        const lnySum = this.lnSum(yData);
        const lnx2Sum = this.ln2Sum(xData);
        const lny2Sum = this.ln2Sum(yData);
        return (n * lnxlnySum - lnxSum * lnySum) / CommonOperators.sqrt((n * lnx2Sum - lnxSum * lnxSum) * (n * lny2Sum - lnySum * lnySum));
    }
    // inverse regression
    private static inverseRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const xn1ySum = this.xn1ySum(xData, yData);
        const xn1Sum = this.xn1Sum(xData);
        const ySum = this.ySum(yData);
        const xn2Sum = this.xn2Sum(xData);

        const b = (n * xn1ySum - xn1Sum * ySum) / (n * xn2Sum - xn1Sum * xn1Sum);
        const a = (ySum - b * xn1Sum) / n;
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a + b * CommonOperators.inverse(x);
        } else if (y !== undefined) {
            x = CommonOperators.inverse((y - a) / b);
        }
        return { a, b, x, y };
    }
    private static inverseRegressionCorrelationCoefficient = (xData: number[], yData: number[]) => {
        const n = this.numberOfData(xData);
        const xn1ySum = this.xn1ySum(xData, yData);
        const xn1Sum = this.xn1Sum(xData);
        const ySum = this.ySum(yData);
        const xn2Sum = this.xn2Sum(xData);
        const y2Sum = this.y2Sum(yData);
        return (n * xn1ySum - xn1Sum * ySum) / CommonOperators.sqrt((n * xn2Sum - xn1Sum * xn1Sum) * (n * y2Sum - ySum * ySum));
    }
    // quadratic regression
    private static quadraticRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const x4Sum = this.x4Sum(xData);
        const x3Sum = this.x3Sum(xData);
        const x2Sum = this.x2Sum(xData);
        const xySum = this.xySum(xData, yData);
        const x2ySum = this.x2ySum(xData, yData);
        const xSum = this.xSum(xData);
        const ySum = this.ySum(yData);

        const sxx = x2Sum - xSum * xSum / n;
        const sxy = xySum - xSum * ySum / n;
        const sxx2 = x3Sum - xSum * x2Sum / n;
        const sx2x2 = x4Sum - x2Sum * x2Sum / n;
        const sx2y = x2ySum - x2Sum * ySum / n;

        const b = (sxy * sx2x2 - sx2y * sxx2) / (sxx * sx2x2 - sxx2 * sxx2);
        const c = (sx2y * sxx - sxy * sxx2) / (sxx * sx2x2 - sxx2 * sxx2);
        const a = (ySum - b * xSum - c * x2Sum) / n;
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        let x1 = x;
        let x2 = x;
        if (x !== undefined) {
            y = a + b * x + c * x * x;
        } else if (y !== undefined) {
            const discriminant = b * b - 4 * c * (a - y);
            if (discriminant < 0) { throw Error.MATH_ERROR; }
            const sqrtDiscriminant = CommonOperators.sqrt(discriminant);
            x1 = (-b + sqrtDiscriminant) / (2 * c);
            x2 = (-b - sqrtDiscriminant) / (2 * c);
        }
        return { a, b, c, x1, x2, y };
    }
    // ab exponential regression
    private static abExponentialRegression = (xData: number[], yData: number[], { x, y }: { x?: number, y?: number }) => {
        const n = this.numberOfData(xData);
        const xlnySum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);

        const b = CommonOperators.exp((n * xlnySum - xSum * lnySum) / (n * x2Sum - xSum * xSum));
        const a = CommonOperators.exp((lnySum - CommonOperators.ln(b) * xSum) / n);
        if (x !== undefined && y !== undefined) { throw Error.EMULATOR_ERROR; }
        if (x !== undefined) {
            y = a * CommonOperators.power(b, x);
        } else if (y !== undefined) {
            x = CommonOperators.ln(y / a) / CommonOperators.ln(b);
        }
        return { a, b, x, y };
    }
    private static abExponentialRegressionCorrelationCoefficient = (xData: number[], yData: number[]) => {
        const n = this.numberOfData(xData);
        const xlnySum = this.lnxySum(yData, xData);
        const xSum = this.xSum(xData);
        const lnySum = this.lnSum(yData);
        const x2Sum = this.x2Sum(xData);
        const lny2Sum = this.ln2Sum(yData);
        return (n * xlnySum - xSum * lnySum) / CommonOperators.sqrt((n * x2Sum - xSum * xSum) * (n * lny2Sum - lnySum * lnySum));
    }
    // 
    public static regressionA = (xData: number[], yData: number[], regressionMode: RegressionMode) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return this.linearRegression(xData, yData, {}).a;
            case RegressionMode.LOGARITHMIC: return this.logarithmicRegression(xData, yData, {}).a;
            case RegressionMode.EXPONENTIAL: return this.exponentialRegression(xData, yData, {}).a;
            case RegressionMode.POWER: return this.powerRegression(xData, yData, {}).a;
            case RegressionMode.INVERSE: return this.inverseRegression(xData, yData, {}).a;
            case RegressionMode.QUADRATIC: return this.quadraticRegression(xData, yData, {}).a;
            case RegressionMode.AB_EXPONENTIAL: return this.abExponentialRegression(xData, yData, {}).a;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static regressionB = (xData: number[], yData: number[], regressionMode: RegressionMode) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return this.linearRegression(xData, yData, {}).b;
            case RegressionMode.LOGARITHMIC: return this.logarithmicRegression(xData, yData, {}).b;
            case RegressionMode.EXPONENTIAL: return this.exponentialRegression(xData, yData, {}).b;
            case RegressionMode.POWER: return this.powerRegression(xData, yData, {}).b;
            case RegressionMode.INVERSE: return this.inverseRegression(xData, yData, {}).b;
            case RegressionMode.QUADRATIC: return this.quadraticRegression(xData, yData, {}).b;
            case RegressionMode.AB_EXPONENTIAL: return this.abExponentialRegression(xData, yData, {}).b;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static regressionC = (xData: number[], yData: number[], regressionMode: RegressionMode) => {
        if (regressionMode !== RegressionMode.QUADRATIC) { throw Error.EMULATOR_ERROR; }
        return this.quadraticRegression(xData, yData, {}).c;
    }
    public static estimatedX = (xData: number[], yData: number[], regressionMode: RegressionMode, y: number) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return this.linearRegression(xData, yData, { y }).x;
            case RegressionMode.LOGARITHMIC: return this.logarithmicRegression(xData, yData, { y }).x;
            case RegressionMode.EXPONENTIAL: return this.exponentialRegression(xData, yData, { y }).x;
            case RegressionMode.POWER: return this.powerRegression(xData, yData, { y }).x;
            case RegressionMode.INVERSE: return this.inverseRegression(xData, yData, { y }).x;
            case RegressionMode.QUADRATIC: throw Error.EMULATOR_ERROR;
            case RegressionMode.AB_EXPONENTIAL: return this.abExponentialRegression(xData, yData, { y }).x;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static estimatedX1 = (xData: number[], yData: number[], regressionMode: RegressionMode, y: number) => {
        if (regressionMode !== RegressionMode.QUADRATIC) { throw Error.EMULATOR_ERROR; }
        return this.quadraticRegression(xData, yData, { y }).x1;
    }
    public static estimatedX2 = (xData: number[], yData: number[], regressionMode: RegressionMode, y: number) => {
        if (regressionMode !== RegressionMode.QUADRATIC) { throw Error.EMULATOR_ERROR; }
        return this.quadraticRegression(xData, yData, { y }).x2;
    }
    public static estimatedY = (xData: number[], yData: number[], regressionMode: RegressionMode, x: number) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return this.linearRegression(xData, yData, { x }).y;
            case RegressionMode.LOGARITHMIC: return this.logarithmicRegression(xData, yData, { x }).y;
            case RegressionMode.EXPONENTIAL: return this.exponentialRegression(xData, yData, { x }).y;
            case RegressionMode.POWER: return this.powerRegression(xData, yData, { x }).y;
            case RegressionMode.INVERSE: return this.inverseRegression(xData, yData, { x }).y;
            case RegressionMode.QUADRATIC: return this.quadraticRegression(xData, yData, { x }).y;
            case RegressionMode.AB_EXPONENTIAL: return this.abExponentialRegression(xData, yData, { x }).y;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
    public static correlationCoefficient = (xData: number[], yData: number[], regressionMode: RegressionMode) => {
        switch (regressionMode) {
            case RegressionMode.LINEAR: return this.linearRegressionCorrelationCoefficient(xData, yData);
            case RegressionMode.LOGARITHMIC: return this.logarithmicRegressionCorrelationCoefficient(xData, yData);
            case RegressionMode.EXPONENTIAL: return this.exponentialRegressionCorrelationCoefficient(xData, yData);
            case RegressionMode.POWER: return this.powerRegressionCorrelationCoefficient(xData, yData);
            case RegressionMode.INVERSE: return this.inverseRegressionCorrelationCoefficient(xData, yData);
            case RegressionMode.QUADRATIC: throw Error.EMULATOR_ERROR;
            case RegressionMode.AB_EXPONENTIAL: return this.abExponentialRegressionCorrelationCoefficient(xData, yData);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }
}