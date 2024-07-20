import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Container, Button, Offcanvas, Table } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

import Home from './Home.js'
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
import WHTLIST_ABI from '../abis/ArtistWhiteList.json'
import POSE_ABI from '../abis/Proposals.json'
import MINT_ABI from '../abis/ArtistMinter.json'

// Config: Import your network config here
import config from '../config.json';

import '../NuWav_crop.png';

const toWei = (n) => ethers.utils.parseEther(n.toString())
const fromWei = (n) => ethers.utils.formatEther(n)

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [artnft, setArtNFT] = useState(null)
  const [whtList, setWhtList] = useState(null)
  const [pose, setProposals] = useState(null)
  const [minter, setMinter] = useState(null)
  //const [signer, setSigner] = useState(null)
  const [balance, setBalance] = useState(0)

  const [show, setShow] = useState(false);
  const [eventSupply, setEventSupply] = useState(null)
  const [eventTokenId, setEventTokenId] = useState(null)
  const [eventNFTName, setEventNFTName] = useState(null)
  const [eventCreator, setEventCreator] = useState(null)
  const [eventPrice, setEventPrice] = useState(null)

  const [events, setEvents] = useState([]);
      
  const handleClose = () => setShow(false);

  const handleShow = () => {
    listenToEvent()
    setShow(true);
  } 

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true)

  const web3Handler = async () => {

    try {
      // Initiate provider
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)

      // Fetch the network details
      const network = await provider.getNetwork()
      const chainId = network.chainId

      // Fetch the corresponding config for the current network
      const networkConfig = config[chainId]
      if (!networkConfig) {
        throw new Error(`No configuration found for network with chainId ${chainId}`)
      }

      // Initiate contracts

      // ArtistMarketplace
      const artnft = new ethers.Contract(networkConfig.artistContract.address, ARTNFT_ABI, provider)
      setArtNFT(artnft)
      console.log("Initiated Contract Address Marketplace: ", artnft.address)

      // ArtistWhiteList
      const whtList = new ethers.Contract(networkConfig.artistWhiteList.address, WHTLIST_ABI, provider)
      setWhtList(whtList)
      console.log("Initiated Contract Address WhiteList: ", whtList.address)

      // Proposals
      const propose = new ethers.Contract(networkConfig.proposalsContract.address, POSE_ABI, provider)
      setProposals(propose)
      console.log("Proposals: ", propose.address)

      // ArtistMinter
      const minter = new ethers.Contract(networkConfig.artistMinter.address, MINT_ABI, provider)
      setMinter(minter)
      console.log("Minter: ", minter.address)

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
    } catch (error) {
      console.error('Error in web3Handler:', error)
    }
  }

  const disconnectFromWeb3 = () => {
    // Reset provider, artNFT, account, and balance state variables
    setProvider(null);
    setArtNFT(null);
    setWhtList(null);
    setProposals(null);
    setMinter(null);
    setAccount(null);
    setBalance(null);
    
    // Add any additional cleanup logic you may need
    // For example, if you have event listeners or subscriptions, you may need to remove them here.
  }
  
  const listenToEvent = async () => {
    if (artnft) {
      artnft.on("TokenListedSuccess", (supplyAmount, tokenId, nftName, creator, CreatorAddress, owner, seller, price, fileNames, fileTypes, tokenCIDS, currentlyListed, log) => {
        const eventData = {
          supplyAmount,
          tokenId: tokenId.toString(), 
          nftName,
          creator, 
          CreatorAddress,
          price: fromWei(price.toString()),
          blockTimestamp: log.blockTimestamp ? log.blockTimestamp.toNumber() : null, // Check if blockTimestamp exists
        }
        setEvents((prevEvents) => [...prevEvents, eventData]);
        console.log("Most recent event: ", eventData);
      });
      
      // Initial query for existing events
      let eventStream = await artnft.queryFilter('TokenListedSuccess');
      eventStream.forEach((log) => {
        const parsedLog = artnft.interface.parseLog(log);
  
        const supplyAmount = parsedLog.args[0];
        const tokenId = parsedLog.args[1];
        const nftName = parsedLog.args[2];
        const creator = parsedLog.args[3];
        const price = parsedLog.args[7];
  
        let eventData = {
          supplyAmount: supplyAmount.toString(),
          tokenId: tokenId.toString(),
          nftName,
          creator,
          price: fromWei(price.toString()),
          blockTimestamp: log.blockTimestamp ? log.blockTimestamp.toNumber() : null, // Check if blockTimestamp exists
        };
  
        setEvents((prevEvents) => [...prevEvents, eventData]);
      });
    }
  };
  
  const runFunction = async () => {
    const signer = await provider.getSigner()
    const func = await minter.connect(signer).tokenSupply()
    return func
  }

  useEffect(() => {
    if (isLoading) {
      web3Handler()
    }
  }, [isLoading]);

  useEffect(() => {
    if (!account) {
      console.error("No account detected, navigating to home.");
      navigate('/Home');
    }
  }, [account, navigate]);

  useEffect(() => {
    if (artnft) {
      listenToEvent();
    }
  }, [artnft]);

  return (
      <Container style={{ color: '#fff' }}>
        <Navigation
          web3Handler={web3Handler} 
          disconnectFromWeb3={disconnectFromWeb3}
          provider={provider} 
          account={account} 
          listenToEvent={listenToEvent}
          handleShow={handleShow}
          artnft={artnft}
          whtList={whtList}
          pose={pose}
        />
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donate provider={provider} artnft={artnft} account={account} />} />
          <Route path="/nftshop" element={<NFTShop provider={provider} artnft={artnft} account={account} minter={minter} />} />
          <Route path="/myNFTs" element={<MyNFTs provider={provider} artnft={artnft} minter={minter} account={account} />} />
          <Route path="/mint" element={<Mint provider={provider} artnft={artnft} account={account} minter={minter} />} />
          <Route path="/whiteList" element={<WhiteList provider={provider} artnft={artnft} whtList={whtList} pose={pose} account={account} />} />
          <Route path="/funds" element={<Funds provider={provider} artnft={artnft} pose={pose} account={account} />} />
          <Route path="/admin" element={<Admin provider={provider} artnft={artnft} whtList={whtList} pose={pose} account={account} />} />
        </Routes>

        <Offcanvas show={show} onHide={handleClose} placement="end">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Event Listener</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Timestamp</th> {/* Add new column for timestamp */}
                  <th>Token ID</th>
                  <th>NFT Name</th>
                  <th>NFT Creator</th>
                  <th>Price</th>
                  <th>Supply Amount</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index}>
                    <td>{new Date(event.blockTimestamp * 1000).toLocaleString()}</td> {/* Display timestamp */}
                    <td>{event.tokenId}</td>
                    <td>{event.nftName}</td>
                    <td>{event.creator}</td>
                    <td>{event.price.toString()}</td>
                    <td>{event.supplyAmount.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Offcanvas.Body>
        </Offcanvas>
      </Container>
  )
}

export default function RouterApp() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}


