import { ethers } from "hardhat";
import { getSpenderAddress, getUsdcAddress } from "./config";

async function main() {
  const [wallet] = await ethers.getSigners();

  const usdc = await ethers.getContractAt("IERC20", getUsdcAddress());
  const spender = getSpenderAddress();

  const allowance = await usdc.allowance(wallet.address, spender);

  console.log("Wallet:", wallet.address);
  console.log("USDC:", getUsdcAddress());
  console.log("Spender:", spender);
  console.log("Allowance:", allowance.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});