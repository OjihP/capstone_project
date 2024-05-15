import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap'
import ReactAudioPlayer from 'react-audio-player'

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const NFTShop = ({ provider, artnft, account }) => {
   const [_nftNames, setTokenNames] = useState([])
   const [listedCIDs, setTokenCIDs] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [_fileTypes, setFileTypes] = useState([])
   const [listedAmounts, setMintAmounts] = useState([])
   const [purchaseAmount, setPurchaseAmount] = useState(null)
   const [audioFilePresent, setAudioFilePresent] = useState(false)
   const [listedState, setListedState] = useState(true)
   //const [myListedURIs, setMyURIs] = useState([])
        
        const loadAllNFTs = async () => {
            try {
                const signer = await provider.getSigner()
                const Ids = await artnft.connect(signer).getTokenIdsFromListedToken()
                console.log("Ids: ", Ids.toString())

                const nftNames = Ids.map(async (tokenId) => {
                    const tokenName = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Token Name: ", tokenName.nftName)
                    return tokenName.nftName
                })
               
                const CIDs = Ids.map(async (tokenId) => {
                    const tokenCID = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Token CID: ", tokenCID.tokenCIDs)
                    return tokenCID.tokenCIDs
                }) 

                const fileTypes = Ids.map(async (tokenId) => {
                    const tokenFileType = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("File Types within Token: ", tokenFileType.fileTypes)
                    return tokenFileType.fileTypes
                })

                const prices = Ids.map(async (tokenId) => {
                    const tokenPrice = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Token Price", tokenPrice.priceOfNFT.toString())
                    return tokenPrice.priceOfNFT.toString()
                })

                const mintAmounts = Ids.map(async (tokenId) => {
                    const tokenAmount = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Token Amount", tokenAmount.mintAmount)
                    return tokenAmount.mintAmount
                })

                const currentlyListed = Ids.map(async (tokenId) => {
                    const listedStatus = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Listed Status: ", listedStatus.currentlyListed)
                    return listedStatus.currentlyListed
                })

                const tokenNames = await Promise.all(nftNames)
                const tokenCIDs = await Promise.all(CIDs)
                const tokenPrices = await Promise.all(prices)
                const tokenFileTypes = await Promise.all(fileTypes)
                const tokenAmounts = await Promise.all(mintAmounts)
                const listedTokens = await Promise.all(currentlyListed)
                console.log("Token Names: ", tokenNames)
                console.log("Token CIDs ", tokenCIDs)
                console.log('Prices: ', prices)
                console.log('File Types: ', fileTypes)
                console.log('Mint amounts: ', mintAmounts)
                console.log("Listed Tokens: ", listedTokens)
                setTokenNames(tokenNames)
                setTokenCIDs(tokenCIDs)
                setListedPrice(tokenPrices)
                setFileTypes(tokenFileTypes)
                setMintAmounts(tokenAmounts)
                setListedState(listedTokens)
                console.log(tokenNames)
                console.log(listedCIDs)
                console.log(_fileTypes)
                console.log(listedPrice)
                console.log(listedAmounts.toString())

                const audioPresentList = _fileTypes.map(types => {
                    return types.some(type => type === 'audio/mpeg');
                });
                setAudioFilePresent(audioPresentList);

            } catch (error) {
                console.log('Error', error)
            }
        }

        const buyNFT = async (index) => {
            try {
                const tokenId = index + 1
                console.log('TokenId: ', tokenId)
                console.log('Price by Index: ', listedPrice[index])
                const signer = await provider.getSigner()
                console.log(ethers.BigNumber.from(listedPrice[index]).mul(purchaseAmount))
                await artnft.connect(signer).executeSale(tokenId, purchaseAmount, { value: ethers.BigNumber.from(listedPrice[index]).mul(purchaseAmount) })
                const sale = await artnft.getListedFromTokenId(tokenId)
                console.log('Creator of NFT: ', sale.creator)
                console.log('Owner of NFT: ', sale.owner)
                console.log('Seller of NFT: ', sale.seller)
                loadAllNFTs()
            } catch (error) {
                console.log('Error', error)
            }
        }

    useEffect(() => {
        loadAllNFTs()
    }, []);

    return (
        <div className='text-center'>
            <p><strong>NFT Shop</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {listedCIDs.map((uri, index) => (
                    <Col key={index} className="overflow-hidden">
                        <Card bg="dark" border="primary" style={{ width: "190px", height: "350px" }}>
                            <Card.Header>
                                <Form.Control plaintext readOnly style={{ color: 'white' }} defaultValue={_nftNames[index]} />
                            </Card.Header>
                            <Card.Img 
                             variant="top" 
                             src={`https://gateway.pinata.cloud/ipfs/${uri[0]}`} 
                             height="200px"
                             width="0px"
                            />
                            {audioFilePresent[index] && (
                                <ReactAudioPlayer
                                    style={{ width: "189px", height: "20px" }}
                                    src={`https://gateway.pinata.cloud/ipfs/${uri[1]}`}
                                    controls
                                    controlslist="nodownload"
                                />
                            )}
                             <Card.Footer> 
                                <InputGroup className="mb-3">
                                    <Button onClick={() => buyNFT(index)} style={{ width: "100px" }} variant="primary" id="button-addon1" size="sm" disabled={listedState[index] === false}>
                                        Buy {fromWei(listedPrice[index]).toString()} ETH {'\n'} {listedAmounts[index].toString()} Left
                                    </Button>
                                    <Form.Control onChange={(e) => setPurchaseAmount(e.target.value)} style={{ width: "10px" }} aria-label="Amount purchase" aria-descibedby="basic-addon1" disabled={listedState[index] === false}/>
                                </InputGroup>
                             </Card.Footer>
                        </Card>
                    </Col>
                ))}
                </Row>
            </div>
        </div>
    )
}

export default NFTShop;