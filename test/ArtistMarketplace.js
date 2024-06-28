const { expect } = require('chai');
const { ethers } = require('hardhat');

const toWei = (n) => ethers.utils.parseEther(n.toString());
const fromWei = (n) => ethers.utils.formatEther(n);

describe("ArtistMarketplace", function () {
    const NAME = 'ArtMarket';
    const SYMBOL = 'AMART';
    const NFT_NAME = "Test NFT";
    const CREATOR_NAME = "Artist1";
    const FILE_NAMES = ['file1', 'file2'];
    const FILE_TYPES = ['type1', 'type2'];
    const TOKEN_CIDS = ['cid1', 'cid2'];
    const BYTES = "0x";
    const PRICE_OF_NFT = toWei(1);
    const LIST_PRICE = toWei(0.01);

    let artistContract,
    proposalsContract,
    artistMinter,
    contractCreator,
    artist1,
    artist2,
    consumer,
    consumer2;

    beforeEach(async () => {
        let accounts = await ethers.getSigners();
        contractCreator = accounts[0];
        artist1 = accounts[1];
        artist2 = accounts[2];
        consumer = accounts[3];
        consumer2 = accounts[4];

        const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace");
        artistContract = await ArtistMarketplace.deploy(artist1.address);
        await artistContract.deployed();

        const ProposalsContract = await hre.ethers.getContractFactory('Proposals')
        proposalsContract = await ProposalsContract.deploy()
        await proposalsContract.deployed()

 
        const ArtistMinter = await hre.ethers.getContractFactory('ArtistMint')
        artistMinter = await ArtistMinter.deploy(artistContract.address)
        await artistMinter.deployed()


        await artistMinter.connect(contractCreator).addToWhtList(artist1.address, CREATOR_NAME);

        await artistContract.connect(contractCreator).updateListPrice(LIST_PRICE);
    });

    it("should create a listed token and emit an event", async () => {
        const SUPPLY_AMOUNT = 7;
        const tokenId = 1;

        // Calling createListedToken function
        expect(
            await artistContract.createListedToken(
                tokenId,
                NFT_NAME,
                CREATOR_NAME,
                artist1.address,
                PRICE_OF_NFT,
                FILE_NAMES,
                FILE_TYPES,
                TOKEN_CIDS,
                SUPPLY_AMOUNT
            )
        ).to.emit(artistContract, 'TokenListedSuccess')
            .withArgs(
                SUPPLY_AMOUNT,
                tokenId,
                NFT_NAME,
                CREATOR_NAME,
                artist1.address,
                artistContract.address,
                artist1.address,
                PRICE_OF_NFT,
                FILE_NAMES,
                FILE_TYPES,
                TOKEN_CIDS,
                true
            );

        // Fetching the listed token
        const listedToken = await artistContract.getListedFromTokenId(tokenId);

        // Checking the listed token values
        expect(listedToken.tokenId).to.equal(tokenId);
        expect(listedToken.nftName).to.equal(NFT_NAME);
        expect(listedToken.creatorName).to.equal(CREATOR_NAME);
        expect(listedToken.creatorAddress).to.equal(artist1.address);
        expect(listedToken.priceOfNFT).to.equal(PRICE_OF_NFT);
        expect(listedToken.fileNames).to.deep.equal(FILE_NAMES);
        expect(listedToken.fileTypes).to.deep.equal(FILE_TYPES);
        expect(listedToken.tokenCIDs).to.deep.equal(TOKEN_CIDS);
        expect(listedToken.supplyAmount).to.equal(SUPPLY_AMOUNT);
        expect(listedToken.currentlyListed).to.be.true;
    });

    it("should make sure the price isn't negative", async () => {
        const tokenId = 1;
        const INVALID_PRICE = 0;
        const SUPPLY_AMOUNT = 5;

        await expect(
            artistContract.createListedToken(
                tokenId,
                NFT_NAME,
                CREATOR_NAME,
                artist1.address,
                INVALID_PRICE,
                FILE_NAMES,
                FILE_TYPES,
                TOKEN_CIDS,
                SUPPLY_AMOUNT
            )
        ).to.be.revertedWith("Make sure the price isn't negative");
    });

    describe("executeSale", function () {
        const TOKEN_ID = 1;
        const PURCHASE_AMOUNT = 3;
        const SUPPLY_AMOUNT = 7;

        beforeEach(async () => {
            await artistMinter.connect(artist1).createToken(
                SUPPLY_AMOUNT, 
                NFT_NAME, 
                CREATOR_NAME, 
                artist1.address, 
                PRICE_OF_NFT, 
                FILE_NAMES, 
                FILE_TYPES, 
                TOKEN_CIDS, 
                BYTES,
                { value: LIST_PRICE.mul(SUPPLY_AMOUNT) }
            );
        })
        
        it("should execute the sale correctly", async () => {
            const sellerInitialBalance = await ethers.provider.getBalance(artist1.address);
            const consumerInitialBalance = await ethers.provider.getBalance(consumer.address);
            const salePrice = PRICE_OF_NFT.mul(PURCHASE_AMOUNT);

            console.log(`ArtistContract: ${artistContract.address}\n`)

            console.log(`ArtistMinter: ${artistMinter.address}\n`)

            console.log(`Proposals: ${proposalsContract.address}\n`)

            const Token = await artistContract.connect(artist1).getListedFromTokenId(TOKEN_ID)
            console.log("TokenId: ", Token)

            const contractTokenBalance = await artistMinter.balanceOf(artistContract.address, TOKEN_ID)
            console.log("balance: ", contractTokenBalance)

            const consumerBalance = await artistMinter.balanceOf(consumer.address, TOKEN_ID);
            console.log("Consumer Tokens: ", consumerBalance)

            const supply = await artistContract.connect(artist1).totalSupply()
            console.log("supply: ", supply)
    
            // Approve marketplace to handle seller's tokens
            //await artistMinter.connect(artist1).setApprovalForAll(artistContract.address, true);
    
            // Execute the sale
            await artistContract.connect(consumer).executeSale(TOKEN_ID, PURCHASE_AMOUNT, { value: salePrice });
    
            // Check the updated supply amount
            const listedToken = await artistContract.getListedFromTokenId(TOKEN_ID);
            expect(listedToken.supplyAmount).to.equal(SUPPLY_AMOUNT - PURCHASE_AMOUNT);
    
            // Check the ownership update
            expect(listedToken.ownerAddress).to.equal(consumer.address);
            expect(listedToken.sellerAddress).to.equal(consumer.address);
    
            // Check if the token was transferred to the buyer
            const consumerBalance2 = await artistMinter.balanceOf(consumer.address, TOKEN_ID);
            console.log("Consumer Tokens: ", consumerBalance2)
            expect(consumerBalance2).to.equal(PURCHASE_AMOUNT);
            const contractTokenBalance2 = await artistMinter.balanceOf(artistContract.address, TOKEN_ID)
            console.log("balance2: ", contractTokenBalance2)
    
            // Check if the proceeds were transferred to the seller
            const sellerFinalBalance = await ethers.provider.getBalance(artist1.address);
            const expectedBalance = sellerInitialBalance.add(PRICE_OF_NFT.mul(PURCHASE_AMOUNT));

            // Tolerance range (e.g., 0.1 ether)
            const tolerance = toWei('0.1');

            expect(sellerFinalBalance).to.be.closeTo(expectedBalance, tolerance);

            //expect(sellerFinalBalance).to.equal(sellerInitialBalance.add(salePrice));
    
            // Ensure the buyer paid the correct amount
            const consumerFinalBalance = await ethers.provider.getBalance(consumer.address);
            expect(consumerInitialBalance.sub(consumerFinalBalance)).to.be.closeTo(salePrice, ethers.utils.parseEther("0.01")); // Considering gas fees

            // consumer2 purchases the remaining tokens
            await artistContract.connect(consumer2).executeSale(TOKEN_ID, PURCHASE_AMOUNT, { value: PRICE_OF_NFT.mul(PURCHASE_AMOUNT) });
            const contractTokenBalance3 = await artistMinter.balanceOf(artistContract.address, TOKEN_ID)
            console.log("balance3: ", contractTokenBalance3)
        });
    
        it("should fail if purchase amount is greater than supply amount", async () => {
            const excessivePurchaseAmount = SUPPLY_AMOUNT + 1;

            console.log(`ArtistContract: ${artistContract.address}\n`)

            // Approve marketplace to handle seller's tokens
            await artistMinter.connect(artist1).setApprovalForAll(artistContract.address, true);

            const Token = await artistContract.connect(artist1).getListedFromTokenId(TOKEN_ID)
            console.log("TokenId: ", Token)

            await expect(
                artistContract.connect(consumer).executeSale(TOKEN_ID, excessivePurchaseAmount, { value: PRICE_OF_NFT.mul(excessivePurchaseAmount) })
            ).to.be.revertedWith("No remaining tokens to sell");
        });
    
        it("should fail if incorrect value is sent", async () => {
            const incorrectValue = PRICE_OF_NFT.mul(PURCHASE_AMOUNT).sub(ethers.utils.parseEther("0.1"));

            await expect(
                artistContract.connect(consumer).executeSale(TOKEN_ID, PURCHASE_AMOUNT, { value: incorrectValue })
            ).to.be.revertedWith("Please submit the asking price in order to complete the purchase");
        });
    
        /*it("should fail if marketplace is not approved to handle tokens", async () => {

            const Token = await artistContract.connect(artist1).getListedFromTokenId(TOKEN_ID)
            console.log("TokenId: ", Token)

            // Approve marketplace to handle seller's tokens
            await artistMinter.connect(artist1).setApprovalForAll(artistContract.address, false);

            await expect(
                artistContract.connect(consumer).executeSale(TOKEN_ID, PURCHASE_AMOUNT, { value: PRICE_OF_NFT.mul(PURCHASE_AMOUNT) })
            ).to.be.revertedWith("Seller has not approved the marketplace");
        });*/
    })
});




