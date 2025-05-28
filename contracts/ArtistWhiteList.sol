// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ArtistMarketplace.sol";
import "./Events.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ArtistWhiteList {
    using Counters for Counters.Counter;

    Counters.Counter private whtListCounter;
    ArtistMarketplace private artistMarketplace;
    Events private events;
    address private contractCreator;

    struct UserInfo {
        uint256 userNumber;
        address userAddress;
        string nameForAddress;
        bool isListed;
    }

    mapping(uint256 => UserInfo) private whtList;
    mapping(address => UserInfo) private whtListByAddress;

    constructor(address payable marketplaceAddress, address _eventsAddress) {
        artistMarketplace = ArtistMarketplace(marketplaceAddress);
        events = Events(_eventsAddress);
        contractCreator = artistMarketplace.getCreatorAddress();
    }

    modifier authorizedPersonnel(address caller) {
        require(caller == contractCreator || isWhitelisted(caller) == true, "Unauthorized User(WHT)");
        _;
    }

    function getCurrentWhtListCounter() external view returns (uint256) {
        return whtListCounter.current();
    }

    function addToWhtList(address _userAddress, string memory _name, address caller) external authorizedPersonnel (caller) {
        UserInfo memory userInfo = whtListByAddress[_userAddress];

        require(!whtListByAddress[_userAddress].isListed, "Address already listed");

        if (_userAddress == userInfo.userAddress && userInfo.isListed == false) {
            whtList[userInfo.userNumber].isListed = true;
            whtListByAddress[_userAddress].isListed = true;
            events.emitWhtListUser(userInfo.userNumber, _userAddress, _name, true);
            return;
        } else {
            whtListCounter.increment();
            uint256 newNumber = whtListCounter.current();
            whtList[newNumber] = UserInfo(newNumber, _userAddress, _name, true);
            whtListByAddress[_userAddress] = UserInfo(newNumber, _userAddress, _name, true);
            events.emitWhtListUser(newNumber, _userAddress, _name, true);
        }
    }

    function removeFromWhtList(uint256 _userNumber, address caller) external authorizedPersonnel (caller) {
        require(_userNumber > 0 && whtList[_userNumber].userNumber == _userNumber, "Invalid user number");

        address _userAddress = whtList[_userNumber].userAddress;
        string memory _name = whtList[_userNumber].nameForAddress;
        whtList[_userNumber].isListed = false;
        whtListByAddress[_userAddress].isListed = false;
        events.emitWhtListUser(_userNumber, _userAddress, _name, false);
    }

    function isWhitelisted(address _userAddress) public view returns (bool) {
        // Loop through the whtList mapping to find the user's number
        uint256 totalUsers = whtListCounter.current();
        for (uint256 i = 1; i <= totalUsers; i++) {
            UserInfo memory userInfo = whtList[i];
            if (userInfo.userAddress == _userAddress) {
                return userInfo.isListed;
            }
        }
        return false; // User not found in the whitelist
    }

    function getUserByNumber(uint256 _userNumber) external view returns (UserInfo memory) {
        require(_userNumber > 0 && _userNumber <= whtListCounter.current(), "User number out of bounds");
        return whtList[_userNumber];
    }

    function getUserByAddress(address _userAddress) external view returns (UserInfo memory) {
        UserInfo memory userInfo = whtListByAddress[_userAddress];
        require(userInfo.userAddress != address(0), "User not found");
        return userInfo;
    }
}