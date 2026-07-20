import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdcAddress = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";

  console.log("Deploying whitelist NFT with:", deployer.address);
  console.log("USDC address:", usdcAddress);

  const WhitelistNFT = await ethers.getContractFactory("WhitelistNFT");
  const nft = await WhitelistNFT.deploy(
    usdcAddress,
    "ipfs://YOUR_HIDDEN_URI",
    "ipfs://YOUR_CONTRACT_URI",
    deployer.address,
    6
  );

  await nft.waitForDeployment();
  console.log("Whitelist NFT deployed to:", await nft.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
