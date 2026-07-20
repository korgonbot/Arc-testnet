// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./NFT.sol";

contract WhitelistNFT is NFT {
    using MerkleProof for bytes32[];

    bytes32 public merkleRoot;
    uint256 public gtdAllocationPerWallet;
    uint256 public gtdAllocationUsed;
    uint256 public usdcDecimals;
    uint256 public teamReserveCap;
    mapping(address => uint256) public gtdMinted;

    event MerkleRootUpdated(bytes32 root);
    event GTDAllocationUpdated(uint256 allocation);
    event USDCDecimalsUpdated(uint256 decimals);
    event TeamReserveCapUpdated(uint256 cap);
    event TreasuryWithdrawal(address indexed token, address indexed recipient, uint256 amount);
    event PauseToggled(bool paused);
    event UpgradePrepared(address indexed newImplementation);

    constructor(
        address usdcAddress,
        string memory hidden_,
        string memory contractURI_,
        address royaltyReceiver,
        uint256 initialUsdcDecimals
    ) NFT(usdcAddress, hidden_, contractURI_, royaltyReceiver) {
        usdcDecimals = initialUsdcDecimals;
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
        emit MerkleRootUpdated(root);
    }

    function setGTDAllocation(uint256 allocation) external onlyOwner {
        gtdAllocationPerWallet = allocation;
        emit GTDAllocationUpdated(allocation);
    }

    function setUSDCDecimals(uint256 decimals) external onlyOwner {
        usdcDecimals = decimals;
        emit USDCDecimalsUpdated(decimals);
    }

    function setTeamReserveCap(uint256 cap) external onlyOwner {
        teamReserveCap = cap;
        emit TeamReserveCapUpdated(cap);
    }

    function setPause(bool paused) external onlyOwner {
        if (paused) {
            _pause();
        } else {
            _unpause();
        }
        emit PauseToggled(paused);
    }

    function prepareUpgrade(address newImplementation) external onlyOwner {
        emit UpgradePrepared(newImplementation);
    }

    function emergencyWithdrawERC20(address token) public override onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");
        IERC20(token).transfer(owner(), balance);
        emit TreasuryWithdrawal(token, owner(), balance);
    }

    function verifyGTD(address wallet, bytes32[] calldata proof) public view returns (bool) {
        if (merkleRoot == bytes32(0)) return false;
        bytes32 leaf = keccak256(abi.encodePacked(wallet));
        return proof.verify(merkleRoot, leaf);
    }

    function ownerMint(address to, uint256 quantity) external override onlyOwner {
        if (totalSupply() + quantity > MAX_SUPPLY - teamReserveCap) revert MaxSupplyExceeded();
        _safeMint(to, quantity);
    }

    function gtdMintWithProof(uint256 quantity, bytes32[] calldata proof) external whenNotPaused nonReentrant {
        if (!gtdMintOpen) revert MintClosed();
        if (quantity == 0) revert WrongPayment();
        if (totalSupply() + quantity > MAX_SUPPLY - teamReserveCap) revert MaxSupplyExceeded();
        if (!verifyGTD(msg.sender, proof)) revert MintClosed();
        if (gtdMinted[msg.sender] + quantity > gtdAllocationPerWallet) revert WalletLimitExceeded();
        if (minted[msg.sender] + quantity > maxPerWallet) revert WalletLimitExceeded();

        uint256 cost = gtdPrice * quantity;
        if (usdcDecimals == 6) {
            cost = gtdPrice * quantity;
        }

        require(usdc.transferFrom(msg.sender, address(this), cost), "Transfer failed");
        gtdMinted[msg.sender] += quantity;
        gtdAllocationUsed += quantity;
        minted[msg.sender] += quantity;
        _safeMint(msg.sender, quantity);
    }
}
