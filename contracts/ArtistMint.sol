//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";
//import "./ContractData.sol";
//import "./ListedToken.sol";
//import "./MarketplaceFunctions.sol";
//import "./Proposals.sol";

import "@openzeppelin/contracts/utils/Counters.sol"; // Safe and secure implementation of a counter in solidity. Can help track # of items sold in a marketplace
//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ArtistMint is ERC1155, ArtistWhiteList {
    using Counters for Counters.Counter;

    // _tokenIds variable has the most recent minted tokenId
    Counters.Counter public _tokenIds;
    ArtistMarketplace public contractCall;
    uint256 public listedPrice;
    address payable contractCreator;

    modifier onlyWhtListed() {
        uint256 num = _numbers.current();
        bool isListed = false;

        for (uint256 i = 0; i < num; i++) {
            if (msg.sender == whtList[i + 1].userAddress) {
                isListed = true;
                break;
            }
        }

        require(isListed = true, "Not white listed");
        _;
    }
    
    constructor(address payable marketplaceAddress) ERC1155("") {
        contractCall = ArtistMarketplace(marketplaceAddress);
        contractCreator = payable(msg.sender);
    }

    function tokenSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    // Main Functions

    // The first time a token is created, it is listed here
    function createToken(
        uint256 _mintAmount,
        string memory _nftName,
        string memory _creatorName, 
        address _creatorAddress,
        uint256 price, 
        string[] memory _fileNames, 
        string[] memory _fileTypes, 
        string[] memory _tokenCIDs,
        bytes memory data 
        ) public payable onlyWhtListed() returns (uint) {
        // Must mint at least 1 token
        require(_mintAmount > 0, "Mint at least 1 token");

        listedPrice = contractCall.getListPrice();
        // Require enough payment
        require(msg.value >= listedPrice * _mintAmount, "Invalid cost");

        _creatorAddress = msg.sender;

       // Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId, _mintAmount, data);

        uint256 _supplyAmount = balanceOf(msg.sender, newTokenId);

        // Approve the marketplace to transfer the tokens
        setApprovalForAll(address(contractCall), true); 
        setApprovalForAll(address(this), true);

        // Transfers NFT ownership to smart contract. If the smart contract owns the NFT, it makes it easier to transfer the NFT. => (56:05)
        safeTransferFrom(msg.sender, address(contractCall), newTokenId, _supplyAmount, data);

        contractCall.createListedToken(newTokenId, _nftName, _creatorName, _creatorAddress, price, _fileNames, _fileTypes, _tokenCIDs, _supplyAmount);
        
        // Transfer the listing fee to the marketplace creator
        payable(contractCreator).transfer(listedPrice * _mintAmount);

        return newTokenId;
        //return _tokenSupply.current();
    }
}