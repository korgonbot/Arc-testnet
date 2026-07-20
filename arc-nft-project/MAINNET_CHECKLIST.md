# Arc mainnet launch checklist

## 1. Merkle proof audit
- Generate the whitelist root locally from a known-good list.
- Verify the root against a sample wallet and a non-whitelisted wallet.
- Store the final root and proof generation script in version control.

## 2. Validate USDC decimals
- Confirm the Arc mainnet USDC contract decimals before deployment.
- If the token uses 6 decimals, keep the pricing units aligned with the contract.
- If the token uses a different decimal count, update the deployment config before minting.

## 3. Pause / upgrade plan
- Keep a pause switch available for emergency halts.
- Prepare an upgrade path and document the owner wallet that will execute it.
- Test the pause/unpause flow on testnet before mainnet.

## 4. Treasury withdrawal guard
- Limit treasury withdrawals to owner-only execution.
- Emit explicit withdrawal events for treasury and payment flows.
- Review balances before any withdrawal action.

## 5. Staging deployment plan
- Deploy to Arc testnet with a real wallet.
- Verify minting, whitelist proof checks, and pause behavior.
- Confirm the ERC20 approval and transfer flow works end to end.
- Only then proceed to Arc mainnet.
