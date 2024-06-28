import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap'
import ReactAudioPlayer from 'react-audio-player'

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const MyNFTs = ({ provider, artnft, minter, account }) => {
   const [_nftNames, setTokenNames] = useState([])
   const [myListedCIDs, setMyTokenCIDs] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [_fileTypes, setFileTypes] = useState([])
   const [nftSupply, setNFTSupply] = useState([])
   const [purchaseAmount, setPurchaseAmount] = useState(null)
   const [audioFilePresent, setAudioFilePresent] = useState(null)
   const [listedState, setListedState] = useState(true)
   //const [myListedURIs, setMyURIs] = useState([])
        
        const getMyNFTs = async () => {
            try{
                const signer = await provider.getSigner()
                const count = await minter.tokenSupply()
                console.log("tokenIds: ", count.toString())
                //const balance = await minter.balanceOf(account, 1)
                //console.log("Balance of tokenId[1]: ", balance.toString())
                const tokenIds = []
                const tokenBalances = []

            for(var i = 0; i < count; i++) {
                const tokenInfo = await artnft.getListedFromTokenId(i + 1)
                const tokenBalance = await minter.balanceOf(account, i + 1)
                if(tokenBalance > 0){
                    tokenIds.push(tokenInfo)
                    tokenBalances.push(tokenBalance)
                }
            }

            console.log("Array of tokenIds: ", tokenIds.toString())
            console.log("Array of tokenBalances: ", tokenBalances.toString())

            // Extract specific details
            const tokenNames = tokenIds.map(details => details.nftName);
            const tokenCIDs = tokenIds.map(details => details.tokenCIDs);
            const tokenPrices = tokenIds.map(details => details.priceOfNFT.toString());
            const tokenFileTypes = tokenIds.map(details => details.fileTypes);
            const tokenAmounts = tokenIds.map(details => details.supplyAmount);
            const listedTokens = tokenIds.map(details => details.currentlyListed);
        
                // Log the details
                console.log("Token Names:", tokenNames);
                console.log("Token CIDs:", tokenCIDs);
                console.log("Prices:", tokenPrices.toString());
                console.log("File Types:", tokenFileTypes);
                console.log("Minted amounts:", tokenAmounts.toString());
                console.log("Listed Tokens:", listedTokens);

            // Update the state
            setTokenNames(tokenNames);
            setMyTokenCIDs(tokenCIDs);
            setListedPrice(tokenPrices);
            setFileTypes(tokenFileTypes);
            setNFTSupply(tokenBalances);
            setListedState(listedTokens);
    
            // Additional processing
            const audioPresentList = tokenFileTypes.map(types => types.some(type => type === 'audio/mpeg'));
            setAudioFilePresent(audioPresentList);
            } catch (error) {
                console.log('Error', error);
            }
            
            /*
            const ownership = myIds.map(async (tokenId) => {
                const owns = await artnft.connect(signer).ownerOf(tokenId)
                console.log("owns: ", owns)
            })

            const nftNames = myIds.map(async (tokenId) => {
                const tokenName = await artnft.connect(signer).getListedFromTokenId(tokenId)
                console.log("Token Name: ", tokenName.nftName, tokenName.tokenId.toString())
                return tokenName.nftName
            })

            const myCIDs = myIds.map(async (tokenId) => {
                const tokenCID = await artnft.connect(signer).getListedFromTokenId(tokenId)
                    console.log("Token CID: ", tokenCID.tokenCIDs)
                    return tokenCID.tokenCIDs
            }) 

            const fileTypes = myIds.map(async (tokenId) => {
                const tokenFileType = await artnft.connect(signer).getListedFromTokenId(tokenId)
                console.log("File Types within Token: ", tokenFileType.fileTypes)
                return tokenFileType.fileTypes
            })

            const mintAmounts = myIds.map(async (tokenId) => {
                const tokenAmount = await artnft.connect(signer).getListedFromTokenId(tokenId)
                console.log("Token Amount", tokenAmount.mintAmount)
                return tokenAmount.mintAmount
            })

            const tokenNames = await Promise.all(nftNames)
            console.log(tokenNames)
            const myTokenCIDs = await Promise.all(myCIDs)
            console.log("CIDs: ", myCIDs)
            const tokenFileTypes = await Promise.all(fileTypes)
            const tokenAmounts = await Promise.all(mintAmounts)
            const aVar = await artnft.connect(signer).ownerOf(5)
                console.log(aVar)

            setTokenNames(tokenNames)
            setMyTokenCIDs(myTokenCIDs)
            setFileTypes(tokenFileTypes)
            setMintAmounts(tokenAmounts)
            //console.log(myListedURIs)
            //const listedStruct = await artnft.getListedForTokenId(1)
            //console.log('listedTokenStruct: ', listedStruct)
            */
        }

        useEffect(() => {
            if (account) {
                getMyNFTs();
            }
        }, [account]);

    return (
        <div className='text-center'>
            <p><strong>MY NFTs</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {myListedCIDs.map((uri, index) => (
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
                                <strong style={{ color: 'white '}}>Quantity: {nftSupply[index].toString()}</strong>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
                </Row>
            </div>
        </div>
    )
}

export default MyNFTs;