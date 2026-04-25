import { Error } from "@lib/errors";
import { CommonOperators, D } from "@lib/operations";
import { AngleMode, CalculatorMode, FrequencyMode, NumberBase, NumberDisplayMode, RegressionMode } from "@lib/modes";
import { Token, TokenSymbol } from "@lib/tokens";
import Decimal from "decimal.js";

export class State {
    public calculatorMode: CalculatorMode;
    public angleMode: AngleMode;
    public numberDisplayMode: NumberDisplayMode;
    public frequencyMode: FrequencyMode;
    public numberBase: NumberBase;
    public regressionMode: RegressionMode;
    public a: Decimal;
    public b: Decimal;
    public c: Decimal;
    public d: Decimal;
    public x: Decimal;
    public y: Decimal;
    public m: Decimal;
    public answer: Decimal;
    public shouldDisplay: boolean;
    public xData: Decimal[];
    public yData: Decimal[];

    constructor({
        calculatorMode,
        angleMode,
        numberDisplayMode,
        frequencyMode,
        numberBase,
        regressionMode,
        a,
        b,
        c,
        d,
        x,
        y,
        m,
        answer,
        shouldDisplay,
        xData,
        yData,
    }: {
        calculatorMode?: CalculatorMode,
        angleMode?: AngleMode,
        numberDisplayMode?: NumberDisplayMode,
        frequencyMode?: FrequencyMode,
        numberBase?: NumberBase,
        regressionMode?: RegressionMode,
        a?: Decimal,
        b?: Decimal,
        c?: Decimal,
        d?: Decimal,
        x?: Decimal,
        y?: Decimal,
        m?: Decimal,
        answer?: Decimal,
        shouldDisplay?: boolean,
        xData?: Decimal[],
        yData?: Decimal[],
    }) {
        this.calculatorMode = calculatorMode ?? CalculatorMode.COMPUTATION;
        this.angleMode = angleMode ?? AngleMode.DEGREE;
        this.numberDisplayMode = numberDisplayMode ?? NumberDisplayMode.NORMAL_NOTATION_1;
        this.frequencyMode = frequencyMode ?? FrequencyMode.ON;
        this.numberBase = numberBase ?? NumberBase.DECIMAL;
        this.regressionMode = regressionMode ?? RegressionMode.LINEAR;
        this.a = a ?? D(0);
        this.b = b ?? D(0);
        this.c = c ?? D(0);
        this.d = d ?? D(0);
        this.x = x ?? D(0);
        this.y = y ?? D(0);
        this.m = m ?? D(0);
        this.answer = answer ?? D(0);
        this.shouldDisplay = shouldDisplay ?? false;
        this.xData = xData ?? [];
        this.yData = yData ?? [];
    }

    public toJSON() {
        return {
            calculatorMode: this.calculatorMode,
            angleMode: this.angleMode,
            numberDisplayMode: this.numberDisplayMode,
            frequencyMode: this.frequencyMode,
            numberBase: this.numberBase,
            regressionMode: this.regressionMode,
            a: this.a,
            b: this.b,
            c: this.c,
            d: this.d,
            x: this.x,
            y: this.y,
            m: this.m,
            answer: this.answer,
            shouldDisplay: this.shouldDisplay,
            xData: this.xData,
            yData: this.yData,
        };
    }
}

type InstructionTerminator = Token.EXECUTION_DELIMITER | Token.DISPLAY | "EOF";

type BoundInstruction =
    | { kind: "literal"; value: Decimal }
    | { kind: "variable"; token: Token }
    | { kind: "unary"; operation: Token; operand: BoundInstruction }
    | { kind: "binary"; operation: Token; left: BoundInstruction; right: BoundInstruction }
    | { kind: "call"; operation: Token; operands: BoundInstruction[] };

type ParseState = {
    tokens: Token[];
    index: number;
}

export class VM {
    public state: State;
    private parseState: ParseState | undefined;

    constructor(state?: Partial<State>) {
        this.state = new State(state ?? {});
    }

    public execute(tokens: Token[]): void {
        let programCounter = 0;
        this.state.shouldDisplay = false;
        while (programCounter < tokens.length) {
            const instruction: Token[] = [];
            let terminator: InstructionTerminator = "EOF";
            while (programCounter < tokens.length) {
                const token = tokens[programCounter]!;
                if (token === Token.DISPLAY || token === Token.EXECUTION_DELIMITER) {
                    terminator = token;
                    programCounter++;
                    break;
                }
                instruction.push(token);
                programCounter++;
            }
            if (instruction.length === 0) {
                if (terminator === Token.DISPLAY || terminator === Token.EXECUTION_DELIMITER) {
                    throw Error.SYNTAX_ERROR;
                }
                continue;
            }
            this.executeInstruction(this.autoCloseParentheses(instruction), terminator);
        }
    }

    private autoCloseParentheses(instruction: Token[]): Token[] {
        const balanced = [...instruction];
        let openCount = 0;

        for (let i = 0; i < balanced.length; i++) {
            const token = balanced[i]!;

            if (this.isParentheticalFunctionToken(token)) {
                openCount++;
                continue;
            }

            if (token === Token.LEFT_PARENTHESIS) {
                const previousToken = i > 0 ? balanced[i - 1] : undefined;
                if (previousToken !== undefined && this.isParentheticalFunctionToken(previousToken)) {
                    // Parenthetical function symbols like sin( can also be followed by LEFT_PARENTHESIS.
                    // This still represents one opening level, not two.
                    continue;
                }
                openCount++;
                continue;
            }

            if (token === Token.RIGHT_PARENTHESIS && openCount > 0) {
                openCount--;
            }
        }

        while (openCount > 0) {
            balanced.push(Token.RIGHT_PARENTHESIS);
            openCount--;
        }

        return balanced;
    }

    private executeInstruction(instruction: Token[], terminator: InstructionTerminator): void {
        if (instruction.length === 0) { throw Error.EMULATOR_ERROR; }
        const boundInstruction = this.bindInstruction(instruction);
        const result = this.evaluateInstruction(boundInstruction);
        this.state.answer = result;

        if (terminator === Token.EXECUTION_DELIMITER) {
            this.state.shouldDisplay = false;
            return;
        }

        this.state.shouldDisplay = true;
    }

    private bindInstruction(instruction: Token[]): BoundInstruction {
        this.parseState = { tokens: instruction, index: 0 };
        const boundInstruction = this.parseExpression(0);
        if (!this.isAtEnd()) { throw Error.SYNTAX_ERROR; }
        this.parseState = undefined;
        return boundInstruction;
    }

    private evaluateInstruction(instruction: BoundInstruction): Decimal {
        switch (instruction.kind) {
            case "literal":
                return instruction.value;
            case "variable":
                return this.readVariable(instruction.token);
            case "unary":
                return this.evaluateUnary(instruction.operation, this.evaluateInstruction(instruction.operand));
            case "binary":
                return this.evaluateBinary(
                    instruction.operation,
                    this.evaluateInstruction(instruction.left),
                    this.evaluateInstruction(instruction.right),
                );
            case "call":
                return this.evaluateCall(instruction.operation, instruction.operands.map((operand) => this.evaluateInstruction(operand)));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private parseExpression(minPrecedence: number): BoundInstruction {
        let left = this.parsePrefix();

        while (true) {
            while (!this.isAtEnd()) {
                const nextPostfix = this.peekToken();
                const postfixPrecedence = this.getPostfixPrecedence(nextPostfix);
                if (postfixPrecedence === undefined || postfixPrecedence < minPrecedence) { break; }

                const operation = this.consumeToken()!;
                if ((operation === Token.POLAR_COMPLEX || operation === Token.RECTANGULAR_COMPLEX) && !this.isAtEnd()) {
                    throw Error.SYNTAX_ERROR;
                }
                left = { kind: "unary", operation, operand: left };
            }

            const nextToken = this.peekToken();
            const binaryOperator = this.getBinaryOperator(nextToken, left);
            if (binaryOperator === undefined) { break; }

            const { token, precedence, rightAssociative } = binaryOperator;
            if (precedence < minPrecedence) { break; }

            this.consumeToken();
            const nextMinPrecedence = rightAssociative ? precedence : precedence + 1;
            const right = this.parseExpression(nextMinPrecedence);
            if ((token === Token.POWER || token === Token.X_ROOT) && this.peekToken() === Token.RIGHT_PARENTHESIS) {
                this.consumeToken();
            }
            left = { kind: "binary", operation: token, left, right };
        }

        return left;
    }

    private parsePrefix(): BoundInstruction {
        const token = this.peekToken();
        if (token === undefined) { throw Error.SYNTAX_ERROR; }

        if (token === Token.MINUS || token === Token.NEGATIVE) {
            this.consumeToken();
            const operand = this.parseExpression(9);
            if (operand.kind === "binary" && (operand.operation === Token.POWER || operand.operation === Token.X_ROOT)) {
                throw Error.SYNTAX_ERROR;
            }
            return { kind: "unary", operation: Token.NEGATIVE, operand };
        }

        if (this.isBasePrefixToken(token)) {
            this.consumeToken();
            return { kind: "literal", value: this.parseBasePrefixedLiteral(token) };
        }

        if (token === Token.RANDOM) {
            this.consumeToken();
            return { kind: "call", operation: Token.RANDOM, operands: [] };
        }

        if (this.isFunctionToken(token)) {
            this.consumeToken();
            const hasExplicitLeftParenthesis = this.peekToken() === Token.LEFT_PARENTHESIS;
            const expectsParenthesis = hasExplicitLeftParenthesis || this.isParentheticalFunctionToken(token);

            if (hasExplicitLeftParenthesis) {
                this.consumeToken();
            }

            if (expectsParenthesis) {
                const operands: BoundInstruction[] = [];
                if (this.peekToken() !== Token.RIGHT_PARENTHESIS) {
                    while (true) {
                        operands.push(this.parseExpression(0));
                        if (this.peekToken() !== Token.COMMA) { break; }
                        this.consumeToken();
                    }
                }
                this.expectToken(Token.RIGHT_PARENTHESIS);
                return operands.length === 1
                    ? { kind: "unary", operation: token, operand: operands[0]! }
                    : { kind: "call", operation: token, operands };
            }

            return { kind: "unary", operation: token, operand: this.parseExpression(9) };
        }

        return this.parsePrimary();
    }

    private parsePrimary(): BoundInstruction {
        const token = this.consumeToken();
        if (token === undefined) { throw Error.SYNTAX_ERROR; }

        if (this.isNumberComponentToken(token)) {
            return { kind: "literal", value: this.parseNumberLiteral(token) };
        }

        if (token === Token.IMAGINARY_UNIT) {
            // Current VM execution model is scalar-only; treat i as zero for compatibility
            // with existing conversion token streams that extract real components.
            return { kind: "literal", value: D(0) };
        }

        if (token === Token.ANSWER) {
            return { kind: "literal", value: this.state.answer };
        }

        if (this.isConstantToken(token)) {
            return { kind: "literal", value: this.readConstant(token) };
        }

        if (this.isVariableToken(token)) {
            return { kind: "variable", token };
        }

        if (token === Token.LEFT_PARENTHESIS) {
            const expression = this.parseExpression(0);
            this.expectToken(Token.RIGHT_PARENTHESIS);
            return expression;
        }

        throw Error.SYNTAX_ERROR;
    }

    private evaluateUnary(operation: Token, operand: Decimal): Decimal {
        switch (operation) {
            case Token.NEGATIVE: return CommonOperators.negative(operand);
            case Token.NEGATE: return CommonOperators.negative(operand);
            case Token.DECIMAL_NUMBER:
            case Token.HEXADECIMAL_NUMBER:
            case Token.BINARY_NUMBER:
            case Token.OCTAL_NUMBER:
                // Number-base prefix symbols (d/h/b/o) are lexical prefixes.
                // Current VM evaluator treats already-parsed numeric operand as decimal.
                return operand;
            case Token.SQUARE: return CommonOperators.square(operand);
            case Token.CUBE: return CommonOperators.cube(operand);
            case Token.INVERSE: return CommonOperators.inverse(operand);
            case Token.FACTORIAL: return CommonOperators.factorial(operand);
            case Token.PERCENT: return CommonOperators.percent(operand);
            case Token.SQUARE_ROOT: return CommonOperators.sqrt(operand);
            case Token.CUBE_ROOT: return CommonOperators.cubeRoot(operand);
            case Token.SINE: return CommonOperators.sin(operand, this.state.angleMode);
            case Token.COSINE: return CommonOperators.cos(operand, this.state.angleMode);
            case Token.TANGENT: return CommonOperators.tan(operand, this.state.angleMode);
            case Token.HYPERBOLIC_SINE: return CommonOperators.sinh(operand);
            case Token.HYPERBOLIC_COSINE: return CommonOperators.cosh(operand);
            case Token.HYPERBOLIC_TANGENT: return CommonOperators.tanh(operand);
            case Token.INVERSE_SINE: return CommonOperators.asin(operand, this.state.angleMode);
            case Token.INVERSE_COSINE: return CommonOperators.acos(operand, this.state.angleMode);
            case Token.INVERSE_TANGENT: return CommonOperators.atan(operand, this.state.angleMode);
            case Token.INVERSE_HYPERBOLIC_SINE: return CommonOperators.asinh(operand);
            case Token.INVERSE_HYPERBOLIC_COSINE: return CommonOperators.acosh(operand);
            case Token.INVERSE_HYPERBOLIC_TANGENT: return CommonOperators.atanh(operand);
            case Token.LOGARITHM: return CommonOperators.log(operand);
            case Token.NATURAL_LOGARITHM: return CommonOperators.ln(operand);
            case Token.TEN_POWER: return CommonOperators.power(D(10), operand);
            case Token.E_POWER: return CommonOperators.exp(operand);
            case Token.FROM_DEGREE: return CommonOperators.fromDegree(operand, this.state.angleMode);
            case Token.FROM_RADIAN: return CommonOperators.fromRadian(operand, this.state.angleMode);
            case Token.FROM_GRADIAN: return CommonOperators.fromGradian(operand, this.state.angleMode);
            case Token.ABSOLUTE_VALUE: return CommonOperators.abs(operand);
            case Token.ARGUMENT:
                if (operand.gt(0)) { return D(0); }
                if (operand.lt(0)) {
                    switch (this.state.angleMode) {
                        case AngleMode.DEGREE: return D(180);
                        case AngleMode.RADIAN: return D(Math.PI);
                        case AngleMode.GRADIAN: return D(200);
                        default: throw Error.EMULATOR_ERROR;
                    }
                }
                throw Error.MATH_ERROR;
            case Token.CONJUGATE: return operand;
            case Token.NOT:
                if (this.state.calculatorMode === CalculatorMode.BASE) {
                    return D((~this.toBitwiseOperand(operand)).toString());
                }
                return D(operand.isZero() ? 1 : 0);
            case Token.X_ESTIMATED_VALUE:
                return this.estimateX(operand, 1);
            case Token.X1_ESTIMATED_VALUE:
                return this.estimateX(operand, 1);
            case Token.X2_ESTIMATED_VALUE:
                return this.estimateX(operand, 2);
            case Token.Y_ESTIMATED_VALUE:
                return this.estimateY(operand);
            case Token.ROUND: return CommonOperators.round(operand, this.state.numberDisplayMode);
            case Token.POLAR_COMPLEX: return operand;
            case Token.RECTANGULAR_COMPLEX: return operand;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private evaluateBinary(operation: Token, left: Decimal, right: Decimal): Decimal {
        switch (operation) {
            case Token.PLUS: return CommonOperators.add(left, right);
            case Token.MINUS: return CommonOperators.subtract(left, right);
            case Token.MULTIPLY: return CommonOperators.multiply(left, right);
            case Token.DIVIDE: return CommonOperators.divide(left, right);
            case Token.FRACTION: return CommonOperators.divide(left, right);
            case Token.POWER: return CommonOperators.power(left, right);
            case Token.X_ROOT: return CommonOperators.xRoot(left, right);
            case Token.PERMUTATION: return CommonOperators.permutation(left, right);
            case Token.COMBINATION: return CommonOperators.combination(left, right);
            case Token.ANGLE: return CommonOperators.rectangular(left, right, this.state.angleMode).x;
            case Token.EQUAL: return D(left.eq(right) ? 1 : 0);
            case Token.NOT_EQUAL: return D(!left.eq(right) ? 1 : 0);
            case Token.GREATER_THAN: return D(left.gt(right) ? 1 : 0);
            case Token.LESS_THAN: return D(left.lt(right) ? 1 : 0);
            case Token.GREATER_THAN_OR_EQUAL: return D(left.gte(right) ? 1 : 0);
            case Token.LESS_THAN_OR_EQUAL: return D(left.lte(right) ? 1 : 0);
            case Token.AND:
                if (this.state.calculatorMode === CalculatorMode.BASE) {
                    return D((this.toBitwiseOperand(left) & this.toBitwiseOperand(right)).toString());
                }
                return D(!left.isZero() && !right.isZero() ? 1 : 0);
            case Token.OR:
                if (this.state.calculatorMode === CalculatorMode.BASE) {
                    return D((this.toBitwiseOperand(left) | this.toBitwiseOperand(right)).toString());
                }
                return D(!left.isZero() || !right.isZero() ? 1 : 0);
            case Token.XOR:
                if (this.state.calculatorMode === CalculatorMode.BASE) {
                    return D((this.toBitwiseOperand(left) ^ this.toBitwiseOperand(right)).toString());
                }
                return D((!left.isZero()) !== (!right.isZero()) ? 1 : 0);
            case Token.XNOR:
                if (this.state.calculatorMode === CalculatorMode.BASE) {
                    return D((~(this.toBitwiseOperand(left) ^ this.toBitwiseOperand(right))).toString());
                }
                return D((!left.isZero()) === (!right.isZero()) ? 1 : 0);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private evaluateCall(operation: Token, operands: Decimal[]): Decimal {
        switch (operation) {
            case Token.RANDOM:
                return CommonOperators.random();
            case Token.LOGARITHM:
                if (operands.length === 1) { return CommonOperators.log(operands[0]!); }
                if (operands.length === 2) { return CommonOperators.log(operands[0]!, operands[1]!); }
                break;
            case Token.POLAR:
            case Token.POLAR_COMPLEX:
                if (operands.length === 2) {
                    return CommonOperators.polar(operands[0]!, operands[1]!, this.state.angleMode).x;
                }
                break;
            case Token.RECTANGULAR:
            case Token.RECTANGULAR_COMPLEX:
                if (operands.length === 2) {
                    return CommonOperators.rectangular(operands[0]!, operands[1]!, this.state.angleMode).x;
                }
                break;
            case Token.ABSOLUTE_VALUE:
                if (operands.length === 1) { return CommonOperators.abs(operands[0]!); }
                break;
        }
        throw Error.EMULATOR_ERROR;
    }

    private parseNumberLiteral(firstToken: Token): Decimal {
        const components: string[] = [];
        let hasExponent = false;
        let hasDecimalPoint = false;

        const appendNumberToken = (token: Token) => {
            if (token === Token.SCIENTIFIC_EXPONENTIATION) {
                if (hasExponent) { throw Error.SYNTAX_ERROR; }
                hasExponent = true;
                hasDecimalPoint = false;
                components.push("e");

                const maybeSign = this.peekToken();
                if (maybeSign === Token.PLUS || maybeSign === Token.MINUS) {
                    this.consumeToken();
                    components.push(maybeSign === Token.PLUS ? "+" : "-");
                }

                const firstExponentDigit = this.peekToken();
                if (firstExponentDigit === undefined || !this.isDigitToken(firstExponentDigit)) {
                    throw Error.SYNTAX_ERROR;
                }
                return;
            }

            if (token === Token.DECIMAL_POINT) {
                if (hasDecimalPoint) { throw Error.SYNTAX_ERROR; }
                hasDecimalPoint = true;
                components.push(".");
                return;
            }

            components.push(this.tokenToNumberComponent(token));
        };

        if (firstToken === Token.SCIENTIFIC_EXPONENTIATION) {
            components.push("1");
        }
        appendNumberToken(firstToken);

        while (!this.isAtEnd()) {
            const token = this.peekToken();
            if (token === undefined || !this.isNumberComponentToken(token)) { break; }

            // Decimal points are not allowed in the exponent section.
            if (hasExponent && token === Token.DECIMAL_POINT) { throw Error.SYNTAX_ERROR; }

            this.consumeToken();
            appendNumberToken(token);
        }

        try {
            return D(components.join(""));
        } catch {
            throw Error.SYNTAX_ERROR;
        }
    }

    private getBinaryOperator(token: Token | undefined, left: BoundInstruction): { token: Token; precedence: number; rightAssociative: boolean } | undefined {
        if (token === undefined) { return undefined; }

        if (this.isImplicitMultiplicationToken(token, left)) {
            return { token: Token.MULTIPLY, precedence: 7, rightAssociative: false };
        }

        switch (token) {
            case Token.POWER:
            case Token.X_ROOT:
                return { token, precedence: 10, rightAssociative: true };
            case Token.FRACTION:
                return { token, precedence: 9, rightAssociative: false };
            case Token.PERMUTATION:
            case Token.COMBINATION:
            case Token.ANGLE:
                return { token, precedence: 8, rightAssociative: false };
            case Token.MULTIPLY:
            case Token.DIVIDE:
                return { token, precedence: 7, rightAssociative: false };
            case Token.PLUS:
            case Token.MINUS:
                return { token, precedence: 6, rightAssociative: false };
            case Token.EQUAL:
            case Token.NOT_EQUAL:
            case Token.GREATER_THAN:
            case Token.LESS_THAN:
            case Token.GREATER_THAN_OR_EQUAL:
            case Token.LESS_THAN_OR_EQUAL:
                return { token, precedence: 5, rightAssociative: false };
            case Token.AND:
                return { token, precedence: 4, rightAssociative: false };
            case Token.OR:
            case Token.XOR:
            case Token.XNOR:
                return { token, precedence: 3, rightAssociative: false };
            default:
                return undefined;
        }
    }

    private isImplicitMultiplicationToken(token: Token, left: BoundInstruction): boolean {
        if (token === Token.SCIENTIFIC_EXPONENTIATION) { return false; }
        if (!this.isPrimaryStartToken(token)) { return false; }
        return left.kind === "literal" || left.kind === "variable" || left.kind === "unary" || left.kind === "call";
    }

    private isPrimaryStartToken(token: Token): boolean {
        return this.isNumberComponentToken(token)
            || token === Token.ANSWER
            || this.isConstantToken(token)
            || this.isVariableToken(token)
            || token === Token.IMAGINARY_UNIT
            || token === Token.LEFT_PARENTHESIS
            || this.isFunctionToken(token)
            || token === Token.RANDOM;
    }

    private isFunctionToken(token: Token): boolean {
        switch (token) {
            case Token.SINE:
            case Token.COSINE:
            case Token.TANGENT:
            case Token.HYPERBOLIC_SINE:
            case Token.HYPERBOLIC_COSINE:
            case Token.HYPERBOLIC_TANGENT:
            case Token.INVERSE_SINE:
            case Token.INVERSE_COSINE:
            case Token.INVERSE_TANGENT:
            case Token.INVERSE_HYPERBOLIC_SINE:
            case Token.INVERSE_HYPERBOLIC_COSINE:
            case Token.INVERSE_HYPERBOLIC_TANGENT:
            case Token.SQUARE_ROOT:
            case Token.CUBE_ROOT:
            case Token.LOGARITHM:
            case Token.NATURAL_LOGARITHM:
            case Token.TEN_POWER:
            case Token.E_POWER:
            case Token.DECIMAL_NUMBER:
            case Token.HEXADECIMAL_NUMBER:
            case Token.BINARY_NUMBER:
            case Token.OCTAL_NUMBER:
            case Token.FROM_DEGREE:
            case Token.FROM_RADIAN:
            case Token.FROM_GRADIAN:
            case Token.POLAR:
            case Token.POLAR_COMPLEX:
            case Token.RECTANGULAR:
            case Token.RECTANGULAR_COMPLEX:
            case Token.ABSOLUTE_VALUE:
            case Token.ARGUMENT:
            case Token.CONJUGATE:
            case Token.NOT:
            case Token.NEGATE:
            case Token.X_ESTIMATED_VALUE:
            case Token.X1_ESTIMATED_VALUE:
            case Token.X2_ESTIMATED_VALUE:
            case Token.Y_ESTIMATED_VALUE:
            case Token.ROUND:
                return true;
            default:
                return false;
        }
    }

    private isParentheticalFunctionToken(token: Token): boolean {
        if (token === Token.NOT || token === Token.NEGATE) { return true; }
        const symbol = TokenSymbol[token];
        return typeof symbol === "string" && symbol.endsWith("(");
    }

    private isPostfixOperator(token: Token | undefined): boolean {
        switch (token) {
            case Token.FACTORIAL:
            case Token.SQUARE:
            case Token.CUBE:
            case Token.INVERSE:
            case Token.PERCENT:
            case Token.X_ESTIMATED_VALUE:
            case Token.X1_ESTIMATED_VALUE:
            case Token.X2_ESTIMATED_VALUE:
            case Token.Y_ESTIMATED_VALUE:
            case Token.POLAR_COMPLEX:
            case Token.RECTANGULAR_COMPLEX:
                return true;
            default:
                return false;
        }
    }

    private isNumberComponentToken(token: Token): boolean {
        switch (token) {
            case Token.NUMBER_0:
            case Token.NUMBER_1:
            case Token.NUMBER_2:
            case Token.NUMBER_3:
            case Token.NUMBER_4:
            case Token.NUMBER_5:
            case Token.NUMBER_6:
            case Token.NUMBER_7:
            case Token.NUMBER_8:
            case Token.NUMBER_9:
            case Token.DECIMAL_POINT:
            case Token.SCIENTIFIC_EXPONENTIATION:
                return true;
            default:
                return false;
        }
    }

    private isVariableToken(token: Token): boolean {
        switch (token) {
            case Token.VARIABLE_A:
            case Token.VARIABLE_B:
            case Token.VARIABLE_C:
            case Token.VARIABLE_D:
            case Token.VARIABLE_X:
            case Token.VARIABLE_Y:
            case Token.VARIABLE_M:
                return true;
            default:
                return false;
        }
    }

    private isDigitToken(token: Token): boolean {
        switch (token) {
            case Token.NUMBER_0:
            case Token.NUMBER_1:
            case Token.NUMBER_2:
            case Token.NUMBER_3:
            case Token.NUMBER_4:
            case Token.NUMBER_5:
            case Token.NUMBER_6:
            case Token.NUMBER_7:
            case Token.NUMBER_8:
            case Token.NUMBER_9:
                return true;
            default:
                return false;
        }
    }

    private isBasePrefixToken(token: Token): boolean {
        return token === Token.DECIMAL_NUMBER
            || token === Token.HEXADECIMAL_NUMBER
            || token === Token.BINARY_NUMBER
            || token === Token.OCTAL_NUMBER;
    }

    private parseBasePrefixedLiteral(prefix: Token): Decimal {
        const base = prefix === Token.DECIMAL_NUMBER ? 10
            : prefix === Token.HEXADECIMAL_NUMBER ? 16
                : prefix === Token.BINARY_NUMBER ? 2
                    : 8;

        const digits: string[] = [];
        while (!this.isAtEnd()) {
            const token = this.peekToken();
            if (token === undefined) { break; }
            const digit = this.tokenToBaseDigit(token, base);
            if (digit === undefined) { break; }
            this.consumeToken();
            digits.push(digit);
        }

        if (digits.length === 0) { throw Error.SYNTAX_ERROR; }
        return D(parseInt(digits.join(""), base));
    }

    private tokenToBaseDigit(token: Token, base: number): string | undefined {
        if (this.isDigitToken(token)) {
            const digit = this.tokenToNumberComponent(token);
            if (Number(digit) < base) { return digit; }
            return undefined;
        }

        if (base === 16) {
            switch (token) {
                case Token.HEXADECIMAL_A: return "A";
                case Token.HEXADECIMAL_B: return "B";
                case Token.HEXADECIMAL_C: return "C";
                case Token.HEXADECIMAL_D: return "D";
                case Token.HEXADECIMAL_E: return "E";
                case Token.HEXADECIMAL_F: return "F";
                default: return undefined;
            }
        }

        return undefined;
    }

    private toBitwiseOperand(value: Decimal): bigint {
        if (!value.isInteger()) { throw Error.MATH_ERROR; }
        return BigInt(value.toFixed(0));
    }

    private isConstantToken(token: Token): boolean {
        switch (token) {
            case Token.PI:
            case Token.EULER_NUMBER:
                return true;
            default:
                return false;
        }
    }

    private readVariable(token: Token): Decimal {
        switch (token) {
            case Token.VARIABLE_A: return this.state.a;
            case Token.VARIABLE_B: return this.state.b;
            case Token.VARIABLE_C: return this.state.c;
            case Token.VARIABLE_D: return this.state.d;
            case Token.VARIABLE_X: return this.state.x;
            case Token.VARIABLE_Y: return this.state.y;
            case Token.VARIABLE_M: return this.state.m;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private readConstant(token: Token): Decimal {
        switch (token) {
            case Token.PI: return D("3.1415926535897932384626433832795028841971");
            case Token.EULER_NUMBER: return D("2.7182818284590452353602874713526624977572");
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private tokenToNumberComponent(token: Token): string {
        switch (token) {
            case Token.NUMBER_0: return "0";
            case Token.NUMBER_1: return "1";
            case Token.NUMBER_2: return "2";
            case Token.NUMBER_3: return "3";
            case Token.NUMBER_4: return "4";
            case Token.NUMBER_5: return "5";
            case Token.NUMBER_6: return "6";
            case Token.NUMBER_7: return "7";
            case Token.NUMBER_8: return "8";
            case Token.NUMBER_9: return "9";
            case Token.DECIMAL_POINT: return ".";
            case Token.SCIENTIFIC_EXPONENTIATION: return "e";
            default:
                throw Error.SYNTAX_ERROR;
        }
    }

    private peekToken(): Token | undefined {
        return this.parseState?.tokens[this.parseState.index];
    }

    private estimateY(x: Decimal): Decimal {
        const { a, b, c } = this.getRegressionCoefficients();
        const { regressionMode } = this.state;
        switch (regressionMode) {
            case RegressionMode.LINEAR:
                return a.plus(b.times(x));
            case RegressionMode.LOGARITHMIC:
                if (x.lte(0)) { throw Error.MATH_ERROR; }
                return a.plus(b.times(CommonOperators.ln(x)));
            case RegressionMode.EXPONENTIAL:
                return a.times(CommonOperators.exp(b.times(x)));
            case RegressionMode.POWER:
                if (x.lte(0)) { throw Error.MATH_ERROR; }
                return a.times(CommonOperators.power(x, b));
            case RegressionMode.INVERSE:
                if (x.isZero()) { throw Error.MATH_ERROR; }
                return a.plus(b.div(x));
            case RegressionMode.QUADRATIC:
                return a.plus(b.times(x)).plus(c.times(CommonOperators.square(x)));
            case RegressionMode.AB_EXPONENTIAL:
                return a.times(CommonOperators.power(b, x));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private estimateX(y: Decimal, rootIndex: 1 | 2): Decimal {
        const { a, b, c } = this.getRegressionCoefficients();
        const { regressionMode } = this.state;
        switch (regressionMode) {
            case RegressionMode.LINEAR:
                if (b.isZero()) { throw Error.MATH_ERROR; }
                return y.minus(a).div(b);
            case RegressionMode.LOGARITHMIC:
                if (b.isZero()) { throw Error.MATH_ERROR; }
                return CommonOperators.exp(y.minus(a).div(b));
            case RegressionMode.EXPONENTIAL:
                if (a.isZero() || b.isZero()) { throw Error.MATH_ERROR; }
                return CommonOperators.ln(y.div(a)).div(b);
            case RegressionMode.POWER:
                if (a.isZero() || b.isZero()) { throw Error.MATH_ERROR; }
                return CommonOperators.power(y.div(a), D(1).div(b));
            case RegressionMode.INVERSE:
                if (y.eq(a)) { throw Error.MATH_ERROR; }
                return b.div(y.minus(a));
            case RegressionMode.QUADRATIC: {
                const A = c;
                const B = b;
                const C = a.minus(y);
                if (A.isZero()) {
                    if (B.isZero()) { throw Error.MATH_ERROR; }
                    return C.negated().div(B);
                }
                const discriminant = B.pow(2).minus(D(4).times(A).times(C));
                if (discriminant.lt(0)) { throw Error.MATH_ERROR; }
                const sqrtDiscriminant = CommonOperators.sqrt(discriminant);
                const denominator = D(2).times(A);
                if (rootIndex === 1) {
                    return B.negated().plus(sqrtDiscriminant).div(denominator);
                }
                return B.negated().minus(sqrtDiscriminant).div(denominator);
            }
            case RegressionMode.AB_EXPONENTIAL:
                if (a.isZero() || b.lte(0) || b.eq(1)) { throw Error.MATH_ERROR; }
                return CommonOperators.ln(y.div(a)).div(CommonOperators.ln(b));
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private getRegressionCoefficients(): { a: Decimal; b: Decimal; c: Decimal } {
        const { a, b, c, regressionMode, xData, yData } = this.state;

        if (xData.length === 0 || yData.length === 0 || xData.length !== yData.length) {
            return { a, b, c };
        }

        if (regressionMode === RegressionMode.LINEAR && xData.length >= 2) {
            const n = D(xData.length);
            const sumX = xData.reduce((acc, v) => acc.plus(v), D(0));
            const sumY = yData.reduce((acc, v) => acc.plus(v), D(0));
            const sumXY = xData.reduce((acc, x, i) => acc.plus(x.times(yData[i]!)), D(0));
            const sumX2 = xData.reduce((acc, x) => acc.plus(x.times(x)), D(0));
            const denom = n.times(sumX2).minus(sumX.times(sumX));
            if (denom.isZero()) { return { a, b, c }; }
            const bCoeff = n.times(sumXY).minus(sumX.times(sumY)).div(denom);
            const aCoeff = sumY.minus(bCoeff.times(sumX)).div(n);
            return { a: aCoeff, b: bCoeff, c: D(0) };
        }

        if (regressionMode === RegressionMode.QUADRATIC && xData.length >= 3) {
            const x1 = xData[0]!; const y1 = yData[0]!;
            const x2 = xData[1]!; const y2 = yData[1]!;
            const x3 = xData[2]!; const y3 = yData[2]!;

            const det = x1.pow(2).times(x2.minus(x3))
                .plus(x2.pow(2).times(x3.minus(x1)))
                .plus(x3.pow(2).times(x1.minus(x2)));
            if (det.isZero()) { return { a, b, c }; }

            const cCoeff = y1.times(x2.minus(x3))
                .plus(y2.times(x3.minus(x1)))
                .plus(y3.times(x1.minus(x2)))
                .div(det);

            const bCoeff = y1.times(x3.pow(2).minus(x2.pow(2)))
                .plus(y2.times(x1.pow(2).minus(x3.pow(2))))
                .plus(y3.times(x2.pow(2).minus(x1.pow(2))))
                .div(det);

            const aCoeff = y1.minus(bCoeff.times(x1)).minus(cCoeff.times(x1.pow(2)));
            return { a: aCoeff, b: bCoeff, c: cCoeff };
        }

        return { a, b, c };
    }

    private getPostfixPrecedence(token: Token | undefined): number | undefined {
        switch (token) {
            case Token.FACTORIAL:
            case Token.SQUARE:
            case Token.CUBE:
            case Token.INVERSE:
            case Token.PERCENT:
            case Token.POLAR_COMPLEX:
            case Token.RECTANGULAR_COMPLEX:
                return 11;
            case Token.X_ESTIMATED_VALUE:
            case Token.X1_ESTIMATED_VALUE:
            case Token.X2_ESTIMATED_VALUE:
            case Token.Y_ESTIMATED_VALUE:
                return 8;
            default:
                return undefined;
        }
    }

    private consumeToken(): Token | undefined {
        if (this.parseState === undefined) { throw Error.EMULATOR_ERROR; }
        const token = this.parseState.tokens[this.parseState.index];
        if (token !== undefined) {
            this.parseState.index++;
        }
        return token;
    }

    private expectToken(expectedToken: Token): void {
        const token = this.consumeToken();
        if (token !== expectedToken) { throw Error.SYNTAX_ERROR; }
    }

    private isAtEnd(): boolean {
        return this.parseState === undefined || this.parseState.index >= this.parseState.tokens.length;
    }
}

/*
    The calculator performs calculations you input in accordance with the priority sequence shown below.
    - Basically, calculations are performed from left to right.
    - Calculations enclosed in parentheses are given priority.
    
    Priority sequence:
    1.
        Parenthetical Functions
            Pol(, Rec(
            sin(, cos(, tan(, sin¹(, cos1(, tan 1(, sinh(, cosh(,
            tanh(, sinh ¹(, cosh1(, tanh ¹(
            log(, In(, e^(, 10^(, √(, 3√(
            arg(, Abs(, Conjg(
            Not(, Neg(, Rnd(
    2.
        Functions Preceded by Values
            x², x³, x⁻¹, x!, °’”, °, ʳ, ᵍ
        Power, Power Root
            ^(, ˣ√(
        Percent
            %
    3.
        Fractions
            aᵇ/꜀
    4.
        Prefix Symbols
            (-) (minus sign)
            d, h, b, o (number base symbol)
    5.
        Statistical Estimated Value Calculations
        x̂, ŷ, x̂₁, x̂₂
    6.
        Permutation, Combination
            nPr, nCr
        Complex Number Symbol
            ∠
    7.
        Multiplication, Division
            ×, ÷
        Omitted Multiplication Sign
            Multiplication sign can be omitted immediately
            before π, e, variables, scientific constants (2π, 5A,
            πА, 3mₚ, 2i, etc.), and parenthetical functions
            (2√(3), Asin(30), etc.)
    8.
        Addition, Subtraction
            +,-
    9.
        Relational Operators
            =, ≠, >, <, 2, ≤
    10.
        Logical Product
            and
    11.
        Logical Sum, Exclusive Logical Sum, Exclusive Negative Logical Sum
            or, xor, xnor
    
    If a calculation contains a negative value, you may need to enclose the negative value in
    parentheses. If you want to square the value –2, for example, you need to input: (-2)².This is
    because x² is a function preceded by a value (Priority 2, above), whose priority is greater than the
    negative sign, which is a prefix symbol (Priority 4).

    Multiplication and division, and multiplication where the sign is omitted are the same priority
    (Priority 7), so these operations are performed from left to right when both types are mixed in the
    same calculation. Enclosing an operation in parentheses causes it to be performed first, so the
    use of parentheses can result in different calculation results.
*/