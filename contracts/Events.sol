// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

contract Events {
    // Event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 supplyAmount,
        uint256 tokenId,
        string nftName,
        string  artistName,
        address artistAddress,
        address ownerAddress,
        address sellerAddress,
        uint256 nftPrice,
        bool currentlyListed,
        uint256 timestamp
    );

    function emitEvents(
        uint256 _tokenId,
        uint256 _supplyAmount,
        string memory _nftName,
        string memory _artistName,
        address _artistAddress,
        address payable _ownerAddress,
        address payable _sellerAddress,
        uint256 _nftPrice,
        bool _currentlyListed
    ) external {
        emit TokenListedSuccess(
            _supplyAmount,
            _tokenId,
            _nftName,
            _artistName,
            _artistAddress,
            _ownerAddress,
            _sellerAddress,
            _nftPrice,
            _currentlyListed,
            block.timestamp
        );
    }
}