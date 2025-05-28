// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMint.sol";
import "./Events.sol";
import "./NFTListing.sol";
import "./ArtistWhiteList.sol";
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

contract ArtistMarketplace is ERC721, ERC721URIStorage, ERC721Enumerable, ReentrancyGuard, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    address payable private contractCreator;
    ArtistMint private artistMint;
    Events private events;
    NFTListing private nftListing;
    ArtistWhiteList private whiteList;
    uint256 private listPrice;
    Counters.Counter private currentTokenCounter;

    constructor() ERC721("ArtistMarketplace", "ARTM") {
        contractCreator = payable(msg.sender);
    }

    modifier onlyWhtListed(address caller) {
        bool chkWhtList = whiteList.isWhitelisted(caller);
        require(chkWhtList == true, "Unauthorized User(ART)");
        _;
    }

    modifier authorizedPersonnel(address caller) {
        require(caller == contractCreator || whiteList.isWhitelisted(caller) == true, "Unauthorized User(ART1)");
        _;
    }

    function setContractAddresses(address _whtListAddress, address payable _artistMintAddress, address _eventsAddress, address _nftListingAddress) external onlyOwner {
        artistMint = ArtistMint(_artistMintAddress);
        nftListing = NFTListing(_nftListingAddress);
        events = Events(_eventsAddress);
        whiteList = ArtistWhiteList(_whtListAddress);
    }

    function updateListPrice(uint256 _listPrice) external onlyOwner {
        listPrice = _listPrice;
    }

    function getCreatorAddress() public view returns (address) {
        return contractCreator;
    }

    function getListPrice() external view returns (uint256) {
        return listPrice;
    }

    function fullNFTRemoval(uint256 _tokenId) external onlyOwner {
        NFTListing.ListedToken memory listedToken = nftListing.getListedFromTokenId(_tokenId);
        uint256 amount = artistMint.getMarketTokenBalance(_tokenId);

        deleteNFTTokens(_tokenId, amount, msg.sender);

        events.emitTokenListing(
            listedToken.tokenId,
            artistMint.getMarketTokenBalance(_tokenId),
            listedToken.nftName,
            listedToken.artistName,
            listedToken.artistAddress,
            payable(address(0)),
            payable(address(0)),
            listedToken.nftPrice,
            false
        );

        nftListing.deleteListedFromTokenId(_tokenId);

        artistMint.decrementTokenCounter();
    }

    function executeSale(uint256 _tokenId, uint256 purchaseAmount) external payable {
        NFTListing.ListedToken memory listedToken = nftListing.getListedFromTokenId(_tokenId);
        uint256 _supplyAmount = artistMint.getMarketTokenBalance(_tokenId);
        uint256 _price = listedToken.nftPrice;
        address payable seller = listedToken.sellerAddress;

        require(msg.value >= _price * purchaseAmount, "Please submit the asking price in order to complete the purchase");
        require(_supplyAmount >= purchaseAmount, "No remaining tokens to sell");

        for (uint256 i = 0; i < purchaseAmount; i++) {
            artistMint.safeTransferFrom(address(this), msg.sender, _tokenId, 1, "");
        }

        payable(seller).transfer(msg.value);

        _supplyAmount = artistMint.getMarketTokenBalance(_tokenId);

        if (_supplyAmount == 0) {
            nftListing.setListedFromTokenId(
                _tokenId, 
                _supplyAmount, 
                listedToken.nftName, 
                listedToken.artistName, 
                listedToken.artistAddress,
                payable(address(0)),
                payable(address(0)),
                listedToken.nftPrice,
                false
            );

            events.emitTokenListing(
                _tokenId,
                _supplyAmount,
                listedToken.nftName,
                listedToken.artistName,
                listedToken.artistAddress,
                payable(address(0)),
                payable(address(0)),
                listedToken.nftPrice,
                false
            );
        }

        nftListing.setListedFromTokenId(
            _tokenId, 
            _supplyAmount, 
            listedToken.nftName, 
            listedToken.artistName, 
            listedToken.artistAddress,
            payable(msg.sender),
            payable(msg.sender),
            listedToken.nftPrice,
            listedToken.currentlyListed
        );
    }

    function replenishNFTTokens(uint256 _tokenId, uint256 mintAmount, bytes memory data, address caller) external payable nonReentrant onlyWhtListed (caller){
        NFTListing.ListedToken memory listedToken = nftListing.getListedFromTokenId(_tokenId);
        uint256 mintPrice = listPrice * mintAmount;
        uint256 _supplyAmount = artistMint.getMarketTokenBalance(_tokenId);

        // Ensure enough ETH is sent to cover the minting cost
        require(msg.value >= mintPrice, "Insufficient funds for minting");

        // Call the ArtistMint contract and forward the value (msg.value)
        artistMint.mintTokens{value: msg.value}(_tokenId, mintAmount, mintPrice, data, caller);

        _supplyAmount = artistMint.getMarketTokenBalance(_tokenId);

        // Update the supply in ArtistMarketplace after replenishment
        if (_supplyAmount > 0) {
            nftListing.setListedFromTokenId(
                _tokenId, 
                _supplyAmount,
                listedToken.nftName, 
                listedToken.artistName, 
                listedToken.artistAddress,
                payable(msg.sender),
                payable(msg.sender),
                listedToken.nftPrice,
                true
            );
            
            events.emitTokenListing(
                _tokenId,
                _supplyAmount,
                listedToken.nftName,
                listedToken.artistName,
                listedToken.artistAddress,
                payable(msg.sender),
                payable(msg.sender),
                listedToken.nftPrice,
                true
            );
        }

        nftListing.setListedFromTokenId(
            _tokenId, 
            _supplyAmount,
            listedToken.nftName, 
            listedToken.artistName, 
            listedToken.artistAddress,
            payable(msg.sender),
            payable(msg.sender),
            listedToken.nftPrice,
            listedToken.currentlyListed
        );
    }

    function deleteNFTTokens(uint256 _tokenId, uint256 amount, address caller) public nonReentrant authorizedPersonnel(caller) {
    NFTListing.ListedToken memory listedToken = nftListing.getListedFromTokenId(_tokenId);
    uint256 _supplyAmount = artistMint.getMarketTokenBalance(_tokenId);

    require(listedToken.supplyAmount >= amount, "Amount exceeds listed supply");

    // Calculate the refund based on the listed price and the amount of tokens burned
    uint256 refundAmount = listPrice * amount;

    // Ensure the contract has enough balance to refund
    require(address(artistMint).balance >= refundAmount, "Insufficient balance in ArtistMint.sol");

    // Transfer the refund to the artist that created it
    artistMint.transferRefund(refundAmount, listedToken.artistAddress, caller);

    // Burn the tokens
    artistMint.burnTokens(_tokenId, amount, caller);

    // Update supply amount AFTER burning tokens
    _supplyAmount = artistMint.getMarketTokenBalance(_tokenId);

    // If all tokens are burned, rewrite the listing
    if (_supplyAmount == 0) {
        nftListing.setListedFromTokenId(
            _tokenId, 
            _supplyAmount,
            listedToken.nftName, 
            listedToken.artistName, 
            listedToken.artistAddress,
            payable(address(0)),
            payable(address(0)),
            listedToken.nftPrice,
            false
        );

        events.emitTokenListing(
            _tokenId,
            _supplyAmount,
            listedToken.nftName,
            listedToken.artistName,
            listedToken.artistAddress,
            payable(address(0)),
            payable(address(0)),
            listedToken.nftPrice,
            false
        );
    }

    // Update the supply in your mapping
    nftListing.setListedFromTokenId(
        _tokenId, 
        _supplyAmount,
        listedToken.nftName, 
        listedToken.artistName, 
        listedToken.artistAddress,
        listedToken.ownerAddress,
        listedToken.sellerAddress,
        listedToken.nftPrice,
        listedToken.currentlyListed
    );
}

    // Transfers funds from ArtistMarketplace contract to recipient via a proposal
    function transferFunds(address payable recipient, uint256 amount, address caller) external onlyWhtListed (caller){
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