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
