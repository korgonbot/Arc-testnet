import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const NFT = await ethers.getContractFactory("NFT");

  const nft = await NFT.deploy(
    process.env.USDC_ADDRESS!, // Arc USDC contract
    "ipfs://YOUR_PLACEHOLDER_CID/hidden.json",
    "ipfs://YOUR_COLLECTION_METADATA/contract.json",
    deployer.address
  );

  await nft.waitForDeployment();

  console.log("NFT deployed to:");
  console.log(await nft.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});