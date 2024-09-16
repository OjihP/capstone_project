// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ArtistWhiteList {
    using Counters for Counters.Counter;

    Counters.Counter private whtListCounter;

    struct UserInfo {
        uint256 userNumber;
        address userAddress;
        string nameForAddress;
        bool isListed;
    }

    mapping(uint256 => UserInfo) private whtList;
    mapping(address => bool) private addressListed;

    modifier onlyWhtListed() {
        require(isWhitelisted(msg.sender), "Unauthorized User");
        _;
    }

    function getCurrentWhtListCounter() external view returns (uint256) {
        return whtListCounter.current();
    }

    function addToWhtList(address _userAddress, string memory _name) external {
        require(!addressListed[_userAddress], "Address already listed");
        whtListCounter.increment();
        uint256 newNumber = whtListCounter.current();
        whtList[newNumber] = UserInfo(newNumber, _userAddress, _name, true);
        addressListed[_userAddress] = true;
    }

    function removeFromWhtList(uint256 _userNumber) external {
        require(_userNumber > 0 && whtList[_userNumber].userNumber == _userNumber, "Invalid user number");

        address _userAddress = whtList[_userNumber].userAddress;
        whtList[_userNumber].isListed = false;
        addressListed[_userAddress] = false;
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
}
