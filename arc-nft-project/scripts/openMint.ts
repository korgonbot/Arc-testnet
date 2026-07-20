import { ethers } from "hardhat";

async function main() {
  const nft = await ethers.getContractAt(
    "NFT",
    "0x360821bC87bb545Ca8a255f607298fd5C0CE9798"
  );

  const tx = await nft.setPublicMint(true);
  await tx.wait();

  console.log("✅ Public mint enabled");
}

main().catch(console.error);