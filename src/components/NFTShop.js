import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Form, Modal, Tabs, Tab, ListGroup, InputGroup, Button } from 'react-bootstrap';
import ReactAudioPlayer from 'react-audio-player'
import ReactPlayer from 'react-player';

import config from '../config.json';

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const NFTShop = ({ provider, artnft, listings, account, minter }) => {
   const [_nftNames, setTokenNames] = useState([])
   const [_artistNames, setArtistNames] = useState([])
   const [listedCIDs, setTokenCIDs] = useState([])
   const [listedPrice, setListedPrice] = useState([])
   const [_fileTypes, setFileTypes] = useState([])
   const [listedAmounts, setMintAmounts] = useState([])
   const [purchaseAmount, setPurchaseAmount] = useState(null)
   const [audioFilePresent, setAudioFilePresent] = useState(false)
   const [listedState, setListedState] = useState(true)
   const [_nestIDs, setNestIDs] = useState([])
   const [show, setShow] = useState(false);
   const [selectedNFT, setSelectedNFT] = useState(null);
   const [nestIDTabs, setNestIDTabs] = useState({});
   const [nftSupply, setNFTSupply] = useState([]);
   const [refresh, setRefresh] = useState(false);

   const handleClose = () => setShow(false);

   const handleShow = (index, tokenId) => {
        setSelectedNFT({ index, tokenId });
        setShow(true);
    };

    const loadAllNFTs = async () => {
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        const networkConfig = config[chainId];

        try {
            const count = await minter.getCurrentTokenCounter();
            const tokenIdArray = [];
            const fileDataIdArray = [];
            const tokenBalances = [];

            console.log("Total tokens count:", count.toString());

            // Retrieve token IDs
            for (let i = 0; i < count; i++) {
                try {
                    const tokenInfo = await listings.getListedFromTokenId(i + 1);
                    const tokenBalance = await minter.balanceOf(networkConfig.artistContract.address, i + 1); 
                    tokenIdArray.push(tokenInfo.tokenId);
                    fileDataIdArray.push(tokenInfo.tokenId);
                    tokenBalances.push(tokenBalance);
                    console.log(`Token ID ${i + 1}:`, tokenInfo.tokenId.toString());
                } catch (innerError) {
                    console.error(`Error retrieving token info for token ID ${i + 1}:`, innerError);
                }
            }
    
            // Helper function to get token details
            const getTokenDetails = async (tokenId) => {
                const tokenDetails = await listings.getListedFromTokenId(tokenId);
                console.log("'tokenDetails' variable: ", tokenDetails)
                return tokenDetails;
            };

            // Helper function to get token details
            const getTokenFileDetails = async (tokenId) => {
                const tokenFileDetails = await listings.getFileDataFromTokenId(tokenId);
                console.log("'tokenFileDetails' variable: ", tokenFileDetails)
                return tokenFileDetails;
            };
    
            // Retrieve all token details concurrently
            const tokenDetailPromises = tokenIdArray.map(getTokenDetails);
            const tokenDetails = await Promise.all(tokenDetailPromises);
    
            const tokenDetailFilePromises = fileDataIdArray.map(getTokenFileDetails);
            const tokenFileDetails = await Promise.all(tokenDetailFilePromises);
    
            // Extract specific details
            const tokenNames = tokenDetails.map(details => details.nftName);
            const artistNames = tokenDetails.map(details => details.artistName);
            const tokenPrices = tokenDetails.map(details => details.nftPrice.toString());
            const tokenAmounts = tokenDetails.map(details => details.supplyAmount);
            const listedTokens = tokenDetails.map(details => details.currentlyListed);

            const fileNames = tokenFileDetails.map(details => details.fileNames);
            const fileTypes = tokenFileDetails.map(details => details.fileTypes);
            const tokenCIDs = tokenFileDetails.map(details => details.tokenCIDs);
            const nestIDs = tokenFileDetails.map(details => details.nestIDs)
    
            // Log the details
            console.log("Token Names:", tokenNames);
            console.log("Prices:", tokenPrices);
            console.log("Mint amounts:", tokenAmounts.toString());
            console.log("Listed Tokens:", listedTokens);

            console.log("File Names:", fileNames);
            console.log("File Types:", fileTypes);
            console.log("Token CIDs:", tokenCIDs);
            console.log("Nest IDs:", nestIDs.toString())

            // Organize files by nestID, ensuring separation by tokenId
            const tabsData = tokenIdArray.reduce((acc, tokenId, tokenIndex) => {
                const nestIDArray = nestIDs[tokenIndex];

                nestIDArray.forEach((nestID, fileIndex) => {
                    // Ensure each tokenId has its own group in the acc object
                    if (!acc[tokenId]) {
                        acc[tokenId] = {};
                    }

                    // Group by nestID within each tokenId
                    if (!acc[tokenId][nestID]) {
                        acc[tokenId][nestID] = [];
                    }

                    acc[tokenId][nestID].push({
                        CID: tokenCIDs[tokenIndex][fileIndex],
                        fileName: fileNames[tokenIndex][fileIndex],
                        fileType: fileTypes[tokenIndex][fileIndex],
                    });
                });
                console.log("'acc' variable: ", acc)
                return acc;
            }, {});

            console.log("'nestIDTabs' variable: ", nestIDTabs)
            console.log("'tabsData' variable: ", tabsData)

            // Update the state
            setTokenNames(tokenNames);
            setArtistNames(artistNames)
            setTokenCIDs(tokenCIDs);
            setListedPrice(tokenPrices);
            setFileTypes(fileTypes);
            setMintAmounts(tokenAmounts);
            setListedState(listedTokens);
            setNestIDTabs(tabsData)
            setNestIDs(nestIDs);
            setNFTSupply(tokenBalances);
    
            // Additional processing
            const audioPresentList = fileTypes.map(types => {
                return types.some(type => type === 'audio/mpeg');
            });
            setAudioFilePresent(audioPresentList);
    
        } catch (error) {
            console.log("Error loading NFTs: ", error);
            window.alert("Error loading NFTs!")
        }
    };

    const renderFileContent = (file, tokenId) => {
        const { CID, fileType, fileName } = file; // Destructure the file object
        
        if (typeof fileType === 'string') {
            if (fileType.startsWith('image/')) {
                return (
                    <ListGroup.Item key={`${tokenId}-${CID}`}>
                        <div className="d-flex align-items-center">
                            <div className='text-center'>{fileName}</div>
                            <a href={`https://gateway.pinata.cloud/ipfs/${CID}`} target="_blank" rel="noopener noreferrer">
                                <img src={`https://gateway.pinata.cloud/ipfs/${CID}`} alt="NFT" width="50px" height="50px" />
                            </a>
                        </div>
                    </ListGroup.Item>
                );
            } else if (fileType.startsWith('audio/')) {
                return (
                    <ListGroup.Item key={`${tokenId}-${CID}`}>
                        <div>{fileName}</div>
                        <ReactAudioPlayer
                            src={`https://gateway.pinata.cloud/ipfs/${CID}`}
                            controls
                            style={{ width: "100%" }}
                        />
                    </ListGroup.Item>
                );
            } else if (fileType.startsWith('video/')) {
                return (
                    <ListGroup.Item key={`${tokenId}-${CID}`}>
                        <div>{fileName}</div>
                        <ReactPlayer
                            url={`https://gateway.pinata.cloud/ipfs/${CID}`}
                            controls
                            width="100%"
                            height="auto"
                        />
                    </ListGroup.Item>
                );
            } else {
                console.error('Unexpected type:', fileType);
            }
        }
        return null;
    };
    
    const buyNFT = async (index) => {
        if (!account) {
            window.alert('Please connect wallet to purchase NFTs')
            return;
        }

        try {
            const tokenId = index + 1
            console.log('TokenId: ', tokenId)
            console.log('Price by Index: ', listedPrice[index])
            const signer = await provider.getSigner()
            const totalAmount = ethers.BigNumber.from(listedPrice[index]).mul(ethers.BigNumber.from(purchaseAmount));
            console.log("'purchaseAmount' variable: ", purchaseAmount)
            console.log('Total Price: ', totalAmount.toString())
            await artnft.connect(signer).executeSale(tokenId, purchaseAmount, { value: totalAmount })

            window.alert("Your NFT(s) have been purchased!")

            // Toggle the refresh state to force re-render
            setRefresh(true);

            if (refresh == true) {
                loadAllNFTs();
            } 
            
            console.log('Refresh State: ', refresh)

        } catch (error) {
            console.log('Error purchasing NFT: ', error)
            window.alert('Error purchasing NFT')
            return;
        }
    }

    useEffect(() => {
        loadAllNFTs();
    }, [artnft, listings, refresh]);

    return (
        <div className='padding-fromNav text-center'>
            <p><strong>NFT Shop{console.log(nftSupply.toString())}</strong></p>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {listedCIDs.map((uri, index) => {
                        const tokenId = index + 1
                        return(
                            <Col key={index} className="overflow-hidden">
                                <Card bg="dark" border="primary" style={{ width: "190px", height: "350px", position: "relative" }}>
                                    <Card.Header>
                                        <Form.Control 
                                            className="text-center" 
                                            plaintext 
                                            readOnly 
                                            style={{ color: 'white', cursor: nftSupply[index] == 0 ? "not-allowed" : "pointer" }} 
                                            defaultValue={_nftNames[index]} 
                                            onClick={() => handleShow(index, tokenId)} 
                                            disabled={nftSupply[index] == 0}
                                        />
                                        <small style={{ color: 'white', fontSize: '0.6rem' }} >{_artistNames[index]}</small>
                                    </Card.Header>

                                    <div style={{ position: "relative", height: "195px" }}>
                                        <Card.Img
                                            variant="top"
                                            src={`https://gateway.pinata.cloud/ipfs/${uri[0]}`}
                                            height="195px"
                                            width="0px"
                                            onClick={() => handleShow(index, tokenId)}
                                        />
                                        {nftSupply[index] == 0 && (
                                            <div style={{
                                                position: "absolute",
                                                top: "0",
                                                left: "0",
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                backgroundColor: "rgba(0, 0, 0, 0.5)",  // Transparent black overlay
                                                color: "white",
                                                fontSize: "1.5rem",
                                                fontWeight: "bold",
                                                zIndex: "1",
                                                filter: nftSupply[index] == 0 ? "grayscale(50%)" : "none",  // Full grayscale if sold out
                                                cursor: nftSupply[index] == 0 ? "not-allowed" : "pointer"    // Change cursor to indicate sold out
                                            }}>
                                                Sold Out
                                            </div>
                                        )}
                                    </div>

                                    {nftSupply[index] && audioFilePresent[index] && (
                                        <ReactAudioPlayer
                                            style={{ width: "189px", height: "20px" }}
                                            src={`https://gateway.pinata.cloud/ipfs/${uri[1]}`}
                                            controls
                                            controlslist="nodownload"
                                        />
                                    )}

                                    <Card.Footer> 
                                        <InputGroup className="mb-3">
                                            <Button onClick={() => buyNFT(index)} style={{ width: "100px" }} variant="primary" id="button-addon1" size="sm" disabled={nftSupply[index].toString() == 0}>
                                                Buy {fromWei(listedPrice[index]).toString()} ETH <br /> 
                                                {nftSupply[index].toString()} Left
                                            </Button>
                                            <Form.Control onChange={(e) => setPurchaseAmount(e.target.value)} style={{ width: "10px" }} aria-label="Amount purchase" aria-descibedby="basic-addon1" disabled={nftSupply[index].toString() == 0}/>
                                        </InputGroup>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            </div>

            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedNFT !== null && _nftNames[selectedNFT]}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedNFT !== null && (
                        <Tabs defaultActiveKey={Object.keys(nestIDTabs[selectedNFT.tokenId])[0]} id="uncontrolled-tab-example" className="mb-3">
                            {Object.keys(nestIDTabs[selectedNFT.tokenId]).map((nestID) => (
                                <Tab eventKey={nestID} title={`Nest ID ${nestID}`} key={nestID}>
                                    <ListGroup>
                                        {Array.isArray(nestIDTabs[selectedNFT.tokenId][nestID]) && nestIDTabs[selectedNFT.tokenId][nestID].map((file, index) =>
                                            renderFileContent(file, selectedNFT.tokenId, index) // Pass tokenId to renderFileContent
                                        )}
                                    </ListGroup>
                                </Tab>
                            ))}
                        </Tabs>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default NFTShop;