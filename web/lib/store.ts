import { promises as fs } from "fs";
import path from "path";

export type Call = { requestId: string; txHash?: string; payer: string; amount: string; status: number; at: string };
export type Toll = { id: string; onchainId: string; name: string; upstream: string; priceMusd: string; payee: string; createdAt: string; calls: Call[] };

const FILE = path.join(process.cwd(), "data", "tolls.json");
export async function load(): Promise<Toll[]> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return []; }
}
export async function save(t: Toll[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(t, null, 2));
}
