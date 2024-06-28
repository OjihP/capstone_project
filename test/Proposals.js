const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Proposals Contract", function () {
  let Proposals, proposals;
  let ArtistMarketplace, artistMarketplace;
  let ArtistMinter, artistMinter;
  let ArtistWhiteList, artistWhiteList;
  let artist, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, artist, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy and initialize the ArtistWhiteList contract first
    ArtistWhiteList = await ethers.getContractFactory("ArtistWhiteList");
    artistWhiteList = await ArtistWhiteList.deploy();
    await artistWhiteList.deployed();

     // Add users to the whitelist
     await artistWhiteList.addToWhtList(artist.address, "Artist");
     await artistWhiteList.addToWhtList(addr1.address, "Artist2");
     await artistWhiteList.addToWhtList(addr2.address, "Artist3");

    // Deploy ArtistMarketplace contract
    ArtistMarketplace = await ethers.getContractFactory("ArtistMarketplace");
    artistMarketplace = await ArtistMarketplace.deploy(artist.address);
    await artistMarketplace.deployed();

    // Deploy Proposals contract after the whitelist has been populated
    Proposals = await ethers.getContractFactory("Proposals");
    proposals = await Proposals.deploy(artistMarketplace.address, artistWhiteList.address);
    await proposals.deployed();

    // Initialize quorum in the Proposals contract
    await proposals.initializeQuorum();

    // Fund the marketplace contract with 10 ETH
    await owner.sendTransaction({
      to: artistMarketplace.address,
      value: ethers.utils.parseEther("10")
    });
  });

  it("Should initialize the Proposals contract correctly", async function () {
    // Check that the contractCall is set correctly
    expect(await proposals.contractCall()).to.equal(artistMarketplace.address);
    //console.log(await artistWhiteList.whtList(3))

    // Check that the whtListTotal is set correctly
    const whtListTotal = await artistWhiteList._numbers();
    console.log(whtListTotal)
    console.log(await proposals.getWhtListTotal())
    console.log(await proposals.whtListTotal())

    expect(await proposals.whtListTotal()).to.equal(whtListTotal);

    // Check that the quorum is set correctly
    const expectedQuorum = whtListTotal.mul(70).div(100);
    expect(await proposals.quorum()).to.equal(expectedQuorum);
  });

  it("Should create a proposal", async function () {
    const proposalId = 1;
    const proposalName = "Proposal 1";
    const proposalDescription = "Description for Proposal 1";
    const proposalAmount = ethers.utils.parseEther("1"); // 1 ETH
    const recipient = addr1.address;
    const recipientBalance = ethers.utils.parseEther("0"); // 0 ETH initially
    const quorum = await proposals.getQuorum()
    console.log("Quorum: ", quorum)

    await proposals.createProposal(
      proposalName,
      proposalDescription,
      proposalAmount,
      recipient,
      recipientBalance
    );

    const proposal = await proposals.proposals(proposalId);
    expect(proposal.name).to.equal(proposalName);
    expect(proposal.description).to.equal(proposalDescription);
    expect(proposal.amount).to.equal(proposalAmount);
    expect(proposal.recipient).to.equal(recipient);
    expect(proposal.recipientBalance).to.equal(recipientBalance);
    expect(proposal.votes).to.equal(0);
    expect(proposal.finalized).to.equal(false);
  });

  it("Should vote up a proposal", async function () {
    const proposalId = 1;
    const proposalName = "Proposal 1";
    const proposalDescription = "Description for Proposal 1";
    const proposalAmount = ethers.utils.parseEther("1"); // 1 ETH
    const recipient = addr1.address;
    const recipientBalance = ethers.utils.parseEther("0"); // 0 ETH initially

    await proposals.createProposal(
      proposalName,
      proposalDescription,
      proposalAmount,
      recipient,
      recipientBalance
    );

    await proposals.connect(addr1).voteUp(proposalId);

    const proposal = await proposals.proposals(proposalId);
    expect(proposal.votes).to.equal(1);

    const hasVoted = await proposals.proposals(proposalId);
  });

  it("Should finalize a proposal if quorum is met and check if funds were transferred", async function () {
    const proposalId = 1;
    const proposalName = "Proposal 1";
    const proposalDescription = "Description for Proposal 1";
    const proposalAmount = ethers.utils.parseEther("1"); // 1 ETH
    const recipient = addr1.address;

    await proposals.createProposal(
      proposalName,
      proposalDescription,
      proposalAmount,
      recipient,
      ethers.utils.parseEther("0") // 0 ETH initially
    );

    await proposals.connect(addr1).voteUp(proposalId);
    await proposals.connect(addr2).voteUp(proposalId);

    const recipientInitialBalance = await ethers.provider.getBalance(recipient);

    const tx = await proposals.finalizeProposal(proposalId);
    const receipt = await tx.wait();

    const proposal = await proposals.proposals(proposalId);
    expect(proposal.finalized).to.equal(true);

    const recipientFinalBalance = await ethers.provider.getBalance(recipient);

    // Check that the recipient's final balance has increased by the proposal amount
    expect(recipientFinalBalance).to.equal(recipientInitialBalance.add(proposalAmount));
  });

  it("Should not allow voting twice on a proposal", async function () {
    const proposalId = 1;
    const proposalName = "Proposal 1";
    const proposalDescription = "Description for Proposal 1";
    const proposalAmount = ethers.utils.parseEther("1"); // 1 ETH
    const recipient = addr1.address;
    const recipientBalance = ethers.utils.parseEther("0"); // 0 ETH initially

    await proposals.createProposal(
      proposalName,
      proposalDescription,
      proposalAmount,
      recipient,
      recipientBalance
    );

    await proposals.connect(addr1).voteUp(proposalId);

    await expect(
      proposals.connect(addr1).voteUp(proposalId)
    ).to.be.revertedWith("already voted");

    const proposal = await proposals.proposals(proposalId);
    expect(proposal.votes).to.equal(1);
  });

  it("Should not finalize a proposal if quorum is not met", async function () {
    const proposalId = 1;
    const proposalName = "Proposal 1";
    const proposalDescription = "Description for Proposal 1";
    const proposalAmount = ethers.utils.parseEther("1"); // 1 ETH
    const recipient = addr1.address;
    const recipientBalance = ethers.utils.parseEther("0"); // 0 ETH initially

    await proposals.createProposal(
      proposalName,
      proposalDescription,
      proposalAmount,
      recipient,
      recipientBalance
    );

    await proposals.connect(addr1).voteUp(proposalId);

    const proposal = await proposals.proposals(proposalId);
    console.log("Proposal: ", proposal)
    console.log("Quorum: ", await proposals.quorum())
    console.log("_Numbers: ", await artistWhiteList._numbers())

    await expect(
      proposals.finalizeProposal(proposalId)
    ).to.be.revertedWith("must reach quorum to finalize proposal");

    //const proposal = await proposals.proposals(proposalId);
    //console.log("Proposal: ", proposal)
    expect(proposal.finalized).to.equal(false);
  });
});
