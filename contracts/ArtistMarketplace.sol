// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMint.sol";
import "./Events.sol";
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

contract ArtistMarketplace is Events, ERC721, ERC721URIStorage, ERC721Enumerable, ReentrancyGuard, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    address payable private contractCreator;
    ArtistMint private artistMint;
    Events private events;
    uint256 private listPrice;

    // Struct to hold necessary file data for NFT
    struct FileData {
        string[] fileNames;
        string[] fileTypes;
        string[] tokenCIDs;
        uint256[] nestIDs;
    }

    // Struct to hold necessary NFT data
    struct ListedToken {
        uint256 supplyAmount;
        uint256 tokenId;
        string nftName;
        string artistName;
        address payable artistAddress;
        address payable ownerAddress;
        address payable sellerAddress;
        uint256 nftPrice;
        bool currentlyListed;
    }

    // Mappings to store token data for NFT
    mapping(uint256 => ListedToken) private idToListedToken;
    mapping(uint256 => FileData) private idToFileData;

    constructor() ERC721("ArtistMarketplace", "ARTM") {
        contractCreator = payable(msg.sender);
    }

    function setContractAddresses(address payable _artistMintAddress, address _eventsAddress) external onlyOwner {
        artistMint = ArtistMint(_artistMintAddress);
        events = Events(_eventsAddress);
    }

    function updateListPrice(uint256 _listPrice) external onlyOwner {
        listPrice = _listPrice;
    }

    function getCreatorAddress() external view returns (address) {
        return contractCreator;
    }

    function getListPrice() external view returns (uint256) {
        return listPrice;
    }

    function getListedFromTokenId(uint256 _tokenId) external view returns (ListedToken memory) {
        return idToListedToken[_tokenId];
    }

    function getFileDataFromTokenId(uint256 _tokenId) external view returns (FileData memory) {
        return idToFileData[_tokenId];
    }

    // Logs data into mapping
    function createListedFileData(
        uint256 _tokenId,
        string[] memory _fileNames,
        string[] memory _fileTypes,
        string[] memory _tokenCIDs,
        uint256[] memory _nestIDs
    ) external {
        idToFileData[_tokenId] = FileData(
            _fileNames,
            _fileTypes,
            _tokenCIDs,
            _nestIDs
        );
    }

    // Logs data into mapping, and emits event
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
    ) external payable {
        require(_nftPrice > 0, "Make sure the price isn't negative");

        idToListedToken[_tokenId] = ListedToken(
            _supplyAmount,
            _tokenId,
            _nftName,
            _artistName,
            payable(_artistAddress),
            _ownerAddress = payable(address(this)),
            _sellerAddress = payable(_artistAddress),
            _nftPrice,
            _currentlyListed
        );

        events.emitEvents(
            _tokenId,
            _supplyAmount,
            _nftName,
            _artistName,
            payable(_artistAddress),
            _ownerAddress = payable(address(this)),
            _sellerAddress = payable(_artistAddress),
            _nftPrice,
            _currentlyListed
        );
    }

    function executeSale(uint256 _tokenId, uint256 purchaseAmount) external payable {
        ListedToken storage listedToken = idToListedToken[_tokenId];
        uint256 _supplyAmount = listedToken.supplyAmount;
        uint256 _price = listedToken.nftPrice;
        address payable seller = listedToken.sellerAddress;

        require(msg.value >= _price * purchaseAmount, "Please submit the asking price in order to complete the purchase");
        require(_supplyAmount >= purchaseAmount, "No remaining tokens to sell");

        _supplyAmount -= purchaseAmount;

        for (uint256 i = 0; i < purchaseAmount; i++) {
            artistMint.safeTransferFrom(address(this), msg.sender, _tokenId, 1, "");
        }

        payable(seller).transfer(msg.value);

        listedToken.supplyAmount = _supplyAmount;
        if (listedToken.supplyAmount == 0) {
            idToListedToken[_tokenId].currentlyListed = false;
        }
        listedToken.ownerAddress = payable(msg.sender);
        listedToken.sellerAddress = payable(msg.sender);
    }

    function replenishNFTTokens(uint256 _tokenId, uint256 mintAmount, bytes memory data) external payable nonReentrant {
        ListedToken storage listedToken = idToListedToken[_tokenId];
        uint256 mintPrice = listPrice * mintAmount;

        // Ensure enough ETH is sent to cover the minting cost
        require(msg.value >= mintPrice, "Insufficient funds for minting");

        // Call the ArtistMint contract and forward the value (msg.value)
        artistMint.mintTokens{value: msg.value}(_tokenId, mintAmount, mintPrice, data);

        // Update the supply in ArtistMarketplace after replenishment
        listedToken.supplyAmount += mintAmount;
        if (listedToken.supplyAmount > 0) {
            idToListedToken[_tokenId].currentlyListed = true;
        }
    }

    function deleteNFTTokens(uint256 _tokenId, uint256 amount) external nonReentrant {
        ListedToken storage listedToken = idToListedToken[_tokenId];

        require(listedToken.supplyAmount >= amount, "Amount exceeds listed supply");

        // Calculate the refund based on the listed price and the amount of tokens burned
        uint256 refundAmount = listPrice * amount;

        // Ensure the contract has enough balance to refund
        require(address(artistMint).balance >= refundAmount, "Insufficient balance in ArtistMint.sol");

        // Update the supply in your mapping
        listedToken.supplyAmount -= amount;

        // If all tokens are burned, remove the listing
        if (listedToken.supplyAmount == 0) {
            idToListedToken[_tokenId].currentlyListed = false;
        }

        // Transfer the refund to the artist that created it
        artistMint.transferRefund(refundAmount, listedToken.artistAddress);

        // Burn the tokens
        artistMint.burnTokens(_tokenId, amount);
    }

    // Transfers funds from ArtistMarketplace contract to recipient via a proposal
    function transferFunds(address payable recipient, uint256 amount) external {
        require(address(this).balance >= amount, "Insufficient balance in ArtistMarketplace");
        (bool success, ) = recipient.call{value: amount}("");
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