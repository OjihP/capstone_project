//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ListedToken.sol";
import "./ContractData.sol";
import "./ArtistWhiteList.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // Safe and secure implementation of a counter in solidity. Can help track # of items sold in a marketplace
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestStruct is ArtistWhiteList, ContractData, ERC721, Ownable {
    using Counters for Counters.Counter;
    
    constructor(string memory _name, string memory _symbol, address _artist) ERC721(_name, _symbol) {
        contractCreator = payable(msg.sender);
        artist = _artist;
        addToWhtList(_artist, "Artist"); // Add artist to the white list with a predefined name
    }

    // This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) internal idToListedToken;

    modifier onlyWhtListed() {
        require(whiteList[msg.sender].isListed == true, "User is not white listed");
        _;
    }

    function getListedFromTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    // Main Functions

    // The first time a token is created, it is listed here
    function createToken(
        uint256 _mintAmount,
        string memory _nftName, 
        uint256 price, 
        string[] memory _fileNames, 
        string[] memory _fileTypes, 
        string[] memory _tokenCIDs 
        ) public payable onlyWhtListed() returns (uint) {
        // Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Must mint at least 1 token
        require(_mintAmount > 0, "Must mint at least 1 token");

        // Require enough payment
        require(msg.value >= listPrice * _mintAmount, "Invalid cost");

        _safeMint(msg.sender, newTokenId);
        
        // Helper function to update Global variables and emit an event
        createListedToken(_mintAmount, newTokenId, _nftName, price, _fileNames, _fileTypes, _tokenCIDs);

        return newTokenId;
    }

    // Helps create the object of type ListedToken for the NFT and update the idToListedToken mapping
    function createListedToken(
        uint256 mintAmount,
        uint256 tokenId, 
        string memory _nftName, 
        uint256 price, 
        string[] memory _fileNames,
        string[] memory _fileTypes,
        string[] memory _tokenCIDs
        ) private {
        // Make sure the sender sent enough ETH to pay for listing
        require(msg.value == listPrice * mintAmount, "Please send the correct price");
        // Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        // Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            mintAmount,
            tokenId,
            _nftName,
            msg.sender,
            payable(address(this)),
            payable(msg.sender),
            price,
            _fileNames,
            _fileTypes,
            _tokenCIDs,
            true
        );

        // Transfers NFT ownership to smart contract. If the smart contract owns the NFT, it makes it easier to transfer the NFT. => (56:05)
        _transfer(msg.sender, address(this), tokenId);

        // Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            _nftName,
            msg.sender,
            address(this),
            msg.sender,
            price,
            _fileNames,
            _fileTypes,
            _tokenCIDs,
            true
        );
    }
}