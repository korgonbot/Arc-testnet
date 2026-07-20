import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Staging wallet:", signer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
