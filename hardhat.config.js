require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require('dotenv').config();

const privateKeys = process.env.REACT_APP_PRIVATE_KEYS || ''

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':ArtistMarketplace$', ':ArtistWhiteList$', ':ArtistMint$', ':Proposals$', ':Events$'],
    unit: 'B'
  },
  networks: {
    localhost: {},
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      //accounts: privateKeys.split(",")
      accounts: [process.env.REACT_APP_PRIVATE_KEYS]
    }
  },
};


