import { useEffect, useState } from 'react';
import { Row, Form, Button, Container } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import axios from 'axios';

const toWei = (n) => ethers.utils.parseEther(n.toString())

const FormData = require("form-data")



const Mint = ({ provider, artnft }) => {
    const [files, setFiles] = useState(null)
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

    const mintHandler = async () => {
      const formData = new FormData();
      formData.append('file', files);

      const pinataMetadata = JSON.stringify({
        name: files.name,
        keyvalues: {
          nftDescription: description
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
          console.log("response: ", res)
          console.log(toWei(price).toString())
          console.log("File uploaded, CID: ", res.data.IpfsHash)

        const URI = `ipfs/${res.data.IpfsHash}`

        const signer = await provider.getSigner()

        const transaction = await artnft.connect(signer).createToken(URI, toWei(price).toString(), { value: ethers.utils.parseEther('0.01') })
        await transaction.wait()
      } catch (error) {
        console.log(error);
        window.alert('User rejected or transaction reverted');
        return;
      }
    }

    /*const mintHandler = async () => {
        console.log("FileList Object: ", files)

      const filesArray = Array.from(files)
        console.log("FileList Object converted into an array: ", filesArray)

      const formData = new FormData();

      filesArray.forEach((file, index) => {
        formData.append(`file[${index}]`, file);

        const pinataMetadata = JSON.stringify({
          name: file.name,
          keyvalues: {
            index: index
          }
        });
        formData.append(`pinataMetadata[${index}]`, pinataMetadata);

        const pinataOptions = JSON.stringify({
          cidVersion: 0,
        });
        formData.append(`pinataOptions[${index}]`, pinataOptions);
      })

      formData.forEach((value, key) => {
        console.log("Contents of formData object: ", key, value);
      });

      try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
              maxBodyLength: "Infinity",
              headers: {
                  'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                  'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT_KEY}`
              }
          });
          console.log("response: ", res)
          console.log(toWei(price).toString())
          console.log("File uploaded, CID: ", res.data.IpfsHash)

        const URI = `ipfs/${res.data.IpfsHash}`

        const signer = await provider.getSigner()

        const transaction = await artnft.connect(signer).createToken(URI, toWei(price).toString(), { value: ethers.utils.parseEther('0.01') })
        await transaction.wait()
      } catch (error) {
        console.log(error);
        window.alert('User rejected or transaction reverted');
        return;
      }
    }*/

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
                  onChange={(e) => setFiles(e.target.files[0])} 
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