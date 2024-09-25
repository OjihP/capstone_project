import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Modal, Tabs, Tab, ListGroup, Button, InputGroup } from 'react-bootstrap'
import ReactAudioPlayer from 'react-audio-player'
import ReactPlayer from 'react-player';

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const ManageNFTs = ({ provider, artnft, minter, account }) => {
    const [_nftNames, setTokenNames] = useState([])
    const [listedCIDs, setTokenCIDs] = useState([])
    const [listedPrice, setListedPrice] = useState([])
    const [_fileTypes, setFileTypes] = useState([])
    const [listedAmounts, setMintAmounts] = useState([])
    const [listedState, setListedState] = useState(false)
    const [show, setShow] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState(null)
    const [nestIDTabs, setNestIDTabs] = useState({})
    const [_nestIDs, setNestIDs] = useState([])
    const [_tokenIdArray, setTokenIdArray] = useState([])
    const [_fileDataIdArray, setFileDataIdArray] = useState([])
    const [burnAmount, setBurnAmount] = useState(0)
    const [mintAmount, setMintAmount] = useState('');
    //const [timeStamp, setTokenTimeStamp] = useState(0)

    const handleClose = () => setShow(false);

    const handleShow = (index, tokenId) => {
        setSelectedNFT({ index, tokenId });
        setShow(true);
    };

    const loadUserNFTs = async () => {
        try {
            const signer = await provider.getSigner();
            const count = await minter.getCurrentTokenCounter();
            const mintContractBalance = await provider.getBalance('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');
            console.log("Mint Contract Balance", mintContractBalance.toString())
            const tokenIdArray = [];
            const fileDataIdArray = [];

            // Retrieve token IDs
            for (let i = 0; i < count; i++) {
                try {
                    const tokenInfo = await artnft.getListedFromTokenId(i + 1);

                    // Check if the creatorAddress matches the account
                    if (tokenInfo.artistAddress.toLowerCase() === account.toLowerCase()) {
                        tokenIdArray.push(tokenInfo.tokenId);
                        fileDataIdArray.push(tokenInfo.tokenId);
                        setTokenIdArray(tokenIdArray)
                        setFileDataIdArray(fileDataIdArray)
                        console.log(`Token ID ${i + 1}:`, tokenInfo.tokenId.toString());
                    }
                } catch (innerError) {
                    console.error(`Error retrieving token info for token ID ${i + 1}:`, innerError);
                }
            }

            // Helper function to get token details
            const getTokenDetails = async (tokenId) => {
                const tokenDetails = await artnft.connect(signer).getListedFromTokenId(tokenId);
                return tokenDetails;
            };

            // Helper function to get token details
            const getTokenFileDetails = async (tokenId) => {
                const tokenFileDetails = await artnft.connect(signer).getFileDataFromTokenId(tokenId);
                return tokenFileDetails;
            };

            // Retrieve all token details concurrently
            const tokenDetailPromises = tokenIdArray.map(getTokenDetails);
            const tokenDetails = await Promise.all(tokenDetailPromises);
    
            const tokenDetailFilePromises = fileDataIdArray.map(getTokenFileDetails);
            const tokenFileDetails = await Promise.all(tokenDetailFilePromises);

            // Log the filtered token details
            console.log(tokenDetails);
            console.log(tokenFileDetails)

            // Extract specific details
            const tokenNames = tokenDetails.map(details => details.nftName);
            const tokenPrices = tokenDetails.map(details => details.nftPrice.toString());
            const tokenAmounts = tokenDetails.map(details => details.supplyAmount);
            const listedTokens = tokenDetails.map(details => details.currentlyListed);

            const fileNames = tokenFileDetails.map(details => details.fileNames);
            const fileTypes = tokenFileDetails.map(details => details.fileTypes);
            const tokenCIDs = tokenFileDetails.map(details => details.tokenCIDs);
            const nestIDs = tokenFileDetails.map(details => details.nestIDs)

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
                console.log(acc)
                return acc;
            }, {});

            // Update the state
            setTokenNames(tokenNames);
            setTokenCIDs(tokenCIDs);
            setListedPrice(tokenPrices);
            setFileTypes(fileTypes);
            setMintAmounts(tokenAmounts);
            setListedState(listedTokens);
            setNestIDTabs(tabsData)
            setNestIDs(nestIDs);
            console.log(listedCIDs)

        } catch (error) {
            console.error("Error loading NFTs:", error);
        }
    }

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

    const addNFT = async (index) => {
        try {
            const signer = await provider.getSigner();
            const tokenId = _tokenIdArray[index]
            console.log(tokenId)
            console.log(await artnft.getListedFromTokenId(tokenId))

            await artnft.connect(signer).replenishNFTTokens(tokenId, mintAmount, ethers.utils.hexlify([]));

            loadUserNFTs();
    
            console.log(`Replenished NFT Tokens at index: ${tokenId}`);
        } catch (error) {
            console.error("Error adding NFT Tokens:", error);
        }
    };

    const deleteNFT = async (index) => {
        try {
            const signer = await provider.getSigner();
            const tokenId = _tokenIdArray[index]
            console.log(tokenId)
            console.log(await artnft.getListedFromTokenId(tokenId))

            /*// Remove the selected NFT from the tokenIdArray and fileDataIdArray
            const updatedTokenIdArray = [..._tokenIdArray];
            const updatedFileDataIdArray = [..._fileDataIdArray];
    
            // Remove the NFT at the specified index
            updatedTokenIdArray.splice(tokenId, 1);
            updatedFileDataIdArray.splice(tokenId, 1);
    
            // Update the state variables
            setTokenIdArray(updatedTokenIdArray);
            setFileDataIdArray(updatedFileDataIdArray);
    
            // Optional: Remove associated data from other state variables (e.g., names, CIDs)
            const updatedNames = [..._nftNames];
            const updatedCIDs = [...listedCIDs];
            const updatedPrices = [...listedPrice];
            const updatedAmounts = [...listedAmounts];
            const updatedFileTypes = [..._fileTypes];
            const updatedNestIDTabs = { ...nestIDTabs };
    
            updatedNames.splice(tokenId, 1);
            updatedCIDs.splice(tokenId, 1);
            updatedPrices.splice(tokenId, 1);
            updatedAmounts.splice(tokenId, 1);
            updatedFileTypes.splice(tokenId, 1);
            delete updatedNestIDTabs[_tokenIdArray[tokenId]]; // Assuming nestIDTabs is keyed by tokenId
    
            setTokenNames(updatedNames);
            setTokenCIDs(updatedCIDs);
            setListedPrice(updatedPrices);
            setMintAmounts(updatedAmounts);
            setFileTypes(updatedFileTypes);
            setNestIDTabs(updatedNestIDTabs);*/

            await artnft.connect(signer).deleteMultipleTokens(tokenId, burnAmount);

            loadUserNFTs();
    
            console.log(`Deleted NFT at index: ${tokenId}`);
        } catch (error) {
            console.error("Error deleting NFT:", error);
        }
    };
    
    const changeNFT = async () => {

    }

    useEffect(() => {
        if (account) {
            loadUserNFTs();
        }
    }, [account]);

    return (
        <div className='padding-fromNav text-center'>
            <header>
                <h1>Listed NFTs</h1>
            </header>
            <div className="px-5 py-3 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                    {listedCIDs.map((uri, index) => {
                        const tokenId = _tokenIdArray[index]
                        return (
                            <Col key={index} className="overflow-hidden">
                                <Card bg="dark" border="primary" style={{ width: "190px", height: "350px" }}>
                                    <Card.Header>
                                        <Form.Control className="text-center" plaintext readOnly style={{ color: 'white' }} defaultValue={_nftNames[index]} onClick={() => handleShow(index, tokenId)} />
                                    </Card.Header>
                                    <Card.Img 
                                        variant="top" 
                                        src={`https://gateway.pinata.cloud/ipfs/${uri[0]}`} 
                                        height="200px"
                                        width="0px"
                                        onClick={() => handleShow(index, tokenId)}
                                    />
                                    <Card.Footer> 
                                        <div style={{ color: 'white', fontSize: '0.7rem' }}>
                                            <p>
                                                Amount: {listedAmounts[index].toString()} Left <br />
                                                Price: {listedPrice[index].toString()} ETH
                                                <InputGroup>
                                                    <Button onClick={() => addNFT(index)} style={{ height: "25px", width: "75px", fontSize: '0.7rem' }} variant="primary" id="button-addon1" size="sm">
                                                        Add NFT
                                                    </Button>
                                                    <Form.Control onChange={(e) => setMintAmount(e.target.value)} style={{ height: "25px", width: "1px" }} aria-label="Amount to mint" aria-descibedby="basic-addon1" />
                                                </InputGroup>
                                                <InputGroup>
                                                    <Button onClick={() => deleteNFT(index)} style={{ height: "25px", width: "75px", fontSize: '0.7rem' }} variant="primary" id="button-addon1" size="sm">
                                                        Delete NFT
                                                    </Button>
                                                    <Form.Control onChange={(e) => setBurnAmount(e.target.value)} style={{ height: "25px", width: "1px" }} aria-label="Amount to burn" aria-descibedby="basic-addon1" />
                                                </InputGroup>
                                            </p>
                                        </div>
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
                    {selectedNFT !== null && nestIDTabs[selectedNFT.tokenId] && (
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
};

export default ManageNFTs;
