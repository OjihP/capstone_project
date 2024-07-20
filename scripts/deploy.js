// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const NAME = 'Soleplex'
  const SYMBOL = 'PLEX'
  const network = await ethers.provider.getNetwork();


  let contractCreator,
      artist1,
      artist2,
      consumer

  let accounts = await ethers.getSigners()
      contractCreator = accounts[0]
      artist1 = accounts[1]
      artist2 = accounts[2]
      consumer = accounts[3]

      console.log('Deploying contracts with the account:', contractCreator.address);
      console.log('Network:', network.name);
      console.log('Network ID:', network.chainId);

  // Deploy Marketplace 
  const ArtistContract = await hre.ethers.getContractFactory('ArtistMarketplace')
  let artistContract = await ArtistContract.deploy(contractCreator.address)

  await artistContract.deployed()
  console.log(`ArtistMarketplace deployed to: ${artistContract.address}\n`)
  let CreatorAddress = await artistContract.getCreatorAddress()
  console.log(`ArtistMarketplace initialzed with the account: ${CreatorAddress}\n` )

  // Deploy ArtistWhiteList 
  const ArtistWhiteList = await ethers.getContractFactory("ArtistWhiteList");
  let artistWhiteList = await ArtistWhiteList.deploy();

  await artistWhiteList.deployed();
  console.log(`ArtistWhiteList deployed to: ${artistWhiteList.address}\n`)

  // Deploy Proposals 
  const ProposalsContract = await ethers.getContractFactory('Proposals')
  let proposalsContract = await ProposalsContract.deploy(artistContract.address, artistWhiteList.address)

  await proposalsContract.deployed()
  console.log(`Proposals deployed to: ${proposalsContract.address}\n`)

  // Deploy ArtistMint 
  const ArtistMinter = await ethers.getContractFactory('ArtistMint')
  let artistMinter = await ArtistMinter.deploy(artistContract.address)

  await artistMinter.deployed()
  console.log(`ArtistMinter deployed to: ${artistMinter.address}\n`)

  // Set the ArtistMint address in ArtistMarketplace
  await artistContract.setTokenCallAddress(artistMinter.address);

  console.log("ArtistMint address set in ArtistMarketplace");

  // Initialize quorum in the Proposals contract
  await proposalsContract.initializeQuorum();

  // Read the existing config file
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  } catch (error) {
    console.log('config.json not found, creating a new one.');
  }

  // Update the config with the new addresses and network
  config[network.chainId] = {
    artistContract: { address: artistContract.address },
    artistWhiteList: { address: artistWhiteList.address },
    proposalsContract: { address: proposalsContract.address },
    artistMinter: { address: artistMinter.address }
  };

  // Write the updated config back to the file
  fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
  console.log('Updated config.json');

  // Deploy Functions
  //const ArtistFunctions = await hre.ethers.getContractFactory('MarketplaceFunctions')
  //let artistFunctions = await ArtistFunctions.deploy()

  //await artistFunctions.deployed()
  //console.log(`MarketplaceFunctions deployed to: ${artistFunctions.address}\n`)

  // Deploy White list
  //const ArtistWhtList = await hre.ethers.getContractFactory('ArtistWhiteList')
  //let artistWhhtList = await ArtistWhtList.deploy()

  //await artistWhhtList.deployed()
  //console.log(`ArtistWhiteList deployed to: ${artistWhhtList.address}\n`)

  const abiData = {
    abi: JSON.parse(artistContract.interface.format('json'))
  }

  //This writes the ABI to ArtistContract.json
  //fs.writeFileSync('./src/abis/ArtistContract.json', JSON.stringify(abiData, null, "\t"))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
