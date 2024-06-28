require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':ArtistMarketplace$', ':ArtistWhiteList$', ':ArtistMint$', ':Proposals$'],
    unit: 'B'
  }
};


