//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";
//import "./ContractData.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Proposals {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    uint256 public proposalCount;
    uint256 public quorum;
    ArtistMarketplace public contractCall;
    ArtistWhiteList public listCall;
    uint256 public whtListTotal;

    mapping(uint256 => Proposal) public proposals;
    //mapping(uint256 => uint256) public recipientBalances;
    mapping(address => mapping(uint256 => bool)) votes;

    struct Proposal {
        uint256 id;
        string name;
        string description;
        uint256 amount;
        address payable recipient;
        uint256 recipientBalance;
        uint256 votes;
        bool finalized;
    }

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );
    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);

    constructor(address payable marketplaceAddress, address whiteListAddress) {
        contractCall = ArtistMarketplace(marketplaceAddress);
        listCall = ArtistWhiteList(whiteListAddress);
    }

    function initializeQuorum() public returns (uint256) {
        // Set qourum based on the number of white listed users
        whtListTotal = listCall.getWhtListTotal();
        quorum = whtListTotal.mul(70).div(100);
        return quorum;
    }

    function getQuorum() public view returns (uint256) {
        return quorum;
    }

    // Create proposal
    function createProposal(
        string memory _name,
        string memory _description,
        uint256 _amount,
        address payable _recipient,
        uint256 _recipientBalance
    ) public {
        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _description,
            _amount,
            _recipient,
            _recipientBalance,
            0,
            false
        );

        emit Propose(
            proposalCount,
            _amount,
            _recipient,
            msg.sender
        );
    }

    // Up vote a proposal
    function voteUp(uint256 _id) external {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let investors vote twice
        require(!votes[msg.sender][_id], "already voted");

        // update votes
        proposal.votes++;

        // Track that user has voted
        votes[msg.sender][_id] = true;

        // Emit an event
        emit Vote(_id, msg.sender);
    }

    function hasVoted(address user, uint256 proposalId) public view returns (bool) {
        return votes[user][proposalId];
    }

    // Down vote a proposal
    /*function voteDown(uint256 _id) external {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let investors vote twice
        require(!votes[msg.sender][_id], "already voted");

        // update votes
        proposal.votes--;

        // Track that user has voted
        votes[msg.sender][_id] = true;

        // Emit an event
        emit Vote(_id, msg.sender);
    }*/

    // Finalize proposal & tranfer funds
    function finalizeProposal(uint256 _id) external {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Check that proposal has enough votes
        require(proposal.votes >= quorum, "must reach quorum to finalize proposal");

        // Check that the contract has enough ether
        require(contractCall.getMarketplaceBalance() >= proposal.amount, "Amount exceeds contract funds.");

        // Transfer the funds to recipient from marketplace contract
        contractCall.transferFunds(proposal.recipient, proposal.amount);

        // Transfer the funds to recipient
        //(bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
        //require(sent, "could not send funds to recipient");

        // Mark proposal as finalized
        proposal.finalized = true;

        // Emit event
        emit Finalize(_id);
    }
}