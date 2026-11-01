# Mezo Testnet deployment

| Item | Value |
| --- | --- |
| Network | Mezo Testnet |
| Chain ID | `31611` |
| Contract | [`0x449589641A2134e86aaEf5E463AD5419F273440D`](https://explorer.test.mezo.org/address/0x449589641A2134e86aaEf5E463AD5419F273440D) |
| Deploy tx | [`0xe67538f539c3f9791fe87ed3728be23608699d55bf98a2a0f199281d3b18b29e`](https://explorer.test.mezo.org/tx/0xe67538f539c3f9791fe87ed3728be23608699d55bf98a2a0f199281d3b18b29e) |
| MUSD | [`0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`](https://explorer.test.mezo.org/token/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503) (18 decimals) |
| Deployer | `0x58983fdd3F4A14b931627C7Aa1BFf6A43677B8e5` |
| Agent (payer) | `0x7E6743880A7A3AbB928C9be758b504A56dBA6105` |
| Deployed | 2026-11-01 (Africa/Lagos) |

Set in `web/.env.local`:

```
TOLLGATE_CONTRACT=0x449589641A2134e86aaEf5E463AD5419F273440D
TOLLGATE_MOCK_PAYMENTS=false
NEXT_PUBLIC_MEZO_CHAIN_ID=31611
NEXT_PUBLIC_MEZO_RPC=https://rpc.test.mezo.org
NEXT_PUBLIC_MUSD=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
```

Agent still needs testnet MUSD (borrow at https://mezo.org/feature/borrow after faucet BTC).

## Live demo transactions (Mezo testnet, chain 31611)

| What | Tx |
|---|---|
| openTrove (deployer borrowed 1800 MUSD against testnet BTC) | [0x27474183…de0](https://explorer.test.mezo.org/tx/0x27474183b3f7fdba3f244c47ca6a007b04424d470684564a0b9c7f26ba517de0) |
| createToll (toll id 1, 0.05 MUSD/call, payee deployer) | [0xd95691df…d77](https://explorer.test.mezo.org/tx/0xd95691df1ecff12f23d23bdbbdd9fee445bf2be0f88dc09fa3072ccad7293d77) |
| Sample payCall by agent | [0xe03e1458…dd7](https://explorer.test.mezo.org/tx/0xe03e14586c183c3410bcf8aaedb892ee3b1ca396730cbd1e4800cbb1faecfdd7) |
| payCall filmed in demo video | [0xff4e9014…59c](https://explorer.test.mezo.org/tx/0xff4e901420af490ba9d5d2e3d5df676eae9e984eaeaf6a1fec29ff8f174bf59c), [0xfedf0c28…e21](https://explorer.test.mezo.org/tx/0xfedf0c28d3c1619432a961267cfdc6994676219265678e8e2197e0b3dfa7fe21) |

- Agent wallet `0x7E6743880A7A3AbB928C9be758b504A56dBA6105` was funded with **100 MUSD** (plus a slice of BTC for gas) by transfer from the deployer.
- Note: the Mezo faucet rate-limited the agent address (24h cooldown), so it was funded via deployer transfer instead of the faucet.
- The browser agent console (`/agent`) pays live via `/api/agent-pay`, which signs with `AGENT_PRIVATE_KEY` from the server env (demo only; never committed).
