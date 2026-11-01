"use client";
import { useEffect, useState } from "react";

type Call = { requestId: string; txHash?: string; payer: string; amount: string; status: number; at: string };
type Toll = { id: string; name: string; upstream: string; priceMusd: string; calls: Call[] };
const card = { background: "#15151c", border: "1px solid #26262f", borderRadius: 12, padding: 20, marginBottom: 16 } as const;
const input = { background: "#0b0b0f", color: "#eee", border: "1px solid #333", borderRadius: 8, padding: 10, width: "100%", marginBottom: 10 } as const;

export default function Home() {
  const [tolls, setTolls] = useState<Toll[]>([]);
  const [f, setF] = useState({ name: "", upstream: "", priceMusd: "0.01", payee: "" });
  const [msg, setMsg] = useState("");
  const refresh = () => fetch("/api/tolls").then((r) => r.json()).then(setTolls);
  useEffect(() => { refresh(); const t = setInterval(refresh, 4000); return () => clearInterval(t); }, []);

  async function create() {
    const r = await fetch("/api/tolls", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setMsg(r.ok ? `Toll link: ${location.origin}${j.tollLink}` : j.error); refresh();
  }
  const calls = tolls.flatMap((t) => t.calls.map((c) => ({ ...c, toll: t.name })));
  const revenue = calls.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
      <h1 style={{ marginBottom: 4 }}>Tollgate <span style={{ color: "#f7931a" }}>on Mezo</span></h1>
      <p style={{ color: "#999", marginTop: 0 }}>Paste an API, set a MUSD price per call, share the toll link. AI agents pay per request — Bitcoin-backed, no card subscriptions.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[["Tolls", tolls.length], ["Paid calls", calls.length], ["Revenue", `${revenue.toFixed(4)} MUSD`]].map(([k, v]) => (
          <div key={k as string} style={card}><div style={{ color: "#888" }}>{k}</div><div style={{ fontSize: 28 }}>{v}</div></div>))}
      </div>
      <div style={card}>
        <h3>Create a toll</h3>
        <input style={input} placeholder="Name (e.g. Naija FX rates API)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input style={input} placeholder="Upstream API URL (https://...)" value={f.upstream} onChange={(e) => setF({ ...f, upstream: e.target.value })} />
        <input style={input} placeholder="Price per call (MUSD)" value={f.priceMusd} onChange={(e) => setF({ ...f, priceMusd: e.target.value })} />
        <input style={input} placeholder="Payee address on Mezo (0x...)" value={f.payee} onChange={(e) => setF({ ...f, payee: e.target.value })} />
        <button onClick={create} style={{ background: "#f7931a", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600 }}>Generate toll link</button>
        {msg && <p style={{ color: "#f7931a" }}>{msg}</p>}
      </div>
      <div style={card}>
        <h3>Receipts</h3>
        <table style={{ width: "100%", fontSize: 13 }}><thead><tr style={{ color: "#888", textAlign: "left" }}><th>Time</th><th>Toll</th><th>Payer</th><th>MUSD</th><th>Tx</th></tr></thead>
          <tbody>{calls.slice().reverse().map((c) => (<tr key={c.requestId}><td>{new Date(c.at).toLocaleTimeString()}</td><td>{c.toll}</td><td>{c.payer.slice(0, 10)}…</td><td>{c.amount}</td>
            <td>{c.txHash ? <a style={{ color: "#f7931a" }} href={`https://explorer.test.mezo.org/tx/${c.txHash}`} target="_blank">{c.txHash.slice(0, 10)}…</a> : "—"}</td></tr>))}</tbody></table>
      </div>
    </main>
  );
}
