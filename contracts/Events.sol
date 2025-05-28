// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMint.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Events is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private tokenEventCounter;
    Counters.Counter private whtListEventCounter;
    ArtistMint private artistMint;

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

    event WhtListUser (
        uint256 userNumber,
        address userAddress,
        string nameForAddress,
        bool isListed,
        uint256 timestamp
    );

    struct TokenEvent {
        uint256 tokenId;
        uint256 supplyAmount;
        string nftName;
        string artistName;
        uint256 price;
        bool currentlyListed;
        uint256 timestamp;
    }

    struct WhtListEvent {
        uint256 userNumber;
        address userAddress;
        string nameForAddress;
        bool isListed;
        uint256 timestamp;
    }

    mapping(uint256 => TokenEvent) private tokenEvents;
    mapping(uint256 => WhtListEvent) private whtListEvents;

    function setContract(address payable _artistMintAddress) external onlyOwner {
        artistMint = ArtistMint(_artistMintAddress);
    }

    function getCurrentTokenEventCounter() external view returns (uint256) {
        return tokenEventCounter.current();
    }

    function getTokenEvent(uint256 eventId) public view returns (TokenEvent memory) {
        return tokenEvents[eventId];
    }

    function getCurrentWhtListEventCounter() external view returns (uint256) {
        return whtListEventCounter.current();
    }

    function getWhtListEvent(uint256 eventId) public view returns (WhtListEvent memory) {
        return whtListEvents[eventId];
    }

    function emitWhtListUser (
        uint256 _userNumber,
        address _userAddress,
        string memory _nameForAddress,
        bool _isListed
    ) external {
        whtListEventCounter.increment();

        uint256 eventId = whtListEventCounter.current();

        whtListEvents[eventId] = WhtListEvent({
            userNumber: _userNumber,
            userAddress: _userAddress,
            nameForAddress: _nameForAddress,
            isListed: _isListed,
            timestamp: block.timestamp
        });

        emit WhtListUser(
            _userNumber,
            _userAddress,
            _nameForAddress,
            _isListed,
            block.timestamp
        );
    }

    function emitTokenListing(
        uint256 _tokenId,
        uint256 _supplyAmount,
        string memory _nftName,
        string memory _artistName,
        address payable _artistAddress,
        address payable _ownerAddress,
        address payable _sellerAddress,
        uint256 _nftPrice,
        bool _currentlyListed
    ) external payable {
        tokenEventCounter.increment();

        uint256 eventId = tokenEventCounter.current();

        tokenEvents[eventId] = TokenEvent({
            tokenId: _tokenId,
            supplyAmount: _supplyAmount = artistMint.getMarketTokenBalance(_tokenId),
            nftName: _nftName,
            artistName: _artistName,
            price: _nftPrice,
            currentlyListed: _currentlyListed,
            timestamp: block.timestamp
        });

        emit TokenListedSuccess(
            _supplyAmount = artistMint.getMarketTokenBalance(_tokenId),
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