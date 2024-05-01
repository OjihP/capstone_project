// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ListedToken.sol";

abstract contract IMarketFunctions {

    function updateListPrice(uint256 _listPrice) public virtual payable;

    function getCreatorAddress() public view virtual returns (address);

    function getArtistAddress() public view virtual returns (address);

    function getListPrice() public view virtual returns (uint256);

    function getMintAmountFromTokenId(uint256 tokenId) public view virtual returns (uint256);

    function getListedFromTokenId(uint256 tokenId) public view virtual returns (ListedToken memory);

    function getTokenIdFromListedToken(uint256 tokenId) public virtual view returns (uint256);

    function getNFTNameFromListedToken(uint256 tokenId) public view virtual returns (string memory);

    function getTokenPriceFromListedToken(uint256 tokenId) public view virtual returns (uint256);

    function getFileNamesFromListedToken(uint256 tokenId) public view virtual returns (string[] memory);

    function getFileTypesFromListedToken(uint256 tokenId) public view virtual returns (string[] memory);

    function getTokenCIDsFromListedToken(uint256 tokenId) public view virtual returns (string[] memory);

    function getCurrentlyListedFromListedToken(uint256 tokenId) public view virtual returns (bool);

    function getTokenIdsFromListedToken() public view virtual returns (uint256[] memory);
}
