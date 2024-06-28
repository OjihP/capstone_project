import { useEffect, useState } from 'react';
import { Row, Form, Button, Container } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import axios from 'axios';

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

const FormData = require("form-data")

const fileItemArray = []

const Mint = ({ provider, artnft, account, minter }) => {
    const [files, setFiles] = useState(null)
    const [price, setPrice] = useState(null)
    const [name, setName] = useState('')
    const [artistName, setCreator] = useState('')
    const [mintAmount, setMintAmount] = useState(null)
    const [description, setDescription] = useState('')
    const [_fileItemArray, setFileItemArray] = useState([])
    const [isWaiting, setIsWaiting] = useState(false)

    const testAuthentication = async () => {
      const url = `https://api.pinata.cloud/data/testAuthentication`;
      return axios
          .get(url, {
              headers: {
                  'pinata_api_key': `${process.env.REACT_APP_PINATA_API_KEY}`,
                  'pinata_secret_api_key': `${process.env.REACT_APP_PINATA_API_SECRET}` 
              }
          })
          .then(function (response) {
              //handle your response here
              console.log(response.data)
          })
          .catch(function (error) {
              //handle error here
          });
    };

    const pinFileToIPFS = async () => {
      const formData = new FormData();
      formData.append('file', files);

      const pinataMetadata = JSON.stringify({
        fileName: files.name,
        keyvalues: {
          address: `${account}`,
          //tokenId: 1,
          nftName: name,
          creatorName: artistName
        }
      });
      formData.append('pinataMetadata', pinataMetadata);
      //console.log(pinataMetadata)

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
          console.log("response: ", res)

          const fileItem = {
            fileName: files.name,
            fileType: files.type,
            address: `${account}`,
            //tokenId: 1,
            nftName: name,
            creatorName: artistName,
            CID: res.data.IpfsHash
          }
          console.log("fileItem: ", fileItem)

          console.log(files)

          fileItemArray.push(fileItem)

          const filteredArray = fileItemArray.filter(item => {
            return item.nftName === name;
          })

        console.log("Filtered Array: ", filteredArray)
          
          setFileItemArray(filteredArray)
          
          console.log("File uploaded, CID: ", res.data.IpfsHash)
          console.log(_fileItemArray)

      } catch (error) {
        console.log(error);
        window.alert('User rejected or transaction reverted');
        return;
      }
    }

    /*const multiplyHandler = async () => {
      const count = mintAmount
      console.log("count: ", count)
      for(var i = 0; i < count; i++) {
        mintHandler()
      }
    }*/

    const mintHandler = async () => {
      setIsWaiting(true)

      const _nftName = _fileItemArray.map(item => item.nftName)
      const _artistName = _fileItemArray.map(item => item.creatorName)
      const _artistAddress = _fileItemArray.map(item => item.address)
      const _fileNames = _fileItemArray.map(item => item. fileName)
      const _fileTypes = _fileItemArray.map(item => item.fileType)
      const _tokenCIDs = _fileItemArray.map(item => item.CID)
      const listPrice = await artnft.getListPrice()
      const mintPrice = listPrice.mul(mintAmount)
        
        console.log(_nftName[0].toString())
        console.log(_artistName[0].toString())
        console.log(_artistAddress.toString())
        console.log(_fileNames)
        console.log(_fileTypes)
        console.log(_tokenCIDs)
        console.log(toWei(price).toString())
        console.log(fromWei(listPrice).toString())
        console.log(toWei(mintPrice).toString())
        console.log(mintAmount)

      try {
        const signer = await provider.getSigner()

        const transaction = await minter.connect(signer).createToken(mintAmount, _nftName[0].toString(), _artistName[0].toString(), _artistAddress[0], toWei(price).toString(), _fileNames, _fileTypes, _tokenCIDs, ethers.utils.hexlify([]), { value: mintPrice })
        await transaction.wait()

      } catch (error) {
        console.log(error);
        window.alert('User rejected or transaction reverted');
        return;
      }
      
      window.alert('NFT has been minted')
    }

    useEffect(() => {
      testAuthentication()
    }, [])

    return(
      <div className="container-fluid mt-5">
        <div className="row">
          <div className='text-center'><p><strong>Upload Files into NFT Package</strong></p></div>
          <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
            <div className="content mx-auto">
              <Row className="g-4">
                <Form.Control
                  type="file" 
                  required
                  name="file" 
                  onChange={(e) => setFiles(e.target.files[0])} 
                />
                <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name of NFT the file will be placed in" />
                <Form.Control onChange={(e) => setCreator(e.target.value)} size="lg" required type="text" placeholder="Name of the Creator of this NFT" />
                <div className="d-grid px-0">
                  <Button onClick={pinFileToIPFS} variant="primary" size="lg">
                    Upload File
                  </Button>
                </div>
                <div className='text-center'><p><strong>Files Pinned To IPFS</strong></p></div>
                <div className="px-5 py-3 container">
                  {/* Display pinned files here */}
                  {_fileItemArray.map((file, index) => (
                      <div key={index}>
                          <p>{file.fileName}</p>
                      </div>
                  ))}
                </div>
                <div className='text-center'><p><strong>Create NFT</strong></p></div>
                <Form.Control onChange={(e) => setMintAmount(e.target.value)} size="lg" required type="text" placeholder="Amount of NFTs to be minted" />
                <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
                <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
                <div className="d-grid px-0">
                  {isWaiting ? (
                    <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
                  ) : (
                    <Button onClick={mintHandler} variant="primary" size="lg">
                    Create & List NFT!
                  </Button>
                  )}
                </div>
              </Row>
            </div>
          </main>
        </div>
      </div>
    )
}

export default Mint;