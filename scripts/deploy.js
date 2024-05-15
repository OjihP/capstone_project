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

  let contractCreator,
      artist1,
      artist2,
      consumer

  let accounts = await ethers.getSigners()
      contractCreator = accounts[0]
      artist1 = accounts[1]
      artist2 = accounts[2]
      consumer = accounts[3]
    

  // Deploy Marketplace 
  const ArtistContract = await hre.ethers.getContractFactory('ArtistMarketplace')
  let artistContract = await ArtistContract.deploy(NAME, SYMBOL, artist1.address)

  await artistContract.deployed()
  console.log(`ArtistMarketplace deployed to: ${artistContract.address}\n`)

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
