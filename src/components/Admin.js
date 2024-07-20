import { ethers } from 'ethers';
import { useState, useEffect } from 'react'
import { Button, Form, Table, Spinner } from 'react-bootstrap';

const toWei = (n) => ethers.utils.parseEther(n.toString())

const Admin = ({ provider, artnft, whtList, pose, account }) => {
    const [userAddress, setUserAddress] = useState('')
    const [userName, setUserName] = useState('')
    const [initialName, setInitialName] = useState('')
    const [initialAddress, setInitialAddress] = useState('')
    const [initialNumber, setInitialNumber] = useState('')
    const [listPrice, setListPrice] = useState(0)
    
    const initializeArtist = async () => {
        const signer = await provider.getSigner()

        const transaction = await whtList.connect(signer).addToWhtList(userAddress, userName)
        await transaction.wait()

        const initializedInfo = await whtList.connect(signer).getUserByNumber(1)
        console.log(initializedInfo)
        console.log(initializedInfo.nameForAddress)
        console.log(initializedInfo.userAddress)
        console.log(initializedInfo.userNumber.toString())
        setInitialName(initializedInfo.nameForAddress)
        setInitialAddress(initializedInfo.userAddress)
        setInitialNumber(initializedInfo.userNumber.toString())
    }

    const changeListPrice = async () => {
        const signer = await provider.getSigner()
        console.log(listPrice)
        const listPriceWei = toWei(listPrice)
        console.log(listPriceWei.toString())

        const transaction = await artnft.connect(signer).updateListPrice(listPriceWei)
        await transaction.wait()
    }
 
    return (
        <div className='padding-fromNav text-center'>
            <p><strong>Set Initial Artist Address</strong></p>
            <p>Initialized Artist:</p>
            <Table striped="columns" bordered hover responsive variant="dark">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Address</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{initialNumber}</td>
                        <td>{initialName}</td>
                        <td>{initialAddress}</td>
                    </tr>
                </tbody>
            </Table>
                <Form.Control onChange={(e) => setUserAddress(e.target.value)} size="lg" required type="text" placeholder="Type or paste user address here" />
                <Form.Control onChange={(e) => setUserName(e.target.value)} size="lg" required type="text" placeholder="Type or paste username here" />
                <Button onClick={initializeArtist} variant="primary" size="lg">
                    Add to White List
                </Button>
            <p><strong>Update Listing Price</strong></p>
            <p>Current Listing Price: {listPrice} ETH</p>
                <Form.Control onChange={(e) => setListPrice(e.target.value)} size="lg" required type="text" placeholder="Enter new listing price in ETH" />
                <Button onClick={changeListPrice} variant="primary" size="lg">
                    Change List Price
                </Button>
        </div>
    )
 }
 
 export default Admin;