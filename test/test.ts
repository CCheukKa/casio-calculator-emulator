import Decimal from "decimal.js";
import { expect } from "bun:test";
import { C, TARGET_PRECISION, type Complex } from "@lib/operations";
import type { Error } from "@lib/errors";

export function formatComplex(c: Complex) {
    const re = c.re.toPrecision(TARGET_PRECISION);
    const im = c.im.abs().toPrecision(TARGET_PRECISION);
    const sign = c.im.toSignificantDigits(TARGET_PRECISION).isNegative() ? "-" : "+";
    return `${re} ${sign} ${im}i`;
}

declare module "bun:test" {
    interface Matchers<T = unknown> {
        toEqualDecimal(expected: Decimal.Value): void;
        toEqualComplex(expected: Complex | Decimal.Value): void;
    }
}
expect.extend({
    toEqualDecimal(received: unknown, expected: Decimal.Value) {
        if (!Decimal.isDecimal(received)) {
            return {
                pass: false,
                message: () => `Expected a Decimal, got ${typeof received}`,
            };
        }

        const receivedSD = received.toSignificantDigits(TARGET_PRECISION);
        const expectedSD = new Decimal(expected).toSignificantDigits(TARGET_PRECISION);
        const pass = receivedSD.equals(expectedSD);
        const message = () => `Expected ${expectedSD.toPrecision(TARGET_PRECISION)}, but got ${receivedSD.toPrecision(TARGET_PRECISION)}`
        return { pass, message };
    },
    toEqualComplex(received: unknown, expected: Complex | Decimal.Value) {
        const isComplex = (val: unknown): val is Complex =>
            typeof val === "object" && val !== null && "re" in val && "im" in val
            && Decimal.isDecimal(val.re) && Decimal.isDecimal(val.im)
            ;
        const isDecimalValue = (val: unknown): val is Decimal.Value => (
            Decimal.isDecimal(val) || val instanceof Decimal
            || typeof val === "number" || typeof val === "string" || typeof expected === "bigint"
        );
        if (received === null || (!isComplex(received) && !isDecimalValue(received))) {
            return {
                pass: false,
                message: () => `Expected a Complex or Decimal, got ${typeof received}`,
            };
        }

        if (isDecimalValue(received)) {
            received = C(received);
        }

        if (isDecimalValue(expected)) {
            expected = C(expected);
        }

        const rC = received as Complex;
        const eC = expected as Complex;
        const pass =
            rC.re.toSD(TARGET_PRECISION).equals(eC.re.toSD(TARGET_PRECISION))
            && rC.im.toSD(TARGET_PRECISION).equals(eC.im.toSD(TARGET_PRECISION));
        const message = () => `Expected ${formatComplex(eC)}, but got ${formatComplex(rC)}`;
        return { pass, message };
    },
});

export const expectThrowsValue = (fn: () => unknown, expected: Error) => {
    let result;
    try {
        result = fn() as Decimal | Complex;
    } catch (error) {
        expect(error).toBe(expected);
        return;
    }
    const resultFormatted = Decimal.isDecimal(result) ? result.toPrecision(TARGET_PRECISION) : formatComplex(result);
    throw new globalThis.Error(`Expected function to throw, but it returned ${resultFormatted}`);
};