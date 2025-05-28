const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Artist Contracts Test Suite", function () {
  let ArtistMarketplace, artistMarketplace;
  let ArtistMint, artistMint;
  let ArtistWhiteList, artistWhiteList;
  let Proposals, proposals;
  let Events, events;
  let deployer, artist1, artist2, consumer;
  let initialPrice = ethers.utils.parseEther("0.1"); // Example price

  beforeEach(async function () {
    [deployer, artist1, artist2, consumer] = await ethers.getSigners();

    // Deploy ArtistMarketplace
    ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace");
    artistMarketplace = await ArtistMarketplace.deploy();
    await artistMarketplace.deployed();

    // Deploy ArtistWhiteList
    ArtistWhiteList = await ethers.getContractFactory("ArtistWhiteList");
    artistWhiteList = await ArtistWhiteList.deploy();
    await artistWhiteList.deployed();

    // Deploy Proposals
    Proposals = await ethers.getContractFactory("Proposals");
    proposals = await Proposals.deploy(artistMarketplace.address, artistWhiteList.address);
    await proposals.deployed();

    // Deploy ArtistMint
    ArtistMint = await ethers.getContractFactory("ArtistMint");
    artistMint = await ArtistMint.deploy(artistMarketplace.address, artistWhiteList.address);
    await artistMint.deployed();

    // Deploy Events
    Events = await ethers.getContractFactory('Events');
    events = await Events.deploy();
    await events.deployed();

    // Set ArtistMint address in ArtistMarketplace
    await artistMarketplace.setContractAddresses(artistMint.address, events.address );

    // Initialize quorum in Proposals
    await proposals.initializeQuorum();

    await artistWhiteList.connect(deployer).addToWhtList(artist1.address, "ArtistOne");
    
    //console.log(isArtist1Whitelisted)
    //expect(isArtist1Whitelisted).to.be.true;

    const displayWhiteListedUsers = async () => {
      const count = await artistWhiteList.getCurrentWhtListCounter();
      const items = [];

      for (let i = 0; i < count; i++) {
        try {
          //const userInfo = await artistWhiteList.getUserByNumber(i + 1);
          const isArtist1Whitelisted = await artistWhiteList.isWhitelisted(artist1.address);
          items.push(isArtist1Whitelisted);
        } catch (error) {
          console.error(`Error fetching user at index ${i + 1}:`, error);
        }
      }  
      //console.log(items);
    };

    displayWhiteListedUsers()
  });

  describe("mintNFT", function () {
    it("should mint a token, create a listing, and emit an event", async function () {
      const toWei = (n) => ethers.utils.parseEther(n.toString());
      const fromWei = (n) => ethers.utils.formatEther(n);

      const tokenData = {
        supplyAmount: 10,
        tokenId: 0, // placeholder
        nftName: "ArtPiece",
        artistName: "ArtistOne",
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseEther("1"),
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["file1", "file2"],
        fileTypes: ["type1", "type2"],
        tokenCIDs: ["cid1", "cid2"],
        nestIDs: [1, 2]
      };

      const listPrice = toWei(0.02)
      const mintPrice = listPrice.mul(tokenData.supplyAmount)
      console.log("Mint Price: ", mintPrice.toString())

      const isArtist1Whitelisted = await artistWhiteList.isWhitelisted(artist1.address);
      console.log("Is artist1 whitelisted before minting:", isArtist1Whitelisted);
      expect(isArtist1Whitelisted).to.be.true;

      // Mint the token
      const tx = await artistMint.connect(artist1).mintNFT(tokenData, fileData, [], { value: mintPrice });

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      // Get the block timestamp
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      console.log("Block: ", block)
      const blockTimestamp = block.timestamp;
      console.log("Receipt timestamp: ", blockTimestamp)

      // Now perform the assertion
      await expect(tx)
      .to.emit(events, "TokenListedSuccess")
      .withArgs(
        tokenData.supplyAmount,
        1, // Assuming tokenId 1
        tokenData.nftName,
        tokenData.artistName,
        tokenData.artistAddress,
        artistMarketplace.address,
        tokenData.sellerAddress,
        tokenData.nftPrice,
        true
        //blockTimestamp // Compare the emitted event's timestamp with the actual block timestamp
      );

      console.log(receipt.events)

      // Check ArtistMint contract balance
      const contractBalance = await ethers.provider.getBalance(artistMint.address);
      console.log("Artist Mint Contract Balance: ", contractBalance.toString())

      // Verify the listing
      const listedToken = await artistMarketplace.getListedFromTokenId(1); // Assuming ID is 1
      expect(listedToken.nftName).to.equal(tokenData.nftName);
      expect(listedToken.supplyAmount).to.equal(tokenData.supplyAmount);
    });
  });

  describe("burnTokens", function () {
    it("should burn tokens and refund", async function () {
      const toWei = (n) => ethers.utils.parseEther(n.toString());
      const fromWei = (n) => ethers.utils.formatEther(n);

      // Mint tokens first
      const tokenData = {
        supplyAmount: 10,
        tokenId: 0,
        nftName: "ArtPiece",
        artistName: "ArtistOne",
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseEther("1"),
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["file1", "file2"],
        fileTypes: ["type1", "type2"],
        tokenCIDs: ["cid1", "cid2"],
        nestIDs: [1, 2]
      };

      const listPrice = toWei(0.02)
      const mintPrice = listPrice.mul(tokenData.supplyAmount)
      console.log("Mint Price: ", mintPrice.toString())

      await artistMint.connect(artist1).mintNFT(tokenData, fileData, [], {value: mintPrice});

      // Check ArtistMint contract balance
      const contractBalance = await ethers.provider.getBalance(artistMint.address);
      console.log("Artist Mint Contract Balance: ", contractBalance.toString())

      // Check token balance of Artist Marketplace contract
      const contractBalance1 = await artistMint.balanceOf(artistMarketplace.address, 1)
      console.log("Minted Tokens Before: ", contractBalance1.toString())

      // Burn tokens
      await artistMint.connect(artist1).burnTokens(1, 5);

      // Check refund
      const contractBalance2 = await artistMint.balanceOf(artistMarketplace.address, 1);
      console.log("Minted Tokens After: ", contractBalance2.toString())
      expect(contractBalance2).to.be.gt(0);
    });
  });

  describe("transferRefund", function () {
    it("should transfer refund correctly", async function () {
      const toWei = (n) => ethers.utils.parseEther(n.toString());
      const fromWei = (n) => ethers.utils.formatEther(n);

      // Mint tokens and burn some to get a refund
      const tokenData = {
        supplyAmount: 10,
        tokenId: 0,
        nftName: "ArtPiece",
        artistName: "ArtistOne",
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseEther("1"),
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["file1", "file2"],
        fileTypes: ["type1", "type2"],
        tokenCIDs: ["cid1", "cid2"],
        nestIDs: [1, 2]
      };

      const listPrice = toWei(0.02)
      const mintPrice = listPrice.mul(tokenData.supplyAmount)
      console.log("Mint Price: ", mintPrice.toString())

      // Fund the contract with some Ether
      await deployer.sendTransaction({
        to: artistMint.address, 
        value: ethers.utils.parseEther("5") // Fund contract with 5 Ether
      });

      const balance = await ethers.provider.getBalance(artist1.address);
      console.log("ArtistOne Balance: ", balance.toString())

      await artistMint.connect(artist1).mintNFT(tokenData, fileData, [], {value: mintPrice});
      console.log("Mint Contract Balance Before: ", (await ethers.provider.getBalance(artistMint.address)).toString())

      const balance1 = await ethers.provider.getBalance(artist1.address);
      console.log("ArtistOne Balance Before: ", balance1.toString())

      await artistMint.connect(artist1).burnTokens(1, 5);

      // Transfer refund
      const refundAmount = listPrice.mul(5);
      console.log("Refund Amount: ", refundAmount.toString())
      const tx = await artistMint.connect(artist1).transferRefund(5, artist1.address);
      const receipt = await tx.wait();
      //console.log("Receipt", receipt)
      //console.log("Gas used:", receipt.gasUsed.toString());

      // Check balance
      console.log("Mint Contract Balance After: ", (await ethers.provider.getBalance(artistMint.address)).toString())
      const balance2 = await ethers.provider.getBalance(artist1.address);
      console.log("ArtistOne Balance After: ", balance2.toString())
      expect(balance2).to.be.gt(refundAmount);
    });
  });

  describe("executeSale", function () {
    it("should execute a sale correctly", async function () {
      // Mint and list tokens
      const tokenData = {
        supplyAmount: 10,
        tokenId: 0,
        nftName: "ArtPiece",
        artistName: "ArtistOne",
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseEther("1"),
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["file1", "file2"],
        fileTypes: ["type1", "type2"],
        tokenCIDs: ["cid1", "cid2"],
        nestIDs: [1, 2]
      };

      await artistMint.mintNFT(tokenData, fileData, []);
      
      // Execute sale
      await artistMarketplace.executeSale(1, 1, { value: ethers.utils.parseEther("1") });

      // Verify the sale
      const listedToken = await artistMarketplace.getListedFromTokenId(1);
      expect(listedToken.supplyAmount).to.equal(9); // One token sold
    });
  });

  describe("replenishNFTTokens", function () {
    it("should replenish multiple tokens correctly", async function () {
      // Define the initial mint data
      const initialSupplyAmount = 5;
      const mintPrice = ethers.utils.parseEther("0.01").mul(initialSupplyAmount);
      const nftName = "Test NFT";
      const artistName = "Test Artist";
      const nftPrice = ethers.utils.parseEther("0.05");

      const tokenData = {
        supplyAmount: initialSupplyAmount,
        tokenId: 1,
        nftName: nftName,
        artistName: artistName,
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: nftPrice,
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["file1", "file2"],
        fileTypes: ["type1", "type2"],
        tokenCIDs: ["cid1", "cid2"],
        nestIDs: [1, 2]
      };
  
      await artistMint.connect(artist1).mintNFT(tokenData, fileData, [], { value: mintPrice });

      // Get contract balance after minting NFT
      console.log("Contract Balance After Minting: ", (await ethers.provider.getBalance(artistMint.address)).toString())
  
      // Get the initial listed token details
      let listedToken = await artistMarketplace.getListedFromTokenId(1);
      expect(listedToken.supplyAmount).to.equal(initialSupplyAmount);
  
      // Replenish the token supply
      const replenishAmount = 3;
      const replenishCost = ethers.utils.parseEther("0.01").mul(replenishAmount);
  
      await artistMarketplace.connect(artist1).replenishNFTTokens(
        1,
        replenishAmount,
        ethers.utils.randomBytes(32), // Some arbitrary data
        { value: replenishCost }
      );
  
      // Check the updated token supply after replenishment
      listedToken = await artistMarketplace.getListedFromTokenId(1);
      expect(listedToken.supplyAmount).to.equal(initialSupplyAmount + replenishAmount);

      // Check the balance of ArtistMint.sol
      console.log("Mint Contract Balance After: ", (await ethers.provider.getBalance(artistMint.address)).toString())
    });
  })

  describe("deleteNFTTokens", function () {
    it("should delete tokens correctly", async function () {
      const toWei = (n) => ethers.utils.parseEther(n.toString());
      const fromWei = (n) => ethers.utils.formatEther(n);

      // Mint and list tokens
      const tokenData = {
        supplyAmount: 10,
        tokenId: 0,
        nftName: "ArtPiece",
        artistName: "ArtistOne",
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseEther("1"),
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["file1", "file2"],
        fileTypes: ["type1", "type2"],
        tokenCIDs: ["cid1", "cid2"],
        nestIDs: [1, 2]
      };

      const listPrice = toWei(0.02)
      await artistMarketplace.updateListPrice(listPrice)

      const mintPrice = listPrice.mul(tokenData.supplyAmount)
      console.log("Mint Price: ", mintPrice.toString())

      const balance = await ethers.provider.getBalance(artist1.address);
      console.log("ArtistOne Balance: ", balance.toString())

      await artistMint.connect(artist1).mintNFT(tokenData, fileData, [], {value: mintPrice});
      console.log("Mint Contract Balance Before: ", (await ethers.provider.getBalance(artistMint.address)).toString())

      const balance1 = await ethers.provider.getBalance(artist1.address);
      console.log("ArtistOne Balance Before: ", balance1.toString())
      
      // Delete tokens
      await artistMarketplace.connect(artist1).deleteNFTTokens(1, 5);

      // Check balance
      const balance2 = await ethers.provider.getBalance(artist1.address);
      console.log("ArtistOne Balance After: ", balance2.toString())
      console.log("Mint Contract Balance After: ", (await ethers.provider.getBalance(artistMint.address)).toString())

      // Verify the deletion
      const listedToken = await artistMarketplace.getListedFromTokenId(1);
      expect(listedToken.supplyAmount).to.equal(5); // Five tokens remaining
    });
  });

  describe("transferFunds", function () {
    it("should transfer funds correctly", async function () {
      // Transfer funds to the marketplace
      const transferAmount = ethers.utils.parseEther("1");
      await deployer.sendTransaction({
        to: artistMarketplace.address,
        value: transferAmount
      });

      // Transfer funds from marketplace to artist1
      await artistMarketplace.transferFunds(artist1.address, transferAmount);

      // Check the balance of artist1
      const balance = await ethers.provider.getBalance(artist1.address);
      expect(balance).to.be.gt(transferAmount);
    });
  });
});
