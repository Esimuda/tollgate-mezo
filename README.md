# Tollgate on Mezo — pay-per-request API tolls for AI agents, settled in MUSD

**Mezo Buildathon — Wave 2 entry.** A builder pastes an API URL, sets a MUSD price per call and gets a **toll link**. An AI agent hits the link → gets **HTTP 402 Payment Required** → pays the call on **Mezo testnet in MUSD** → retries with the receipt → the call is forwarded upstream. Every paid call is an on-chain receipt; the dashboard shows calls, revenue and tx links.

**Why:** Nigerian / African builders can earn from agent traffic without card subscriptions, Stripe access or FX-hostile billing — revenue lands as Bitcoin-backed MUSD in a self-custodied wallet.

## Layout
| Path | What |
|---|---|
| `contracts/src/TollgateMUSD.sol` | Toll registry + `payCall` (MUSD `transferFrom` agent → builder, optional fee ≤5%) + receipts keyed by `requestId` (replay-proof, `maxPrice` guard) |
| `contracts/test/` | Foundry tests (4 passing) |
| `contracts/script/Deploy.s.sol` | Mezo testnet deploy |
| `web/` | Next.js 15: create toll, dashboard, `/t/[id]` 402 gateway, `scripts/agent-demo.mjs` agent walkthrough |

## Mezo testnet (verified via RPC, Nov 1 2026)
- Chain ID `31611` · RPC `https://rpc.test.mezo.org` · Explorer `https://explorer.test.mezo.org` · gas = BTC (18 dec)
- MUSD `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` (symbol MUSD, **18 decimals**)
- Compiler: solc 0.8.28, `evm_version = london` (per Mezo docs)


## Live on Mezo testnet (1 Nov 2026)
- **TollgateMUSD:** [`0x449589641A2134e86aaEf5E463AD5419F273440D`](https://explorer.test.mezo.org/address/0x449589641A2134e86aaEf5E463AD5419F273440D)
- **Deploy tx:** [`0xe67538f5…`](https://explorer.test.mezo.org/tx/0xe67538f539c3f9791fe87ed3728be23608699d55bf98a2a0f199281d3b18b29e)
- Details: [`docs/DEPLOYED.md`](docs/DEPLOYED.md)

## Run locally (mock payments, no chain needed)
```bash
cd web && npm install && cp .env.example .env.local && npm run build && npm start
# create a toll in the UI, then:
TOLL_URL=http://localhost:3000/t/<id> npm run agent
```

## Deploy (Wave 2, testnet only — no real funds)
1. Get testnet BTC (Mezo faucet / `#testnet` in Mezo Discord) for a deployer and an agent wallet.
2. Agent wallet: borrow testnet MUSD at mezo.org/feature/borrow (protocol min debt ≈ 2,000 MUSD, testnet only).
3. `cd contracts && forge test && forge script script/Deploy.s.sol --rpc-url mezo_testnet --broadcast --private-key $DEPLOYER_KEY`
4. Builder calls `createToll(payee, price, keccak256(url))`; put the returned id as `onchainId` on the toll.
5. `web/.env.local`: `TOLLGATE_CONTRACT=<deployed>`, `TOLLGATE_MOCK_PAYMENTS=false`.
6. `TOLL_URL=... AGENT_KEY=<testnet key> npm run agent` → approve, `payCall`, retry → 200 + explorer link.

## Settlement: Arc/USDC (v1) vs Mezo/MUSD (this)
| | Tollgate v1 (Arc) | Tollgate on Mezo |
|---|---|---|
| Asset | USDC (6 dec), x402 `exact` EIP-3009 signature settled by a facilitator | MUSD (18 dec), Bitcoin-backed stablecoin |
| Settlement | Off-chain signed authorization → facilitator submits | Agent calls `TollgateMUSD.payCall` directly; contract pulls MUSD to builder and writes a receipt |
| Verification | Facilitator `/verify` | Gateway reads `isPaid(requestId, tollId)` on Mezo — no facilitator trust |
| Replay / price safety | Nonce in authorization | Gateway-issued `requestId` (one-shot) + agent `maxPrice` |
| Gas | USDC on Arc | BTC on Mezo |

Product logic is unchanged; only the settlement layer moved. Mezo also documents a native x402 path (`@x402/evm ≥2.10` on testnet); a facilitator-based `exact` scheme can be added alongside the receipt contract.

## Roadmap
x402 `exact` MUSD scheme via Mezo facilitator · per-agent prepaid balances (fewer txs) · naira off-ramp of MUSD revenue · usage analytics per agent.
