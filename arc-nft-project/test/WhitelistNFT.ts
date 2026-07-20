import { expect } from "chai";
import { ethers } from "hardhat";

describe("WhitelistNFT", function () {
  it("accepts merkle-verified GTD minting with per-wallet allocation", async function () {
    const [owner, whitelisted] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const leaf = ethers.solidityPackedKeccak256(["address"], [whitelisted.address]);

    const WhitelistNFT = await ethers.getContractFactory("WhitelistNFT");
    const nft = await WhitelistNFT.deploy(await usdc.getAddress(), "ipfs://hidden", "ipfs://contract", owner.address, 6);

    await nft.setMerkleRoot(leaf);
    await nft.setGTDAllocation(2);
    await nft.setGTDMint(true);
    await nft.setPublicMint(true);

    await usdc.mint(whitelisted.address, 1_000_000n * 2n);
    await usdc.connect(whitelisted).approve(await nft.getAddress(), 10_000_000n);

    await nft.connect(whitelisted).gtdMintWithProof(2, []);

    expect(await nft.balanceOf(whitelisted.address)).to.equal(2);
    expect(await nft.gtdMinted(whitelisted.address)).to.equal(2);
  });

  it("rejects non-whitelisted GTD mint attempts", async function () {
    const [owner, nonWhitelisted] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const WhitelistNFT = await ethers.getContractFactory("WhitelistNFT");
    const nft = await WhitelistNFT.deploy(await usdc.getAddress(), "ipfs://hidden", "ipfs://contract", owner.address, 6);

    await nft.setMerkleRoot(ethers.keccak256(ethers.toUtf8Bytes("root")));
    await nft.setGTDAllocation(2);
    await nft.setGTDMint(true);

    await expect(nft.connect(nonWhitelisted).gtdMintWithProof(1, [])).to.be.revertedWithCustomError(nft, "MintClosed");
  });

  it("rejects minting above the per-wallet GTD allocation", async function () {
    const [owner, whitelisted] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const leaf = ethers.solidityPackedKeccak256(["address"], [whitelisted.address]);

    const WhitelistNFT = await ethers.getContractFactory("WhitelistNFT");
    const nft = await WhitelistNFT.deploy(await usdc.getAddress(), "ipfs://hidden", "ipfs://contract", owner.address, 6);

    await nft.setMerkleRoot(leaf);
    await nft.setGTDAllocation(1);
    await nft.setGTDMint(true);

    await usdc.mint(whitelisted.address, 1_000_000n * 3n);
    await usdc.connect(whitelisted).approve(await nft.getAddress(), 10_000_000n);

    await nft.connect(whitelisted).gtdMintWithProof(1, []);

    await expect(nft.connect(whitelisted).gtdMintWithProof(1, [])).to.be.revertedWithCustomError(nft, "WalletLimitExceeded");
  });

  it("prevents owner mint from consuming the reserved team supply", async function () {
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const WhitelistNFT = await ethers.getContractFactory("WhitelistNFT");
    const nft = await WhitelistNFT.deploy(await usdc.getAddress(), "ipfs://hidden", "ipfs://contract", owner.address, 6);

    await nft.setTeamReserveCap(100);

    await expect(nft.ownerMint(owner.address, 2000)).to.be.revertedWithCustomError(nft, "MaxSupplyExceeded");
  });
});
