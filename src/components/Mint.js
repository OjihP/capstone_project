import { useEffect, useState } from 'react';
import { Row, Form, Button, Container } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import axios from 'axios';

const toWei = (n) => ethers.utils.parseEther(n.toString())

const FormData = require("form-data")
const fetch = require("node-fetch")
//const fs = require("fs")

const Mint = ({ provider, artnft }) => {
    const [image, setImage] = useState(null)
    //const [URI, setURI] = useState('');
    const [price, setPrice] = useState(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
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
  
  /*const uploadImage = async () => {
    try {
      const data = new FormData()
      data.append("file", image)

      const pinataMetaData =  JSON.stringify({name: name, description: description});

      data.append("pinataMetadata", pinataMetaData);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });

      data.append('pinataOptions', pinataOptions);

      const res = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`, data, {
        maxbodylength: "Infinity",
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT_KEY}`
        },
      })
      console.log("Metadata: ", data)
      console.log("File uploaded, CID: ", res.data.IpfsHash)
      setURI(`ipfs/${res.data.IpfsHash}`)
      return `ipfs/${res.data.IpfsHash}`




    } catch (error) {
      console.log(error)
    }
  }*/
  
  /*const uploadMetadata = async (name, description, external_url, CID) => {
    try {
      const data = JSON.stringify({
        pinataContent: {
          name: `${name}`,
          description: `${description}`,
          external_url: `${external_url}`,
          image: `ipfs://${CID}`,
        },
        pinataMetadata: {
          name: "Pinnie NFT Metadata",
        },
      });
  
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PINATA_JWT}`
        },
        body: data
      })
      const resData = await res.json()
      console.log("Metadata uploaded, CID:", resData.IpfsHash)
      return resData.IpfsHash
    } catch (error) {
      console.log(error)
    }
  }

  const main = async (file, name, description, external_url, wallet) => {
    try {
      const imageCID = await uploadImage(file)
      const metadataCID = await uploadMetadata(name, description, external_url, imageCID)
      //await mintNft(metadataCID, wallet)
    } catch (error) {
      console.log(error)
    }
  }*/

    const mintHandler = async () => {
      try {
        const data = new FormData()
        data.append("file", image)
  
        const pinataMetaData =  JSON.stringify({name: name, description: description, price: price});
  
        data.append("pinataMetadata", pinataMetaData);
  
        const pinataOptions = JSON.stringify({
          cidVersion: 0,
        });
  
        data.append('pinataOptions', pinataOptions);
  
        const res = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`, data, {
          maxbodylength: "Infinity",
          headers: {
            'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
            'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT_KEY}`
          },
        })
        
        console.log(toWei(price).toString())
        console.log("File uploaded, CID: ", res.data.IpfsHash)
        const URI = `ipfs/${res.data.IpfsHash}`

        const signer = await provider.getSigner()

        const transaction = await artnft.connect(signer).createToken(URI, toWei(price).toString(), { value: ethers.utils.parseEther('0.01') })
        await transaction.wait()
      } catch (error) {
        console.log(error)
        window.alert('User rejected or transaction reverted', error)
      }
    }

    useEffect(() => {
      testAuthentication()
    }, [])

    return(
      <div className="container-fluid mt-5">
        <div className="row">
          <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
            <div className="content mx-auto">
              <Row className="g-4">
                <Form.Control
                  type="file"
                  required
                  name="file" 
                  onChange={(e) => setImage(e.target.files[0])} 
                />

                <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
                <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
                <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
                <div className="d-grid px-0">
                  <Button onClick={mintHandler} variant="primary" size="lg">
                    Create & List NFT!
                  </Button>
                </div>
              </Row>
            </div>
          </main>
        </div>
      </div>
    )
}

export default Mint;