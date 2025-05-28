// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ArtistMarketplace.sol";
import "./ArtistMint.sol";
import "./Events.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTListing is Ownable {

    ArtistMarketplace private artistMarketplace;
    ArtistMint private artistMint;
    Events private events;

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

    constructor(address payable _marketplaceAddress, address _eventsAddress) {
        artistMarketplace = ArtistMarketplace(_marketplaceAddress);
        events = Events(_eventsAddress);
    }

    function setContractAddress(address payable _artistMintAddress) external onlyOwner {
        artistMint = ArtistMint(_artistMintAddress);
    }

    function getListedFromTokenId(uint256 _tokenId) external view returns (ListedToken memory) {
        return idToListedToken[_tokenId];
    }

    function getFileDataFromTokenId(uint256 _tokenId) external view returns (FileData memory) {
        return idToFileData[_tokenId];
    }

    function deleteListedFromTokenId(uint256 _tokenId) external {
        delete idToListedToken[_tokenId];
        delete idToFileData[_tokenId];
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

        uint256 balance = artistMint.getMarketTokenBalance(_tokenId);
        require(balance > 0, "Supply amount is undefined!");

        idToListedToken[_tokenId] = ListedToken(
            artistMint.getMarketTokenBalance(_tokenId),
            _tokenId,
            _nftName,
            _artistName,
            payable(_artistAddress),
            payable(address(artistMarketplace)),
            payable(_artistAddress),
            _nftPrice,
            _currentlyListed
        );

        events.emitTokenListing(
            _tokenId,
            artistMint.getMarketTokenBalance(_tokenId),
            _nftName,
            _artistName,
            payable(_artistAddress),
            payable(address(artistMarketplace)),
            payable(_artistAddress),
            _nftPrice,
            _currentlyListed
        );
    }

    function setListedFromTokenId(
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
        if (_supplyAmount == 0) {
            idToListedToken[_tokenId].currentlyListed = false;
        } else if (_supplyAmount > 0) {
            idToListedToken[_tokenId].currentlyListed = true;
        }

        idToListedToken[_tokenId] = ListedToken({
            supplyAmount: _supplyAmount,
            tokenId: _tokenId,
            nftName: _nftName,
            artistName: _artistName,
            artistAddress: payable(_artistAddress),
            ownerAddress: _ownerAddress,
            sellerAddress: _sellerAddress,
            nftPrice: _nftPrice,
            currentlyListed: idToListedToken[_tokenId].currentlyListed
        });
    }
}