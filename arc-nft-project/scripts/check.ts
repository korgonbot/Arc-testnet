import { ethers } from "hardhat";

async function main() {
  const nft = await ethers.getContractAt(
    "NFT",
    "0x360821bC87bb545Ca8a255f607298fd5C0CE9798"
  );

  console.log("Name:", await nft.name());
  console.log("Symbol:", await nft.symbol());

  console.log("Owner:", await nft.owner());

  console.log("Supply:", (await nft.totalSupply()).toString());
  console.log("Max Supply:", (await nft.MAX_SUPPLY()).toString());

  console.log("Public Mint:", await nft.publicMintOpen());
  console.log("GTD Mint:", await nft.gtdMintOpen());

  console.log("Public Price:", (await nft.publicPrice()).toString());
  console.log("GTD Price:", (await nft.gtdPrice()).toString());

  console.log("Revealed:", await nft.revealed());

  console.log("USDC:", await nft.usdc());
}

main().catch(console.error);