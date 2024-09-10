// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json');

async function main() {
  console.log(`Fetching accounts & network...\n`);

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
  console.log(`Network ID: ${chainId}`);

  console.log(`Fetching contracts and initializing data\n`);

  try {
    // Fetch deployed marketplace contract
    const marketplace = await ethers.getContractAt('ArtistMarketplace', config[chainId].artistContract.address);
    console.log(`Artist Marketplace fetched: ${marketplace.address}\n`);

    // Fetch deployed whitelist contract
    const whitelist = await ethers.getContractAt('ArtistWhiteList', config[chainId].artistWhiteList.address);
    console.log(`Artist WhiteList fetched: ${whitelist.address}\n`);

    // Fetch deployed minter contract
    const minter = await ethers.getContractAt('ArtistMint', config[chainId].artistMinter.address);
    console.log(`Artist Minter fetched: ${minter.address}\n`);

    // Fetch deployed proposal contract
    const proposal = await ethers.getContractAt('Proposals', config[chainId].proposalsContract.address);
    console.log(`Proposals fetched: ${proposal.address}\n`);

    // Set contract creator
    let transaction = await marketplace.setContractCreator(contractCreator.address);
    await transaction.wait();
    const creatorAddress = await marketplace.getCreatorAddress();
    console.log(`Contract creator set to: ${creatorAddress}\n`);

    // Initialize list price
    const listPrice = ethers.utils.parseUnits('0.001', 'ether');
    transaction = await marketplace.updateListPrice(listPrice);
    await transaction.wait();
    console.log(`List price set to: ${listPrice}\n`);

    // Add users to whitelist
    let userNumber

    await whitelist.connect(contractCreator).addToWhtList(artist1.address, "Artist One");
    userNumber = await whitelist._numbers();
    console.log(`Artist One added to whitelist with user number: ${userNumber}\n`);

    await whitelist.connect(contractCreator).addToWhtList(artist2.address, "Artist Two");
    userNumber = await whitelist._numbers();
    console.log(`Artist Two added to whitelist with user number: ${userNumber}\n`);
    
    await whitelist.connect(contractCreator).addToWhtList(artist3.address, "Artist Three");
    userNumber = await whitelist._numbers();
    console.log(`Artist Three added to whitelist with user number: ${userNumber}\n`);

    await whitelist.connect(contractCreator).addToWhtList(artist4.address, "Artist Four");
    userNumber = await whitelist._numbers();
    console.log(`Artist Four added to whitelist with user number: ${userNumber}\n`);

    // Initialize quorum
    transaction = await proposal.initializeQuorum();
    await transaction.wait();
    const quorum = await proposal.getQuorum();
    console.log(`Quorum initialized to: ${quorum}\n`);

    console.log(`Initializing sample NFT\n`);

    // Initialize sample NFT
    const nftName = "Nu.WAV NFT Album";
    const creatorName = "Artist One";
    const price = ethers.utils.parseUnits('0.02', 'ether');
    const fileNames = ["Nu.WavFrontCover","OTW.WAV", "Checks.WAV", "Nu.WAV_video"];
    const fileTypes = ["image/jpeg", "audio/mpeg", "audio/mpeg", "video/mp4"];
    const tokenCIDs = [
      "QmQ2XRnmvKzvLn5FvSYJ6ptCqVdjEardSwXsnciFGJEXdW",
      "QmXoLKTnCEpTdZVfXCmHmZzGnhYQVZJiTFp8uT2sLfiXnT",
      "QmeaeVyr8iujXkxUhWekvo8JCaGbAbgdnJQme8dSzSwnad",
      "QmWGkC4m3DQBSSxvYT4E69kpT8o946SNSpcnPGg3ftoqd5"
    ];
    const supplyAmount = 10;

    transaction = await minter.connect(artist1).createToken(
        supplyAmount,
        nftName,
        creatorName,
        contractCreator.address,
        price,
        [fileNames],
        [fileTypes],
        [tokenCIDs],
        "0x",
        { value: listPrice.mul(10) }
      );
      await transaction.wait();

    console.log("Example token listed successfully.\n");

    console.log("Consumer donates ether to smart contract.\n")

    // Fund the marketplace contract with 100 ETH
    await consumer.sendTransaction({
      to: marketplace.address,
      value: ethers.utils.parseEther("0.2")
    });

    // Create proposal
    const proposalName = "Fund Project X";
    const proposalDescription = "Funding request for Project X";
    const proposalAmount = ethers.utils.parseUnits('0.01', 'ether');
    const proposalRecipient = artist1.address;
    const proposalRecipientBalance = await hre.ethers.provider.getBalance(artist1.address);

    transaction = await proposal.createProposal(
      proposalName,
      proposalDescription,
      proposalAmount,
      proposalRecipient,
      proposalRecipientBalance
    );
    await transaction.wait();
    console.log("Proposal created successfully.");

    // Artists vote on proposal
    transaction = await proposal.connect(artist1).voteUp(1);
    await transaction.wait();
    console.log("Artist One voted on proposal successfully.");

    transaction = await proposal.connect(artist2).voteUp(1);
    await transaction.wait();
    console.log("Artist Two voted on proposal successfully.");

    /*// Finalize proposal
    transaction = await proposal.finalizeProposal(1);
    await transaction.wait();
    console.log("Proposal finalized successfully.");
    */
    
  } catch (error) {
    console.error("Error initializing contracts and data:", error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
