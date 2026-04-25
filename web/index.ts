import Decimal from "decimal.js";

import { Token, TokenButton, TokenSymbol } from "@lib/tokens";
import { VM } from "@lib/vm";

const vm = new VM();
const tokenMap = new Map<string, Token>();

type TokenDescriptor = {
    name: string;
    symbol?: string;
    button?: string;
};

const getEl = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }
    return element as T;
};

for (const [_key, value] of Object.entries(Token)) {
    if (typeof value !== "string") { continue; }
    const token = value as Token;

    const symbol = TokenSymbol[token];
    if (symbol) { tokenMap.set(symbol, token); }
}

const parseProgram = (input: string | string[]) => {
    const parts = Array.isArray(input)
        ? input
        : input.split(/[\s,]+/g).map((part) => part.trim()).filter((part) => part.length > 0);

    const unknownTokens: string[] = [];
    const program: Token[] = [];

    for (const part of parts) {
        const token = tokenMap.get(part);
        if (!token) {
            unknownTokens.push(part);
            continue;
        }
        program.push(token);
    }

    return { parts, program, unknownTokens };
};

const serializeForUI = (value: unknown): unknown => {
    if (Decimal.isDecimal(value)) {
        return value.toString();
    }

    if (Array.isArray(value)) {
        return value.map((entry) => serializeForUI(entry));
    }

    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            out[key] = serializeForUI(entry);
        }
        return out;
    }

    return value;
};

const stateForUI = () => serializeForUI(vm.state);

const statusEl = getEl<HTMLElement>("status");
const resultEl = getEl<HTMLElement>("result");
const stateEl = getEl<HTMLElement>("state");
const displayValueEl = getEl<HTMLElement>("displayValue");
const programEl = getEl<HTMLTextAreaElement>("program");
const tokenModeToggleEl = getEl<HTMLInputElement>("tokenModeToggle");
const tokenProgramEl = getEl<HTMLElement>("tokenProgram");
const keypadEl = getEl<HTMLElement>("keypad");
const tokenListEl = getEl<HTMLElement>("tokenList");
const constantsListEl = getEl<HTMLElement>("constantsList");
const constantsMenuEl = getEl<HTMLDetailsElement>("constantsMenu");
const constantsSummaryEl = getEl<HTMLElement>("constantsSummary");
const tokenFilterEl = getEl<HTMLInputElement>("tokenFilter");
const clearProgramBtn = getEl<HTMLButtonElement>("clearProgramBtn");
const popTokenBtn = getEl<HTMLButtonElement>("popTokenBtn");
const runBtn = getEl<HTMLButtonElement>("runBtn");
const peekBtn = getEl<HTMLButtonElement>("peekBtn");
const resetBtn = getEl<HTMLButtonElement>("resetBtn");

let tokens: TokenDescriptor[] = [];

const keypadLayout = [
    [
        "NUMBER_7",
        "NUMBER_8",
        "NUMBER_9",
        "DIVIDE",
        "LEFT_PARENTHESIS",
        "RIGHT_PARENTHESIS",
    ],
    [
        "NUMBER_4",
        "NUMBER_5",
        "NUMBER_6",
        "MULTIPLY",
        "SINE",
        "COSINE",
    ],
    ["NUMBER_1", "NUMBER_2", "NUMBER_3", "MINUS", "TANGENT", "PI"],
    [
        "NUMBER_0",
        "DECIMAL_POINT",
        "ANSWER",
        "PLUS",
        "LOGARITHM",
        "NATURAL_LOGARITHM",
    ],
    [
        "POWER",
        "SQUARE_ROOT",
        "SQUARE",
        "NEGATIVE",
        "EXECUTION_DELIMITER",
        "DISPLAY",
    ],
];

const setStatus = (text: string, ok: boolean) => {
    statusEl.textContent = text;
    statusEl.className = `status ${ok ? "ok" : "err"}`;
};

const formatDisplayValue = (value: unknown) => {
    if (Decimal.isDecimal(value)) {
        return value.toString();
    }

    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) {
        return String(value);
    }

    const rounded = Number(number.toPrecision(15));
    if (Object.is(rounded, -0)) {
        return "0";
    }
    return String(rounded);
};

const updateDisplay = () => {
    if (!vm.state.shouldDisplay) {
        displayValueEl.textContent = "(hidden)";
        displayValueEl.classList.add("dim");
        return;
    }

    displayValueEl.textContent = formatDisplayValue(vm.state.answer);
    displayValueEl.classList.remove("dim");
};

const renderState = () => {
    stateEl.textContent = JSON.stringify(stateForUI(), null, 2);
    updateDisplay();
};

const renderTokenProgram = () => {
    const { parts, program, unknownTokens } = parseProgram(programEl.value);
    if (parts.length === 0) {
        tokenProgramEl.textContent = "(empty program)";
        return;
    }

    const unknownSet = new Set(unknownTokens);
    const rendered = parts.map((part) => {
        const resolved = tokenMap.get(part);
        if (resolved) {
            return resolved;
        }
        if (unknownSet.has(part)) {
            return `UNKNOWN(${part})`;
        }
        return part;
    });

    tokenProgramEl.textContent = rendered.join(" ");
    if (program.length === 0 && unknownTokens.length > 0) {
        tokenProgramEl.textContent += "\n\nNo executable tokens found.";
    }
};

const syncTokenModeView = () => {
    const enabled = tokenModeToggleEl.checked;
    tokenProgramEl.classList.toggle("hidden", !enabled);
    if (enabled) {
        renderTokenProgram();
    }
};

const appendToken = (tokenDisplay: string) => {
    const current = programEl.value.trim();
    programEl.value = current.length === 0
        ? tokenDisplay
        : `${current} ${tokenDisplay}`;
    renderTokenProgram();
    programEl.focus();
};

const popToken = () => {
    const parts = programEl.value
        .split(/[\s,]+/g)
        .map((part) => part.trim())
        .filter(Boolean);
    parts.pop();
    programEl.value = parts.join(" ");
    renderTokenProgram();
    programEl.focus();
};

const createChip = (token: TokenDescriptor) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "token-chip";
    chip.innerHTML = `<span class="symbol">${token.symbol || "?"}</span><span class="name">${token.name}</span>`;
    chip.title = `${token.name} (${token.symbol || "?"})`;
    chip.addEventListener("click", () => appendToken(token.symbol || token.name));
    return chip;
};

const renderTokens = () => {
    const q = tokenFilterEl.value.trim().toUpperCase();
    const filtered = q
        ? tokens.filter(
            (t) =>
                t.name.includes(q)
                || (t.symbol || "").toUpperCase().includes(q)
                || (t.button || "").toUpperCase().includes(q),
        )
        : tokens;

    const regularTokens = filtered.filter((t) => t.button !== "CONST");
    const constantTokens = filtered.filter((t) => t.button === "CONST");

    tokenListEl.innerHTML = "";
    constantsListEl.innerHTML = "";

    for (const token of regularTokens) {
        tokenListEl.appendChild(createChip(token));
    }

    for (const token of constantTokens) {
        constantsListEl.appendChild(createChip(token));
    }

    constantsSummaryEl.textContent = `Constants (${constantTokens.length})`;
    if (q.length > 0 && constantTokens.length > 0) {
        constantsMenuEl.open = true;
    }

    if (regularTokens.length === 0) {
        tokenListEl.textContent = "No matching tokens.";
    }

    if (constantTokens.length === 0) {
        constantsListEl.textContent = "No matching constants.";
    }
};

const renderKeypad = () => {
    const byName = new Map(tokens.map((t) => [t.name, t]));
    keypadEl.innerHTML = "";

    for (const row of keypadLayout) {
        for (const tokenName of row) {
            const token = byName.get(tokenName);
            if (!token) {
                continue;
            }

            const key = document.createElement("button");
            key.type = "button";
            key.className = "key";
            if (tokenName === "EXECUTION_DELIMITER" || tokenName === "DISPLAY") {
                key.classList.add("accent");
            }
            if (tokenName === "NEGATIVE") {
                key.classList.add("warn");
            }
            key.innerHTML = `<span class="key-top">${token.symbol || "?"}</span><span class="key-bottom">${token.name}</span>`;
            key.title = `${token.name} (${token.symbol || "?"})`;
            key.addEventListener("click", () => appendToken(token.symbol || token.name));
            keypadEl.appendChild(key);
        }
    }
};

const loadTokens = () => {
    tokens = Object.keys(Token)
        .sort()
        .map((name) => {
            const token = Token[name as keyof typeof Token] as Token;
            return {
                name,
                symbol: TokenSymbol[token],
                button: TokenButton[token],
            } satisfies TokenDescriptor;
        });
};

const runProgram = () => {
    setStatus("Executing...", true);
    const { parts, program, unknownTokens } = parseProgram(programEl.value);

    if (parts.length === 0) {
        const body = { ok: false, error: "Program is empty." };
        resultEl.textContent = JSON.stringify(body, null, 2);
        setStatus("Execution failed.", false);
        return;
    }

    if (unknownTokens.length > 0) {
        const body = { ok: false, error: "Unknown tokens found.", unknownTokens };
        resultEl.textContent = JSON.stringify(body, null, 2);
        setStatus("Execution failed.", false);
        return;
    }

    try {
        vm.execute(program);
        const body = {
            ok: true,
            parsedTokens: program,
            state: stateForUI(),
        };
        resultEl.textContent = JSON.stringify(body, null, 2);
        renderState();
        setStatus("Execution complete.", true);
    } catch (error) {
        const body = {
            ok: false,
            parsedTokens: program,
            error: String(error),
            state: stateForUI(),
        };
        resultEl.textContent = JSON.stringify(body, null, 2);
        renderState();
        setStatus("Execution failed.", false);
    }
};

const resetVm = () => {
    vm.state = new VM().state;
    resultEl.textContent = JSON.stringify({ ok: true, state: stateForUI() }, null, 2);
    renderState();
    setStatus("VM reset.", true);
};

runBtn.addEventListener("click", runProgram);
peekBtn.addEventListener("click", () => {
    renderState();
    setStatus("State refreshed.", true);
});
resetBtn.addEventListener("click", resetVm);

tokenFilterEl.addEventListener("input", renderTokens);
clearProgramBtn.addEventListener("click", () => {
    programEl.value = "";
    renderTokenProgram();
    programEl.focus();
});
popTokenBtn.addEventListener("click", popToken);
programEl.addEventListener("input", renderTokenProgram);
tokenModeToggleEl.addEventListener("change", syncTokenModeView);

loadTokens();
renderTokens();
renderKeypad();
renderState();
syncTokenModeView();
setStatus("Ready.", true);
