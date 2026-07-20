import dotenv from "dotenv";

dotenv.config();

export function getAddress(envName: string, fallback: string): string {
  const value = process.env[envName]?.trim();
  return value ? value : fallback;
}

export function getUsdcAddress(): string {
  return getAddress("USDC_ADDRESS", "0x3600000000000000000000000000000000000000");
}

export function getSpenderAddress(): string {
  return getAddress(
    "SPENDER_ADDRESS",
    process.env.NFT_ADDRESS || "0x360821bC87bb545Ca8a255f607298fd5C0CE9798"
  );
}

export function getAllowanceAmount(): bigint {
  const configured = process.env.ALLOWANCE_AMOUNT?.trim();
  return configured ? BigInt(configured) : 1_000_000n;
}
