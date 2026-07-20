import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xfD5Ad97cBf3e13d5AadBa66be6a88c0Cf5645912";

  const balance = await ethers.provider.getBalance(contractAddress);

  console.log("Contract Balance:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);