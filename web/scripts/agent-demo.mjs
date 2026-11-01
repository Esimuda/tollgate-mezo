// Agent walkthrough: hit toll link -> 402 -> pay on Mezo testnet -> retry with X-PAYMENT.
// Usage: TOLL_URL=http://localhost:3000/t/<id> [AGENT_KEY=0x... testnet only] node scripts/agent-demo.mjs
import { createWalletClient, createPublicClient, http, defineChain, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const url = process.env.TOLL_URL;
const r1 = await fetch(url);
console.log("1) first call ->", r1.status);
const req = (await r1.json()).accepts[0];
console.log("   pay", req.maxAmountRequired, "wei MUSD to", req.payTo, "requestId", req.extra.requestId);
let txHash;
if (!req.extra.mock) {
  const chain = defineChain({ id: 31611, name: "Mezo Testnet", nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } } });
  const account = privateKeyToAccount(process.env.AGENT_KEY);
  const w = createWalletClient({ account, chain, transport: http() });
  const pc = createPublicClient({ chain, transport: http() });
  const amt = BigInt(req.maxAmountRequired);
  const a = await w.writeContract({ address: req.asset, abi: parseAbi(["function approve(address,uint256) returns (bool)"]), functionName: "approve", args: [req.payTo, amt] });
  await pc.waitForTransactionReceipt({ hash: a });
  txHash = await w.writeContract({ address: req.payTo, abi: parseAbi(["function payCall(uint256,bytes32,uint128)"]), functionName: "payCall", args: [BigInt(req.extra.tollId), req.extra.requestId, amt] });
  await pc.waitForTransactionReceipt({ hash: txHash });
  console.log("2) paid on Mezo:", `https://explorer.test.mezo.org/tx/${txHash}`);
} else console.log("2) MOCK mode — skipping on-chain payment");
const r2 = await fetch(url, { headers: { "x-payment": JSON.stringify({ requestId: req.extra.requestId, txHash }) } });
console.log("3) retry ->", r2.status, (await r2.text()).slice(0, 200));
