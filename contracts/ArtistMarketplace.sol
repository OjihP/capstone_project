// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMint.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1155Token {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;
    function burn(address from, uint256 id, uint256 amount) external;
    function uri(uint256 tokenId) external view returns (string memory);
}

contract ArtistMarketplace is ERC721, ERC721URIStorage, ERC721Enumerable, ReentrancyGuard, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    address payable public contractCreator;
    ArtistMint public tokenCall;
    uint256 public listPrice;

    // Define a struct to group file-related data
    struct FileData {
        string[] fileNames;
        string[] fileTypes;
        string[] tokenCIDs;
        uint256[] nestIDs;
    }

    struct ListedToken {
        uint256 supplyAmount;
        uint256 tokenId;
        string nftName;
        string artistName;
        address artistAddress;
        address payable ownerAddress;
        address payable sellerAddress;
        uint256 nftPrice;
        bool currentlyListed;
    }

    // Mappings to store token data
    mapping(uint256 => ListedToken) public idToListedToken;
    mapping(uint256 => FileData) private idToFileData;

    // Event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 supplyAmount,
        uint256 indexed tokenId,
        string nftName,
        string artistName,
        address artistAddress,
        address ownerAddress,
        address sellerAddress,
        uint256 nftPrice,
        bool currentlyListed,
        uint256 timestamp
    );

    constructor() ERC721("ArtistMarketplace", "ARTM") {
        contractCreator = payable(msg.sender);
    }

    function setTokenCallAddress(address payable _tokenCallAddress) external onlyOwner {
        tokenCall = ArtistMint(_tokenCallAddress);
    }

    function updateListPrice(uint256 _listPrice) public onlyOwner {
        listPrice = _listPrice;
    }

    function getCreatorAddress() public view returns (address) {
        return contractCreator;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getListedFromTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getFileDataFromTokenId(uint256 tokenId) public view returns (FileData memory) {
        return idToFileData[tokenId];
    }

    function createListedFileData(
        uint256 tokenId,
        string[] memory _fileNames,
        string[] memory _fileTypes,
        string[] memory _tokenCIDs,
        uint256[] memory _nestIDs
    ) public {
        idToFileData[tokenId] = FileData(
            _fileNames,
            _fileTypes,
            _tokenCIDs,
            _nestIDs
        );
    }

    function createListedToken(
        uint256 _tokenId,
        uint256 _supplyAmount,
        string memory _nftName,
        string memory _artistName,
        address _artistAddress,
        address payable _ownerAddress,
        address payable _sellerAddress,
        uint256 _nftPrice,
        bool _currentlyListed
    ) public payable {
        require(_nftPrice > 0, "Make sure the price isn't negative");

        idToListedToken[_tokenId] = ListedToken(
            _supplyAmount,
            _tokenId,
            _nftName,
            _artistName,
            _artistAddress,
            _ownerAddress = payable(address(this)),
            _sellerAddress = payable(_artistAddress),
            _nftPrice,
            _currentlyListed 
        );

        emit TokenListedSuccess(
            _supplyAmount,
            _tokenId,
            _nftName,
            _artistName,
            _artistAddress,
            address(this),
            _artistAddress,
            _nftPrice,
            true,
            block.timestamp
        );
    }

    function executeSale(uint256 tokenId, uint256 purchaseAmount) public payable {
        ListedToken storage listedToken = idToListedToken[tokenId];
        uint256 _supplyAmount = listedToken.supplyAmount;
        uint256 _price = listedToken.nftPrice;
        address payable seller = listedToken.sellerAddress;

        require(msg.value >= _price * purchaseAmount, "Please submit the asking price in order to complete the purchase");
        require(_supplyAmount >= purchaseAmount, "No remaining tokens to sell");

        for (uint256 i = 0; i < purchaseAmount; i++) {
            tokenCall.safeTransferFrom(address(this), msg.sender, tokenId, 1, "");
        }

        _supplyAmount -= purchaseAmount;

        listedToken.supplyAmount = _supplyAmount;
        listedToken.currentlyListed = _supplyAmount > 0;
        listedToken.ownerAddress = payable(msg.sender);
        listedToken.sellerAddress = payable(msg.sender);

        payable(seller).transfer(msg.value);
    }

    function deleteMultipleTokens(uint256 tokenId, uint256 amount, address payable userAddress) external nonReentrant {
        ListedToken storage listedToken = idToListedToken[tokenId];

        require(listedToken.supplyAmount >= amount, "Amount exceeds listed supply");

        // Calculate the refund based on the listed price and the amount of tokens burned
        uint256 refundAmount = listPrice * amount;

        // Ensure the contract creator has enough balance to refund
        require(address(contractCreator).balance >= refundAmount, "Insufficient balance in contractCreator");

        // Burn the tokens
        tokenCall.burnTokens(tokenId, amount);

        // Update the supply in your mapping
        listedToken.supplyAmount -= amount;

        // If all tokens are burned, remove the listing
        if (listedToken.supplyAmount == 0) {
            delete idToListedToken[tokenId];
        }

        tokenCall.transferRefund(amount, userAddress);
    }

    function transferFunds(address payable _recipient, uint256 _amount) external {
        require(address(this).balance >= _amount, "Insufficient balance in ArtistMarketplace");
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}

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
