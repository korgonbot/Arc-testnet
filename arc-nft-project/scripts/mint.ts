import { ethers } from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0x360821bC87bb545Ca8a255f607298fd5C0CE9798";

  const nft = await ethers.getContractAt(
    "NFT",
    CONTRACT_ADDRESS
  );

  console.log("Minting 1 NFT...");

  const tx = await nft.publicMint(1);

  console.log("Transaction:", tx.hash);

  await tx.wait();

  console.log("✅ NFT minted successfully!");

  console.log("Total Supply:", (await nft.totalSupply()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});