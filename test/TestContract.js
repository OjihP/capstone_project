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

    let testContract,
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

    describe('Test Functions', () => {
        beforeEach(async () => {
            const TestContract = await ethers.getContractFactory("TestStruct")
            testContract = await TestContract.deploy(NAME, SYMBOL, artist1.address)
            await testContract.deployed()

            // Create a listed token for testing
            await testContract.connect(artist1).createToken(
                1, NFT_NAME, PRICE_OF_NFT, FILE_NAMES, FILE_TYPES, TOKEN_CIDS, { value: LIST_PRICE }
            )
        })
        
        it("should return the details of a listed token for a given token ID", async function () {
            // Assuming tokenId is valid and exists
            const tokenId = 1;
    
            // Call the function
            const listedToken = await testContract.getListedFromTokenId(tokenId);
    
            // Assert the listed token details are correct
            expect(listedToken.mintAmount).to.equal(1); // Assuming mint amount is 1
            expect(listedToken.nftName).to.equal(NFT_NAME);
            expect(listedToken.priceOfNFT).to.equal(PRICE_OF_NFT);
            expect(listedToken.fileNames).to.eql(FILE_NAMES);
            expect(listedToken.fileTypes).to.eql(FILE_TYPES);
            expect(listedToken.tokenCIDs).to.eql(TOKEN_CIDS);
            expect(listedToken.currentlyListed).to.equal(true);

            console.log(listedToken.mintAmount)
            console.log(listedToken.nftName)
        });
    })     
})
