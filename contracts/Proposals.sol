//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";

contract Proposals {
    using Counters for Counters.Counter;

    Counters.Counter private proposalCount;
    uint256 private quorum;
    ArtistMarketplace private artistMarketplace;
    ArtistWhiteList private artistWhiteList;

    mapping(uint256 => Proposal) private proposals;
    mapping(address => mapping(uint256 => bool)) private votes;

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
    event Vote(uint256 id, address voter);
    event Finalize(uint256 id);

    constructor(address payable marketplaceAddress, address whiteListAddress) {
        artistMarketplace = ArtistMarketplace(marketplaceAddress);
        artistWhiteList = ArtistWhiteList(whiteListAddress);
    }

    function getProposalCount() external view returns (uint256) {
        return proposalCount.current();
    }

    function getProposalFromProposalId(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getQuorum() external view returns (uint256) {
        return quorum;
    }

    function initializeQuorum() external returns (uint256) {
        // Set quorum based on the number of white listed users
        uint256 totalListed = artistWhiteList.getCurrentWhtListCounter();
        ArtistWhiteList.UserInfo[] memory totalWhtListedArray;
        
        for (uint256 i = 1; i < totalListed; i++) {
            ArtistWhiteList.UserInfo memory userInfo = artistWhiteList.getUserByNumber(i);
            if (userInfo.isListed == true) {
                totalWhtListedArray[i] = userInfo;
            }
        }

        uint256 totalWhtListed = totalWhtListedArray.length;
        
        uint256 numerator = totalWhtListed * 70;
        uint256 denominator = 100;
        uint256 quotient = numerator / denominator;
        uint256 remainder = numerator % denominator;

        // Check the remainder to determine if we should round up or down
        if (remainder * 2 >= denominator) {
            quorum = quotient + 1; // Round up
        } else {
            quorum = quotient; // Round down
        }

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
        proposalCount.increment();
        uint proposalId = proposalCount.current();

        proposals[proposalId] = Proposal(
            proposalId,
            _name,
            _description,
            _amount,
            _recipient,
            _recipientBalance,
            0,
            false
        );

        emit Propose(
            proposalId,
            _amount,
            _recipient,
            msg.sender
        );
    }

    // Up vote a proposal
    function voteUp(uint256 _id) external {
        Proposal storage proposal = proposals[_id];

        require(!votes[msg.sender][_id], "Already voted");

        proposal.votes++;
        votes[msg.sender][_id] = true;

        emit Vote(_id, msg.sender);
    }

    function hasVoted(address user, uint256 proposalId) external view returns (bool) {
        return votes[user][proposalId];
    }

    // Finalize proposal & transfer funds
    function finalizeProposal(uint256 _id) external {
        Proposal storage proposal = proposals[_id];

        require(!proposal.finalized, "Proposal already finalized");
        require(proposal.votes >= quorum, "Must reach quorum to finalize proposal");
        require(address(artistMarketplace).balance >= proposal.amount, "Amount exceeds contract funds");

        // Transfer the funds to recipient from marketplace contract
        artistMarketplace.transferFunds(proposal.recipient, proposal.amount);

        proposal.finalized = true;

        emit Finalize(_id);
    }
}
