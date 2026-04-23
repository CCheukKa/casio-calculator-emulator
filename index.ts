import { Token, TokenButton, TokenSymbol } from "@lib/tokens";
import { VM } from "@lib/vm";

const vm = new VM();
const tokenMap = new Map<string, Token>();

for (const [key, value] of Object.entries(Token)) {
    if (typeof value !== "string") { continue; }
    tokenMap.set(key, value as Token);
    tokenMap.set(value, value as Token);
    tokenMap.set(key.toUpperCase(), value as Token);
    tokenMap.set(value.toUpperCase(), value as Token);

    const symbol = TokenSymbol[value as Token];
    const button = TokenButton[value as Token];
    if (symbol) {
        tokenMap.set(symbol, value as Token);
        tokenMap.set(symbol.toUpperCase(), value as Token);
    }
    if (button) {
        tokenMap.set(button, value as Token);
        tokenMap.set(button.toUpperCase(), value as Token);
    }
}

const parseProgram = (input: string | string[]) => {
    const parts = Array.isArray(input)
        ? input
        : input.split(/[\s,]+/g).map((part) => part.trim()).filter((part) => part.length > 0);

    const unknownTokens: string[] = [];
    const program: Token[] = [];

    for (const part of parts) {
        const token = tokenMap.get(part) ?? tokenMap.get(part.toUpperCase());
        if (!token) {
            unknownTokens.push(part);
            continue;
        }
        program.push(token);
    }

    return { parts, program, unknownTokens };
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
});

const htmlPath = new URL("./web/index.html", import.meta.url);

Bun.serve({
    port: 3000,
    async fetch(req: Request) {
        const url = new URL(req.url);

        if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
            const html = await Bun.file(htmlPath).text();
            return new Response(html, {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }

        if (req.method === "GET" && url.pathname === "/api/state") {
            return json({ state: vm.state });
        }

        if (req.method === "GET" && url.pathname === "/api/tokens") {
            const tokens = Object.keys(Token)
                .sort()
                .map((name) => ({
                    name,
                    symbol: TokenSymbol[Token[name as keyof typeof Token] as Token],
                    button: TokenButton[Token[name as keyof typeof Token] as Token],
                }));

            return json({
                tokens,
            });
        }

        if (req.method === "POST" && url.pathname === "/api/reset") {
            vm.state = new VM().state;
            return json({ ok: true, state: vm.state });
        }

        if (req.method === "POST" && url.pathname === "/api/execute") {
            let payload: { programText?: string; tokens?: string[] };
            try {
                payload = await req.json();
            } catch {
                return json({ ok: false, error: "Invalid JSON body." }, 400);
            }

            const source = payload.tokens ?? payload.programText ?? "";
            const { parts, program, unknownTokens } = parseProgram(source);

            if (parts.length === 0) {
                return json({ ok: false, error: "Program is empty." }, 400);
            }

            if (unknownTokens.length > 0) {
                return json({
                    ok: false,
                    error: "Unknown tokens found.",
                    unknownTokens,
                }, 400);
            }

            try {
                vm.execute(program);
                return json({
                    ok: true,
                    parsedTokens: program,
                    state: vm.state,
                });
            } catch (error) {
                return json({
                    ok: false,
                    parsedTokens: program,
                    error: String(error),
                    state: vm.state,
                }, 400);
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log("VM UI running at http://localhost:3000");