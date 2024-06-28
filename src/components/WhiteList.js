import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Row, Form, Button, Table, Container } from 'react-bootstrap';

const WhiteList = ({ provider, whtList, account }) => {
    const [_usersOnWhtList, setUsersWhtListed] = useState([]);
    const [userAddress, setUserAddress] = useState('');
    const [userName, setUserName] = useState('');
    const [userNumber, setUserNumber] = useState('');

    const addUserToWhiteList = async () => {
        const signer = await provider.getSigner();
        const transaction = await whtList.connect(signer).addToWhtList(userAddress, userName);
        await transaction.wait();
        displayWhiteListedUsers();
    };

    const removeUserFromWhiteList = async () => {
        const signer = await provider.getSigner();
        const userNumberInt = parseInt(userNumber, 10);

        const totalUsers = await whtList.getWhtListTotal();
        if (userNumberInt > totalUsers || userNumberInt <= 0) {
            alert('Invalid user number');
            return;
        }

        const transaction = await whtList.connect(signer).removeFromWhtList(userNumberInt);
        await transaction.wait();
        displayWhiteListedUsers();
    };

    const displayWhiteListedUsers = async () => {
        const count = await whtList.getWhtListTotal();
        const items = [];

        for (let i = 0; i < count; i++) {
            try {
                const userInfo = await whtList.getUserByNumber(i + 1);
                items.push(userInfo);
            } catch (error) {
                console.error(`Error fetching user at index ${i + 1}:`, error);
            }
        }

        setUsersWhtListed(items);
    };

    useEffect(() => {
        displayWhiteListedUsers();
    }, []);

    return (
        <div className='text-center'>
            <p><strong>White List</strong></p>
            <Table striped bordered hover responsive variant="dark">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {_usersOnWhtList.map((info, index) => (
                        <tr key={index}>
                            <td>{info.userNumber.toString()}</td>
                            <td>{info.nameForAddress}</td>
                            <td>{info.userAddress}</td>
                            <td>{info.isListed.toString()}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <div className="px-5 py-3 container">
                <p><strong>Add User to White List</strong></p>
                <Form.Control onChange={(e) => setUserAddress(e.target.value)} size="lg" required type="text" placeholder="Type or paste user address here" />
                <Form.Control onChange={(e) => setUserName(e.target.value)} size="lg" required type="text" placeholder="Type or paste username here" />
                <Button onClick={addUserToWhiteList} variant="primary" size="lg">
                    Add to White List
                </Button>
                <p><strong>Remove User from White List</strong></p>
                <Form.Control onChange={(e) => setUserNumber(e.target.value)} size="lg" required type="number" placeholder="Type or paste user number here" />
                <Button onClick={removeUserFromWhiteList} variant="primary" size="lg">
                    Remove from White List
                </Button>
            </div>
        </div>
    );
};

export default WhiteList;
