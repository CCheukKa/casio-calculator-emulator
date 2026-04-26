# Casio fx-50FH II Specifications
Manual seems to be unavailable, so specifications are based on the fx-50F PLUS and fx-3650P II manuals.  

## Mode 3: Base-N Calculations
In Base-N mode, you can perform calculations in binary, octal, decimal, or hexadecimal.  
- Inputting a digit outside the current number base causes an error. For example, if you input 2 in binary mode, you will get a Syntax ERROR.
- In the BASE Mode, input of fractional (decimal) values and exponential values is not supported. Anything to the right of the decimal point of calculation results is cut off.

### Effective Calculation Range
- Binary
  - Positive: 0 ≤ x ≤ 11111111
  - Negative: 1000000000 ≤ x ≤ 1111111111
- Octal
  - Positive: 0 ≤ x ≤3777777777
  - Negative: 4000000000 ≤ x ≤ 7777777777
- Decimal
  - Positive: 0 ≤ x ≤ 2147483647
  - Negative: -2147483648 ≤ x ≤ 2147483647
- Hexadecimal
  - Positive: 0 ≤ x ≤ 7FFFFFFF
  - Negative: 80000000 ≤ x ≤ FFFFFFFF

A  Math ERROR occurs when a calculation result is outside of the applicable range for the
current default number base.

### Operations
- Not: Returns the complement (bitwise inversion) of a value.  
- Neg: Returns the two's complement of a value.  


## Calculation Priority Sequence
The calculator performs calculations you input in accordance with the priority sequence shown below.  
- Basically, calculations are performed from left to right.  
- Calculations enclosed in parentheses are given priority.  

### 1
#### Parenthetical Functions
Pol(, Rec(  
sin(, cos(, tan(, sin⁻¹(, cos⁻¹(, tan⁻¹(, sinh(, cosh(, tanh(, sinh⁻¹(, cosh⁻¹(, tanh⁻¹(  
log(, ln(, e^(, 10^(, √(, ∛(  
arg(, Abs(, Conjg(  
Not(, Neg(, Rnd(
### 2
#### Functions Preceded by Values
x², x³, x⁻¹, x!, °’”, °, ʳ, ᵍ  
#### Power, Power Root
^(, ˣ√(  
#### Percent
%  
### 3
#### Fractions
aᵇ/꜀  
### 4
#### Prefix Symbols
(-) (minus sign)  
d, h, b, o (number base symbol)  
### 5
#### Statistical Estimated Value Calculations
x̂, ŷ, x̂₁, x̂₂  
### 6
#### Permutation, Combination
nPr, nCr  
#### Complex Number Symbol
∠  
### 7
#### Multiplication, Division
×, ÷  
#### Omitted Multiplication Sign
Multiplication sign can be omitted immediately before π, e, variables, scientific constants (2π, 5A, πА, 3mₚ, 2i, etc.), and parenthetical functions (2√(3), Asin(30), etc.)  
### 8
#### Addition, Subtraction
+, -  
### 9
#### Relational Operators
=, ≠, <, >, ≤, ≥  
### 10
#### Logical Product
and  
### 11
#### Logical Sum, Exclusive Logical Sum, Exclusive Negative Logical Sum
or, xor, xnor  

### Note
- If a calculation contains a negative value, you may need to enclose the negative value in parentheses. If you want to square the value –2, for example, you need to input: (-2)².This is because x² is a function preceded by a value (Priority 2, above), whose priority is greater than the negative sign, which is a prefix symbol (Priority 4).  
- Multiplication and division, and multiplication where the sign is omitted are the same priority (Priority 7), so these operations are performed from left to right when both types are mixed in the same calculation. Enclosing an operation in parentheses causes it to be performed first, so the use of parentheses can result in different calculation results.  
- For implicit multiplication, an expression like 12 ÷ 2A is treated as 12 ÷ (2 × A).