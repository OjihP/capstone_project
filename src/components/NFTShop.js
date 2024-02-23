import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button } from 'react-bootstrap'

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const NFTShop = ({ provider, artnft, account }) => {
   const [listedtokenIds, setListedTokenIds] = useState([])
   const [listedURIs, setTokenURIs] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [myListedURIs, setMyURIs] = useState([])
        
        const loadAllNFTs = async () => {

            try {
                const signer = await provider.getSigner()
                const Ids = await artnft.connect(signer).getTokenIdsFromListedToken()
                console.log("Ids: ", Ids.toString())
                setListedTokenIds(Ids)
                const URIs = Ids.map(async (tokenId) => {
                    const tokenURI = await artnft.connect(signer).getTokenURI(tokenId)
                    console.log("Token URI", tokenURI)
                    return tokenURI 
                }) 

                const Prices = Ids.map(async (tokenId) => {
                    const tokenPrice = await artnft.connect(signer).getTokenPriceFromListedToken(tokenId)
                    console.log("Token Price", tokenPrice.toString())
                    return tokenPrice.toString()
                })
                
                const tokenURIs = await Promise.all(URIs)
                const tokenPrices = await Promise.all(Prices)
                console.log("URIs: ", URIs)
                console.log('Prices: ', Prices)
                setTokenURIs(tokenURIs)
                setListedPrice(tokenPrices)
                console.log(listedPrice)

                
                
            } catch (error) {
                console.log('Error', error)
            }
        }

        const getMyNFTs = async () => {
            const signer = await provider.getSigner()
            const myIds = await artnft.connect(signer).getMyIds(account)
            console.log("myIds: ", myIds.toString())
            const myURIs = myIds.map(async (tokenId) => {
                const tokenURI = await artnft.connect(signer).getTokenURI(tokenId)
                console.log("Token URI", tokenURI)
                return tokenURI 
            }) 

            const myTokenURIs = await Promise.all(myURIs)
            console.log("URIs: ", myURIs)

            setMyURIs(myTokenURIs)
            console.log(myListedURIs)
            const listedStruct = await artnft.getListedForTokenId(1)
            console.log('listedTokenStruct: ', listedStruct)
        }

        const buyNFT = async (index) => {
            try {
                const tokenId = index + 1
                console.log('TokenId: ', tokenId)
                console.log('Price by Index: ', listedPrice[index])
                const signer = await provider.getSigner()

                await artnft.connect(signer).executeSale(tokenId, { value: listedPrice[index] })
                const sale = await artnft.getListedForTokenId(tokenId)
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
        getMyNFTs()
    }, [provider, artnft]);

    return (
        <div className='text-center'>
            <p><strong>MY NFTs</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {myListedURIs.map((uri, index) => (
                    <Col key={index} className="overflow-hidden">
                        <Card style={{ width: "75px" }}>
                            <Card.Img 
                             variant="bottom" 
                             src={`https://gateway.pinata.cloud/${uri}`} 
                             height="75px"
                             width="200px"
                            />
                             <Card.Footer> 
                                
                             </Card.Footer>
                        </Card>
                    </Col>
                ))}
                </Row>
            </div>
            <p><strong>NFT Shop</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {listedURIs.map((uri, index) => (
                    <Col key={index} className="overflow-hidden">
                        <Card style={{ width: "200px" }}>
                            <Card.Img 
                             variant="bottom" 
                             src={`https://gateway.pinata.cloud/${uri}`} 
                             height="200px"
                             width="200px"
                            />
                             <Card.Footer> 
                                <Button onClick={() => buyNFT(index)} variant="primary" size="lg">
                                    Buy {fromWei(listedPrice[index]).toString()} ETH    
                                </Button>
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