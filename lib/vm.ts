import { Error } from "./errors";
import { CommonOperators } from "./operations";
import { AngleMode, CalculatorMode, FrequencyMode, NumberBase, NumberDisplayMode, RegressionMode } from "./modes";
import { Token } from "./tokens";

class State {
    public calculatorMode: CalculatorMode;
    public angleMode: AngleMode;
    public numberDisplayMode: NumberDisplayMode;
    public frequencyMode: FrequencyMode;
    public numberBase: NumberBase;
    public regressionMode: RegressionMode;
    public a: number;
    public b: number;
    public c: number;
    public d: number;
    public x: number;
    public y: number;
    public m: number;
    public answer: number;
    public shouldDisplay: boolean;
    public xData: number[];
    public yData: number[];

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
        a?: number,
        b?: number,
        c?: number,
        d?: number,
        x?: number,
        y?: number,
        m?: number,
        answer?: number,
        shouldDisplay?: boolean,
        xData?: number[],
        yData?: number[],
    }) {
        this.calculatorMode = calculatorMode ?? CalculatorMode.COMPUTATION;
        this.angleMode = angleMode ?? AngleMode.DEGREE;
        this.numberDisplayMode = numberDisplayMode ?? NumberDisplayMode.NORMAL_NOTATION_1;
        this.frequencyMode = frequencyMode ?? FrequencyMode.ON;
        this.numberBase = numberBase ?? NumberBase.DECIMAL;
        this.regressionMode = regressionMode ?? RegressionMode.LINEAR;
        this.a = a ?? 0;
        this.b = b ?? 0;
        this.c = c ?? 0;
        this.d = d ?? 0;
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.m = m ?? 0;
        this.answer = answer ?? 0;
        this.shouldDisplay = shouldDisplay ?? false;
        this.xData = xData ?? [];
        this.yData = yData ?? [];
    }
}

type InstructionTerminator = Token.EXECUTION_DELIMITER | Token.DISPLAY | "EOF";

type BoundInstruction =
    | { kind: "literal"; value: number }
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

    constructor() {
        this.state = new State({});
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
            this.executeInstruction(instruction, terminator);
        }
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

    private evaluateInstruction(instruction: BoundInstruction): number {
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
            while (!this.isAtEnd() && this.isPostfixOperator(this.peekToken())) {
                const operation = this.consumeToken()!;
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
            left = { kind: "binary", operation: token, left, right };
        }

        return left;
    }

    private parsePrefix(): BoundInstruction {
        const token = this.peekToken();
        if (token === undefined) { throw Error.SYNTAX_ERROR; }

        if (token === Token.MINUS || token === Token.NEGATIVE) {
            this.consumeToken();
            return { kind: "unary", operation: Token.NEGATIVE, operand: this.parseExpression(9) };
        }

        if (token === Token.RANDOM) {
            this.consumeToken();
            return { kind: "call", operation: Token.RANDOM, operands: [] };
        }

        if (this.isFunctionToken(token)) {
            this.consumeToken();
            if (this.peekToken() === Token.LEFT_PARENTHESIS) {
                this.consumeToken();
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

    private evaluateUnary(operation: Token, operand: number): number {
        switch (operation) {
            case Token.NEGATIVE: return CommonOperators.negative(operand);
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
            case Token.HYPERBOLIC_SINE: return CommonOperators.sinh(operand, this.state.angleMode);
            case Token.HYPERBOLIC_COSINE: return CommonOperators.cosh(operand, this.state.angleMode);
            case Token.HYPERBOLIC_TANGENT: return CommonOperators.tanh(operand, this.state.angleMode);
            case Token.INVERSE_SINE: return CommonOperators.asin(operand, this.state.angleMode);
            case Token.INVERSE_COSINE: return CommonOperators.acos(operand, this.state.angleMode);
            case Token.INVERSE_TANGENT: return CommonOperators.atan(operand, this.state.angleMode);
            case Token.INVERSE_HYPERBOLIC_SINE: return CommonOperators.asinh(operand, this.state.angleMode);
            case Token.INVERSE_HYPERBOLIC_COSINE: return CommonOperators.acosh(operand, this.state.angleMode);
            case Token.INVERSE_HYPERBOLIC_TANGENT: return CommonOperators.atanh(operand, this.state.angleMode);
            case Token.LOGARITHM: return CommonOperators.log(operand);
            case Token.NATURAL_LOGARITHM: return CommonOperators.ln(operand);
            case Token.FROM_DEGREE: return CommonOperators.fromDegree(operand, this.state.angleMode);
            case Token.FROM_RADIAN: return CommonOperators.fromRadian(operand, this.state.angleMode);
            case Token.FROM_GRADIAN: return CommonOperators.fromGradian(operand, this.state.angleMode);
            case Token.ABSOLUTE_VALUE: return CommonOperators.abs(operand);
            case Token.ROUND: return CommonOperators.round(operand, this.state.numberDisplayMode);
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private evaluateBinary(operation: Token, left: number, right: number): number {
        switch (operation) {
            case Token.PLUS: return CommonOperators.add(left, right);
            case Token.MINUS: return CommonOperators.subtract(left, right);
            case Token.MULTIPLY: return CommonOperators.multiply(left, right);
            case Token.DIVIDE: return CommonOperators.divide(left, right);
            case Token.POWER: return CommonOperators.power(left, right);
            case Token.SCIENTIFIC_EXPONENTIATION: return CommonOperators.sciExp(left, right);
            case Token.PERMUTATION: return CommonOperators.permutation(left, right);
            case Token.COMBINATION: return CommonOperators.combination(left, right);
            case Token.EQUAL: return left === right ? 1 : 0;
            case Token.NOT_EQUAL: return left !== right ? 1 : 0;
            case Token.GREATER_THAN: return left > right ? 1 : 0;
            case Token.LESS_THAN: return left < right ? 1 : 0;
            case Token.GREATER_THAN_OR_EQUAL: return left >= right ? 1 : 0;
            case Token.LESS_THAN_OR_EQUAL: return left <= right ? 1 : 0;
            case Token.AND: return left && right ? 1 : 0;
            case Token.OR: return left || right ? 1 : 0;
            case Token.XOR: return Boolean(left) !== Boolean(right) ? 1 : 0;
            case Token.XNOR: return Boolean(left) === Boolean(right) ? 1 : 0;
            default:
                throw Error.EMULATOR_ERROR;
        }
    }

    private evaluateCall(operation: Token, operands: number[]): number {
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

    private parseNumberLiteral(firstToken: Token): number {
        const components: string[] = [this.tokenToNumberComponent(firstToken)];
        while (!this.isAtEnd()) {
            const token = this.peekToken();
            if (token === undefined || !this.isNumberComponentToken(token)) { break; }
            components.push(this.tokenToNumberComponent(this.consumeToken()!));
        }
        const value = Number(components.join(""));
        if (Number.isNaN(value)) { throw Error.SYNTAX_ERROR; }
        return value;
    }

    private getBinaryOperator(token: Token | undefined, left: BoundInstruction): { token: Token; precedence: number; rightAssociative: boolean } | undefined {
        if (token === undefined) { return undefined; }

        if (this.isImplicitMultiplicationToken(token, left)) {
            return { token: Token.MULTIPLY, precedence: 7, rightAssociative: false };
        }

        switch (token) {
            case Token.POWER:
                return { token, precedence: 8, rightAssociative: true };
            case Token.MULTIPLY:
            case Token.DIVIDE:
            case Token.SCIENTIFIC_EXPONENTIATION:
            case Token.PERMUTATION:
            case Token.COMBINATION:
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
        if (!this.isPrimaryStartToken(token)) { return false; }
        return left.kind === "literal" || left.kind === "variable" || left.kind === "unary" || left.kind === "call";
    }

    private isPrimaryStartToken(token: Token): boolean {
        return this.isNumberComponentToken(token)
            || token === Token.ANSWER
            || this.isConstantToken(token)
            || this.isVariableToken(token)
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
            case Token.FROM_DEGREE:
            case Token.FROM_RADIAN:
            case Token.FROM_GRADIAN:
            case Token.POLAR:
            case Token.POLAR_COMPLEX:
            case Token.RECTANGULAR:
            case Token.RECTANGULAR_COMPLEX:
            case Token.PERMUTATION:
            case Token.COMBINATION:
            case Token.ABSOLUTE_VALUE:
            case Token.ROUND:
                return true;
            default:
                return false;
        }
    }

    private isPostfixOperator(token: Token | undefined): boolean {
        switch (token) {
            case Token.FACTORIAL:
            case Token.SQUARE:
            case Token.CUBE:
            case Token.INVERSE:
            case Token.PERCENT:
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

    private isConstantToken(token: Token): boolean {
        switch (token) {
            case Token.PI:
            case Token.EULER_NUMBER:
                return true;
            default:
                return false;
        }
    }

    private readVariable(token: Token): number {
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

    private readConstant(token: Token): number {
        switch (token) {
            case Token.PI: return Math.PI;
            case Token.EULER_NUMBER: return Math.E;
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