# Arc NFT Launchpad Studio

This project now includes a lightweight web UI for testing the Arc NFT contract features from a browser.

## Run the UI

From the project folder:

```bash
python3 -m http.server 8000 --directory ui
```

Then open:

- http://localhost:8000

## What the UI covers

- Connect wallet with MetaMask or another injected wallet
- Inspect the NFT contract state
- Approve USDC and check allowance
- Public mint and GTD mint actions
- Owner actions for toggling minting and pausing the contract

## Production-ready roadmap

The page is intentionally designed as a testing and design playground for the next upgrade steps:

1. Merkle-tree GTD whitelist
2. Per-wallet GTD allocation
3. Team reserve cap
4. USDC decimals validation
5. Batch admin tools
6. Hardhat regression tests

