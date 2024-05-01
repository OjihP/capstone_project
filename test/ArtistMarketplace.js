const { expect } = require('chai');
const { ethers } = require('hardhat');

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

describe("ArtistMarketplace", function () {
    const NAME = 'ArtMarket'
    const SYMBOL = 'AMART'
    const NFT_NAME = "Test NFT"
    const FILE_NAMES = [ 'file1', 'file2' ]
    const FILE_TYPES = [ 'type1', 'type2' ]
    const TOKEN_CIDS = [ 'cid1', 'cid2' ]
    const PRICE_OF_NFT = toWei(1)
    const USER_NUMBER = 1
    const LIST_PRICE = toWei(0.01)

    let artistMarketplace,
        contractCreator,
        artist1,
        artist2,
        consumer,
        consumer2

    beforeEach(async () => {
        let accounts = await ethers.getSigners()
        contractCreator = accounts[0]
        artist1 = accounts[1]
        artist2 = accounts[2]
        consumer = accounts[3]
        consumer2 = accounts[4]
    })

    describe('Deployment', () => {
        beforeEach(async () => {
            const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace")
            artistMarketplace = await ArtistMarketplace.deploy(NAME, SYMBOL, artist1.address)
            await artistMarketplace.deployed()
        })

        it("Has correct name and symbol", async () => {
            expect(await artistMarketplace.name()).to.equal(NAME)
            expect(await artistMarketplace.symbol()).to.equal(SYMBOL)
        })

        it("Should set the contract creator correctly", async function () {
            const creatorAddress = await artistMarketplace.getCreatorAddress()
                //console.log("Creator Address: ", creatorAddress)
                //console.log("Defined Creator Address: ", contractCreator.address)
            expect(await artistMarketplace.getCreatorAddress()).to.equal(contractCreator.address);
        });
    
        it("Should set the artist address correctly", async function () {
            const artistAddress = await artistMarketplace.getArtistAddress()
                //console.log("Artist Address: ", artistAddress)
            expect(await artistMarketplace.getArtistAddress()).to.equal(artist1.address);
        });
    
        it("Should add the artist to the whitelist with predefined name 'Artist'", async function () {
            // Check if the artist is whitelisted with the name 'Artist'
            //const artist = await artistMarketplace.whiteList(1);
                //console.log("White List: ", artist)
            //expect(artist.isListed).to.be.true;
            //expect(artist.nameForAddress).to.equal("Artist");

            const userInfo = await artistMarketplace.whiteList(artist1.address);
            expect(userInfo.nameForAddress).to.equal("Artist");
            expect(userInfo.isListed).to.equal(true);
        });
    })

    describe('Admin Functions', () => {
        beforeEach(async () => {
            const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace")
            artistMarketplace = await ArtistMarketplace.deploy(NAME, SYMBOL, artist1.address)
            await artistMarketplace.deployed()
        })

        it("should return the current listing price", async function () {
            const price = await artistMarketplace.getListPrice();
            expect(price).to.equal(LIST_PRICE);
        });

        it("should allow the contract creator to update the listing price", async function () {
            const newPrice = toWei(0.02);
            await artistMarketplace.updateListPrice(newPrice);
            const updatedPrice = await artistMarketplace.getListPrice();
            expect(updatedPrice).to.equal(newPrice);
        });

        it("should revert if called by a non-contract creator", async function () {
            const newPrice = toWei(0.02);
            await expect(artistMarketplace.connect(artist1).updateListPrice(newPrice)).to.be.revertedWith("Only contract creator can update the listing price");
        });
    })

    describe('Sub Functions', () => {
        beforeEach(async () => {
            const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace")
            artistMarketplace = await ArtistMarketplace.deploy(NAME, SYMBOL, artist1.address)
            await artistMarketplace.deployed()

            // Create a listed token for testing
            await artistMarketplace.connect(artist1).createToken(
                1, "NFT Test", PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
            )
        })
        
        it("should return the details of a listed token for a given token ID", async function () {
            // Assuming tokenId is valid and exists
            const tokenId = 1;
    
            // Call the function
            const listedToken = await artistMarketplace.getListedFromTokenId(tokenId);
    
            // Assert the listed token details are correct
            expect(listedToken.mintAmount).to.equal(1); // Assuming mint amount is 1
            expect(listedToken.nftName).to.equal("NFT Test");
            expect(listedToken.priceOfNFT).to.equal(toWei(1));
            expect(listedToken.fileNames).to.eql(FILE_NAMES);
            expect(listedToken.fileTypes).to.eql(FILE_TYPES);
            expect(listedToken.tokenCIDs).to.eql(TOKEN_CIDS);
            expect(listedToken.currentlyListed).to.equal(true);
        });

        it("should return the token ID associated with a listed token", async function () {
            // Assuming tokenId is valid and exists
            const tokenId = 1;
    
            // Call the function
            const returnedTokenId = await artistMarketplace.getTokenIdFromListedToken(tokenId);
    
            // Assert the returned token ID is correct
            expect(returnedTokenId).to.equal(tokenId);
        });

        it("Should return the correct NFT name from the ListedToken", async function () {
            const tokenId = 1
            const nftName = await artistMarketplace.getNFTNameFromListedToken(tokenId)
            expect(nftName).to.equal("NFT Test")
        });
    
        it("Should return the correct price of the NFT from the ListedToken", async function () {
            const tokenId = 1
            const price = await artistMarketplace.getTokenPriceFromListedToken(tokenId)
            expect(price).to.equal(PRICE_OF_NFT)
        });
    
        it("Should return the correct file names from the ListedToken", async function () {
            const tokenId = 1
            const fileNames = await artistMarketplace.getFileNamesFromListedToken(tokenId)
            expect(fileNames).to.eql(FILE_NAMES)
        });
    
        it("Should return the correct file types from the ListedToken", async function () {
            const tokenId = 1
            const fileTypes = await artistMarketplace.getFileTypesFromListedToken(tokenId)
            expect(fileTypes).to.eql(FILE_TYPES)
        });
    
        it("Should return the correct token CIDs from the ListedToken", async function () {
            const tokenId = 1
            const tokenCIDs = await artistMarketplace.getTokenCIDsFromListedToken(tokenId)
            expect(tokenCIDs).to.eql(TOKEN_CIDS)
        });

        it("should return true for a currently listed token", async function () {
            // Assuming tokenId is valid and exists
            const tokenId = 1;
    
            // Call the function
            const currentlyListed = await artistMarketplace.getCurrentlyListedFromListedToken(tokenId);
    
            // Assert the returned value is true
            expect(currentlyListed).to.be.true;
        });
    
        it("should return false for a token that is not currently listed", async function () {
            // Assuming tokenId is valid and exists, but token is not currently listed
            const tokenId = 1;
    
            // Modify token to set currentlyListed to false
            await artistMarketplace.executeSale(tokenId, 1, { value: PRICE_OF_NFT });
    
            // Call the function
            const currentlyListed = await artistMarketplace.getCurrentlyListedFromListedToken(tokenId);
    
            // Assert the returned value is false
            expect(currentlyListed).to.be.false;
        });

        it("should return an array of token IDs for all listed tokens", async function () {
            // Create multiple listed tokens for testing
            await artistMarketplace.connect(artist1).createToken(
                1, "NFT Test 1", PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
            );
            await artistMarketplace.connect(artist1).createToken(
                1, "NFT Test 2", PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
            );

            // Call the function
            const tokenIds = await artistMarketplace.getTokenIdsFromListedToken();
                //console.log("Token Ids: ", tokenIds)
    
            // Assert that the array length is equal to the number of tokens listed
            expect(tokenIds.length).to.equal(3);
    
            // Assuming tokenId 1, 2, and 3 are listed
            expect(tokenIds.toString()).to.include(1);
            expect(tokenIds.toString()).to.include(2);
            expect(tokenIds.toString()).to.include(3);
        });
    })

    describe('Main Functions', () => {
        describe('createToken', () => {
            beforeEach(async () => {
                const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace")
                artistMarketplace = await ArtistMarketplace.deploy(NAME, SYMBOL, artist1.address)
                await artistMarketplace.deployed()
            })

            it("should revert if user is not whitelisted", async function () {
                // Attempt to call createToken function with artist2, who is not whitelisted
                await expect(artistMarketplace.connect(artist2).createToken(
                    1, NFT_NAME, PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
                )).to.be.revertedWith("User is not white listed");
            });
    
            it("should create a new listed token with the specified details", async function () {
                // Create a new listed token
                await artistMarketplace.connect(artist1).createToken(
                    1, NFT_NAME, PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
                );
        
                // Retrieve the created token details
                const listedToken = await artistMarketplace.getListedFromTokenId(1);
        
                // Check if the token is listed
                expect(listedToken.currentlyListed).to.be.true;
        
                // Check if the token details match the provided inputs
                expect(listedToken.mintAmount).to.equal(1);
                expect(listedToken.nftName).to.equal(NFT_NAME);
                expect(listedToken.priceOfNFT).to.equal(PRICE_OF_NFT);
                expect(listedToken.fileNames).to.have.members(FILE_NAMES);
                expect(listedToken.fileTypes).to.have.members(FILE_TYPES);
                expect(listedToken.tokenCIDs).to.have.members(TOKEN_CIDS);
            });
        
            it("should revert if insufficient payment is sent", async function () {
                // Attempt to create a new listed token with insufficient payment
                await expect(artistMarketplace.connect(artist1).createToken(
                    2, NFT_NAME, PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
                )).to.be.revertedWith("Invalid cost");
            });
        })
    })
})
