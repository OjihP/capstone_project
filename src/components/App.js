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
import MyNFTs from './MyNFTs.js';
import Mint from './Mint.js';
import WhiteList from './WhiteList.js';
import Funds from './Funds.js'
import Admin from './Admin.js'

// ABIs: Import your contract ABIs here
import ARTNFT_ABI from '../abis/ArtistContract.json'
//import FUNC_ABI from '../abis/FunctionsContract.json'
//import WHTLIST_ABI from '../abis/WhiteListContract.json'

// Config: Import your network config here
import config from '../config.json';

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [artnft, setArtNFT] = useState(null)
  const [funcs, setMarketFunctions] = useState(null)
  const [whtList, setWhtList] = useState(null)
  const [signer, setSigner] = useState(null)
  const [balance, setBalance] = useState(0)

  const [isLoading, setIsLoading] = useState(true)

  const web3Handler = async () => {

    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Initiate contracts
    const artnft = new ethers.Contract(config[31337].artistContract.address, ARTNFT_ABI, provider)
    setArtNFT(artnft)
    console.log("Initiated Contract Address: ", artnft.address)

    // Initialize contract instance for MarketplaceFunctions
    //const funcs = new ethers.Contract(config[31337].artistFunctions.address, FUNC_ABI, provider)
    //setMarketFunctions(funcs)
    //console.log(funcs.address)

    //const whtlist = new ethers.Contract(config[31337].artistWhiteList.address, WHTLIST_ABI, provider)
    //setWhtList(whtlist)
    //console.log(whtlist.address)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)
    console.log("Set Account: ", account)
    
    // Fetch account balance
    let balance = await provider.getBalance(account)
    balance = ethers.utils.formatUnits(balance, 18)
    setBalance(balance)

    //loadContract()
    setIsLoading(false)
    
  }

  const disconnectFromWeb3 = () => {
    // Reset provider, artNFT, account, and balance state variables
    setProvider(null);
    setArtNFT(null);
    setMarketFunctions(null);
    setAccount(null);
    setBalance(null);
    
    // Add any additional cleanup logic you may need
    // For example, if you have event listeners or subscriptions, you may need to remove them here.
  }
  
  const listenToEvent = async () => {
      artnft.on("TokenListedSuccess", (tokenId, nftName, creator, owner, seller, price, assetURIs, currentlyListed) => {
        let data = {
          tokenId: tokenId.toString(), 
          nftName,
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
        const nftName = event.args[1]
        const creator = event.args[2]
        const price = event.args[5]

        console.log('tokenId: ', tokenId.toString())
        console.log('NFT Name: ', nftName)
        console.log('Creator: ', creator)
        console.log('Price: ', fromWei(price.toString()))
      })
    }

  useEffect(() => {
    if (isLoading) {
      web3Handler()
    }
  }, []);

  return(
    <Container>
           <HashRouter>
              <Navigation 
                web3Handler={web3Handler} 
                disconnectFromWeb3={disconnectFromWeb3}
                provider={provider} 
                account={account} 
                listenToEvent={listenToEvent}
                artnft={artnft}
              />
              <Routes>
                <Route path="/" />
                <Route path="/about" />
                <Route path="/contact" />
                <Route path="/donate" element={
                  <Donate
                    provider={provider}
                    artnft={artnft}
                    account={account}
                   />}
                />
                <Route path="/nftshop" element={
                  <NFTShop 
                    provider={provider}
                    artnft={artnft}
                    account={account}
                  />} 
                />
                <Route path="/myNFTs" element={
                  <MyNFTs
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
                <Route path="/whiteList" element={
                  <WhiteList
                    provider={provider}
                    artnft={artnft}
                    //whtList={whtList}
                    account={account}
                  />}
                />
                <Route path="/funds" element={
                  <Funds
                    provider={provider} 
                    artnft={artnft}
                    account={account}
                  />} 
                />
                <Route path="/admin" element={
                  <Admin
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
