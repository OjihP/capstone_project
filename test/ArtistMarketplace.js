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
        consumer,
        consumer2

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

        it('should return the latest ListedToken by calling getLatestIdToListedToken', async function () {
            const tokenURI = 'your_token_uri' // Replace with the desired token URI
            const price = 100 // Replace with the desired token price

            // Perform some actions to add ListedTokens to idToListedToken mapping
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
        
            // Call the getLatestIdToListedToken function
            const latestListedToken = await artistContract.getLatestIdToListedToken();
        
            // Assert that the returned ListedToken is not null or undefined
            expect(latestListedToken.currentlyListed).to.equal(true);
        
            // Add more specific assertions based on your contract logic and data structure
            // For example, check properties of the returned ListedToken object
            // expect(latestListedToken.someProperty).to.equal(someExpectedValue);
        })

        it('should return the ListedToken for a specific tokenId by calling getListedForTokenId', async function () {
            const tokenURI = 'your_token_uri' // Replace with the desired token URI
            const price = 100 // Replace with the desired token price
            const tokenId = 1; // Replace with the desired tokenId
        
            // Perform some actions to add a ListedToken to the idToListedToken mapping for the given tokenId
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
        
            // Call the getListedForTokenId function
            const listedToken = await artistContract.getListedForTokenId(tokenId);
        
            // Assert that the returned ListedToken is not null or undefined
            expect(listedToken.currentlyListed).to.equal(true);
        
            // Add more specific assertions based on your contract logic and data structure
            // For example, check properties of the returned ListedToken object
            // expect(listedToken.someProperty).to.equal(someExpectedValue);
        })
        
        it('should return false for a tokenId that has not been listed', async function () {
            const tokenId = 2; // Replace with a tokenId that has not been listed
        
            // Call the getListedForTokenId function
            const listedToken = await artistContract.getListedForTokenId(tokenId);
            
            // Assert that the returned ListedToken is not listed
            expect(listedToken.currentlyListed).to.equal(false)
        })

        it('should return the correct token URI', async function () {
            const tokenId = 1;
            const tokenURI = 'https://example.com/token/1';
            const price = 100;
            
            // Set token URI
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') });
        
            // Get token URI
            const returnedTokenURI = await artistContract.getTokenURI(tokenId);
            console.log(returnedTokenURI)
            // Assert that the returned token URI matches the expected value
            expect(returnedTokenURI).to.equal(tokenURI);
          })

        it("should return an array of token IDs", async function () {
            const tokenURI = 'your_token_uri' // Replace with the desired token URI
            const price = 100 // Replace with the desired token price
        
            // Perform some actions to add a ListedToken to the idToListedToken mapping for the given tokenId
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
        
            // Check if the length of the returned array matches the expected length
            const arrayLength = await artistContract.getTokenIdsFromListedToken()
            console.log(arrayLength)
            expect(arrayLength.length).to.equal(3);
        
            // You can add more specific assertions based on your use case
            // For example, you can check if the token IDs are in the expected range
            // or compare them with specific values from your deployed contract
        
            // Example: Check if the first token ID is greater than or equal to 0
            //expect(TokenIdsFromListedToken[0]).to.be.at.least(0);
          })

        it('should return the current token ID by calling getCurrentToken', async function () {
            const tokenURI = 'your_token_uri' // Replace with the desired token URI
            const price = 100 // Replace with the desired token price

            // Perform some actions to mint tokens, if necessary
            await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
        
            // Call the getCurrentToken function
            const currentTokenId = await artistContract.getCurrentToken();
        
            // Assert that the returned current token ID is as expected
            // For example, you might expect it to be 1 if it's the first token minted
            expect(currentTokenId).to.equal(1)
        })
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

                it('should demonstrate basic event subscription and history', async () => {
                    const tokenId = 1; // Replace with the desired tokenId
                    const tokenURI_1 = 'your_token_uri_1' // Replace with the desired token URI
                    const tokenURI_2 = 'your_token_uri_2' // Replace with the desired token URI
                    const tokenURI_3 = 'your_token_uri_3' // Replace with the desired token URI
                    const price1 = 100; // Replace with the desired token price
                    const price2 = 200; // Replace with the desired token price
                    const price3 = 300; // Replace with the desired token price

                    let artistMint = await artistContract.connect(artist1).createToken(tokenURI_1, price1, { value: ethers.utils.parseEther('0.01') })
                    await artistMint.wait()

                    artistMint = await artistContract.connect(artist1).createToken(tokenURI_2, price2, { value: ethers.utils.parseEther('0.01') })
                    await artistMint.wait()

                    artistMint = await artistContract.connect(artist1).createToken(tokenURI_3, price3, { value: ethers.utils.parseEther('0.01') })
                    await artistMint.wait()

                    let eventStream = await artistContract.queryFilter('TokenListedSuccess')
                        console.log(eventStream)
                })
            })

            describe('Failure', async () => {
                beforeEach(async () => {
                    const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                    artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
                })

                it('should revert if called with the incorrect value', async function () {
                    const tokenId = 2; // Replace with the desired tokenId
                    const price = 100; // Replace with the desired token price
                
                    // Attempt to call createListedToken function with the incorrect value
                    await expect(artistContract.connect(artist1).createToken(tokenId, price, { value: ethers.utils.parseEther('0.5') }))
                      .to.be.revertedWith('Please send the correct price');
                });
            })
        })

        describe('getAllNFTs', async () => {
            beforeEach(async () => {
                const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
            })

            it('should return an array of ListedToken with all NFTs in the marketplace', async function () {
                const tokenURI = 'your_token_uri' // Replace with the desired token URI
                const price = 100; // Replace with the desired token price

                // Add two NFTs to the array
                await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
                await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
            
                // Call the getAllNFTs function
                const allNFTs = await artistContract.getAllNFTs();
            
                // Assert that the returned array is not null or undefined
                expect(allNFTs).to.not.be.null;
            
                // Add more specific assertions based on your contract logic and data structure
                // For example, check the length of the returned array
                // expect(allNFTs.length).to.equal(expectedLength);
            
                // Or check properties of the individual ListedToken objects in the array
                // expect(allNFTs[0].someProperty).to.equal(someExpectedValue);
            })
        })

        describe('getMyIds', async () => {
            beforeEach(async () => {
                const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
            })

            it('should return an array of ListedToken owned or listed by the caller', async function () {
                const tokenURI = 'your_token_uri' // Replace with the desired token URI
                const price = toWei(100); // Replace with the desired token price
                const tokenId1 = 1
                const tokenId2 = 2
                const tokenId3 = 3

                // Perform some actions to add ListedTokens to idToListedToken mapping
                await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
                await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })
                await artistContract.connect(artist1).createToken(tokenURI, price, { value: ethers.utils.parseEther('0.01') })

                // Purchase created NFT as the consumer
                await artistContract.connect(consumer).executeSale(tokenId1, { value: toWei(100) })
                await artistContract.connect(consumer).executeSale(tokenId2, { value: toWei(100) })
                await artistContract.connect(consumer).executeSale(tokenId3, { value: toWei(100) })

                // Check consumer wallet for the NFT Id using function
                const ownerIds = await artistContract.connect(consumer).getMyIds(consumer.address);

                const listedId = await artistContract.getListedForTokenId(tokenId1)
                console.log(listedId.toString())
                
                // Assert that the returned array is not null or undefined
                expect(ownerIds).to.have.lengthOf(3); // Assuming the owner owns 3 tokens
                expect(ownerIds.toString()).to.include(1);
                expect(ownerIds.toString()).to.include(2);
                expect(ownerIds.toString()).to.include(3);
            
                // Add more specific assertions based on your contract logic and data structure
                // For example, check the length of the returned array
                // expect(ownerNFTs.length).to.equal(expectedLength);
            
                // Or check properties of the individual ListedToken objects in the array
                // expect(ownerNFTs[0].someProperty).to.equal(someExpectedValue);
            });
            
            it('should return an empty array for a user with no owned or listed NFTs', async function () {
                // Call the getMyNFTs function as another user
                const userNFTs = await artistContract.connect(consumer).getMyIds(consumer.address);
                
                // Assert that the returned array is empty
                expect(userNFTs.length).to.equal(0);
            });
        })

        describe('executeSale', async () => {
            describe('Success', async () => {
                beforeEach(async () => {
                    const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                    artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
                })

                it('should execute the sale and transfer ownership when called with the correct value', async function () {
                    const tokenId = 1; // Replace with the desired tokenId
                
                    // Mint a token and list it for sale
                    await artistContract.connect(artist1).createToken('your_token_uri', toWei(100), { value: ethers.utils.parseEther('0.01') });

                    const listedToken = await artistContract.getListedForTokenId(tokenId);
                    const ownerBeforeSale = await artistContract.ownerOf(tokenId);
                        console.log('Owner before sale using ownerOf: ', ownerBeforeSale)
                        console.log('Owner before sale in struct : ', listedToken.owner)
                        console.log('Seller before sale: ', listedToken.seller)
                        console.log('listedToken: ', listedToken)

                    // Call the executeSale function as the buyer with the correct value
                    await expect(artistContract.connect(consumer).executeSale(tokenId, { value: toWei(100) }))
                      .to.emit(artistContract, 'Transfer')
                      .withArgs(artistContract.address, consumer.address, tokenId)
                      .and.to.emit(artistContract, 'Approval')
                      .withArgs(consumer.address, artistContract.address, tokenId)
                
                    // Check if ownership is transferred
                    const ownerAfterSale = await artistContract.ownerOf(tokenId);
                        console.log('Owner after sale using ownerOf: ', ownerAfterSale)
                    expect(ownerAfterSale).to.equal(consumer.address);
                
                    // Check if the ListedToken is updated
                    const updatedListedToken = await artistContract.getListedForTokenId(tokenId);
                        console.log('Owner after sale in struct : ', updatedListedToken.owner)
                        console.log('Seller after sale: ', updatedListedToken.seller)
                        console.log('updatedListedToken: ', updatedListedToken)
                    expect(updatedListedToken.seller).to.equal(consumer.address);
                    expect(updatedListedToken.currentlyListed).to.equal(true);
                
                    // Check if funds are transferred to the seller and contract creator
                    const sellerBalanceAfterSale = await ethers.provider.getBalance(artist1.address);
                    console.log('Artist Balance: ', fromWei(sellerBalanceAfterSale))
                    const creatorBalanceAfterSale = await ethers.provider.getBalance(contractCreator.address); // Assuming contractCreator is the owner
                    console.log('Contract Creator Balance: ', fromWei(creatorBalanceAfterSale))

                    // Add more specific assertions based on your contract logic and data structure
                    // For example, check if the balances have increased by the correct amounts
                    // expect(sellerBalanceAfterSale).to.equal(sellerBalanceBeforeSale + expectedSellerBalanceIncrease);
                    // expect(creatorBalanceAfterSale).to.equal(creatorBalanceBeforeSale + expectedCreatorBalanceIncrease);
                })
            })

            describe('Failure', async () => {
                beforeEach(async () => {
                    const ArtistContract = await ethers.getContractFactory('ArtistMarketplace')
                    artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)
                })

                it('should revert if called with the incorrect value', async function () {
                    const tokenId = 2; // Replace with the desired tokenId
                
                    // Mint a token and list it for sale
                    await artistContract.connect(artist1).createToken('your_token_uri', 100, { value: ethers.utils.parseEther('0.01') });
                
                    // Attempt to call executeSale function with the incorrect value
                    await expect(artistContract.connect(consumer).executeSale(tokenId, { value: 50 }))
                        .to.be.revertedWith('Please submit the asking price in order to complete the purchase');
                })
            })
        })
    })
})