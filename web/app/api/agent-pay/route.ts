import { NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { client, mezoTestnet, TOLLGATE, tollgateAbi } from "@/lib/mezo";

// Demo-only agent wallet for the browser console. Key comes from AGENT_PRIVATE_KEY env (never committed).
// Assumes the agent already approved MUSD to TollgateMUSD.
export async function POST(req: Request) {
  const raw = process.env.AGENT_PRIVATE_KEY?.trim();
  if (!raw) return NextResponse.json({ error: "AGENT_PRIVATE_KEY not set" }, { status: 501 });
  const { tollId, requestId, maxAmount } = await req.json();
  const wallet = createWalletClient({ account: privateKeyToAccount((raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`), chain: mezoTestnet, transport: http() });
  try {
    let hash: `0x${string}` | undefined; let last: unknown;
    for (let i = 0; i < 4 && !hash; i++) {
      try {
        const nonce = await client.getTransactionCount({ address: wallet.account.address, blockTag: "pending" });
        const gasPrice = ((await client.getGasPrice()) * 12n) / 10n;
        hash = await wallet.writeContract({ address: TOLLGATE, abi: tollgateAbi, functionName: "payCall", args: [BigInt(tollId), requestId, BigInt(maxAmount)], nonce, gasPrice });
      } catch (e) { last = e; await new Promise((r) => setTimeout(r, 2500)); }
    }
    if (!hash) throw last;
    const r = await client.waitForTransactionReceipt({ hash });
    return NextResponse.json({ txHash: hash, block: r.blockNumber.toString(), status: r.status });
  } catch (e) { return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 500 }); }
}
