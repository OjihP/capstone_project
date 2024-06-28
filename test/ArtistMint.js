const { expect } = require('chai');
const { ethers } = require('hardhat');

const toWei = (n) => ethers.utils.parseEther(n.toString());
const fromWei = (n) => ethers.utils.formatEther(n);

describe("ArtistMint", function () {
    const NAME = 'ArtMarket';
    const SYMBOL = 'AMART';
    const NFT_NAME = "Test NFT";
    const NFT_NAME_2 = "Test NFT 2";
    const CREATOR_NAME = "Artist1";
    const FILE_NAMES = ['file1', 'file2'];
    const FILE_TYPES = ['type1', 'type2'];
    const TOKEN_CIDS = ['cid1', 'cid2'];
    const BYTES = "0x";
    const PRICE_OF_NFT = toWei(1);
    const LIST_PRICE = toWei(0.01);

    let artistMarketplace,
        proposalsContract,
        artistMinter,
        contractCreator,
        artist1,
        artist2,
        consumer,
        consumer2

    beforeEach(async () => {
        let accounts = await ethers.getSigners();
        contractCreator = accounts[0];
        artist1 = accounts[1];
        artist2 = accounts[2];
        consumer = accounts[3];
        consumer2 = accounts[4];

        const ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace");
        artistMarketplace = await ArtistMarketplace.deploy(artist1.address);
        await artistMarketplace.deployed();

        const ProposalsContract = await ethers.getContractFactory('Proposals');
        proposalsContract = await ProposalsContract.deploy();
        await proposalsContract.deployed();

        const ArtistMint = await ethers.getContractFactory('ArtistMint');
        artistMinter = await ArtistMint.deploy(artistMarketplace.address);
        await artistMinter.deployed();

        await artistMinter.connect(contractCreator).addToWhtList(artist1.address, CREATOR_NAME);

        await artistMarketplace.connect(contractCreator).updateListPrice(LIST_PRICE);
    });

    describe('createToken', () => {
        it('should create and list tokens', async () => {
            await artistMinter.connect(artist1).createToken(
                1, 
                NFT_NAME, 
                CREATOR_NAME, 
                artist1.address, 
                PRICE_OF_NFT, 
                FILE_NAMES, 
                FILE_TYPES, 
                TOKEN_CIDS, 
                BYTES,
                { value: LIST_PRICE }
            );

            const newTokenId = await artistMinter._tokenIds();
            expect(newTokenId).to.equal(1);

            const balance = await artistMinter.balanceOf(artistMarketplace.address, newTokenId);
            expect(balance).to.equal(1);
        });

        it('should create multiple tokens with multiple quantities', async () => {
            // Create first token with quantity 5
            await artistMinter.connect(artist1).createToken(
                5, 
                NFT_NAME, 
                CREATOR_NAME, 
                artist1.address, 
                PRICE_OF_NFT, 
                FILE_NAMES, 
                FILE_TYPES, 
                TOKEN_CIDS, 
                BYTES,
                { value: LIST_PRICE.mul(5) }
            );

            // Create second token with quantity 3
            await artistMinter.connect(artist1).createToken(
                3, 
                NFT_NAME_2, 
                CREATOR_NAME, 
                artist1.address, 
                PRICE_OF_NFT, 
                FILE_NAMES, 
                FILE_TYPES, 
                TOKEN_CIDS, 
                BYTES,
                { value: LIST_PRICE.mul(3) }
            );

            const newTokenId1 = await artistMinter._tokenIds();
            expect(newTokenId1).to.equal(2); // since two tokens have been created

            const balance1 = await artistMinter.balanceOf(artistMarketplace.address, 1);
            expect(balance1).to.equal(5);

            const balance2 = await artistMinter.balanceOf(artistMarketplace.address, 2);
            expect(balance2).to.equal(3);
        });

        it('should check if user is whitelisted', async () => {
            // Initially, the user should not be whitelisted
            let isWhitelisted = await artistMinter.whtList(0);
            console.log(isWhitelisted)
            expect(isWhitelisted.isListed).to.equal(false);

            // Add the user to the whitelist
            await artistMinter.connect(contractCreator).addToWhtList(artist1.address, "Artist1");

            // Now, the user should be whitelisted
            let isWhitelisted2 = await artistMinter.whtList(1);
            console.log(isWhitelisted2)
            expect(isWhitelisted2.isListed).to.equal(true);
        })

        it('should transfer the listing fee to the contractCreator', async () => {
            const initialCreatorBalance = await ethers.provider.getBalance(contractCreator.address);

            // Create token with quantity 5
            const tx = await artistMinter.connect(artist1).createToken(
                5, 
                NFT_NAME, 
                CREATOR_NAME, 
                artist1.address, 
                PRICE_OF_NFT, 
                FILE_NAMES, 
                FILE_TYPES, 
                TOKEN_CIDS, 
                BYTES,
                { value: LIST_PRICE.mul(5) }
            );

            // Wait for the transaction to be mined
            await tx.wait();

            const finalCreatorBalance = await ethers.provider.getBalance(contractCreator.address);

            // Calculate the difference in balance
            const balanceDifference = finalCreatorBalance.sub(initialCreatorBalance);

            // The balance difference should be equal to the total listing fee transferred
            expect(balanceDifference).to.equal(LIST_PRICE.mul(5));
        });

        it('should set approval for ArtistMarketplace.sol to transfer tokens and transfer tokens to ArtistMarketplace.sol', async () => {
            // Create token with quantity 5
            const tx = await artistMinter.connect(artist1).createToken(
                5, 
                NFT_NAME, 
                CREATOR_NAME, 
                artist1.address, 
                PRICE_OF_NFT, 
                FILE_NAMES, 
                FILE_TYPES, 
                TOKEN_CIDS, 
                BYTES,
                { value: LIST_PRICE.mul(5) }
            );

            // Wait for the transaction to be mined
            await tx.wait();

            const newTokenId = await artistMinter._tokenIds();

            // Check if approval for all tokens is set
            const isApproved = await artistMinter.isApprovedForAll(artist1.address, artistMarketplace.address);
            expect(isApproved).to.be.true;

            // Check if the tokens were transferred to the ArtistMarketplace
            const balanceInMarketplace = await artistMinter.balanceOf(artistMarketplace.address, newTokenId);
            expect(balanceInMarketplace).to.equal(5);

            // Check if the artist1's balance is zero for the new token
            const artist1Balance = await artistMinter.balanceOf(artist1.address, newTokenId);
            expect(artist1Balance).to.equal(0);
        });
    });
});
