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

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

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
  
  const listenToEvent = async () => {
      artnft.on("TokenListedSuccess", (tokenId, creator, owner, seller, price, assetURIs, currentlyListed) => {
        let data = {
          tokenId: tokenId.toString(), 
          creator, 
          price: fromWei(price.toString()),
        }
        console.log("Most recent event: ", data)
        return data
      })
      
      let eventStream = await artnft.queryFilter('TokenListedSuccess')

      eventStream.forEach((log) => {
        const event = artnft.interface.parseLog(log)

        const tokenId = event.args[0]
        const creator = event.args[1]
        const price = event.args[4]

        console.log('tokenId: ', tokenId.toString())
        console.log('Creator: ', creator)
        console.log('Price: ', fromWei(price.toString()))
      })
    }

  /*useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);*/

  return(
    <Container>
           <HashRouter>
              <Navigation web3Handler={web3Handler} account={account} listenToEvent={listenToEvent} />
              <Routes>
                <Route path="/" />
                <Route path="/about" />
                <Route path="/contact" />
                <Route path="/donate" />
                <Route path="/nftshop" element={
                  <NFTShop 
                    provider={provider}
                    artnft={artnft}
                    account={account}
                  />} 
                />
                <Route path="/mint" element={
                  <Mint 
                    provider={provider}
                    artnft={artnft} 
                    account={account}
                  />} 
                />
              </Routes>
            </HashRouter>
    </Container>

    
    
  )
}

export default App;
