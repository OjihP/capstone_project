import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button, Form, InputGroup } from 'react-bootstrap';

import config from '../config.json';

const Donate = ({ provider, account, whtList }) => {
    const [donateAmount, setDonateAmount] = useState(0);
    const [donationName, setDonatorName] = useState('')
    //const [account, setAccount] = useState(null);

    const handleDonate = async () => {
        if (!provider || !account) {
            console.error('Provider or account is not initialized.');
            return;
        }

        // Convert donation amount to wei
        const donationInWei = ethers.utils.parseEther(donateAmount.toString());
        console.log(donationInWei.toString())

        // Validate donation amount
        if (isNaN(donationInWei) || donationInWei <= 0) {
            console.log(donationInWei)
            console.error('Invalid donation amount.');
            return;
        }

        // Get the signer
        const signer = await provider.getSigner();

        // Prepare the transaction
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        const networkConfig = config[chainId];

        const tx = {
            to: networkConfig.artistContract.address, // Replace with your contract address
            value: donationInWei,
        };

        // Sign and send the transaction
        try {
            const txResponse = await signer.sendTransaction(tx);
            console.log('Transaction sent:', txResponse);
            window.alert('Transaction sent!');
        } catch (error) {
            console.error('Error sending transaction:', error.message);
            window.alert('Error sending transaction: ', error.message)
        }

        try {
            if (donateAmount >= 0.5) {
                await whtList.connect(signer).addToWhtList(account, donationName)
            }
        } catch (error) {
            window.alert('Error with whitelist: ', error.message)
        }
    }

    const handleAmountChange = (e) => {
        setDonateAmount(e.target.value);
    }

    const handleNameChange = (e) => {
        setDonatorName(e.target.value);
    }

    return (
        <div className="padding-fromNav text-center">
            <p>
                <strong>Donate</strong>
            </p>
            <InputGroup className="mb-3">
                <Form.Control
                    onChange={handleAmountChange}
                    style={{ width: '10px' }}
                    size="sm"
                    required
                    type="number"
                    placeholder="Donation in sepoliaETH"
                    aria-label="Donation Amount"
                    aria-describedby="basic-addon1"
                />
                <Form.Control
                    onChange={handleNameChange}
                    style={{ width: '10px' }}
                    size="sm"
                    required
                    type="text"
                    placeholder="Name of Donator"
                    aria-label="Donator Name"
                    aria-describedby="basic-addon1"
                />
                <Button onClick={handleDonate} variant="primary" id="button-addon1">
                    Donate!
                </Button>
            </InputGroup>
            <p>
                If you would like to donate, please enter the amount in sepoliaETH along with a name. If you can donate 0.5 sepoliaETH or more, you will be automatically be added to the whitelist.
            </p>
        </div>
    );
};

export default Donate;
