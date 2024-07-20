// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMint.sol";
//import "./ArtistWhiteList.sol";
//import "./Proposals.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1155Token {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;
    function burn(address from, uint256 id, uint256 amount) external;
    function uri(uint256 tokenId) external view returns (string memory);
}

contract ArtistMarketplace is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    address payable public contractCreator;
    address internal artist;
    uint256 public currentTokenID = 0;
    ArtistMint public tokenCall;

    // Keeps track of the number of items sold on the marketplace
    Counters.Counter public _itemsSold;

    // The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice;

    struct ListedToken {
        uint256 supplyAmount;
        uint256 tokenId;
        string nftName;
        string creatorName;
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
        uint256 supplyAmount,
        uint256 indexed tokenId,
        string nftName,
        string creatorName,
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
    mapping(uint256 => ListedToken) public idToListedToken;

    constructor(address payable) ERC721("ArtistMarketplace", "ARTM") {
        contractCreator = payable(msg.sender);
        //artist = _artist;
        //addToWhtList(_artist, "Artist"); // Add artist to the white list with a predefined name
    }

    function setTokenCallAddress(address _tokenCallAddress) external onlyOwner {
        tokenCall = ArtistMint(_tokenCallAddress);
    }

    function getMarketplaceBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function updateListPrice(uint256 _listPrice) public payable  {
        require(contractCreator == msg.sender/*, "Only contract creator can update the listing price"*/);
        listPrice = _listPrice;
    }

    function getCreatorAddress() public view  returns (address) {
        return contractCreator;
    }

    function getArtistAddress() public view  returns (address) {
        return artist;
    }

    function getListPrice() public view  returns (uint256) {
        return listPrice;
    }

    function getListedFromTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    // Helper function to get ERC1155 tokens held by a user
    function getUserERC1155Tokens(address user) external view returns (uint256[] memory) {
        uint256 totalTokens = tokenCall.tokenSupply();
        uint256[] memory userTokens = new uint256[](totalTokens);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalTokens; i++) {
            if (tokenCall.balanceOf(user, i) > 0) {
                userTokens[index] = i;
                index++;
            }
        }

        // Resize the array to fit the number of tokens found
        uint256[] memory result = new uint256[](index);
        for (uint256 i = 0; i < index; i++) {
            result[i] = userTokens[i];
        }

        return result;
    }

     // Helps create the object of type ListedToken for the NFT and update the idToListedToken mapping
    function createListedToken(
        uint256 tokenId, 
        string memory _nftName, 
        string memory _creatorName,
        address _creatorAddress,
        uint256 price, 
        string[] memory _fileNames,
        string[] memory _fileTypes,
        string[] memory _tokenCIDs,
        uint256 supplyAmount
        ) payable public {
        // Make sure the sender sent enough ETH to pay for listing
        //require(msg.value == listPrice * mintAmount, "Please send the correct price");
        // Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        // Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            supplyAmount,
            tokenId,
            _nftName,
            _creatorName,
            _creatorAddress,
            payable(address(this)),
            payable(_creatorAddress),
            price,
            _fileNames,
            _fileTypes,
            _tokenCIDs,
            true
        );
    
        // Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            supplyAmount,
            tokenId,
            _nftName,
            _creatorName,
            _creatorAddress,
            address(this),
            _creatorAddress,
            price,
            _fileNames,
            _fileTypes,
            _tokenCIDs,
            true
        );
    }

    // the function that executes the sale on the marketplace
    function executeSale(uint256 tokenId, uint256 purchaseAmount) public payable {
        uint _supplyAmount = idToListedToken[tokenId].supplyAmount;
        uint price = idToListedToken[tokenId].priceOfNFT;
        address seller = idToListedToken[tokenId].sellerAddress;
        //uint256[] memory ids;
        //uint256[] memory amounts;
        //address tokenOwner = idToListedToken[tokenId].ownerAddress;

        // Check if the contract is approved to transfer the token on behalf of the seller
        //require(tokenCall.isApprovedForAll(seller, address(this)), "Seller has not approved the marketplace");

        require(msg.value >= price * purchaseAmount, "Please submit the asking price in order to complete the purchase");

        // Ensure _mintAmount is greater than 0 before decrementing
        require(_supplyAmount >= purchaseAmount, "No remaining tokens to sell");

        for(uint256 i = 1; i <= purchaseAmount; i++){
            // Actually transfer the token to the new owner
            tokenCall.safeTransferFrom(address(this), msg.sender, tokenId, 1, "");
        }
        
        // Decrease the mint amount
        _supplyAmount -= purchaseAmount;

        // Update the details of the token
        idToListedToken[tokenId].supplyAmount = _supplyAmount;
        idToListedToken[tokenId].currentlyListed = true; // extend the functionally...
        idToListedToken[tokenId].ownerAddress = payable(msg.sender);
        idToListedToken[tokenId].sellerAddress = payable(msg.sender);
        //_itemsSold.increment();

        // Set currentlyListed to false if _supplyAmount reaches 0
        if (_supplyAmount == 0) {
            idToListedToken[tokenId].currentlyListed = false;
        }

        // Transfer the proceeds from the sale to the seller of the NFT
        payable(seller).transfer(msg.value);
    }

     // Function to transfer funds to a specified address
    function transferFunds(address payable _recipient, uint256 _amount) external {
        require(address(this).balance >= _amount, "Insufficient balance in ArtistMarketplace");
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer failed");
    }

    // Function to receive funds
    receive() external payable {
        // Check that the address has enough funds for donation
    }

    // Override required functions from parent contracts
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 amount) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, amount);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Implement IERC1155Receiver functions
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
    
