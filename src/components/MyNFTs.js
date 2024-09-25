import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Card, Form, Modal, Tabs, Tab, ListGroup } from 'react-bootstrap';
import ReactAudioPlayer from 'react-audio-player';
import ReactPlayer from 'react-player';

const toWei = (n) => ethers.utils.parseEther(n.toString());
const fromWei = (n) => ethers.utils.formatEther(n);

const MyNFTs = ({ provider, artnft, minter, account }) => {
  const [_nftNames, setTokenNames] = useState([]);
  const [myListedCIDs, setMyTokenCIDs] = useState([]);
  const [listedPrice, setListedPrice] = useState([]);
  const [_fileNames, setFileNames] = useState([]);
  const [_fileTypes, setFileTypes] = useState([]);
  const [nftSupply, setNFTSupply] = useState([]);
  const [purchaseAmount, setPurchaseAmount] = useState(null);
  const [audioFilePresent, setAudioFilePresent] = useState([]);
  const [listedState, setListedState] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [nestIDTabs, setNestIDTabs] = useState({});
  const [_tokenIdArray, setTokenIdArray] = useState([])

  const handleClose = () => setShow(false);

  const handleShow = (index, tokenId) => {
    setSelectedNFT({ index, tokenId });
    setShow(true);
  };

  const getMyNFTs = async () => {
    try {
      const signer = await provider.getSigner();
      const count = await minter.getCurrentTokenCounter();
      console.log('tokenIds: ', count.toString());
      const tokenIdArray = [];
      const fileDataIdArray = [];
      const tokenBalances = [];

      for (let i = 0; i < count; i++) {
        const tokenInfo = await artnft.getListedFromTokenId(i + 1);
        const tokenBalance = await minter.balanceOf(account, i + 1);
        if (tokenBalance > 0) {
          tokenIdArray.push(tokenInfo.tokenId);
          fileDataIdArray.push(tokenInfo.tokenId);
          tokenBalances.push(tokenBalance);
          setTokenIdArray(tokenIdArray)
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

      // Update the state
      setTokenNames(tokenNames);
      setMyTokenCIDs(tokenCIDs);
      setListedPrice(tokenPrices);
      setFileTypes(fileTypes);
      setNFTSupply(tokenBalances);
      setListedState(listedTokens);
      setNestIDTabs(tabsData)

      // Determine if audio files are present
      const audioPresentList = fileTypes.map(types => types.some(type => type === 'audio/mpeg'));
      setAudioFilePresent(audioPresentList);

    } catch (error) {
      console.error('Error fetching NFTs:', error);
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

  useEffect(() => {
    if (account) {
      getMyNFTs();
    }
  }, [account, provider, artnft, minter]);

  return (
    <div className='padding-fromNav text-center'>
      <p><strong>MY NFTs</strong></p>
      <div className="px-5 py-3 container">
        <Row xs={1} md={2} lg={4} className="g-4 py-3">
          {myListedCIDs.map((uri, index) => {
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
                    width="100%"
                    onClick={() => handleShow(index, tokenId)}
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
  );
}

export default MyNFTs;
