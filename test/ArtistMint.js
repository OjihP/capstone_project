const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
  
const ether = tokens

describe("ArtistMint - mintToken function", function () {
  let artistMarketplace, artistMint, artistWhiteList, owner, user1, user2;
  let listPrice, tokenData, fileData, bytes;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ArtistWhiteList = await ethers.getContractFactory("ArtistWhiteList");
    artistWhiteList = await ArtistWhiteList.deploy();
    await artistWhiteList.deployed();

    const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace");
    artistMarketplace = await ArtistMarketplace.deploy();
    await artistMarketplace.deployed();

    const ArtistMint = await ethers.getContractFactory("ArtistMint");
    artistMint = await ArtistMint.deploy(artistMarketplace.address, artistWhiteList.address);
    await artistMint.deployed();

    await artistMarketplace.setTokenCallAddress(artistMint.address);

    await artistWhiteList.addToWhtList(user1.address, "Artist ONE");

    listPrice = ethers.utils.parseEther("1");
    await artistMarketplace.updateListPrice(listPrice);

    tokenData = {
      supplyAmount: 10,
      nftName: "Test NFT",
      artistName: "Artist 1",
      artistAddress: user1.address,
      ownerAddress: artistMarketplace.address,
      sellerAddress: user1.address,
      nftPrice: ethers.utils.parseEther("0.1"),
      currentlyListed: true,
    };

    fileData = {
      fileNames: ["file1", "file2"],
      fileTypes: ["image/png", "image/jpeg"],
      tokenCIDs: ["cid1", "cid2"],
      nestIDs: [1, 2],
    };

    bytes = "0x";
    const mintPrice = listPrice.mul(tokenData.supplyAmount);
    console.log(ether(mintPrice))
    console.log(mintPrice)
  });

  it("should successfully mint a new token", async function () {
    await artistMint.connect(user1).mintToken(tokenData, fileData, bytes, { value: ether(mintPrice) });

    const tokenId = await artistMint.tokenSupply();
    expect(tokenId).to.be.gt(0);

    const tokenDataFromContract = await artistMint.tokens(tokenId);
    expect(tokenDataFromContract.supplyAmount).to.equal(tokenData.supplyAmount);
    expect(tokenDataFromContract.nftName).to.equal(tokenData.nftName);
  });

  it("should fail if payment is insufficient", async function () {
    const insufficientMintPrice = mintPrice.sub(ethers.utils.parseEther("0.1"));

    await expect(
      artistMint.connect(user1).mintToken(tokenData, fileData, bytes, { value: insufficientMintPrice })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("should fail if token data is invalid", async function () {
    // Example of invalid data: supplyAmount is zero
    const invalidTokenData = { ...tokenData, supplyAmount: 0 };

    await expect(
      artistMint.connect(user1).mintToken(invalidTokenData, fileData, bytes, { value: mintPrice })
    ).to.be.revertedWith("Invalid token data");
  });

  it("should fail if user is not whitelisted", async function () {
    // Remove user1 from whitelist
    await artistWhiteList.removeFromWhtList(user1.address);

    await expect(
      artistMint.connect(user1).mintToken(tokenData, fileData, bytes, { value: mintPrice })
    ).to.be.revertedWith("User is not whitelisted");
  });
});
