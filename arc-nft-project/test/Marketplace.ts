import { expect } from "chai";
import { ethers } from "hardhat";

describe("Marketplace", function () {
  it("lists, buys, and cancels items", async function () {
    const [seller, buyer] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const MockNFT = await ethers.getContractFactory("MockNFT");
    const nft = await MockNFT.deploy("Mock NFT", "MNFT");

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(await usdc.getAddress());

    const price = 1_000_000n;

    await usdc.mint(seller.address, price * 2n);
    await usdc.mint(buyer.address, price * 2n);

    await nft.connect(seller).mint(seller.address, 1);
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
    await usdc.connect(buyer).approve(await marketplace.getAddress(), price);

    await marketplace.connect(seller).listItem(await nft.getAddress(), 1, price);

    const listing = await marketplace.listings(await nft.getAddress(), 1);
    expect(listing.active).to.equal(true);
    expect(listing.price).to.equal(price);

    await marketplace.connect(buyer).buyItem(await nft.getAddress(), 1);

    expect(await nft.ownerOf(1)).to.equal(buyer.address);
    expect(await usdc.balanceOf(seller.address)).to.equal(price * 3n);
    expect(await usdc.balanceOf(buyer.address)).to.equal(price * 1n);
  });

  it("cancels a listing so it can no longer be bought", async function () {
    const [seller, buyer] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const MockNFT = await ethers.getContractFactory("MockNFT");
    const nft = await MockNFT.deploy("Mock NFT", "MNFT");

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(await usdc.getAddress());

    const price = 1_000_000n;

    await usdc.mint(seller.address, price);
    await usdc.mint(buyer.address, price);

    await nft.connect(seller).mint(seller.address, 2);
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
    await usdc.connect(buyer).approve(await marketplace.getAddress(), price);

    await marketplace.connect(seller).listItem(await nft.getAddress(), 2, price);
    await marketplace.connect(seller).cancelListing(await nft.getAddress(), 2);

    await expect(marketplace.connect(buyer).buyItem(await nft.getAddress(), 2)).to.be.revertedWithCustomError(marketplace, "NotListed");
  });
});
