const { expect } = require('chai');
const { ethers } = require('hardhat');

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

describe("ArtistMarketplace", function () {
    const NAME = 'Soleplex'
    const SYMBOL = 'PLEX'

    let artistContract,
        contractCreator,
        artist1,
        artist2,
        consumer

    beforeEach(async () => {
        let accounts = await ethers.getSigners()
        contractCreator = accounts[0]
        artist1 = accounts[1]
        artist2 = accounts[2]
        consumer = accounts[3]
    })

    describe('Deployment', () => {
        beforeEach(async () => {
            const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
            artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
        })

        it('has correct name', async () => {
            expect(await artistContract.name()).to.equal(NAME)
        })
      
        it('has correct symbol', async () => {
            expect(await artistContract.symbol()).to.equal(SYMBOL)
        })

        it('initializes artist address', async () => {
            expect(await artistContract.getArtistAddress()).to.equal(artist1.address)
        })

        it('returns the contract creator address', async () => {
            expect(await artistContract.getCreatorAddress()).to.equal(contractCreator.address)
        })

        it('should whitelist the artist in the constructor', async () => {
            const whiteListTheArtist = await artistContract.whiteList(artist1.address)
            expect(whiteListTheArtist).to.be.true
        })
    })

    describe('Sub Functions', () => {
        beforeEach(async () => {
            const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
            artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
        })

        it('should update listPrice when called by the owner', async function () {
            const newPrice = 100; // Set the desired new list price
        
            // Ensure that the owner is initially the contract creator
            expect(await artistContract.owner()).to.equal(contractCreator.address)
        
            // Call the updateListPrice function as the owner
            await artistContract.connect(contractCreator).updateListPrice(newPrice)
        
            // Check if the listPrice is updated
            expect(await artistContract.getListPrice()).to.equal(newPrice)
        })

        it('should revert if not called by the owner', async function () {
            const newPrice = 100; // Set the desired new list price
        
            // Ensure that the owner is initially not the contract creator
            await artistContract.updateListPrice(newPrice) // Change the contract creator to a different address
        
            // Attempt to call updateListPrice function by a non-owner
            await expect(artistContract.connect(artist1).updateListPrice(newPrice))
              .to.be.revertedWith('Only contract creator can update the listing price')
        })

        /*it('should return the latest ListedToken by calling getLatestIdToListedToken', async function () {
            // Perform some actions to add ListedTokens to idToListedToken mapping
            // For example, mint tokens, list them, etc.
        
            // Call the getLatestIdToListedToken function
            const latestListedToken = await yourContract.getLatestIdToListedToken();
        
            // Assert that the returned ListedToken is not null or undefined
            expect(latestListedToken).to.not.be.null;
        
            // Add more specific assertions based on your contract logic and data structure
            // For example, check properties of the returned ListedToken object
            // expect(latestListedToken.someProperty).to.equal(someExpectedValue);
        })*/

        /*it('should return the ListedToken for a specific tokenId by calling getListedForTokenId', async function () {
            const tokenId = 1; // Replace with the desired tokenId
        
            // Perform some actions to add a ListedToken to the idToListedToken mapping for the given tokenId
            // For example, mint a token, list it, etc.
        
            // Call the getListedForTokenId function
            const listedToken = await yourContract.getListedForTokenId(tokenId);
        
            // Assert that the returned ListedToken is not null or undefined
            expect(listedToken).to.not.be.null;
        
            // Add more specific assertions based on your contract logic and data structure
            // For example, check properties of the returned ListedToken object
            // expect(listedToken.someProperty).to.equal(someExpectedValue);
        })*/
        
        /*it('should return null for a tokenId that has not been listed', async function () {
            const tokenId = 2; // Replace with a tokenId that has not been listed
        
            // Call the getListedForTokenId function
            const listedToken = await yourContract.getListedForTokenId(tokenId);
        
            // Assert that the returned ListedToken is null
            expect(listedToken).to.be.null;
        })*/

        /*it('should return the current token ID by calling getCurrentToken', async function () {
            // Perform some actions to mint tokens, if necessary
        
            // Call the getCurrentToken function
            const currentTokenId = await yourContract.getCurrentToken();
        
            // Assert that the returned current token ID is as expected
            // For example, you might expect it to be 1 if it's the first token minted
            expect(currentTokenId).to.equal(/* Expected current token ID )
        })*/
    })

    describe('Main Functions', () => {
        describe('createToken', async () => {
            describe('Success', async () => {
                beforeEach(async () => {
                    const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                    artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
                })
    
                it('should create a new token with the specified URI and price when called by a whitelisted address', async function () {
                    const tokenURI = 'your_token_uri' // Replace with the desired token URI
                    const price = 100 // Replace with the desired token price
                
                    // Add artist to the whitelist (redundant)
                    //await artistContract.addToWhtList(artist1.address);
                
                    // Call the createToken function as a whitelisted address
                    await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
                
                    // Check if the token has been minted
                    const newTokenId = await artistContract.getCurrentToken()
                    expect(newTokenId).to.equal(1) 
                
                    // Check if the token URI is set correctly
                    const createdTokenURI = await artistContract.tokenURI(newTokenId)
                    expect(createdTokenURI).to.equal(tokenURI)
                
                    // Check if the ListedToken is created with the correct price
                    const listedToken = await artistContract.getListedForTokenId(newTokenId)
                    expect(listedToken.price).to.equal(price)
                })
            })
            
            describe('Failure', async () => {
               beforeEach(async () => {
                    const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                    artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
               })
    
                it('should revert if called by a non-whitelisted address', async function () {
                    const tokenURI = 'your_token_uri' // Replace with the desired token URI
                    const price = 100 // Replace with the desired token price
            
                    // Attempt to call createToken function by a non-whitelisted address
                    await expect(artistContract.connect(consumer).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') }))
                      .to.be.revertedWith("User is not whitelisted")
                })
            })
        })

        describe('createListedToken', async () => {
            describe('Success', async () => {
                beforeEach(async () => {
                    const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                    artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
               })

                it('should create a ListedToken with the specified tokenId and price when called with the correct value', async function () {
                    const tokenId = 1; // Replace with the desired tokenId
                    const tokenURI = 'your_token_uri' // Replace with the desired token URI
                    const price = 100; // Replace with the desired token price
                
                    // Call the createListedToken function with the correct value
                    await expect(artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') }))
                      .to.emit(artistContract, 'TokenListedSuccess')
                      .withArgs(tokenId, artist1.address, artistContract.address, artist1.address, price, true);
                
                    // Check if the ListedToken is created with the correct values
                    const listedToken = await artistContract.getListedForTokenId(tokenId);
                    expect(listedToken.tokenId).to.equal(tokenId);
                    expect(listedToken.creator).to.equal(artist1.address);
                    expect(listedToken.owner).to.equal(artistContract.address);
                    expect(listedToken.price).to.equal(price);
                    expect(listedToken.currentlyListed).to.equal(true);
                  });
            })

            describe('Failure', async () => {

            })
        })
    })
})