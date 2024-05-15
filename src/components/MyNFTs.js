import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap'

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const MyNFTs = ({ provider, artnft, account }) => {
   const [_nftNames, setTokenNames] = useState([])
   const [myListedCIDs, setMyTokenCIDs] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [_fileTypes, setFileTypes] = useState([])
   const [listedAmounts, setMintAmounts] = useState([])
   const [purchaseAmount, setPurchaseAmount] = useState(null)
   const [audioFilePresent, setAudioFilePresent] = useState(false)
   const [listedState, setListedState] = useState(true)
   //const [myListedURIs, setMyURIs] = useState([])
        
        const getMyNFTs = async () => {
            const signer = await provider.getSigner()
            const myIds = await artnft.connect(signer).getMyIds(account)
            console.log("myIds: ", myIds.toString())
            const myCIDs = myIds.map(async (tokenId) => {
                const tokenCID = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Token CID: ", tokenCID.tokenCIDs)
                    return tokenCID.tokenCIDs
            }) 

            const myTokenCIDs = await Promise.all(myCIDs)
            console.log("CIDs: ", myCIDs)

            setMyTokenCIDs(myTokenCIDs)
            //console.log(myListedURIs)
            //const listedStruct = await artnft.getListedForTokenId(1)
            //console.log('listedTokenStruct: ', listedStruct)
        }

    useEffect(() => {
        getMyNFTs()
    }, []);

    return (
        <div className='text-center'>
            <p><strong>MY NFTs</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {myListedCIDs.map((uri, index) => (
                    <Col key={index} className="overflow-hidden">
                        <Card style={{ width: "50px" }}>
                            <Card.Img 
                             variant="top" 
                             src={`https://gateway.pinata.cloud/ipfs/${uri[0]}`} 
                             height="50px"
                             width="50px"
                            />
                        </Card>
                    </Col>
                ))}
                </Row>
            </div>
        </div>
    )
}

export default MyNFTs;