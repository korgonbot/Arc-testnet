// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NotListed();
    error AlreadyListed();
    error NotSeller();
    error NotOwner();
    error WrongPrice();
    error InvalidToken();
    error NoPayment();

    IERC20 public immutable usdc;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    event ItemListed(address indexed nft, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemCanceled(address indexed nft, uint256 indexed tokenId, address indexed seller);
    event ItemBought(address indexed nft, uint256 indexed tokenId, address indexed buyer, uint256 price);

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    function listItem(address nft, uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert WrongPrice();
        if (listings[nft][tokenId].active) revert AlreadyListed();

        IERC721 erc721 = IERC721(nft);
        if (erc721.ownerOf(tokenId) != msg.sender) revert NotSeller();
        if (erc721.getApproved(tokenId) != address(this) && !erc721.isApprovedForAll(msg.sender, address(this))) revert NotOwner();

        listings[nft][tokenId] = Listing({ seller: msg.sender, price: price, active: true });
        emit ItemListed(nft, tokenId, msg.sender, price);
    }

    function cancelListing(address nft, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[nft][tokenId];
        if (!listing.active) revert NotListed();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;
        emit ItemCanceled(nft, tokenId, msg.sender);
    }

    function buyItem(address nft, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[nft][tokenId];
        if (!listing.active) revert NotListed();

        IERC721 erc721 = IERC721(nft);
        if (erc721.ownerOf(tokenId) != listing.seller) revert NotSeller();

        uint256 price = listing.price;
        if (price == 0) revert NoPayment();

        listing.active = false;
        usdc.safeTransferFrom(msg.sender, listing.seller, price);
        erc721.safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit ItemBought(nft, tokenId, msg.sender, price);
    }
}
