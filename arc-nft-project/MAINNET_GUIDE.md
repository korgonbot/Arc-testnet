# Mainnet launch guide

This guide covers the full flow for running the NFT + marketplace setup on mainnet, from preparing metadata to minting, listing, buying, and operating the contracts safely.

## 1. Understand the pieces

You are working with three main parts:

- NFT contract: handles minting, royalty settings, metadata, pause/unpause, and withdrawals.
- Whitelist NFT contract: adds merkle-proof-based GTD minting, allocation caps, and reserve protections.
- Marketplace contract: lets sellers list NFTs and buyers purchase them using USDC.

The contracts are designed for a launchpad-style flow, but they should be treated as production contracts only after a careful review and a testnet rehearsal.

## 2. Prepare your metadata on IPFS

NFT metadata is typically stored on IPFS, which is a decentralized storage network. The usual workflow is:

1. Create a folder with:
   - a collection contract metadata file, for example `contract.json`
   - a hidden metadata file, for example `hidden.json`
   - token metadata files, for example `1.json`, `2.json`, and so on
2. Upload those files to IPFS with a service such as Pinata, nft.storage, or your own IPFS node.
3. Keep the resulting CID (content identifier) or folder CID.

A typical setup looks like this:

- `ipfs://YOUR_COLLECTION_CID/contract.json`
- `ipfs://YOUR_HIDDEN_CID/hidden.json`
- `ipfs://YOUR_BASE_CID/1.json`

For the NFT contract, the deployment scripts currently accept a hidden URI and a contract URI. The actual token URI is built from the base URI that you later reveal.

### Example metadata shape

`contract.json`:

```json
{
  "name": "Arc Genesis",
  "description": "Arc NFT collection",
  "image": "ipfs://YOUR_IMAGE_CID/cover.png",
  "external_link": "https://your-site.com"
}
```

`hidden.json`:

```json
{
  "name": "Hidden",
  "description": "Metadata is hidden until reveal"
}
```

`1.json`:

```json
{
  "name": "Arc #1",
  "description": "First Arc NFT",
  "image": "ipfs://YOUR_IMAGE_CID/1.png"
}
```

## 3. Configure your environment

Copy the example environment file and fill in the real values:

```bash
cp .env.example .env
```

Set the following values in `.env`:

- `RPC_URL`: your mainnet RPC endpoint
- `PRIVATE_KEY`: the wallet private key that will deploy and manage the contracts
- `USDC_ADDRESS`: the mainnet USDC contract address
- `SPENDER_ADDRESS`: the contract address that should receive USDC approvals for the action you want to perform
- `NFT_ADDRESS`: your deployed NFT contract address once deployed
- `ALLOWANCE_AMOUNT`: the USDC allowance amount you want to approve

Important:

- Never commit your private key or `.env` file to GitHub.
- Use a dedicated wallet for deployment and operations if possible.
- Make sure the USDC address is correct for the chain you are deploying on.

## 4. Deploy the NFT contract

The repository includes deployment scripts for the base NFT contract and the whitelist-enabled variant.

### Deploy the base NFT

```bash
cd arc-nft-project
npx hardhat run scripts/deploy-nft.ts --network arcTestnet
```

For mainnet, you will want to add a matching mainnet network entry to the Hardhat config and then run the same command with your mainnet network name.

### Deploy the whitelist NFT

```bash
npx hardhat run scripts/deploy-whitelist-nft.ts --network arcTestnet
```

This variant uses merkle proofs for GTD minting and supports reserve-cap protections.

### Deploy the marketplace

```bash
npx hardhat run scripts/deploy-marketplace.ts --network arcTestnet
```

The marketplace contract needs the USDC address at deployment time.

## 5. Turn minting on after deployment

Minting is not automatically open just because the contract is deployed. After deployment you need to enable it.

### Open public mint

```bash
npx hardhat run scripts/openMint.ts --network arcTestnet
```

That script calls the public mint toggle. For a more explicit manual flow, you can also call the contract method directly.

### Enable GTD minting

If you are using the whitelist contract, you also need to:

1. Set the merkle root with `setMerkleRoot(...)`
2. Set the GTD wallet allocation with `setGTDAllocation(...)`
3. Enable GTD minting

## 6. Approve USDC before minting

Minting requires the buyer wallet to approve USDC for the NFT contract.

```bash
npx hardhat run scripts/approve.ts --network arcTestnet
```

You can verify the allowance with:

```bash
npx hardhat run scripts/allowance.ts --network arcTestnet
```

If you are using the marketplace, approve the marketplace contract instead of the NFT contract for the relevant flow.

## 7. Mint NFTs

### Public mint

The base contract supports `publicMint(quantity)`.

You can use the included script as a starting point, or create a new script that calls the contract with the quantity you want.

### GTD/whitelist mint

For whitelist minting, the buyer must provide a valid merkle proof that matches the merkle root stored on-chain.

Recommended order:

1. Generate the merkle tree from the allowed wallet addresses
2. Store the root on-chain
3. Share the proof with each whitelisted wallet
4. Have each wallet call the GTD mint function with their proof

## 8. Reveal metadata when you are ready

If you want the metadata to remain hidden until launch day, keep the contract in hidden mode at first. When you are ready, reveal the base URI:

```solidity
reveal("ipfs://YOUR_BASE_CID/")
```

That makes token URIs resolve to the real metadata. If you want to lock the metadata permanently, call `freezeMetadata()` after reveal.

## 9. List NFTs on the marketplace

To list an NFT on the marketplace:

1. The NFT owner must approve the marketplace contract for that token
2. The owner calls `listItem(nft, tokenId, price)`
3. The listing becomes active for purchase

The marketplace uses USDC for payments, so the buyer must have approved the marketplace contract for the correct amount.

### Buy flow

1. Buyer approves USDC for the marketplace contract
2. Buyer calls `buyItem(nft, tokenId)`
3. USDC is transferred to the seller and the NFT is transferred to the buyer

### Cancel flow

The seller can cancel the listing with `cancelListing(nft, tokenId)`.

## 10. Admin and operational controls

The contracts include safety controls that you should understand before going live:

- `pause()` / `unpause()` to pause minting or transfers in an emergency
- `setPublicMint(true/false)` to enable or disable public mint
- `setGTDMint(true/false)` to enable or disable whitelist minting
- `setMerkleRoot(...)` for whitelist setup
- `setGTDAllocation(...)` to control per-wallet allocation
- `setTeamReserveCap(...)` to protect team reserve supply
- `withdrawUSDC()` to withdraw collected USDC
- `emergencyWithdrawERC20(...)` to recover tokens if needed

## 11. How the admin should run launch day

On launch day, the admin should use a simple checklist and only change one thing at a time.

### A. Before the public launch

1. Confirm the deployed NFT address and marketplace address.
2. Confirm the correct USDC address for the chain.
3. Confirm the metadata has been uploaded to IPFS and the reveal URI is correct.
4. Set the merkle root if whitelist minting is part of the launch.
5. Set the GTD allocation per wallet.
6. Set the team reserve cap so the reserve remains protected.
7. Turn on the desired minting mode only once everything is verified.

### B. Launch-day controls

The admin should be ready to do these actions from a control panel or from a small admin script:

- Enable public mint
- Enable GTD minting if using whitelist
- Pause the contract immediately if anything looks wrong
- Reveal metadata once the launch begins
- Freeze metadata after the reveal if you want the metadata to stay fixed
- Withdraw USDC after the sale is finished, if that is part of your plan

### C. What the frontend should include

Your existing frontend is a good base for an admin dashboard. The most useful additions are:

- Wallet connection status and current chain
- A section to paste a whitelist and generate a merkle root
- A section to set GTD allocation and USDC decimals
- A section to enable or disable public mint and GTD mint
- A section to pause or unpause the contract
- A section to reveal metadata and freeze it after reveal
- A section to show current supply, remaining supply, and mint status
- A section to view the marketplace address and whether an NFT is approved for listing

### D. Recommended frontend layout

Use your current page as follows:

- Hero panel: wallet, chain, current status
- First panel: whitelist + merkle root generation
- Second panel: admin controls for mint toggles, pause, reveal, and freeze
- Third panel: marketplace actions such as approve, list, cancel, and buy
- Fourth panel: launch metrics such as sold supply, remaining supply, and treasury balance

That gives the admin a single launch-day screen instead of jumping between multiple tools.

## 12. Mainnet launch checklist

Before you launch on mainnet, verify the following:

- The chain and USDC address are correct
- The wallet is the intended owner/admin
- The metadata CID and hidden URI are correct
- The merkle root is correct for the whitelist addresses
- The GTD allocation cap is set appropriately
- The public mint and GTD mint toggles are enabled only when you are ready
- The marketplace is approved properly for the NFT contract
- You have tested the full flow on testnet first
- You have a pause plan and a recovery plan ready

## 12. Recommended order of operations

1. Upload metadata to IPFS
2. Configure `.env`
3. Deploy the NFT contract
4. Deploy the marketplace contract
5. Approve USDC for minting
6. Enable minting
7. Mint a few test NFTs
8. List a test NFT
9. Buy a listed NFT
10. Reveal metadata and freeze it when ready
11. Open the public launch

If you want to keep the launch safe, the best pattern is to rehearse the whole flow on testnet first, then repeat the same steps on mainnet with the real addresses and real funds.
