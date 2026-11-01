# Mezo Testnet Deploy (Wave 2, Nov 2)

| | |
|---|---|
| Chain ID | 31611 |
| RPC | https://rpc.test.mezo.org (`mezo_testnet` in `contracts/foundry.toml`) |
| Explorer | https://explorer.test.mezo.org |
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` (18 decimals) |

## Addresses to fund (no private keys here, ever)
- Deployer: `0x58983fdd3F4A14b931627C7Aa1BFf6A43677B8e5` (needs testnet BTC for gas)
- Agent: `0x7E6743880A7A3AbB928C9be758b504A56dBA6105` (needs BTC for gas + MUSD to pay tolls)

## Steps
1. **BTC:** request testnet BTC for both addresses at https://faucet.test.mezo.org/
2. **MUSD:** borrow at https://mezo.org/feature/borrow with BTC as collateral (minimum debt is about 2000 MUSD). Send some MUSD to the agent address.
3. **Deploy:**
   ```bash
   cd contracts
   export DEPLOYER_KEY=...   # local shell only, never commit
   # optional: FEE_RECIPIENT=0x... FEE_BPS=0
   forge script script/Deploy.s.sol --rpc-url mezo_testnet --broadcast --private-key $DEPLOYER_KEY
   ```
   Copy the `TollgateMUSD:` address from the log.
4. **Wire the web app** (`web/.env.local`):
   ```
   TOLLGATE_CONTRACT=0x<deployed address>
   TOLLGATE_MOCK_PAYMENTS=false
   ```
5. **Create a toll on-chain:** call `createToll(payee, price, endpointHash)`, then POST `/api/tolls` with `createTxHash` (the server reads `tollId` from the `TollCreated` event) or with an explicit `onchainId`. In live mode a request with neither is rejected, so tolls cannot get a guessed ID.
6. **Agent run:** run `web/scripts/agent-demo.mjs` with the agent key in env. It does approve MUSD → `payCall` → retry, then gets a 200. Put the explorer tx links in the demo.
