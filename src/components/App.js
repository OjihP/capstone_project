import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

import About from './About.js';
import Contact from './Contact.js';
import Donate from './Donate.js';
import NFTShop from './NFTShop.js';
import Mint from './Mint.js';

// ABIs: Import your contract ABIs here
import ARTNFT_ABI from '../abis/ArtistContract.json'

// Config: Import your network config here
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [artnft, setArtNFT] = useState(null)
  const [signer, setSigner] = useState(null)
  const [balance, setBalance] = useState(0)

  const [isLoading, setIsLoading] = useState(true)

  const web3Handler = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Initiate contract
    const artnft = new ethers.Contract(config[31337].artistContract.address, ARTNFT_ABI, provider)
    setArtNFT(artnft)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)
    
    // Fetch account balance
    let balance = await provider.getBalance(account)
    balance = ethers.utils.formatUnits(balance, 18)
    setBalance(balance)
    
    //loadContract()
    setIsLoading(false)
    
  }

  /*useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);*/

  return(
    <Container>
           <HashRouter>
              <Navigation web3Handler={web3Handler} account={account} />
              <Routes>
                <Route path="/" />
                <Route path="/about" />
                <Route path="/contact" />
                <Route path="/donate" />
                <Route path="/nftshop" element={
                  <NFTShop 
                    provider={provider}
                    artnft={artnft}
                  />} 
                />
                <Route path="/mint" element={
                  <Mint 
                    provider={provider}
                    artnft={artnft} 
                    account={account} 
                    setIsLoading={setIsLoading}
                  />} 
                />
              </Routes>
            </HashRouter>
    </Container>

    
    
  )
}

export default App;
