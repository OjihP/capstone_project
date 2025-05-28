// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const config = require('../src/config.json');

async function main() {
  console.log(`Fetching accounts & network...\n`);

  try {
    let marketplace, 
      whitelist, 
      minter, 
      proposal, 
      listPrice

    const accounts = await ethers.getSigners();
    const contractCreator = accounts[0];
    const artist1 = accounts[1];
    const artist2 = accounts[2];
    const artist3 = accounts[3];
    const artist4 = accounts[4];
    const consumer = accounts[5];

    console.log('Accounts:', {
      contractCreator: contractCreator.address,
      artist1: artist1.address,
      artist2: artist2.address,
      artist3: artist3.address,
      artist4: artist4.address,
      consumer: consumer.address
    });

    // Fetch network
    const { chainId } = await ethers.provider.getNetwork();
    console.log(`Network ID: ${chainId}\n\n`);

    console.log(`Fetching contracts and initializing data...\n`);

    try {
      // Fetch deployed marketplace contract
      marketplace = await ethers.getContractAt('ArtistMarketplace', config[chainId].artistContract.address);
      console.log(`Artist Marketplace fetched: ${marketplace.address}\n`);

      // Fetch deployed whitelist contract
      whitelist = await ethers.getContractAt('ArtistWhiteList', config[chainId].artistWhiteList.address);
      console.log(`Artist WhiteList fetched: ${whitelist.address}\n`);

      // Fetch deployed minter contract
      minter = await ethers.getContractAt('ArtistMint', config[chainId].artistMinter.address);
      console.log(`Artist Minter fetched: ${minter.address}\n`);

      // Fetch deployed proposal contract
      proposal = await ethers.getContractAt('Proposals', config[chainId].proposalsContract.address);
      console.log(`Proposals fetched: ${proposal.address}\n\n`);

      console.log(`Checking for deployer address in Marketplace contract...\n`)

      // Check for deployer address
      const creatorAddress = await marketplace.getCreatorAddress();
      console.log(`Contract creator set to: ${creatorAddress}\n\n`);

      console.log(`Smart Contracts are now deployed onto the blockchain network.\n\n`)

    } catch (error) {
      console.error("Error initializing contracts:", error);
    }

    console.log(`Initializing list price for NFT minting...\n`)

    try {
      // Initialize list price
      const convertListPrice = ethers.utils.parseUnits('0.001', 'ether');
      transaction = await marketplace.updateListPrice(convertListPrice);
      await transaction.wait();
      listPrice = await marketplace.getListPrice();
      
      console.log(`List price set to: ${ethers.utils.formatEther(listPrice)} ETH\n\n`);

    } catch (error) {
      console.error("Error initializing list price: \n\n", error);
    }

    console.log(`Initializing and allocating users onto the whitelist...\n`)

    try {
      // Add users to whitelist
      let user1,
          user2,
          user3,
          user4

      await whitelist.connect(contractCreator).addToWhtList(artist1.address, "Artist One", contractCreator.address);
      user1 = await whitelist.getCurrentWhtListCounter();
      console.log(`Artist One added to whitelist with user number: ${user1}\n`);

      await whitelist.connect(contractCreator).addToWhtList(artist2.address, "Artist Two", contractCreator.address);
      user2 = await whitelist.getCurrentWhtListCounter();
      console.log(`Artist Two added to whitelist with user number: ${user2}\n`);
      
      await whitelist.connect(contractCreator).addToWhtList(artist3.address, "Artist Three", contractCreator.address);
      user3 = await whitelist.getCurrentWhtListCounter();
      console.log(`Artist Three added to whitelist with user number: ${user3}\n`);

      await whitelist.connect(contractCreator).addToWhtList(artist4.address, "Artist Four", contractCreator.address);
      user4 = await whitelist.getCurrentWhtListCounter();
      console.log(`Artist Four added to whitelist with user number: ${user4}\n`);

      console.log(`Users allocated onto whitelist.\n\n`)

    } catch (error) {
      console.error("Error initializing users onto whitelist:", error);
    }

    console.log(`Initializing voting quorum...\n`)

    try {
      // Initialize quorum
      await proposal.initializeQuorum(contractCreator.address);
      await transaction.wait();

      const quorum = await proposal.getQuorum();
      
      console.log(`Quorum initialized to: ${quorum}\n\n`);
      
    } catch (error) {
      console.error("Error initializing quorum:", error);
    }

    console.log(`Initializing sample NFT...\n`);
      
    try {
      // Initialize sample NFT
      const nftData = {
        supplyAmount: 10,
        tokenId: 0,
        nftName: "Nu.WAV NFT Album",
        artistName: "Artist One",
        artistAddress: artist1.address,
        ownerAddress: marketplace.address,
        sellerAddress: artist1.address,
        nftPrice: ethers.utils.parseUnits("0.02", "ether"),
        currentlyListed: true
      };

      const fileData = {
        fileNames: ["Nu.WavFrontCover","OTW.WAV", "Checks.WAV", "Nu.WAV_video"],
        fileTypes: ["image/jpeg", "audio/mpeg", "audio/mpeg", "video/mp4"],
        tokenCIDs: [
          "QmQ2XRnmvKzvLn5FvSYJ6ptCqVdjEardSwXsnciFGJEXdW",
          "QmXoLKTnCEpTdZVfXCmHmZzGnhYQVZJiTFp8uT2sLfiXnT",
          "QmeaeVyr8iujXkxUhWekvo8JCaGbAbgdnJQme8dSzSwnad",
          "QmWGkC4m3DQBSSxvYT4E69kpT8o946SNSpcnPGg3ftoqd5"
        ],
        nestIDs: [1, 1, 1, 1]
      };

      const Data = {
        tokenData: {
          supplyAmount: 10,
          tokenId: 0,
          nftName: "Nu.WAV NFT Album",
          artistName: "Artist One",
          artistAddress: artist1.address,
          ownerAddress: marketplace.address,
          sellerAddress: artist1.address,
          nftPrice: ethers.utils.parseUnits("0.02", "ether"),
          currentlyListed: true
        },
        fileData: {
          fileNames: ["Nu.WavFrontCover","OTW.WAV", "Checks.WAV", "Nu.WAV_video"],
          fileTypes: ["image/jpeg", "audio/mpeg", "audio/mpeg", "video/mp4"],
          tokenCIDs: [
            "QmQ2XRnmvKzvLn5FvSYJ6ptCqVdjEardSwXsnciFGJEXdW",
            "QmXoLKTnCEpTdZVfXCmHmZzGnhYQVZJiTFp8uT2sLfiXnT",
            "QmeaeVyr8iujXkxUhWekvo8JCaGbAbgdnJQme8dSzSwnad",
            "QmWGkC4m3DQBSSxvYT4E69kpT8o946SNSpcnPGg3ftoqd5"
          ],
          nestIDs: [1, 1, 1, 1]
        },
      }

      console.log("Data:", Data);

      const totalPrice = listPrice.mul(nftData.supplyAmount).toString();

      transaction = await minter.connect(artist1).mintNFT(Data, artist1.address, { value: totalPrice });
      await transaction.wait();
      
      console.log("Example NFT listed successfully.\n\n");

    } catch (error) {
      console.error("Error initializing sample NFT: ", error);
    }
      
    console.log("Consumer donates ether to smart contract...\n")

    try {
      // Fund the marketplace contract
      await consumer.sendTransaction({
        to: marketplace.address,
        value: ethers.utils.parseEther("0.2")
      });

      console.log(`Consumer donation received!\n\n`)

    } catch (error) {
      console.error("Error receiving donated funds: ", error);
    }

    console.log(`Initializing sample proposal...\n`)

    try {
      // Create proposal
      const proposalName = "Fund Project X";
      const proposalDescription = "Funding request for Project X";
      const proposalAmount = ethers.utils.parseUnits('0.01', 'ether');
      const proposalRecipient = artist1.address;
      const proposalRecipientBalance = await hre.ethers.provider.getBalance(artist1.address);

      transaction = await proposal.connect(artist1).createProposal(
        proposalName,
        proposalDescription,
        proposalAmount,
        proposalRecipient,
        proposalRecipientBalance,
        artist1.address
      );
      await transaction.wait();

      console.log("Proposal created successfully.\n");

      // Artists vote on proposal
      transaction = await proposal.connect(artist1).voteUp(1, artist1.address);
      await transaction.wait();
      console.log("Artist One voted on proposal successfully.");

      transaction = await proposal.connect(artist2).voteUp(1, artist2.address);
      await transaction.wait();
      console.log("Artist Two voted on proposal successfully.\n");
      
      console.log(`Proposal initialzed successfully.\n\n`);
      
    } catch (error) {
      console.error("Error initializing sample proposal:", error);
    }

    console.log(`Data initialization complete!\n`)

  } catch {
    console.log("Error initializing data.\n\n")
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
