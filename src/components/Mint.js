import { useEffect, useState } from 'react';
import { Row, Form, Button } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import Navigation from './Navigation';
import Loading from './Loading';

const Mint = (provider, artnft, setIsLoading, account) => {
    const [image, setImage] = useState('')
    const [price, setPrice] = useState(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isWaiting, setIsWaiting] = useState(false)

    const mintHandler = async (e) => {
        e.preventDefault()
        setIsWaiting(true)

        try {
            //const signer = await provider.getSigner()
            //console.log(signer)

            //const transaction = await artnft.connect(account).createToken()
            //await transaction.wait()

            let balance = provider.getBalance(account)
            balance = ethers.utils.formatUnits(balance, 18)
            console.log(balance)
        } catch (error) {
            console.error(error)
            window.alert('User rejected or transaction reverted', error)
        }

        //setIsLoading(true)
    }

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
                  //onChange={uploadToIPFS}
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