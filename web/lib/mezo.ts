import { createPublicClient, http, defineChain, parseAbi, parseEventLogs } from "viem";

export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.MEZO_RPC_URL ?? "https://rpc.test.mezo.org"] } },
  blockExplorers: { default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" } },
});

export const MUSD = (process.env.MUSD_ADDRESS ?? "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503") as `0x${string}`;
export const TOLLGATE = (process.env.TOLLGATE_CONTRACT ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const MOCK = process.env.TOLLGATE_MOCK_PAYMENTS === "true" || /^0x0+$/.test(TOLLGATE);

export const tollgateAbi = parseAbi([
  "function createToll(address payee, uint128 price, bytes32 endpointHash) returns (uint256)",
  "function payCall(uint256 id, bytes32 requestId, uint128 maxPrice)",
  "function isPaid(bytes32 requestId, uint256 id) view returns (bool)",
  "function receipts(bytes32) view returns (uint256 tollId, address payer, uint128 amount, uint64 paidAt)",
  "event TollCreated(uint256 indexed tollId, address indexed owner, address payee, uint128 price, bytes32 endpointHash)",
  "event CallPaid(uint256 indexed tollId, bytes32 indexed requestId, address indexed payer, uint128 amount, uint128 fee)",
]);

export const client = createPublicClient({ chain: mezoTestnet, transport: http() });

/** Verify an agent's payment for (onchainTollId, requestId) by reading the contract receipt. */
export async function verifyPayment(onchainTollId: bigint, requestId: `0x${string}`) {
  if (MOCK) return { ok: true, payer: "0xmock", amount: 0n };
  const ok = await client.readContract({ address: TOLLGATE, abi: tollgateAbi, functionName: "isPaid", args: [requestId, onchainTollId] });
  if (!ok) return { ok: false as const };
  const [, payer, amount] = await client.readContract({ address: TOLLGATE, abi: tollgateAbi, functionName: "receipts", args: [requestId] });
  return { ok: true as const, payer, amount };
}

/** Read the on-chain toll id from a createToll tx receipt (TollCreated event). */
export async function tollIdFromTx(hash: `0x${string}`): Promise<string> {
  const r = await client.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({ abi: tollgateAbi, eventName: "TollCreated", logs: r.logs.filter((l) => l.address.toLowerCase() === TOLLGATE.toLowerCase()) });
  if (!logs.length) throw new Error("no TollCreated event in tx");
  return logs[0].args.tollId.toString();
}
