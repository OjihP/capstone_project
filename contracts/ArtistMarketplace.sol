//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // Safe and secure implementation of a counter in solidity. Can help track # of items sold in a marketplace
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // Helps store the token URI. The token URI is the URL in which the metatdata for the NFT is located
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtistMarketplace is ERC721URIStorage, Ownable {
    using Strings for uint256;

    address payable contractCreator;
    address private artist;

    using Counters for Counters.Counter; // get the counter implementation from 'Counters.sol'
    // _tokenIds variable has the most recent minted tokenId
    Counters.Counter private _tokenIds;
    // Keeps track of the number of items sold on the marketplace
    Counters.Counter private _itemsSold;

    // The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.01 ether;

    // The structure to store info about a listed token
    struct ListedToken {
        uint256 tokenId;
        string nftName;
        address creatorAddress;
        address payable ownerAddress;
        address payable sellerAddress;
        uint256 priceOfNFT;
        string[] fileNames;
        string[] fileTypes;
        string[] tokenCIDs;
        bool currentlyListed;
    }

    // the event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 indexed tokenId,
        string nftName,
        address creatorAddress,
        address ownerAddress,
        address sellerAddress,
        uint256 priceOfNFT,
        string[] fileNames,
        string[] fileTypes,
        string[] tokenCIDs,
        bool currentlyListed
    );

    // This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) private idToListedToken;
    // 
    mapping(address => bool) public whiteList;

    constructor(string memory _name, string memory _symbol, address _artist) ERC721(_name, _symbol) {
        contractCreator = payable(msg.sender);
        artist = _artist;
        whiteList[artist] = true;
    }

    modifier onlyWhtListed() {
        require(whiteList[msg.sender] == true, "User is not whitelisted");
        _;
    }

    // Sub Functions

    function updateListPrice(uint256 _listPrice) public payable {
        require(contractCreator == msg.sender, "Only contract creator can update the listing price");
        listPrice = _listPrice;
    }

    function getCreatorAddress() public view returns (address) {
        return contractCreator;
    }

    function getArtistAddress() public view returns (address) {
        return artist;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    /*function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }*/

    function getListedForTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getTokenIdFromListedToken(uint256 tokenId) public view returns (uint256) {
        return idToListedToken[tokenId].tokenId;
    }

    function getNFTNameFromListedToken(uint256 tokenId) public view returns (string memory) {
        return idToListedToken[tokenId].nftName;
    }

    function getFileNamesFromListedToken(uint256 tokenId) public view returns (string[] memory) {
        return idToListedToken[tokenId].fileNames;
    }

    function getFileTypesFromListedToken(uint256 tokenId) public view returns (string[] memory) {
        return idToListedToken[tokenId].fileTypes;
    }

    function getTokenCIDsFromListedToken(uint256 tokenId) public view returns (string[] memory) {
        return idToListedToken[tokenId].tokenCIDs;
    }


    function getTokenIdsFromListedToken() public view returns (uint256[] memory) {
        uint nftCount = _tokenIds.current();
        uint256[] memory tokenIds = new uint256[](nftCount);
        uint256 currentId;
        uint256 currentIndex;
   
        for(uint i = 0; i < nftCount; i++)
        {
            currentId = i + 1;
            tokenIds[currentIndex] = idToListedToken[currentId].tokenId;
            currentIndex += 1;
        }

        return tokenIds;
    }

    function getTokenPriceFromListedToken(uint256 tokenId) public view returns (uint256) {
        return idToListedToken[tokenId].priceOfNFT;
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    function addToWhtList(address _user) public {
        whiteList[_user] = true;
    }

    function removeFromWhtList(address _user) public {
        whiteList[_user] = false;
    }

    // Main Functions

    // The first time a token is created, it is listed here
    function createToken(
        string memory _nftName, 
        uint256 price, 
        string[] memory _fileNames, 
        string[] memory _fileTypes, 
        string[] memory _tokenCIDs 
        ) public payable onlyWhtListed returns (uint) {
        // Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Mint the NFT with tokenId newTokenId to the address who called createToken
        _safeMint(msg.sender, newTokenId);

        // Helper function to update Global variables and emit an event
        createListedToken(newTokenId, _nftName, price, _fileNames, _fileTypes, _tokenCIDs);

        return newTokenId;
    }

    // Helps create the object of type ListedToken for the NFT and update the idToListedToken mapping
    function createListedToken(
        uint256 tokenId, 
        string memory _nftName, 
        uint256 price, 
        string[] memory _fileNames,
        string[] memory _fileTypes,
        string[] memory _tokenCIDs
        ) private {
        // Make sure the sender sent enough ETH to pay for listing
        require(msg.value == listPrice, "Please send the correct price");
        // Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        // Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
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
    function getAllNFTs() public view returns (ListedToken[] memory) {
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
    }
    
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
    function executeSale(uint256 tokenId) public payable {
        uint price = idToListedToken[tokenId].priceOfNFT;
        address seller = idToListedToken[tokenId].sellerAddress;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        // update the details of the token
        idToListedToken[tokenId].currentlyListed = true; // extend the functionally...
        idToListedToken[tokenId].ownerAddress = payable(msg.sender);
        idToListedToken[tokenId].sellerAddress = payable(msg.sender);
        _itemsSold.increment();

        // Actually transfer the token to the new owner
        _transfer(address(this), msg.sender, tokenId);
        // approve the marketplace to sell NFTs on your behalf
        approve(address(this), tokenId);

        // Transfer the listing fee to the marketplace creator
        payable(contractCreator).transfer(listPrice);
        // Transfer the proceeds from the sale to the seller of the NFT
        payable(seller).transfer(msg.value);
    }
}