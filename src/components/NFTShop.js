import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap'
import ReactAudioPlayer from 'react-audio-player'

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const NFTShop = ({ provider, artnft, account, minter }) => {
   const [_nftNames, setTokenNames] = useState([])
   const [listedCIDs, setTokenCIDs] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [_fileTypes, setFileTypes] = useState([])
   const [listedAmounts, setMintAmounts] = useState([])
   const [purchaseAmount, setPurchaseAmount] = useState(null)
   const [audioFilePresent, setAudioFilePresent] = useState(false)
   const [listedState, setListedState] = useState(true)
   //const [myListedURIs, setMyURIs] = useState([])
        
        const base = async () => {
            const signer = await provider.getSigner()

            const supply = await artnft.connect(signer).totalSupply()
            console.log("Total Supply: ", supply)
            //console.log("Token of Owner By Index: ", tokenOfOwnerByIndex())
            //console.log("Token By Index", tokenByIndex())
        }
        const loadAllNFTs = async () => {
            try {
                const signer = await provider.getSigner();
                const count = await minter._tokenIds();
                const items = [];

                console.log("Total tokens count:", count.toString());

        
                // Retrieve token IDs
                /*for (let i = 0; i < count; i++) {
                    const userInfo = await artnft.connect(signer).idToListedToken(i + 1);
                    items.push(userInfo.tokenId);
                }*/

                // Retrieve token IDs
                for (let i = 0; i < count; i++) {
                    try {
                        const userInfo = await artnft.idToListedToken(i + 1); // Ensure idToListedToken is defined in the contract
                        items.push(userInfo.tokenId);
                        console.log(`Token ID ${i + 1}:`, userInfo.tokenId.toString());
                    } catch (innerError) {
                        console.error(`Error retrieving token info for token ID ${i + 1}:`, innerError);
                    }
                }
        
                // Helper function to get token details
                const getTokenDetails = async (tokenId) => {
                    const tokenDetails = await artnft.connect(signer).getListedFromTokenId(tokenId);
                    return tokenDetails;
                };
        
                // Retrieve all token details concurrently
                const tokenDetailsPromises = items.map(getTokenDetails);
                const tokenDetails = await Promise.all(tokenDetailsPromises);
        
                // Extract specific details
                const tokenNames = tokenDetails.map(details => details.nftName);
                const tokenCIDs = tokenDetails.map(details => details.tokenCIDs);
                const tokenPrices = tokenDetails.map(details => details.priceOfNFT.toString());
                const tokenFileTypes = tokenDetails.map(details => details.fileTypes);
                const tokenAmounts = tokenDetails.map(details => details.supplyAmount);
                const listedTokens = tokenDetails.map(details => details.currentlyListed);
        
                // Log the details
                console.log("Token Names:", tokenNames);
                console.log("Token CIDs:", tokenCIDs);
                console.log("Prices:", tokenPrices);
                console.log("File Types:", tokenFileTypes);
                console.log("Mint amounts:", tokenAmounts.toString());
                console.log("Listed Tokens:", listedTokens);
        
                // Update the state
                setTokenNames(tokenNames);
                setTokenCIDs(tokenCIDs);
                setListedPrice(tokenPrices);
                setFileTypes(tokenFileTypes);
                setMintAmounts(tokenAmounts);
                setListedState(listedTokens);
        
                // Additional processing
                const audioPresentList = tokenFileTypes.map(types => {
                    return types.some(type => type === 'audio/mpeg');
                });
                setAudioFilePresent(audioPresentList);
        
            } catch (error) {
                console.log('Error', error);
            }
        };

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
            } catch (error) {
                console.log('Error', error)
            }

            window.alert('NFT(s) has been purchased')

            loadAllNFTs()
        }

    useEffect(() => {
        loadAllNFTs()
        //base()
    }, [artnft]);

    return (
        <div className='padding-fromNav text-center'>
            <p><strong>NFT Shop</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {listedCIDs.map((uri, index) => (
                    <Col key={index} className="overflow-hidden">
                        <Card bg="dark" border="primary" style={{ width: "190px", height: "350px" }}>
                            <Card.Header>
                                <Form.Control className="text-center" plaintext readOnly style={{ color: 'white' }} defaultValue={_nftNames[index]} />
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