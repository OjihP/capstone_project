const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const NAME = 'ArtistMarketplace';
  const SYMBOL = 'ARTM';

  const network = await ethers.provider.getNetwork();

  try {
    let contractCreator, 
      artistContract, 
      events, 
      artistWhiteList, 
      proposalsContract, 
      listings, 
      artistMinter
        
    let accounts = await ethers.getSigners();
    contractCreator = accounts[0];

    console.log('Deploying contracts with the deployer account:', contractCreator.address);
    console.log('Network:', network.name);
    console.log(`Network ID: ${network.chainId}\n`);

    try {
      // Deploy Marketplace 
      const ArtistContract = await hre.ethers.getContractFactory('ArtistMarketplace');
      artistContract = await ArtistContract.deploy();

      await artistContract.deployed();
      console.log(`ArtistMarketplace deployed to: ${artistContract.address}\n`);
      let CreatorAddress = await artistContract.getCreatorAddress();
      console.log(`ArtistMarketplace initialized with the deployer account: ${CreatorAddress}\n`);

      // Deploy Events
      const Events = await ethers.getContractFactory('Events');
      events = await Events.deploy();

      await events.deployed();
      console.log(`Events deployed to: ${events.address}\n`)

      // Deploy ArtistWhiteList 
      const ArtistWhiteList = await ethers.getContractFactory("ArtistWhiteList");
      artistWhiteList = await ArtistWhiteList.deploy(artistContract.address, events.address);

      await artistWhiteList.deployed();
      console.log(`ArtistWhiteList deployed to: ${artistWhiteList.address}\n`);

      // Deploy Proposals 
      const ProposalsContract = await ethers.getContractFactory('Proposals');
      proposalsContract = await ProposalsContract.deploy(artistContract.address, artistWhiteList.address);

      await proposalsContract.deployed();
      console.log(`Proposals deployed to: ${proposalsContract.address}\n`);

      // Deploy NFTListing
      const Listings = await ethers.getContractFactory('NFTListing');
      listings = await Listings.deploy(artistContract.address, events.address);

      await listings.deployed();
      console.log(`NFTListing deployed to: ${listings.address}\n`)

      // Deploy ArtistMint 
      const ArtistMinter = await ethers.getContractFactory('ArtistMint');
      artistMinter = await ArtistMinter.deploy(artistWhiteList.address, listings.address, artistContract.address);

      await artistMinter.deployed();
      console.log(`ArtistMinter deployed to: ${artistMinter.address}\n\n`);

    } catch (error) {
      console.log("Error deploying contracts onto network.", error);
    }

    console.log(`Setting contract addresses within contracts...\n`)

    // Set the contract addresses in ArtistMarketplace contract
    try {
      await artistContract.setContractAddresses(artistWhiteList.address, artistMinter.address, events.address, listings.address);
      await listings.setContractAddress(artistMinter.address);
      await events.setContract(artistMinter.address)

      console.log("ArtistMint, NFTListings, and Events address set in ArtistMarketplace");
      console.log("ArtistMint address set in NFTListing");
      console.log(`ArtistMint address set in Events\n\n`);

    } catch (error) {
      console.error("Error setting contract addresses:", error);
    }

    console.log(`Updating config file...\n`)

    // Define the path to the config file
    const configFilePath = path.join('src', 'config.json');

    // Read the existing config file
    let config = {};
    try {
      config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

    } catch (error) {
      console.log('config.json not found, creating a new one.');
    }

    try {
      // Update the config with the new addresses and network
      config[network.chainId] = {
        artistContract: { address: artistContract.address },
        artistWhiteList: { address: artistWhiteList.address },
        proposalsContract: { address: proposalsContract.address },
        artistMinter: { address: artistMinter.address },
        events: { address: events.address },
        nftListing: { address: listings.address}
      };

      // Write the updated config back to the file
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
      console.log(`Updated config.json at: ${configFilePath}\n\n`);

    } catch (error) {
      console.log("Error updating config file: ", error)
    }

    console.log(`Deployment complete!\n`)

  } catch (error) {
    console.log(`Error in deployment.\n`)
  }

  /*const abiData = {
    abi: JSON.parse(artistContract.interface.format('json'))
  };*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
