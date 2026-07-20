// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFT is
    ERC721A,
    Ownable,
    ERC2981,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ----------------------------------------------------
    // Errors
    // ----------------------------------------------------
    error MintClosed();
    error WrongPayment();
    error MaxSupplyExceeded();
    error WalletLimitExceeded();
    error MetadataFrozen();

    // ----------------------------------------------------
    // Collection
    // ----------------------------------------------------
    string private constant COLLECTION_NAME = "Arc Genesis";
    string private constant COLLECTION_SYMBOL = "ARCG";
    uint256 public constant MAX_SUPPLY = 2000;

    // USDC (6 decimals)
    uint256 public publicPrice = 1_000_000;
    uint256 public gtdPrice = 750_000;
    uint256 public maxPerWallet = 3;
    IERC20 public immutable usdc;

    // ----------------------------------------------------
    // Mint Flags
    // ----------------------------------------------------
    bool public publicMintOpen;
    bool public gtdMintOpen;
    bool public revealed;
    bool public metadataFrozen;

    // ----------------------------------------------------
    // Metadata
    // ----------------------------------------------------
    string private baseTokenURI;
    string public hiddenURI;
    string public contractMetadataURI;
    string public uriSuffix = ".json";

    // ----------------------------------------------------
    // Wallet Tracking
    // ----------------------------------------------------
    mapping(address => uint256) public minted;

    // ----------------------------------------------------
    // Events
    // ----------------------------------------------------
    event PublicMintUpdated(bool enabled);
    event GTDMintUpdated(bool enabled);
    event Revealed(string baseURI);
    event Withdraw(address indexed receiver, uint256 amount);

    // ----------------------------------------------------
    // Constructor
    // ----------------------------------------------------
    constructor(
        address usdcAddress,
        string memory hidden_,
        string memory contractURI_,
        address royaltyReceiver
    )
        ERC721A(COLLECTION_NAME, COLLECTION_SYMBOL)
        Ownable(msg.sender)
    {
        usdc = IERC20(usdcAddress);
        hiddenURI = hidden_;
        contractMetadataURI = contractURI_;
        _setDefaultRoyalty(
            royaltyReceiver,
            500
        );
    }

    // ----------------------------------------------------
    // Public Mint
    // ----------------------------------------------------
    function publicMint(
        uint256 quantity
    )
        external
        whenNotPaused
        nonReentrant
    {
        if (!publicMintOpen)
            revert MintClosed();
        if (quantity == 0)
            revert WrongPayment();
        if (totalSupply() + quantity > MAX_SUPPLY)
            revert MaxSupplyExceeded();
        if (minted[msg.sender] + quantity > maxPerWallet)
            revert WalletLimitExceeded();
        uint256 cost = publicPrice * quantity;
        usdc.safeTransferFrom(
            msg.sender,
            address(this),
            cost
        );
        minted[msg.sender] += quantity;
        _safeMint(
            msg.sender,
            quantity
        );
    }

    // ----------------------------------------------------
    // GTD Mint
    // (Merkle whitelist will be added later)
    // ----------------------------------------------------
    function gtdMint(
        uint256 quantity
    )
        external
        whenNotPaused
        nonReentrant
    {
        if (!gtdMintOpen)
            revert MintClosed();
        if (quantity == 0)
            revert WrongPayment();
        if (totalSupply() + quantity > MAX_SUPPLY)
            revert MaxSupplyExceeded();
        if (minted[msg.sender] + quantity > maxPerWallet)
            revert WalletLimitExceeded();
        uint256 cost = gtdPrice * quantity;
        usdc.safeTransferFrom(
            msg.sender,
            address(this),
            cost
        );
        minted[msg.sender] += quantity;
        _safeMint(
            msg.sender,
            quantity
        );
    }

    // ----------------------------------------------------
    // Team Reserve
    // ----------------------------------------------------
    function ownerMint(
        address to,
        uint256 quantity
    )
        external
        virtual
        onlyOwner
    {
        if (totalSupply() + quantity > MAX_SUPPLY)
            revert MaxSupplyExceeded();
        _safeMint(
            to,
            quantity
        );
    }

    // ----------------------------------------------------
    // Admin Controls
    // ----------------------------------------------------
    function setPublicMint(
        bool enabled
    )
        external
        onlyOwner
    {
        publicMintOpen = enabled;
        emit PublicMintUpdated(enabled);
    }

    function setGTDMint(
        bool enabled
    )
        external
        onlyOwner
    {
        gtdMintOpen = enabled;
        emit GTDMintUpdated(enabled);
    }

    function pause()
        external
        onlyOwner
    {
        _pause();
    }

    function unpause()
        external
        onlyOwner
    {
        _unpause();
    }

    // ----------------------------------------------------
    // Prices
    // ----------------------------------------------------
    function setPublicPrice(
        uint256 newPrice
    )
        external
        onlyOwner
    {
        publicPrice = newPrice;
    }

    function setGTDPrice(
        uint256 newPrice
    )
        external
        onlyOwner
    {
        gtdPrice = newPrice;
    }

    // ----------------------------------------------------
    // Wallet Limits
    // ----------------------------------------------------
    function setMaxPerWallet(
        uint256 amount
    )
        external
        onlyOwner
    {
        maxPerWallet = amount;
    }

    // ----------------------------------------------------
    // Royalty
    // ----------------------------------------------------
    function setRoyalty(
        address receiver,
        uint96 feeNumerator
    )
        external
        onlyOwner
    {
        _setDefaultRoyalty(
            receiver,
            feeNumerator
        );
    }

    function removeRoyalty()
        external
        onlyOwner
    {
        _deleteDefaultRoyalty();
    }

    // ----------------------------------------------------
    // Emergency
    // ----------------------------------------------------
    function emergencyWithdrawERC20(
        address token
    )
        public
        virtual
        onlyOwner
    {
        IERC20 erc20 = IERC20(token);
        uint256 balance = erc20.balanceOf(address(this));
        erc20.safeTransfer(
            owner(),
            balance
        );
    }

    // ----------------------------------------------------
    // Metadata
    // ----------------------------------------------------
    function reveal(
        string calldata newBaseURI
    )
        external
        onlyOwner
    {
        if (metadataFrozen)
            revert MetadataFrozen();
        revealed = true;
        baseTokenURI = newBaseURI;
        emit Revealed(newBaseURI);
    }

    function freezeMetadata()
        external
        onlyOwner
    {
        metadataFrozen = true;
    }

    function setBaseURI(
        string calldata newBaseURI
    )
        external
        onlyOwner
    {
        if (metadataFrozen)
            revert MetadataFrozen();
        baseTokenURI = newBaseURI;
    }

    function setHiddenURI(
        string calldata newHiddenURI
    )
        external
        onlyOwner
    {
        if (metadataFrozen)
            revert MetadataFrozen();
        hiddenURI = newHiddenURI;
    }

    function setContractURI(
        string calldata newContractURI
    )
        external
        onlyOwner
    {
        contractMetadataURI = newContractURI;
    }

    function setURISuffix(
        string calldata suffix
    )
        external
        onlyOwner
    {
        if (metadataFrozen)
            revert MetadataFrozen();
        uriSuffix = suffix;
    }

    function contractURI()
        external
        view
        returns (string memory)
    {
        return contractMetadataURI;
    }

    function _baseURI()
        internal
        view
        override
        returns (string memory)
    {
        return baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "URI query for nonexistent token"
        );
        if (!revealed) {
            return hiddenURI;
        }
        return string(
            abi.encodePacked(
                _baseURI(),
                _toString(tokenId),
                uriSuffix
            )
        );
    }

    // ----------------------------------------------------
    // Withdraw
    // ----------------------------------------------------
    function withdrawUSDC()
        external
        onlyOwner
    {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No USDC");
        usdc.safeTransfer(
            owner(),
            balance
        );
        emit Withdraw(
            owner(),
            balance
        );
    }

    // ----------------------------------------------------
    // View Helpers
    // ----------------------------------------------------
    function remainingSupply()
        external
        view
        returns (uint256)
    {
        return MAX_SUPPLY - totalSupply();
    }

    function walletRemainingMint(
        address wallet
    )
        external
        view
        returns (uint256)
    {
        if (minted[wallet] >= maxPerWallet) {
            return 0;
        }
        return maxPerWallet - minted[wallet];
    }

    function collectionInfo()
        external
        view
        returns (
            string memory name_,
            string memory symbol_,
            uint256 totalSupply_,
            uint256 maxSupply_,
            uint256 publicPrice_,
            uint256 gtdPrice_,
            bool publicOpen_,
            bool gtdOpen_,
            bool revealed_
        )
    {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            publicPrice,
            gtdPrice,
            publicMintOpen,
            gtdMintOpen,
            revealed
        );
    }

    // ----------------------------------------------------
    // ERC2981
    // ----------------------------------------------------
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721A,
            ERC2981
        )
        returns (bool)
    {
        return super.supportsInterface(
            interfaceId
        );
    }
}
