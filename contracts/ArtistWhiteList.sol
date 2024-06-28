//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
    //mapping(address => UserInfo) public whiteList;
    //
    mapping(uint256 => UserInfo) public whtList;
    UserInfo[] public whiteListArray;
    // To keep track of numbers assigned to the user in the white list
    //uint256[] public whiteListUserNumbers; 

    function getWhtListTotal() public view returns(uint) {
        return whiteListArray.length;
    }

    function addToWhtList(address _userAddress, string memory _name) public returns (uint) {
        _numbers.increment();
        uint256 newNumber = _numbers.current();
        UserInfo memory newUser = UserInfo(newNumber, _userAddress, _name, true);

        whtList[newNumber] = newUser;
        whiteListArray.push(newUser);

        return newNumber;
    }

    function removeFromWhtList(uint256 _userNumber) public {
        require(_userNumber > 0 && whtList[_userNumber].userNumber == _userNumber, "Invalid user number");

        uint256 arrayIndex;
        bool userFound = false;

        for (uint256 i = 0; i < whiteListArray.length; i++) {
            if (whiteListArray[i].userNumber == _userNumber) {
                arrayIndex = i;
                userFound = true;
                break;
            }
        }

        require(userFound, "User not found in array");

        // Move the last element into the place to delete and pop the last element
        if (arrayIndex < whiteListArray.length - 1) {
            whiteListArray[arrayIndex] = whiteListArray[whiteListArray.length - 1];
            //whtList[whiteListArray[arrayIndex].userNumber].userNumber = arrayIndex + 1;
        }

        //whiteListArray.pop();
        delete whtList[_userNumber];
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

    /*function getAllUsersOnWhiteList() public view returns (UserInfo[] memory) {
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
    }*/

    function getUserByNumber(uint256 _userNumber) public view returns (UserInfo memory) {
        require(_userNumber > 0 && _userNumber <= _numbers.current(), "User number out of bounds");
        for (uint256 i = 0; i < whiteListArray.length; i++) {
            if (whiteListArray[i].userNumber == _userNumber) {
                return whiteListArray[i];
            }
        }
        revert("User not found");
    }

    /*function getUserNumbersOnWhiteList() public view returns (uint256[] memory) {
        return whiteListUserNumbers;
    }*/
}