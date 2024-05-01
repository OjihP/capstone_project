const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("WhiteList Contract", function () {
    let WhiteList;
    let whiteList;
    let owner;
    let user1;
    let user2;
  
    beforeEach(async function () {
      // Deploy the contract
      WhiteList = await ethers.getContractFactory("ArtistWhiteList");
      whiteList = await WhiteList.deploy();
      await whiteList.deployed();
  
      // Get accounts from Hardhat
      [owner, user1, user2] = await ethers.getSigners();
    });
  
    it("Should add user to whitelist", async function () {
      const userName = "User1";
  
      // Add user1 to the whitelist
      await whiteList.addToWhtList(user1.address, userName);
  
      // Get user1's info
      const userInfo = await whiteList.getUserByAddress(user1.address);
  
      // Check if user1 is listed
      expect(userInfo.isListed).to.equal(true);
      // Check if user1's name matches
      expect(userInfo.nameForAddress).to.equal(userName);
    });
  
    /*it("Should remove user from whitelist", async function () {
      // Add user2 to the whitelist
      await whiteList.addToWhtList(user2.address, "User2");
  
      // Remove user2 from the whitelist
      await whiteList.removeFromWhtList(user2.address);
  
      // Get user2's info
      const userInfo = await whiteList.getUserByAddress(user2.address);
  
      // Check if user2 is not listed
      expect(userInfo.isListed).to.equal(false);
    });*/
  
    /*it("Should get user by name", async function () {
      const userName = "User3";
  
      // Add user1 to the whitelist
      await whiteList.addToWhtList(user1.address, userName);
  
      // Get user by name
      const userInfo = await whiteList.getUserByName(userName);
  
      // Check if user1's address matches
      expect(userInfo.userAddress).to.equal(user1.address);
    });*/
  
    it("Should get all users on whitelist", async function () {
      // Add user1 and user2 to the whitelist
      await whiteList.addToWhtList(user1.address, "User1");
      await whiteList.addToWhtList(user2.address, "User2");
  
      // Get all users on whitelist
      const users = await whiteList.getAllUsersOnWhiteList();
        console.log("Useres on Whitelist: ", users)
  
      // Check if correct number of users is returned
      expect(users.length).to.equal(2);
      // Check if user1's address is included
      expect(users[0].userAddress).to.equal(user1.address);
      // Check if user2's address is included
      expect(users[1].userAddress).to.equal(user2.address);
    });

    it("should return user numbers on the whitelist", async function () {
      // Define usernames
      const userName1 = "User1";
      const userName2 = "User2"
      // Add tests users to the whitelist
      await whiteList.addToWhtList(user1.address, userName1);
      await whiteList.addToWhtList(user1.address, userName2);

      const userNumbers = await whiteList.getUserNumbersOnWhiteList();
        console.log(userNumbers.toString())
      expect(userNumbers.length).to.equal(2);
      expect(userNumbers[0]).to.equal(1);
    });
  });
