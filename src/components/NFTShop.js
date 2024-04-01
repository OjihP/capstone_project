import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button } from 'react-bootstrap'
import ReactAudioPlayer from 'react-audio-player'

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const NFTShop = ({ provider, artnft, account }) => {
   const [listedMetaData, setTokenMetaData] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [_fileTypes, setFileTypes] = useState([])
   const [audioFilePresent, setAudioFilePresent] = useState(false)
   //const [myListedURIs, setMyURIs] = useState([])
        
        const loadAllNFTs = async () => {
            try {
                const signer = await provider.getSigner()
                const Ids = await artnft.connect(signer).getTokenIdsFromListedToken()
                console.log("Ids: ", Ids.toString())
               
                const MetaData = Ids.map(async (tokenId) => {
                    const tokenCID = await artnft.connect(signer).getTokenCIDsFromListedToken(tokenId)
                    console.log("Token CID: ", tokenCID)
                    return tokenCID
                }) 

                const fileTypes = Ids.map(async (tokenId) => {
                    const tokenFileType = await artnft.connect(signer).getFileTypesFromListedToken(tokenId)
                    console.log("File Types within Token: ", tokenFileType)
                    return tokenFileType
                })

                const Prices = Ids.map(async (tokenId) => {
                    const tokenPrice = await artnft.connect(signer).getTokenPriceFromListedToken(tokenId)
                    console.log("Token Price", tokenPrice.toString())
                    return tokenPrice.toString()
                })
                
                const tokenMetaData = await Promise.all(MetaData)
                const tokenPrices = await Promise.all(Prices)
                const tokenFileTypes = await Promise.all(fileTypes)
                console.log("Token Metadata ", tokenMetaData)
                //console.log('Prices: ', Prices)
                //console.log('File Types: ', fileTypes)
                setTokenMetaData(tokenMetaData)
                setListedPrice(tokenPrices)
                setFileTypes(tokenFileTypes)
                console.log(listedMetaData)
                console.log(_fileTypes)
                console.log(listedPrice)

                const audioPresentList = _fileTypes.map(types => {
                    return types.some(type => type === 'audio/mpeg');
                });
                setAudioFilePresent(audioPresentList);

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

            //setMyURIs(myTokenURIs)
            //console.log(myListedURIs)
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
        //getMyNFTs()
    }, []);

    return (
        <div className='text-center'>
            <p><strong>MY NFTs</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    
                </Row>
            </div>
            <p><strong>NFT Shop</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {listedMetaData.map((uri, index) => (
                    <Col key={index} className="overflow-hidden">
                        <Card style={{ width: "200px" }}>
                            <Card.Img 
                             variant="bottom" 
                             src={`https://gateway.pinata.cloud/ipfs/${uri[0]}`} 
                             height="200px"
                             width="300px"
                            />
                            {audioFilePresent[index] && (
                                <ReactAudioPlayer
                                    style={{ width: "180px", height: "20px" }}
                                    src={`https://gateway.pinata.cloud/ipfs/${uri[1]}`}
                                    controls
                                    controlslist="nodownload"
                                />
                            )} {console.log(audioFilePresent)}
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