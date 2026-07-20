import { ethers } from "hardhat";

async function main() {
  const [wallet] = await ethers.getSigners();

  const usdc = await ethers.getContractAt(
    "IERC20",
    "0x3600000000000000000000000000000000000000"
  );

  console.log("Wallet:", wallet.address);

  console.log(
    "USDC:",
    (await usdc.balanceOf(wallet.address)).toString()
  );
}

main().catch(console.error);