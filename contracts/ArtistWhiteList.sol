//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ArtistWhiteList {
    using Strings for string;
    using Counters for Counters.Counter;

    Counters.Counter public _numbers;

    struct UserInfo {
        uint256 userNumber;
        address userAddress;
        string nameForAddress;
        bool isListed;
    }

    // Mapping to store whether an address is in the white list
    mapping(address => UserInfo) public whiteList;
    //
    mapping(uint256 => UserInfo) public whtList;
    // To keep track of numbers assigned to the user in the white list
    //uint256[] public whiteListUserNumbers; 

    function addToWhtList(address _user, string memory _name) public returns(uint) {
        _numbers.increment();
        uint256 newNumber = _numbers.current();

        whiteList[_user] = UserInfo(newNumber, _user, _name, true);
        whtList[newNumber] = UserInfo(newNumber, _user, _name, true);
        //whiteListUserNumbers.push(newNumber); // Add the user number to the array

        return newNumber;
    }

    function removeFromWhtList(uint256 _user) public {
        UserInfo memory user = getUserByNumber(_user);
        delete whiteList[user.userAddress];
        delete whtList[user.userNumber];
        //delete whiteListUserNumbers[user.userNumber];
    }

    /*function getUserByAddress(address _user) public view returns (UserInfo memory) {
        return whiteList[_user];
    }*/

    /*function getUserByName(string memory _name) public view returns (UserInfo memory) {
        for (uint256 i = 0; i < whiteListUserNumbers.length; i++) {
            if (whtList[whiteListUserNumbers[i]].nameForAddress.equal(_name)) {
                return whtList[whiteListUserNumbers[i]];
            }
        }
        return UserInfo(0, address(0), "", false);
    }*/

    function getAllUsersOnWhiteList() public view returns (UserInfo[] memory) {
        uint256 userCount = _numbers.current();
        UserInfo[] memory users = new UserInfo[](userCount);
        uint256 currentId;
        uint256 currentIndex;
   
        for(uint i = 0; i < userCount; i++)
        {
            currentId = i + 1;
            users[currentIndex] = whtList[currentId];
            currentIndex += 1;
        }
        return users;
    }

    function getUserByNumber(uint256 num) public view returns (UserInfo memory) {
        return whtList[num];
    }

    /*function getUserNumbersOnWhiteList() public view returns (uint256[] memory) {
        return whiteListUserNumbers;
    }*/
}