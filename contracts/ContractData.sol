// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract ContractData {
    address payable contractCreator;
    address internal artist;

    using Counters for Counters.Counter; // get the counter implementation from 'Counters.sol'
    // _tokenIds variable has the most recent minted tokenId
    Counters.Counter internal _tokenIds;
    // Keeps track of the number of items sold on the marketplace
    Counters.Counter internal _itemsSold;

    // The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.01 ether;

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
}
    
