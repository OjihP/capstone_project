//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

//import "./ContractData.sol";
import "./ListedToken.sol";
//import "./IMarketFunctions.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // Safe and secure implementation of a counter in solidity. Can help track # of items sold in a marketplace
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MarketplaceFunctions {
    using Strings for uint256;
    using Counters for Counters.Counter;

    address payable contractCreator;
    address internal artist;

    // _tokenIds variable has the most recent minted tokenId
    Counters.Counter internal _tokenIds;
    // Keeps track of the number of items sold on the marketplace
    Counters.Counter internal _itemsSold;

    // The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.01 ether;

    // This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) internal idToListedToken;

    // Admin Functions

    function updateListPrice(uint256 _listPrice) public payable  {
        require(contractCreator == msg.sender, "Only contract creator can update the listing price");
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

    /*function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }*/

    /*function getMintAmountFromTokenId(uint256 tokenId) public view override returns (uint256) {
        return idToListedToken[tokenId].mintAmount;
    }*/

    function getListedFromTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    /*function getTokenIdFromListedToken(uint256 tokenId) public view override returns (uint256) {
        return idToListedToken[tokenId].tokenId;
    }

    function getNFTNameFromListedToken(uint256 tokenId) public view override returns (string memory) {
        return idToListedToken[tokenId].nftName;
    }

    function getTokenPriceFromListedToken(uint256 tokenId) public view override returns (uint256) {
        return idToListedToken[tokenId].priceOfNFT;
    }

    function getFileNamesFromListedToken(uint256 tokenId) public view override returns (string[] memory) {
        return idToListedToken[tokenId].fileNames;
    }

    function getFileTypesFromListedToken(uint256 tokenId) public view override returns (string[] memory) {
        return idToListedToken[tokenId].fileTypes;
    }

    function getTokenCIDsFromListedToken(uint256 tokenId) public view override returns (string[] memory) {
        return idToListedToken[tokenId].tokenCIDs;
    }

    function getCurrentlyListedFromListedToken(uint256 tokenId) public view override returns (bool) {
        return idToListedToken[tokenId].currentlyListed;
    }*/

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
}