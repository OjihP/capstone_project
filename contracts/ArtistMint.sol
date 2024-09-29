// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArtistMint is ERC1155, ArtistWhiteList, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private tokenCounter;
    ArtistMarketplace private artistMarketplace;
    ArtistWhiteList private artistWhiteList;
    uint256 private listedPrice;

    // Mapping to track pending refunds
    mapping(address => uint256) private pendingRefunds;

    constructor(address payable marketplaceAddress, address whiteListAddress) ERC1155("") {
        artistMarketplace = ArtistMarketplace(marketplaceAddress);
        artistWhiteList = ArtistWhiteList(whiteListAddress);
    }

    function getCurrentTokenCounter() external view returns (uint256) {
        return tokenCounter.current();
    }

    function mintNFT(
        ArtistMarketplace.ListedToken memory tokenData,
        ArtistMarketplace.FileData memory fileData, 
        bytes memory data 
    ) external payable onlyWhtListed nonReentrant returns (uint) {
        require(tokenData.supplyAmount > 0, "Mint at least 1 token");

        listedPrice = artistMarketplace.getListPrice();
        require(msg.value >= listedPrice * tokenData.supplyAmount, "Invalid cost");

        // Mint the token
        tokenCounter.increment();
        uint256 newTokenId = tokenCounter.current();
        _mint(msg.sender, newTokenId, tokenData.supplyAmount, data);

        // Approve and transfer tokens to the marketplace
        setApprovalForAll(address(artistMarketplace), true);
        safeTransferFrom(msg.sender, address(artistMarketplace), newTokenId, tokenData.supplyAmount, data);

        // List token and file data in the marketplace
        artistMarketplace.createListedToken(
            newTokenId, 
            tokenData.supplyAmount, 
            tokenData.nftName, 
            tokenData.artistName, 
            payable(tokenData.artistAddress),
            payable(address(artistMarketplace)), 
            payable(tokenData.artistAddress), 
            tokenData.nftPrice, 
            true
        );

        artistMarketplace.createListedFileData(
            newTokenId, 
            fileData.fileNames, 
            fileData.fileTypes, 
            fileData.tokenCIDs, 
            fileData.nestIDs
        );

        return newTokenId;
    }

    // Mint tokens for NFTs already created
    function mintTokens(uint256 tokenId, uint256 restockAmount, uint256 mintPrice, bytes memory data) external payable onlyWhtListed {
        require(msg.value >= mintPrice, "Invalid cost");

        // Mint the tokens for the specified amount
        _mint(msg.sender, tokenId, restockAmount, data);

        // Ensure the marketplace contract is approved to transfer the tokens
        if (msg.sender != address(artistMarketplace) && !isApprovedForAll(msg.sender, address(artistMarketplace))) {
            setApprovalForAll(address(artistMarketplace), true);
        }

        // Transfer the minted tokens to the marketplace
        safeTransferFrom(msg.sender, address(artistMarketplace), tokenId, restockAmount, data);
    }

    function burnTokens(uint256 tokenId, uint256 amount) external onlyWhtListed {
        require(balanceOf(address(artistMarketplace), tokenId) >= amount, "Insufficient balance to burn");
        _burn(address(artistMarketplace), tokenId, amount);
    }

    function transferRefund(uint refundAmount, address payable recipient) external nonReentrant {
        // Ensure the contract has enough balance to refund
        require(address(this).balance >= refundAmount, "Insufficient balance in ArtistMint");

        // Record the refund amount in the pending refunds mapping
        pendingRefunds[recipient] += refundAmount;

        require(refundAmount > 0, "No pending refund available");

        // Transfer the refund
        (bool success, ) = recipient.call{value: refundAmount}("");
        require(success, "Refund Transfer failed");

        // Reset the refund balance before transferring to prevent reentrancy attacks
        pendingRefunds[recipient] = 0;
    }

    receive() external payable {}
}