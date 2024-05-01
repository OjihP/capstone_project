// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

struct ListedToken {
    uint256 mintAmount;
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
