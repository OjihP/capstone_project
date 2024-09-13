// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArtistMint is ERC1155, ArtistWhiteList, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter public _tokenIds;
    ArtistMarketplace public contractCall;
    ArtistWhiteList public artistWhiteList;
    uint256 public listedPrice;
    address payable public contractCreator;

    // Mapping to track pending refunds
    mapping(address => uint256) public pendingRefunds;

    modifier onlyWhtListed() {
        //require(artistWhiteList.isWhitelisted(msg.sender), "Not whitelisted");
        _;
    }

    constructor(address payable marketplaceAddress, address whiteListAddress) ERC1155("") {
        contractCall = ArtistMarketplace(marketplaceAddress);
        artistWhiteList = ArtistWhiteList(whiteListAddress);
        contractCreator = payable(msg.sender);
    }

    function tokenSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function mintToken(
        ArtistMarketplace.ListedToken memory tokenData,
        ArtistMarketplace.FileData memory fileData, 
        bytes memory data 
    ) public payable onlyWhtListed nonReentrant returns (uint) {
        require(tokenData.supplyAmount > 0, "Mint at least 1 token");

        listedPrice = contractCall.getListPrice();
        require(msg.value >= listedPrice * tokenData.supplyAmount, "Invalid cost");

        // Mint the token
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(msg.sender, newTokenId, tokenData.supplyAmount, data);

        // Approve and transfer tokens to the marketplace
        setApprovalForAll(address(contractCall), true);
        safeTransferFrom(msg.sender, address(contractCall), newTokenId, tokenData.supplyAmount, data);

        // Create token and file data in the marketplace
        contractCall.createListedToken(
            newTokenId, 
            tokenData.supplyAmount, 
            tokenData.nftName, 
            tokenData.artistName, 
            payable(tokenData.artistAddress),
            payable(address(contractCall)), 
            payable(tokenData.artistAddress), 
            tokenData.nftPrice, 
            true
        );

        contractCall.createListedFileData(
            newTokenId, 
            fileData.fileNames, 
            fileData.fileTypes, 
            fileData.tokenCIDs, 
            fileData.nestIDs
        );

        return newTokenId;
    }

    function restockTokens(uint256 tokenId, uint256 restockAmount, uint256 mintPrice, bytes memory data) public payable onlyWhtListed {
        require(msg.value >= mintPrice, "Invalid cost");

        // Mint the tokens for the specified amount
        _mint(msg.sender, tokenId, restockAmount, data);

        // Ensure the marketplace contract is approved to transfer the tokens
        if (msg.sender != address(contractCall) && !isApprovedForAll(msg.sender, address(contractCall))) {
            setApprovalForAll(address(contractCall), true);
        }

        // Transfer the minted tokens to the marketplace
        safeTransferFrom(msg.sender, address(contractCall), tokenId, restockAmount, data);
    }

    function burnTokens(uint256 tokenId, uint256 amount) public onlyWhtListed {
        require(balanceOf(address(contractCall), tokenId) >= amount, "Insufficient balance to burn");
        _burn(address(contractCall), tokenId, amount);
    }

    function transferRefund(uint refundAmount, address payable _recipient) public nonReentrant {
        // Ensure the contract has enough balance to refund
        require(address(this).balance >= refundAmount, "Insufficient balance in ArtistMint");

        // Record the refund amount in the pending refunds mapping
        pendingRefunds[_recipient] += refundAmount;

        require(refundAmount > 0, "No pending refund available");

        // Transfer the refund
        (bool success, ) = _recipient.call{value: refundAmount}("");
        require(success, "Refund Transfer failed");

        // Reset the refund balance before transferring to prevent reentrancy attacks
        pendingRefunds[_recipient] = 0;
    }

    receive() external payable {}
}
