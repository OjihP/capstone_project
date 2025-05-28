//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ArtistMarketplace.sol";
import "./ArtistWhiteList.sol";

contract Proposals {
    using Counters for Counters.Counter;

    Counters.Counter private proposalCount;
    uint256 private quorum;
    ArtistMarketplace private artistMarketplace;
    ArtistWhiteList private whiteList;
    address private contractCreator;

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
        whiteList = ArtistWhiteList(whiteListAddress);
        contractCreator = artistMarketplace.getCreatorAddress();
    }

    modifier onlyWhtListed(address caller) {
        bool chkWhtList = whiteList.isWhitelisted(caller);
        require(chkWhtList == true, "Unauthorized User(POSE)");
        _;
    }

    modifier authorizedPersonnel(address caller) {
        require(caller == contractCreator || whiteList.isWhitelisted(caller) == true, "Unauthorized User(POSE1)");
        _;
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

    function initializeQuorum(address caller) external authorizedPersonnel (caller) returns (uint256) {
        // Set quorum based on the number of white listed users
        uint256 totalListed = whiteList.getCurrentWhtListCounter();
        ArtistWhiteList.UserInfo[] memory totalWhtListedArray = new ArtistWhiteList.UserInfo[](totalListed);

        uint256 whtListedCount = 0;
        
        for (uint256 i = 1; i <= totalListed; i++) {
            ArtistWhiteList.UserInfo memory userInfo = whiteList.getUserByNumber(i);
            if (userInfo.isListed == true) {
                totalWhtListedArray[whtListedCount] = userInfo;
                whtListedCount++;
            }
        }

        uint256 totalWhtListed = whtListedCount;
        
        uint256 numerator = totalWhtListed * 70;
        uint256 denominator = 100;
        uint256 quotient = numerator / denominator;
        uint256 remainder = numerator % denominator;

        // Check the remainder to determine if we should round up or down
        if (remainder >= 50) {
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
        uint256 _recipientBalance,
        address caller
    ) public onlyWhtListed (caller) {
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
    function voteUp(uint256 _id, address caller) external onlyWhtListed (caller) {
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
    function finalizeProposal(uint256 _id, address caller) external onlyWhtListed (caller) {
        Proposal storage proposal = proposals[_id];

        require(!proposal.finalized, "Proposal already finalized");
        require(proposal.votes >= quorum, "Must reach quorum to finalize proposal");
        require(address(artistMarketplace).balance >= proposal.amount, "Amount exceeds contract funds");

        // Transfer the funds to recipient from marketplace contract
        artistMarketplace.transferFunds(proposal.recipient, proposal.amount, caller);

        proposal.finalized = true;

        emit Finalize(_id);
    }
}