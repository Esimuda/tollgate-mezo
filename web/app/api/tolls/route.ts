import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { load, save } from "@/lib/store";

export async function GET() { return NextResponse.json(await load()); }

export async function POST(req: Request) {
  const b = await req.json();
  if (!/^https?:\/\//.test(b.upstream ?? "")) return NextResponse.json({ error: "upstream must be http(s) URL" }, { status: 400 });
  if (!(Number(b.priceMusd) > 0)) return NextResponse.json({ error: "price must be > 0" }, { status: 400 });
  const tolls = await load();
  const toll = {
    id: randomBytes(4).toString("hex"),
    onchainId: String(b.onchainId ?? tolls.length + 1), // set from TollCreated event after createToll tx
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
