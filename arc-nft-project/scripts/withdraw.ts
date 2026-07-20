import { ethers } from "hardhat";

async function main() {
  const nft = await ethers.getContractAt(
    "NFT",
    "0xfD5Ad97cBf3e13d5AadBa66be6a88c0Cf5645912"
  );

  const tx = await nft.withdraw();

  console.log("Withdraw TX:", tx.hash);

  await tx.wait();

  console.log("✅ Funds withdrawn");
}

main().catch(console.error);