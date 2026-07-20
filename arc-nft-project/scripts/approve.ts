import { ethers } from "hardhat";
import { getAllowanceAmount, getSpenderAddress, getUsdcAddress } from "./config";

async function main() {
  const [wallet] = await ethers.getSigners();

  const usdc = await ethers.getContractAt("IERC20", getUsdcAddress());
  const spender = getSpenderAddress();
  const amount = getAllowanceAmount();

  console.log("Approving from:", wallet.address);
  console.log("USDC:", getUsdcAddress());
  console.log("Spender:", spender);
  console.log("Amount:", amount.toString());

  const tx = await usdc.approve(spender, amount);

  await tx.wait();

  console.log("Approved!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});