// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

contract ContractData {
    
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

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );
    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);
}
    
