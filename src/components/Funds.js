import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { Button, Form, Table, Spinner } from 'react-bootstrap';

const toWei = (n) => ethers.utils.parseEther(n.toString());

const Funds = ({ provider, artnft, account, pose }) => {
  const [balance, setBalance] = useState(0);
  const [proposals, setProposals] = useState([]);
  const [quorum, setQuorum] = useState(0);
  const [proposalName, setProposalName] = useState('');
  const [description, setDescription] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [address, setAddress] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState('');
  const [userVotes, setUserVotes] = useState({});
  const [finalizedProposals, setFinalizedProposals] = useState(new Set()); // Track finalized proposals

    const fundsAndProposals = async () => {
        const signer = await provider.getSigner();

        // Fetch contract balance
        let balance = await provider.getBalance('0x5fbdb2315678afecb367f032d93f642f64180aa3');
        balance = ethers.utils.formatUnits(balance, 18);
        setBalance(balance);
        console.log(balance);

        // Fetch quorum and whitelisted users total
        const Korum = await pose.getQuorum();
        setQuorum(Korum);
        const whtListTotal = await pose.whtListTotal();
        console.log("Quorum: ", Korum.toString());
        console.log("Whitelisted Users Total: ", whtListTotal.toString());

        // Fetch proposals count
        const count = await pose.connect(signer).proposalCount();
        const items = [];

        // Track user votes
        const votes = {};

        for (var i = 0; i < count; i++) {
            const proposal = await pose.connect(signer).proposals(i + 1);
            items.push(proposal);

            // Check if the user has voted on this proposal
            const userHasVoted = await pose.connect(signer).hasVoted(account, i + 1);
            votes[proposal.id.toString()] = userHasVoted;
        }
        console.log("Count: ", count.toString());
        console.log(items);
        setProposals(items);
        setUserVotes(votes);
    };

    const proposalHandler = async (e) => {
        e.preventDefault();

        setAddress(account);

        // Checks if description is empty
        if (!description.trim()) {
            setError('Please enter a proposal description.');
            return;
        }

        setIsWaiting(true);

        try {
            const signer = await provider.getSigner();
            const formattedAmount = toWei(withdrawAmount).toString();
            const recipientBalance = await provider.getBalance(address);

            // Initialize quorum in the Proposals contract
            const init = await pose.connect(signer).initializeQuorum();
            await init.wait();

            const transaction = await pose.connect(signer).createProposal(proposalName, description, formattedAmount, address, recipientBalance);
            await transaction.wait();

            fundsAndProposals();
        } catch (error) {
            console.error(error);
            window.alert('User rejected or transaction reverted');
        } finally {
            setIsWaiting(false);
        }
    };

    const voteHandler = async (id) => {
        console.log(quorum.toString());
        try {
            const signer = await provider.getSigner();
            const transaction = await pose.connect(signer).voteUp(id);
            await transaction.wait();

            // Update user votes state
            setUserVotes({ ...userVotes, [id.toString()]: true });
        } catch {
            window.alert('User rejected or transaction reverted');
        }

        fundsAndProposals();
    };

    const finalizeHandler = async (id) => {
        console.log(quorum.toString());
        try {
            const signer = await provider.getSigner();
            const transaction = await pose.connect(signer).finalizeProposal(id);
            await transaction.wait();
        } catch {
            window.alert('User rejected or transaction reverted');
        }

        fundsAndProposals();
    };

    useEffect(() => {
        fundsAndProposals();
    }, []);

    return (
        <div className="text-center">
            <p><strong>Contract Funds</strong></p>
            <p>Contract Balance: {balance} ETH</p>
            <div>
                <p><strong>Proposal a Withdrawal</strong></p>
                <Form onSubmit={proposalHandler}>
                    <Form.Group style={{ maxWidth: '450px', margin: '10px auto' }}>
                        <Form.Control
                            type='text'
                            placeholder='Enter the name for the proposal'
                            className='my-2'
                            onChange={(e) => setProposalName(e.target.value)}
                        />
                        <Form.Control
                            type='text'
                            placeholder='Enter a description for the proposal'
                            className='my-2'
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <Form.Control
                            type='number'
                            placeholder='Enter the requested amount'
                            className='my-2'
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <Form.Control
                            type='text'
                            placeholder='Enter the recipient address'
                            className='my-2'
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        {error && <div style={{ color: 'red' }}>{error}</div>}
                        {isWaiting ? (
                            <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
                        ) : (
                            <Button variant='primary' type='submit' style={{ width: '100%' }}>
                                Create Proposal
                            </Button>
                        )}
                    </Form.Group>
                </Form>
            </div>
            <div>
                <Table striped bordered hover responsive variant="dark">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Proposal Name</th>
                            <th>Proposal Description</th>
                            <th>Recipient Address</th>
                            <th>Recipient Balance</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Total Votes / Quorum</th>
                            <th>Cast Vote</th>
                            <th>Finalize</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proposals.map((proposal, index) => (
                            <tr key={index}>
                                <td>{proposal.id.toString()}</td>
                                <td>{proposal.name}</td>
                                <td>{proposal.description}</td>
                                <td>{proposal.recipient}</td>
                                <td>{Number(ethers.utils.formatUnits(proposal.recipientBalance, 18)).toFixed(1)} ETH</td>
                                <td>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</td>
                                <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
                                <td>{proposal.votes.toString()} / {quorum.toString()}</td>
                                <td>
                                    {!proposal.finalized && (
                                        <Button
                                            variant="primary"
                                            style={{
                                                width: '100%',
                                                backgroundColor: userVotes[proposal.id.toString()] ? 'gray' : '',
                                                cursor: userVotes[proposal.id.toString()] ? 'not-allowed' : 'pointer'
                                            }}
                                            disabled={userVotes[proposal.id.toString()]}
                                            onClick={() => voteHandler(proposal.id)}
                                        >
                                            Vote
                                        </Button>
                                    )}
                                </td>
                                <td>
                                    {!proposal.finalized && !finalizedProposals.has(proposal.id.toString()) && proposal.recipient === account && (
                                        <Button
                                            variant="primary"
                                            style={{ width: '100%' }}
                                            onClick={() => finalizeHandler(proposal.id)}
                                        >
                                            Finalize
                                        </Button>
                                    )}
                                    {(proposal.finalized || finalizedProposals.has(proposal.id.toString())) && (
                                        <Button
                                            variant="primary"
                                            style={{ width: '100%', backgroundColor: '#CCCCCC', cursor: 'not-allowed' }}
                                            disabled={true}
                                        >
                                            Finalized
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default Funds;
