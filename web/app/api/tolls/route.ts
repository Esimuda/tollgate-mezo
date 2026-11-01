import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { load, save } from "@/lib/store";
import { MOCK, tollIdFromTx } from "@/lib/mezo";

export async function GET() { return NextResponse.json(await load()); }

export async function POST(req: Request) {
  const b = await req.json();
  if (!/^https?:\/\//.test(b.upstream ?? "")) return NextResponse.json({ error: "upstream must be http(s) URL" }, { status: 400 });
  if (!(Number(b.priceMusd) > 0)) return NextResponse.json({ error: "price must be > 0" }, { status: 400 });
  const tolls = await load();
  let onchainId: string;
  if (b.onchainId != null) onchainId = String(b.onchainId);
  else if (/^0x[0-9a-fA-F]{64}$/.test(b.createTxHash ?? "")) {
    try { onchainId = await tollIdFromTx(b.createTxHash); } catch (e) { return NextResponse.json({ error: String(e) }, { status: 400 }); }
  } else if (MOCK) onchainId = String(tolls.length + 1);
  else return NextResponse.json({ error: "onchainId or createTxHash required in live mode" }, { status: 400 });
  const toll = {
    id: randomBytes(4).toString("hex"),
    onchainId, // from createTxHash (TollCreated event), explicit onchainId, or mock counter
    name: b.name || "Untitled API",
    upstream: b.upstream,
    priceMusd: String(b.priceMusd),
    payee: b.payee || "",
    createdAt: new Date().toISOString(),
    calls: [],
  };
  tolls.push(toll); await save(tolls);
  return NextResponse.json({ ...toll, tollLink: `/t/${toll.id}` }, { status: 201 });
}
