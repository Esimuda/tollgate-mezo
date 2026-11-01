import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { parseUnits } from "viem";
import { load, save } from "@/lib/store";
import { MUSD, TOLLGATE, MOCK, verifyPayment, mezoTestnet } from "@/lib/mezo";

// 402 gateway: GET/POST /t/:id
// 1) no X-PAYMENT header  -> 402 with a fresh requestId + Mezo/MUSD payment instructions
// 2) X-PAYMENT: {"requestId":"0x..","txHash":"0x.."} -> verify receipt on TollgateMUSD -> forward upstream
async function handle(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tolls = await load();
  const toll = tolls.find((t) => t.id === id);
  if (!toll) return NextResponse.json({ error: "toll not found" }, { status: 404 });

  const header = req.headers.get("x-payment");
  if (!header) {
    const requestId = ("0x" + randomBytes(32).toString("hex")) as `0x${string}`;
    return NextResponse.json({
      x402Version: 1,
      error: "Payment Required",
      accepts: [{
        scheme: "tollgate-musd-receipt",
        network: `eip155:${mezoTestnet.id}`,
        asset: MUSD,
        maxAmountRequired: parseUnits(toll.priceMusd, 18).toString(),
        payTo: TOLLGATE,
        resource: new URL(req.url).pathname,
        description: `${toll.name} — ${toll.priceMusd} MUSD per call`,
        extra: { contractCall: "payCall(uint256,bytes32,uint128)", tollId: toll.onchainId, requestId, approveFirst: true, mock: MOCK },
      }],
    }, { status: 402 });
  }

  let p: { requestId: `0x${string}`; txHash?: string };
  try { p = JSON.parse(header); } catch { return NextResponse.json({ error: "bad X-PAYMENT" }, { status: 400 }); }
  if (toll.calls.some((c) => c.requestId === p.requestId)) return NextResponse.json({ error: "receipt already used" }, { status: 409 });

  const v = await verifyPayment(BigInt(toll.onchainId), p.requestId);
  if (!v.ok) return NextResponse.json({ error: "no on-chain receipt for requestId" }, { status: 402 });

  const upstream = await fetch(toll.upstream, {
    method: req.method,
    headers: { "content-type": req.headers.get("content-type") ?? "application/json" },
    body: req.method === "GET" ? undefined : await req.text(),
  });
  toll.calls.push({ requestId: p.requestId, txHash: p.txHash, payer: String(v.payer), amount: toll.priceMusd, status: upstream.status, at: new Date().toISOString() });
  await save(tolls);
  const res = new NextResponse(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" } });
  res.headers.set("x-payment-response", JSON.stringify({ requestId: p.requestId, txHash: p.txHash, network: "mezo-testnet" }));
  return res;
}
export const GET = handle;
export const POST = handle;
