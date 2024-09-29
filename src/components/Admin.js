import { ethers } from 'ethers';
import { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Modal, Tabs, Tab, Table, ListGroup, InputGroup, Button } from 'react-bootstrap';
import ReactAudioPlayer from 'react-audio-player'
import ReactPlayer from 'react-player';

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const Admin = ({ provider, artnft, minter, whtList, pose, account }) => {
    const [userAddress, setUserAddress] = useState('')
    const [userName, setUserName] = useState('')
    const [userNumber, setUserNumber] = useState('');
    const [listPrice, setListPrice] = useState(0)
    const [initialListPrice, setInitialListPrice] = useState(0)
    const [_usersOnWhtList, setUsersWhtListed] = useState([]);

    const [burnAmount, setBurnAmount] = useState(0)
    const [mintAmount, setMintAmount] = useState('');
    const [_tokenIdArray, setTokenIdArray] = useState([])

    const [_nftNames, setTokenNames] = useState([])
    const [listedCIDs, setTokenCIDs] = useState([])
    const [listedPrice, setListedPrice] = useState([])
    const [_fileTypes, setFileTypes] = useState([])
    const [listedAmounts, setMintAmounts] = useState([])
    const [audioFilePresent, setAudioFilePresent] = useState(false)
    const [listedState, setListedState] = useState(true)
    const [_nestIDs, setNestIDs] = useState([])
    const [show, setShow] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState(null);
    const [nestIDTabs, setNestIDTabs] = useState({});

    const handleClose = () => setShow(false);

    const handleShow = (index, tokenId) => {
        setSelectedNFT({ index, tokenId });
        setShow(true);
    };
    
    /*const initializeArtist = async () => {
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
    }*/

    const addUserToWhiteList = async () => {
        const signer = await provider.getSigner();
        const transaction = await whtList.connect(signer).addToWhtList(userAddress, userName);
        await transaction.wait();
        displayWhiteListedUsers();
    };

    const removeUserFromWhiteList = async () => {
        const signer = await provider.getSigner();
        const userNumberInt = parseInt(userNumber, 10);

        const totalUsers = await whtList.getCurrentWhtListCounter();
        if (userNumberInt > totalUsers || userNumberInt <= 0) {
            alert('Invalid user number');
            return;
        }

        const transaction = await whtList.connect(signer).removeFromWhtList(userNumberInt);
        await transaction.wait();
        displayWhiteListedUsers();
    };

    const displayWhiteListedUsers = async () => {
        const count = await whtList.getCurrentWhtListCounter();
        const items = [];

        for (let i = 0; i < count; i++) {
            try {
                const userInfo = await whtList.getUserByNumber(i + 1);
                items.push(userInfo);
            } catch (error) {
                console.error(`Error fetching user at index ${i + 1}:`, error);
            }
        }

        setUsersWhtListed(items);
    };

    const getListPrice = async () => {
        const currentListPrice = await artnft.getListPrice()
        const currentListPriceWei = fromWei(currentListPrice)
        console.log(currentListPriceWei)
        setInitialListPrice(currentListPriceWei)
    }

    const changeListPrice = async () => {
        const signer = await provider.getSigner()
        console.log(listPrice)
        const listPriceWei = toWei(listPrice)
        console.log(listPriceWei.toString())

        const transaction = await artnft.connect(signer).updateListPrice(listPriceWei)
        await transaction.wait()

        getListPrice()
    }

    const loadAllNFTs = async () => {
        try {
            const signer = await provider.getSigner();
            const count = await minter.getCurrentTokenCounter();
            const tokenIdArray = [];
            const fileDataIdArray = [];

            console.log("Total tokens count:", count.toString());

    
            // Retrieve token IDs
            /*for (let i = 0; i < count; i++) {
                const userInfo = await artnft.connect(signer).idToListedToken(i + 1);
                items.push(userInfo.tokenId);
            }*/

            // Retrieve token IDs
            for (let i = 0; i < count; i++) {
                try {
                    const tokenInfo = await artnft.getListedFromTokenId(i + 1); // Ensure idToListedToken is defined in the contract
                    tokenIdArray.push(tokenInfo.tokenId);
                    fileDataIdArray.push(tokenInfo.tokenId);
                    console.log(`Token ID ${i + 1}:`, tokenInfo.tokenId.toString());
                    setTokenIdArray(tokenIdArray)
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
    
            // Extract specific details
            const tokenNames = tokenDetails.map(details => details.nftName);
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
                console.log(acc)
                return acc;
            }, {});

            console.log(nestIDTabs)
            console.log(tabsData)

            // Update the state
            setTokenNames(tokenNames);
            setTokenCIDs(tokenCIDs);
            setListedPrice(tokenPrices);
            setFileTypes(fileTypes);
            setMintAmounts(tokenAmounts);
            setListedState(listedTokens);
            setNestIDTabs(tabsData)
            setNestIDs(nestIDs);
    
            // Additional processing
            const audioPresentList = fileTypes.map(types => {
                return types.some(type => type === 'audio/mpeg');
            });
            setAudioFilePresent(audioPresentList);
    
        } catch (error) {
            console.log('Error', error);
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

    const addNFT = async (index) => {
        try {
            const signer = await provider.getSigner();
            const tokenId = _tokenIdArray[index]
            console.log(tokenId)
            console.log(await artnft.getListedFromTokenId(tokenId))

            await artnft.connect(signer).replenishNFTTokens(tokenId, mintAmount, ethers.utils.hexlify([]));

            loadAllNFTs();
    
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

            await artnft.connect(signer).deleteNFTTokens(tokenId, burnAmount);

            loadAllNFTs();
    
            console.log(`Deleted NFT at index: ${tokenId}`);
        } catch (error) {
            console.error("Error deleting NFT:", error);
        }
    };

    useEffect(() => {
        displayWhiteListedUsers();
        loadAllNFTs();
        getListPrice();
    }, []);
 
    return (
        <div className='padding-fromNav text-center'>
            <p><strong>Set Artist WhiteList Status</strong></p>
            <p>All Whitelisted Artists:</p>
            <Table striped bordered hover responsive variant="dark">
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
            <p><strong>Add User to White List</strong></p>    
            <Form.Control onChange={(e) => setUserAddress(e.target.value)} size="lg" required type="text" placeholder="Type or paste user address here" />
            <Form.Control onChange={(e) => setUserName(e.target.value)} size="lg" required type="text" placeholder="Type or paste username here" />
            <Button onClick={addUserToWhiteList} variant="primary" size="lg">
                Add to White List
            </Button>

            <p><strong>Remove User from White List</strong></p>
            <Form.Control onChange={(e) => setUserNumber(e.target.value)} size="lg" required type="number" placeholder="Type or paste user number here" />
            <Button onClick={removeUserFromWhiteList} variant="primary" size="lg">
                Remove from White List
            </Button>

            <p><strong>Update Listing Price</strong></p>
            <p>Current Listing Price: {initialListPrice} ETH</p>
            <Form.Control onChange={(e) => setListPrice(e.target.value)} size="lg" required type="text" placeholder="Enter new listing price in ETH" />
            <Button onClick={changeListPrice} variant="primary" size="lg">
                Change List Price
            </Button>

            <h1><strong>ALL NFTs</strong></h1>
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
                                        style={{ color: 'white' }} 
                                        defaultValue={_nftNames[index]} 
                                        onClick={() => handleShow(index, tokenId)} 
                                        />
                                    </Card.Header>

                                    <div style={{ position: "relative", height: "200px" }}>
                                        <Card.Img
                                        variant="top"
                                        src={`https://gateway.pinata.cloud/ipfs/${uri[0]}`}
                                        height="200px"
                                        width="0px"
                                        onClick={() => handleShow(index, tokenId)}
                                        style={{
                                            filter: listedState == false ? "grayscale(50%)" : "none",  // Full grayscale if sold out
                                            cursor: listedState == false ? "not-allowed" : "pointer"    // Change cursor to indicate sold out
                                        }}
                                        />
                                        {listedState == false && (
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
                                            zIndex: "1"
                                        }}>
                                            Not Listed
                                        </div>
                                        )}
                                    </div>

                                    {!listedState && audioFilePresent[index] && (
                                        <ReactAudioPlayer
                                        style={{ width: "189px", height: "20px" }}
                                        src={`https://gateway.pinata.cloud/ipfs/${uri[1]}`}
                                        controls
                                        controlslist="nodownload"
                                        />
                                    )}

                                    <Card.Footer>
                                        <strong style={{ color: 'white '}}>Quantity: {listedAmounts[index].toString()}</strong>
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
 
 export default Admin;