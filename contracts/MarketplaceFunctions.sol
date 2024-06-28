//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

//import "./ContractData.sol";
//import "./ListedToken.sol";
//import "./IMarketFunctions.sol";

import "hardhat/console.sol";
//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MarketplaceFunctions  {
    // Admin Functions

    

    /*function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }*/

    /*function getMintAmountFromTokenId(uint256 tokenId) public view override returns (uint256) {
        return idToListedToken[tokenId].mintAmount;
    }*/

    

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

    /*function getTokenIdsFromListedToken() public view returns (uint256[] memory) {
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
    }*/
}