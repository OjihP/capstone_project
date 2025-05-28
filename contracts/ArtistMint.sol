// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./NFTListing.sol";
import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtistMint is ERC1155, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private tokenCounter;
    NFTListing private nftListing;
    ArtistMarketplace private artistMarketplace;
    ArtistWhiteList private whiteList;
    uint256 private listedPrice;
    address private contractCreator;

    struct MintParams {
        NFTListing.ListedToken tokenData;
        NFTListing.FileData fileData;
    }

    // Mapping to track pending refunds
    mapping(address => uint256) private pendingRefunds;

    constructor(address _whtListAddress, address nftListingAddress, address payable marketplaceAddress) ERC1155("") {
        nftListing = NFTListing(nftListingAddress);
        artistMarketplace = ArtistMarketplace(marketplaceAddress);
        whiteList = ArtistWhiteList(_whtListAddress);
        contractCreator = artistMarketplace.getCreatorAddress();
    }

    modifier onlyWhtListed(address caller) {
        bool chkWhtList = whiteList.isWhitelisted(caller);
        require(chkWhtList == true, "Unauthorized User(MINT)");
        _;
    }

    modifier authorizedPersonnel(address caller) {
        require(caller == contractCreator || whiteList.isWhitelisted(caller) == true, "Unauthorized User(MINT1)");
        _;
    }

    function getCurrentTokenCounter() external view returns (uint256) {
        return tokenCounter.current();
    }

    function incrementTokenCounter() public {
        tokenCounter.increment();
    }

    function decrementTokenCounter() public {
        tokenCounter.decrement();
    }

    function getMarketTokenBalance(uint256 _tokenId) external view returns (uint256) {
        return balanceOf(address(artistMarketplace), _tokenId);
    }

    function mintNFT(MintParams memory params, address caller) external payable nonReentrant onlyWhtListed (caller) returns (uint) {
        require(params.tokenData.supplyAmount > 0, "Mint at least 1 token");

        listedPrice = artistMarketplace.getListPrice();
        require(msg.value >= listedPrice * params.tokenData.supplyAmount, "Invalid cost");

        // Mint the token
        tokenCounter.increment();
        uint256 newTokenId = tokenCounter.current();
        _mint(msg.sender, newTokenId, params.tokenData.supplyAmount, "");

        // Approve and transfer tokens to the marketplace
        setApprovalForAll(address(artistMarketplace), true);
        safeTransferFrom(msg.sender, address(artistMarketplace), newTokenId, params.tokenData.supplyAmount, "");

        // List token and file data in the marketplace
        nftListing.createListedToken(
            newTokenId, 
            balanceOf(address(artistMarketplace), newTokenId), 
            params.tokenData.nftName, 
            params.tokenData.artistName, 
            payable(params.tokenData.artistAddress),
            payable(address(artistMarketplace)), 
            payable(params.tokenData.artistAddress), 
            params.tokenData.nftPrice, 
            true
        );

        nftListing.createListedFileData(
            newTokenId, 
            params.fileData.fileNames, 
            params.fileData.fileTypes, 
            params.fileData.tokenCIDs, 
            params.fileData.nestIDs
        );

        return newTokenId;
    }

    // Mint tokens for NFTs already created
    function mintTokens(uint256 tokenId, uint256 restockAmount, uint256 mintPrice, bytes memory data, address caller) external payable onlyWhtListed (caller) {
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

    function burnTokens(uint256 tokenId, uint256 amount, address caller) external authorizedPersonnel (caller) {
        require(balanceOf(address(artistMarketplace), tokenId) >= amount, "Insufficient balance to burn");
        _burn(address(artistMarketplace), tokenId, amount);
    }

    function transferRefund(uint refundAmount, address payable recipient, address caller) external nonReentrant authorizedPersonnel (caller) {
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