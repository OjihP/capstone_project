const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Artist Contracts Test Suite", function () {
  let ArtistMarketplace, artistMarketplace;
  let ArtistMint, artistMint;
  let ArtistWhiteList, artistWhiteList;
  let Events, events;
  let Listing, listing;
  let deployer, artist1, artist2, consumer;
  let initialPrice = ethers.utils.parseEther("0.1"); // Example price

  beforeEach(async function () {
    [deployer, artist1, artist2, consumer] = await ethers.getSigners();

    // Deploy ArtistMarketplace
    ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace");
    artistMarketplace = await ArtistMarketplace.deploy();
    await artistMarketplace.deployed();

    // Deploy Events
    Events = await ethers.getContractFactory("Events");
    events = await Events.deploy();
    await events.deployed();

    // Deploy ArtistWhiteList
    ArtistWhiteList = await ethers.getContractFactory("ArtistWhiteList");
    artistWhiteList = await ArtistWhiteList.deploy(events.address);
    await artistWhiteList.deployed();

    // Deploy NFTListing
    Listing = await ethers.getContractFactory("NFTListing");
    listing = await Listing.deploy(events.address);
    await listing.deployed();

    // Deploy ArtistMint
    ArtistMint = await ethers.getContractFactory("ArtistMint");
    artistMint = await ArtistMint.deploy(listing.address, artistMarketplace.address);
    await artistMint.deployed();

    // Set ArtistMint address in ArtistMarketplace
    await artistMarketplace.setContractAddresses(
      artistMint.address,
      events.address,
      listing.address
    );
  });

  describe("mintNFT", function () {
    it("should mint a new NFT and list it on the marketplace", async function () {
      const tokenData = {
        supplyAmount: 10,
        tokenId: 0, // This will be overridden in the contract during minting
        nftName: "My First NFT",
        artistName: "ArtistOne",
        artistAddress: artist1.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseEther("0.2"),
        currentlyListed: true,
      };

      const fileData = {
        fileNames: ["artwork.png"],
        fileTypes: ["image/png"],
        tokenCIDs: ["QmSomeUniqueHash"],
        nestIDs: [0],
      };

      const listedPrice = await artistMarketplace.getListPrice();
      console.log(listedPrice)
      const totalPrice = listedPrice.mul(tokenData.supplyAmount);

      await artistMint.connect(artist1).mintNFT(tokenData, fileData, "0x", { value: totalPrice })

      // Verify that the NFT is listed in the NFTListing contract
      const listedToken = await listing.getListedFromTokenId(1);
      expect(listedToken.tokenId).to.equal(1);
      expect(listedToken.nftName).to.equal("My First NFT");
      expect(listedToken.artistName).to.equal("ArtistOne");
      expect(listedToken.artistAddress).to.equal(artist1.address);
      expect(listedToken.supplyAmount).to.equal(10);
      expect(listedToken.currentlyListed).to.be.true;

      // Verify that file data is correctly stored
      const storedFileData = await listing.getFileDataFromTokenId(1);
      expect(storedFileData.fileNames[0]).to.equal("artwork.png");
      expect(storedFileData.fileTypes[0]).to.equal("image/png");
      expect(storedFileData.tokenCIDs[0]).to.equal("QmSomeUniqueHash");

      // Verify that the event is registered in the Events mapping
      const tokenEvent = await events.getTokenEvent(1)
      console.log("Token Event: ", tokenEvent)
    });

    it("should fail if the price is insufficient", async function () {
      const tokenData = {
        supplyAmount: 5,
        tokenId: 0,
        nftName: "My Second NFT",
        artistName: "ArtistTwo",
        artistAddress: artist2.address,
        ownerAddress: artistMarketplace.address,
        sellerAddress: artist2.address,
        nftPrice: ethers.utils.parseEther("0.2"),
        currentlyListed: true,
      };

      const fileData = {
        fileNames: ["sculpture.png"],
        fileTypes: ["image/png"],
        tokenCIDs: ["QmAnotherUniqueHash"],
        nestIDs: [0],
      };

      const listedPrice = await artistMarketplace.getListPrice();
      const insufficientAmount = listedPrice.mul(tokenData.supplyAmount - 1);
      console.log(insufficientAmount)

      await expect(
        artistMint.connect(artist2).mintNFT(tokenData, fileData, "0x", { value: insufficientAmount })
      ).to.be.revertedWith("Invalid cost");
    });
  });
});
