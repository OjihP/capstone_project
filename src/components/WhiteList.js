import { useState, useEffect } from 'react'
import { ethers } from 'ethers';
import { Row, Form, Button, Table, Container } from 'react-bootstrap';

const WhiteList = ({ provider, artnft, whtList, account }) => {
    const [_usersOnWhtList, setUsersWhtListed] = useState([])
    const [userAddress, setUserAddress] = useState([])
    const [userName, setUserName] = useState([])

    const addUserToWhiteList = async () => {
        const signer = await provider.getSigner()

        const transaction = await artnft.connect(signer).addToWhtList(userAddress, userName)
        await transaction.wait()

        displayWhiteListedUsers()
    }

    const removeUserFromWhiteList = async () => {
        const signer = await provider.getSigner()

        const transaction = await artnft.connect(signer).removeFromWhtList(userAddress)
        await transaction.wait()

        displayWhiteListedUsers()
    }

    const displayWhiteListedUsers = async () => {
        const signer = await provider.getSigner()

        //const usersOnWhtList = await whtList.connect(signer).getAllUsersOnWhiteList()
        //console.log(usersOnWhtList)

        //const whiteListIndex = await artnft.connect(signer).getUserNumbersOnWhiteList()
        //console.log("Whitelist Index: ", whiteListIndex.toString())

        const count = await artnft._numbers()
        const items = []

        /*for(var i = 0; i < count; i++) {
            const userInfo = await artnft.whtList(i + 1)
            items.push(userInfo)
        }*/

        for(var i = 0; i < count; i++) {
            const userInfo = await artnft.whtList(i + 1)
            items.push(userInfo.userNumber)
        }

        console.log(items.toString())

        //const usersOnWhtList = await artnft.connect(signer).getAllUsersOnWhiteList()
        //console.log(usersOnWhtList)
        const whiteListIndex = items
        console.log("Whitelist Index: ", whiteListIndex.toString())

        const whtListedUsers = whiteListIndex.map(async (num) => {
            const whtListedUser = await artnft.connect(signer).getUserByNumber(num)
            console.log("Whitelisted User: ", whtListedUser.toString())
            return whtListedUser
        })

        const usersWhtListed = await Promise.all(whtListedUsers)
        console.log("Users Whitelisted: ", usersWhtListed)
        
        setUsersWhtListed(usersWhtListed)
    }

    useEffect(() => {
        displayWhiteListedUsers()
    }, []);

    return (
        <div className='text-center'>
            <p><strong>White List</strong></p>
                <Table striped bordered hover responsive>
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
                    <Form.Control onChange={(e) => setUserAddress(e.target.value)} size="lg" required type="text" placeholder="Type or paste user address here" />
                    <Button onClick={removeUserFromWhiteList} variant="primary" size="lg">
                            Remove from White List
                    </Button>
            </div>
        </div>
    )
}

export default WhiteList;