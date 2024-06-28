//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

//import "./ArtistWhiteList.sol";
//import "./ContractData.sol";
//import "./ListedToken.sol";
//import "./MarketplaceFunctions.sol";
//import "./Proposals.sol";
//import "./ArtistMint.sol";

//import "@openzeppelin/contracts/utils/Counters.sol"; // Safe and secure implementation of a counter in solidity. Can help track # of items sold in a marketplace
//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract Sale {

    
    
    // This will return all the NFTs currently listed to be sold on the marketplace
    /*function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        uint currentId;
        // at the moment currentlyListed is true for all, if it becomes false in the future we will 
        // filter out currentlyListed == false over here
        for(uint i = 0; i < nftCount; i++)
        {
            currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }
        // the array 'tokens' has the list of all NFTs in the marketplace
        return tokens;
    }*/
    
    // Returns all the tokenIds that the current user has
    /*function getMyIds(address _owner) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        uint256 currentId;
        uint256 currentIndex;
   
        for(uint i = 0; i < ownerTokenCount; i++)
        {
            currentId = i + 1;
            tokenIds[currentIndex] = idToListedToken[currentId].tokenId;
            currentIndex += 1;
        }*/
        /*uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;
        // Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for(uint i = 0; i < totalItemCount; i++)
        {
            if(idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender){
                itemCount += 1;
            }
        }

        // Once you have the count of relevant NFTs, create an array then store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender) {
                currentId = i + 1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;*/
       // return tokenIds;
    //}

    // Function to transfer funds to another address
    /*function transferFunds(address payable recipient, uint amount) onlyWhtListed external {
        recipient.transfer(amount);
    }*/
}