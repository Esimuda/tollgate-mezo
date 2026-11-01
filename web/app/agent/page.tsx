"use client";
import { useState } from "react";
// Browser agent console: same flow as scripts/agent-demo.mjs (402 -> pay -> retry with X-PAYMENT).
export default function Agent() {
  const [url, setUrl] = useState(""); const [log, setLog] = useState<string[]>([]);
  const add = (s: string) => setLog((l) => [...l, s]);
  async function run() {
    setLog([]); add(`> GET ${url}`);
    const r1 = await fetch(url); const j = await r1.json();
    add(`< HTTP ${r1.status} ${j.error ?? ""}`); const a = j.accepts[0];
    add(`  scheme=${a.scheme} network=${a.network}`); add(`  asset MUSD ${a.asset}`);
    add(`  amount ${a.maxAmountRequired} wei (${a.description})`); add(`  requestId ${a.extra.requestId.slice(0, 18)}…`);
    await new Promise((r) => setTimeout(r, 1200));
    add(a.extra.mock ? "> approve + payCall(tollId, requestId, maxPrice) — MOCK mode (testnet deploy pending)" : "> payCall on Mezo testnet");
    await new Promise((r) => setTimeout(r, 1200));
    add(`> retry with X-PAYMENT receipt`);
    const r2 = await fetch(url, { headers: { "x-payment": JSON.stringify({ requestId: a.extra.requestId }) } });
    add(`< HTTP ${r2.status} x-payment-response: ${r2.headers.get("x-payment-response")?.slice(0, 60)}…`); add(`  body ${await r2.text()}`);
  }
  return (<main style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
    <h1>AI agent console <span style={{ color: "#f7931a" }}>→ Tollgate</span></h1>
    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="toll link" style={{ width: "75%", padding: 10, background: "#0b0b0f", color: "#eee", border: "1px solid #333", borderRadius: 8 }} />
    <button onClick={run} style={{ marginLeft: 8, background: "#f7931a", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600 }}>Run agent</button>
    <pre style={{ background: "#0b0b0f", border: "1px solid #26262f", borderRadius: 12, padding: 16, marginTop: 16, minHeight: 300, whiteSpace: "pre-wrap", fontSize: 14 }}>{log.join("\n")}</pre>
  </main>);
}
