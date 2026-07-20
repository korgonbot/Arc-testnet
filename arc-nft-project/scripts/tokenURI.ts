import { ethers } from "hardhat";

async function main() {
  const nft = await ethers.getContractAt(
    "NFT",
    "0xfD5Ad97cBf3e13d5AadBa66be6a88c0Cf5645912"
  );

  console.log(await nft.tokenURI(0));
}
main().catch(console.error);