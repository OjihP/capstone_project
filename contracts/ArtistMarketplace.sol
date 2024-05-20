//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

//import "./ArtistWhiteList.sol";
//import "./ContractData.sol";
//import "./ListedToken.sol";
import "./MarketplaceFunctions.sol";
import "./Proposals.sol";

import "hardhat/console.sol";
//import "@openzeppelin/contracts/utils/Counters.sol"; // Safe and secure implementation of a counter in solidity. Can help track # of items sold in a marketplace
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtistMarketplace is MarketplaceFunctions, Proposals, ERC721 {
    using Counters for Counters.Counter;
    
    constructor(string memory _name, string memory _symbol, address _artist) ERC721(_name, _symbol) {
        contractCreator = payable(msg.sender);
        artist = _artist;
        //addToWhtList(_artist, "Artist"); // Add artist to the white list with a predefined name
    }

    // This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    //mapping(uint256 => ListedToken) internal idToListedToken;

    modifier onlyWhtListed() {
        require(whiteList[msg.sender].isListed == true, "User is not white listed");
        _;
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
    
    // This will return all the NFTs currently listed to be sold on the marketplace
    /*function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        uint currentId;
        // at the moment currentlyListed is true for all, if it becomes false in the future we will 
        // filter out currentlyListed == false over here
        for(uint i = 0; i < nftCount; i++)
        {
            currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }
        // the array 'tokens' has the list of all NFTs in the marketplace
        return tokens;
    }*/
    
    // Returns all the tokenIds that the current user has
    function getMyIds(address _owner) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        uint256 currentId;
        uint256 currentIndex;
   
        for(uint i = 0; i < ownerTokenCount; i++)
        {
            currentId = i + 1;
            tokenIds[currentIndex] = idToListedToken[currentId].tokenId;
            currentIndex += 1;
        }
        /*uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;
        // Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for(uint i = 0; i < totalItemCount; i++)
        {
            if(idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender){
                itemCount += 1;
            }
        }

        // Once you have the count of relevant NFTs, create an array then store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender) {
                currentId = i + 1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;*/
        return tokenIds;
    }

    // the function that executes the sale on the marketplace
    function executeSale(uint256 tokenId, uint256 purchaseAmount) public payable {
        uint _mintAmount = idToListedToken[tokenId].mintAmount;
        uint price = idToListedToken[tokenId].priceOfNFT;
        address seller = idToListedToken[tokenId].sellerAddress;
        require(msg.value == price * purchaseAmount, "Please submit the asking price in order to complete the purchase");

        // Ensure _mintAmount is greater than 0 before decrementing
        require(_mintAmount >= purchaseAmount, "No remaining tokens to sell");

        // Decrease the mint amount
        _mintAmount -= purchaseAmount;

        // Update the details of the token
        idToListedToken[tokenId].mintAmount = _mintAmount;
        idToListedToken[tokenId].currentlyListed = true; // extend the functionally...
        idToListedToken[tokenId].ownerAddress = payable(msg.sender);
        idToListedToken[tokenId].sellerAddress = payable(msg.sender);
        _itemsSold.increment();

        // Set currentlyListed to false if _mintAmount reaches 0
        if (_mintAmount == 0) {
            idToListedToken[tokenId].currentlyListed = false;
        }

        // Actually transfer the token to the new owner
        _transfer(address(this), msg.sender, tokenId);
        // approve the marketplace to sell NFTs on your behalf
        approve(address(this), tokenId);

        // Transfer the listing fee to the marketplace creator
        payable(contractCreator).transfer(listPrice * purchaseAmount);
        // Transfer the proceeds from the sale to the seller of the NFT
        payable(seller).transfer(msg.value);
    }

    // Function to receive funds
    receive() external payable {
        // Check that the address has enough funds for donation
    }

    // Function to transfer funds to another address
    /*function transferFunds(address payable recipient, uint amount) onlyWhtListed external {
        recipient.transfer(amount);
    }*/
}