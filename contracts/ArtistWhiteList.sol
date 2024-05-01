//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ArtistWhiteList {
    using Strings for string;
    using Counters for Counters.Counter;

    Counters.Counter private _numbers;

    struct UserInfo {
        uint256 userNumber;
        address userAddress;
        string nameForAddress;
        bool isListed;
    }

    // Mapping to store whether an address is in the white list
    mapping(address => UserInfo) public whiteList;
    //
    mapping(uint256 => UserInfo) private whtList;
    // To keep track of numbers assigned to the user in the white list
    uint256[] public whiteListUserNumbers; 

    function addToWhtList(address _user, string memory _name) public returns(uint) {
        _numbers.increment();
        uint256 newNumber = _numbers.current();

        whiteList[_user] = UserInfo(newNumber, _user, _name, true);
        whtList[newNumber] = UserInfo(newNumber, _user, _name, true);
        whiteListUserNumbers.push(newNumber); // Add the user number to the array

        return newNumber;
    }

    /*function removeFromWhtList(address _user) public {
        UserInfo memory user = getUserByAddress(_user);
        delete whiteList[_user];
        delete whtList[user.userNumber];
        delete whiteListUserNumbers[user.userNumber];
    }

    function getUserByAddress(address _user) public view returns (UserInfo memory) {
        return whiteList[_user];
    }

    function getUserByName(string memory _name) public view returns (UserInfo memory) {
        for (uint256 i = 0; i < whiteListUserNumbers.length; i++) {
            if (whtList[whiteListUserNumbers[i]].nameForAddress.equal(_name)) {
                return whtList[whiteListUserNumbers[i]];
            }
        }
        return UserInfo(0, address(0), "", false);
    }

    function getAllUsersOnWhiteList() public view returns (UserInfo[] memory) {
        UserInfo[] memory users = new UserInfo[](whiteListUserNumbers.length);
        for (uint256 i = 0; i < whiteListUserNumbers.length; i++) {
            users[i] = whtList[whiteListUserNumbers[i]];
        }
        return users;
    }

    function getUserByNumber(uint256 num) public view returns (UserInfo memory) {
        return whtList[num];
    }

    function getUserNumbersOnWhiteList() public view returns (uint256[] memory) {
        return whiteListUserNumbers;
    }*/
}