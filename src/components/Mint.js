import { useEffect, useState, useCallback } from 'react';
import { Row, Form, Button, Card, Nav, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { ethers } from 'ethers';

const toWei = (n) => ethers.utils.parseEther(n.toString());
const fromWei = (n) => ethers.utils.formatEther(n);

const FormData = require("form-data");

const Mint = ({ provider, artnft, account, minter }) => {
  const [files, setFiles] = useState([]);
  const [nestFiles, setNestFiles] = useState([]);
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [artistName, setCreator] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [currentListPrice, setListPrice] = useState('');
  const [description, setDescription] = useState('');
  const [increment, setIncrement] = useState(0);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('tab1');
  const [isWaiting, setIsWaiting] = useState(false);

  const testAuthentication = async () => {
    const url = `https://api.pinata.cloud/data/testAuthentication`;
    try {
      const response = await axios.get(url, {
        headers: {
          'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.REACT_APP_PINATA_API_SECRET
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const pinFileToIPFS = async () => {
    if (!files.length) return;
    console.log(files);

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      const formData = new FormData();
      formData.append('file', fileItem);

      const pinataMetadata = JSON.stringify({
        fileName: fileItem.name,
        fileType: fileItem.type,
        keyvalues: {
          address: account,
          nestID: fileItem.nestID,
          nftName: name,
          creatorName: artistName
        }
      });
      formData.append('pinataMetadata', pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', pinataOptions);

      try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
          maxBodyLength: "Infinity",
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT_KEY}`
          }
        });

        files[i] = {
          ...fileItem,
          CID: res.data.IpfsHash
        };

        console.log("File uploaded, CID: ", res.data.IpfsHash);
      } catch (error) {
        console.error(error);
        window.alert('User rejected or transaction reverted');
        return;
      }
    }

    setFiles([...files]); // Update state with the new files array
    console.log(files)
  };

  const onDrop = useCallback((acceptedFiles) => {
    const updatedFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        fileName: file.name,
        fileType: file.type,
        address: account,
        nestID: increment + 1
      }) 
    );

    setFiles(prevFiles => [...prevFiles, ...updatedFiles]);
    setNestFiles(prevFiles => [...prevFiles, ...updatedFiles]);
    console.log(files)
    console.log(nestFiles)
  }, [increment, account]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const nestPackage = () => {
    if (nestFiles.length === 0) return;

    const nestIncrement = increment + 1;
    const _nestFiles = nestFiles.map(file => ({
      fileName: file.name,
      fileType: file.type,
      nestID: nestIncrement
    }));

    setIncrement(nestIncrement);

    const newTab = {
      id: `tab${tabs.length + 1}`,
      title: `${tabs.length + 1}`,
      files: _nestFiles
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTab(newTab.id);

    setNestFiles([]);
  };

  const mintHandler = async () => {
    if (!files.length || !name || !artistName || !price || !mintAmount) return;

    /*const isWhitelisted = await minter.isWhitelisted(account);
    console.log(`Is whitelisted: ${isWhitelisted}`);

    if (!isWhitelisted) {
        console.error('Address is not whitelisted');
        return;
    }*/

    setIsWaiting(true);
    const _supplyAmount = mintAmount
    const _tokenId = 0 // Token ID is set within the function
    const _nftName = name
    const _artistName = artistName
    const _artistAddress = account
    const _ownerAddress =  await minter.contractCall()
    const _sellerAddress = account
    const _nftPrice = price
    const _currentlyListed = true

    const _fileNames = files.map(file => file.fileName)
    const _fileTypes = files.map(file => file.fileType)
    const _tokenCIDs =  files.map(file => file.CID)
    const _nestIDs = files.map(file => file.nestID)

    const listPrice = await artnft.getListPrice();
    const mintPrice = listPrice.mul(mintAmount);

    const tokenData = {
      supplyAmount: _supplyAmount,
      tokenId: _tokenId,
      nftName: _nftName,
      artistName: _artistName,
      artistAddress: _artistAddress,
      ownerAddress: _ownerAddress,
      sellerAddress: _sellerAddress,
      nftPrice: _nftPrice,
      currentlyListed: _currentlyListed
    }

    const fileData = {
      fileNames: _fileNames,
      fileTypes: _fileTypes,
      tokenCIDs: _tokenCIDs,
      nestIDs: _nestIDs
    };

    try {
      const signer = provider.getSigner();

      const transaction = await minter.connect(signer).mintToken(
        tokenData,
        fileData,
        ethers.utils.hexlify([]),
        { value: mintPrice }
      );
      await transaction.wait();

      window.alert('NFT has been minted');
    } catch (error) {
      console.error(error);
      window.alert('User rejected or transaction reverted');
    }

    setIsWaiting(false);
  };

  useEffect(() => {
    setIsWaiting(false);
    testAuthentication();

    const fetchListPrice = async () => {
      const listPrice = await artnft.getListPrice();
      setListPrice(fromWei(listPrice.toString()));
    };

    fetchListPrice();
  }, [artnft, minter, provider]);

  return (
    <div className="padding-fromNav container-fluid mt-5">
      <div className="row">
        <div className='text-center'><h2><strong>Upload Files into NFT Package</strong></h2></div>
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', width: '75vh' }}>
                <div {...getRootProps({ className: 'dropzone' })} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', width: '75vh' }}>
                  <input {...getInputProps()} />
                  {isDragActive ? <p style={{ color: 'black' }}>Drop the files here ...</p> : <p style={{ color: 'black' }}>Drag 'n' drop some files here, or click to select files</p>}
                </div>
              </div>

              <div>
                <h4 className='text-center'>File Preview:</h4>
                <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', border: '2px solid black', borderRadius: '5px', listStyleType: 'none' }}>
                  {nestFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>

              <h4 className='text-center'>Package Preview:</h4>
              <Card>
                <Card.Header>
                  <Nav variant="tabs" activeKey={`#${activeTab}`} onSelect={(selectedKey) => setActiveTab(selectedKey.slice(1))}>
                    {tabs.map((tab) => (
                      <Nav.Item key={tab.id}>
                        <Nav.Link eventKey={`#${tab.id}`} style={{ color: 'black' }}>{tab.title}</Nav.Link>
                      </Nav.Item>
                    ))}
                  </Nav>
                </Card.Header>

                <Card.Body>
                  {tabs.map((tab) => (
                    <div key={tab.id} hidden={tab.id !== activeTab}>
                      <ul>
                        {tab.files.map((file, fileIndex) => (
                          <li key={fileIndex}>{file.fileName}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Card.Body>
              </Card>

              <Button onClick={nestPackage} variant="primary">Nest Package</Button>

              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name of NFT the file will be placed in" />
              <Form.Control onChange={(e) => setCreator(e.target.value)} size="lg" required type="text" placeholder="Name of the Creator of this NFT" />
              <div className="d-grid px-0">
                <Button onClick={pinFileToIPFS} variant="primary" size="lg">Upload File</Button>
              </div>
              <div className='text-center'><p><strong>Files Pinned To IPFS</strong></p></div>
              <div className="px-5 py-3 container">
                {files.map((file, index) => (
                  <li key={index}>{file.fileName}</li>
                ))}
              </div>
              <div className='text-center'><p><strong>Create NFT</strong></p></div>
              <Form.Control onChange={(e) => setMintAmount(e.target.value)} size="lg" required type="text" placeholder="Amount of NFTs to be minted" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                {isWaiting ? <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} /> : <Button onClick={mintHandler} variant="primary" size="lg">Create & List NFT!</Button>}
              </div>
              <div className='text-center'><p><strong>Current List Price: </strong></p>{currentListPrice} ETH</div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Mint;
