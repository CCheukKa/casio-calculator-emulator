import { Token } from "./lib/tokens";
import { VM } from "./lib/vm";

const program = [
    Token.NUMBER_1,
    Token.PLUS,
    Token.NUMBER_2,
    Token.MULTIPLY,
    Token.NUMBER_3,
    Token.EXECUTION_DELIMITER,
    Token.EXECUTION_DELIMITER,
];

const vm = new VM();
vm.execute(program);
console.log(vm.state);