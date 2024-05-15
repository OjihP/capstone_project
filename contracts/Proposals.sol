//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ArtistWhiteList.sol";
import "./ContractData.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Proposals is ArtistWhiteList, ContractData {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    uint256 public proposalCount;
    uint256 public quorum;

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

    // Create proposal
    function createProposal(
        string memory _name,
        string memory _description,
        uint256 _amount,
        address payable _recipient,
        uint256 _recipientBalance
    ) external {
        require(address(this).balance >= _amount, "Amount exceeds contract funds.");

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
        // Set qourum based on the number of white listed users
        uint256 whtListTotal = _numbers.current();
        quorum = whtListTotal.mul(60).div(100);

        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Mark proposal as finalized
        proposal.finalized = true;

        // Check that proposal has enough votes
        require(proposal.votes >= quorum, "must reach quorum to finalize proposal");

        // Check that the contract has enough ether
        require(address(this).balance >= proposal.amount);

        // Transfer the funds to recipient
        (bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
        require(sent);

        // Emit event
        emit Finalize(_id);
    }
}