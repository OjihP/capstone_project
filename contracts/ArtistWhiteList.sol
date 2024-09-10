// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ArtistWhiteList {
    using Counters for Counters.Counter;

    Counters.Counter private _numbers;

    struct UserInfo {
        uint256 userNumber;
        address userAddress;
        string nameForAddress;
        bool isListed;
    }

    mapping(uint256 => UserInfo) public whtList;
    mapping(address => bool) public addressListed;

    function getWhtListTotal() public view returns (uint256) {
        return _numbers.current();
    }

    function addToWhtList(address _userAddress, string memory _name) public returns (uint256) {
        require(!addressListed[_userAddress], "Address already listed");
        _numbers.increment();
        uint256 newNumber = _numbers.current();
        whtList[newNumber] = UserInfo(newNumber, _userAddress, _name, true);
        addressListed[_userAddress] = true;
        return newNumber;
    }

    function removeFromWhtList(uint256 _userNumber) public {
        require(_userNumber > 0 && whtList[_userNumber].userNumber == _userNumber, "Invalid user number");

        address userAddress = whtList[_userNumber].userAddress;
        delete whtList[_userNumber];
        addressListed[userAddress] = false;
    }

    function isWhitelisted(address _userAddress) public view returns (bool) {
        return addressListed[_userAddress];
    }

    function getUserByNumber(uint256 _userNumber) public view returns (UserInfo memory) {
        require(_userNumber > 0 && _userNumber <= _numbers.current(), "User number out of bounds");
        return whtList[_userNumber];
    }
}
