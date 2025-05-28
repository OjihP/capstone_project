import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Container, Offcanvas, Table, Spinner } from 'react-bootstrap';
import { ethers } from 'ethers';

// Components
import Navigation from './Navigation';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Donate from './Donate';
import NFTShop from './NFTShop';
import MyNFTs from './MyNFTs';
import Mint from './Mint';
import WhiteList from './WhiteList';
import Funds from './Funds';
import ManageNFTs from './ManageNFTs'
import Admin from './Admin';

// ABIs
import ARTNFT_ABI from '../abis/ArtistContract.json';
import WHTLIST_ABI from '../abis/ArtistWhiteList.json';
import POSE_ABI from '../abis/Proposals.json';
import MINT_ABI from '../abis/ArtistMinter.json';
import EVENT_ABI from '../abis/Events.json';
import LISTING_ABI from '../abis/NFTListing.json'

// Config
import config from '../config.json';

// Background
import '../NuWav_crop.png';

const toWei = (n) => ethers.utils.parseEther(n.toString());
const fromWei = (n) => ethers.utils.formatEther(n);

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [artnft, setArtNFT] = useState(null);
  const [whtList, setWhtList] = useState(null);
  const [pose, setProposals] = useState(null);
  const [minter, setMinter] = useState(null);
  const [contractEvents, setContractEvents] = useState(null);
  const [listings, setListings] = useState(null);
  const [balances, setBalances] = useState([]);
  const [_fileItemArray, setFileItemArray] = useState([]);
  const [show, setShow] = useState(false);
  const [events, setEvents] = useState([]);
  const [ whtListEvent, setWhtListEvent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const [blockTimestamp, setBlockTimestamp] = useState(null);
  const handleTimestamp = (timestamp) => {
    setBlockTimestamp(timestamp);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
    listenToEvent();
  };

  const navigate = useNavigate();

  const web3Handler = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const networkConfig = config[chainId];

      if (!networkConfig) {
        throw new Error(`No configuration found for network with chainId ${chainId}`);
      }

      // Initialize contracts
      const artnft = new ethers.Contract(networkConfig.artistContract.address, ARTNFT_ABI, provider);
      setArtNFT(artnft);
      
      const whtList = new ethers.Contract(networkConfig.artistWhiteList.address, WHTLIST_ABI, provider);
      setWhtList(whtList);

      const propose = new ethers.Contract(networkConfig.proposalsContract.address, POSE_ABI, provider);
      setProposals(propose);

      const minter = new ethers.Contract(networkConfig.artistMinter.address, MINT_ABI, provider);
      setMinter(minter);

      const events = new ethers.Contract(networkConfig.events.address, EVENT_ABI, provider);
      setContractEvents(events);

      const listings = new ethers.Contract(networkConfig.nftListing.address, LISTING_ABI, provider);
      setListings(listings);

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
      
      let balance = await provider.getBalance(account);
      balance = ethers.utils.formatUnits(balance, 18);
      //setBalance(balance);

      setIsLoading(false);

    } catch (error) {
      console.log('Error in web3Handler:', error);
      window.alert('Error in web3Handler: ', error);
    }
  };

  const disconnectFromWeb3 = () => {
    try {
      //setProvider(null);
      //setArtNFT(null);
      //setWhtList(null);
      //setProposals(null);
      //setMinter(null);
      //setContractEvents(null);
      setAccount(null);
      //setBalance(null);
      navigate('/home');

    } catch (error) {
      console.log('Error disconnecting account:', error);
      window.alert('Error disconnecting account: ', error);
    }
  };

  const getWhiteListedUsers = useCallback (async () => {
    setIsWhitelisted(false);

    if (!whtList || !account) {
      return;
    }

    try {
      const count = await whtList.getCurrentWhtListCounter();
      console.log("Current whtList counter: ", count.toString())
      const items = [];

      for (let i = 0; i < count; i++) {
        const userInfo = await whtList.getUserByNumber(i + 1);
        console.log("User Info: ", userInfo)
        items.push(userInfo);
      }
      console.log("'items' variable: ", items)

      const isCurrentUserWhitelisted = await whtList.isWhitelisted(account)
      console.log("whtList Status: ", isCurrentUserWhitelisted)

      setIsWhitelisted(isCurrentUserWhitelisted);

    } catch (error) {
      console.error('Error fetching whitelist: ', error);
      window.alert('Error fetching whitelist: ', error);
    }
  }, [provider, account, whtList])

  const eventListener = async () => {
    try {
      const count = await contractEvents.getCurrentTokenEventCounter()
      console.log("Token Event Count: ", count.toString())
      const events = [];

      for (let i = 0; i < count; i++) {
        const eventData = await contractEvents.getTokenEvent(i + 1)
        console.log("Event Data: ", eventData)
        events.push(eventData)
      }
      console.log("Events Array: ", events)

      setEvents(events)

    } catch (error) {
      console.log('Error in Token Event Counter : ', error)
      window.alert('Error in Token Event Counter : ', error)
    }

    try {
      const count = await contractEvents.getCurrentWhtListEventCounter()
      console.log("WhtList Count: ", count.toString())
      const events = [];

      for (let i = 0; i < count; i++) {
        const eventData = await contractEvents.getWhtListEvent(i + 1)
        console.log("Event Data: ", eventData)
        events.push(eventData)
      }
      console.log("Events Array: ", events)

      setWhtListEvent(events)

    } catch (error) {
      console.log('Error in White List Event Counter: ', error)
      window.alert('Error in White List Event Counter: ', error)
    }
  }

  const listenToEvent = async () => {
    try {
      eventListener();
    } catch (error) {
      console.log("Error listening to events: ", error)
      window.alert("Error in listening to events.")
    }
    
  };
  
  useEffect(() => {
    if (isLoading) {
      web3Handler();
    }
  }, [isLoading]);
  
  /*useEffect(() => {
    if (!account) {
      console.error("No account detected, navigating to home.");
      navigate('/home');
    }
  }, [account, navigate]);*/

  useEffect(() => {
    getWhiteListedUsers();
  }, [account]);

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
        <Route path="/donate" element={<Donate provider={provider} artnft={artnft} whtList={whtList} account={account} />} />
        <Route path="/nftshop" element={<NFTShop provider={provider} artnft={artnft} listings={listings} account={account} minter={minter} />} />
        <Route path="/myNFTs" element={<MyNFTs provider={provider} artnft={artnft} minter={minter} listings={listings} account={account} fileItemArray={_fileItemArray} />} />
        <Route path="/mint" element={<Mint provider={provider} artnft={artnft} account={account} minter={minter} whtList={whtList} />} />
        <Route path="/whiteList" element={<WhiteList provider={provider} artnft={artnft} whtList={whtList} pose={pose} account={account} />} />
        <Route path="/funds" element={<Funds provider={provider} artnft={artnft} minter={minter} whtList={whtList} pose={pose} account={account} />} />
        <Route path="/manageNFTs" element={<ManageNFTs provider={provider} artnft={artnft} listings={listings} minter={minter} account={account} fileItemArray={_fileItemArray} />} />
        <Route path="/admin" element={<Admin provider={provider} artnft={artnft} minter={minter} whtList={whtList} pose={pose} listings={listings} account={account} />} />
      </Routes>

      <Offcanvas className="w-50" show={show} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title><strong>Event Listener</strong></Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="light" />
            </div>
          ) : (
            <Table striped bordered hover>
              <thead><th><strong>NFT LISTENER</strong></th></thead>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Token ID</th>
                  <th>NFT Name</th>
                  <th>NFT Creator</th>
                  <th>Price</th>
                  <th>Supply Amount</th>
                  <th>NFT Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index}>
                    <td>
                      {new Date(event.timestamp * 1000).toLocaleString('en-US', {
                        year: 'numeric', 
                        month: 'numeric', 
                        day: 'numeric', 
                        hour: 'numeric', 
                        minute: 'numeric', 
                        second: 'numeric',
                        timeZoneName: 'short',
                        hour12: true
                      })}<br />{new Date(event.timestamp * 1000).getTimezoneOffset() / -60} GMT
                    </td>
                    <td>{event.tokenId.toString()}</td>
                    <td>{event.nftName}</td>
                    <td>{event.artistName}</td>
                    <td>{fromWei(event.price.toString())} ETH</td>
                    <td>{event.supplyAmount.toString()}</td>
                    <td>{event.currentlyListed ? "In Stock" : "Sold Out"}</td>
                    <td>{console.log("Status: ", event.currentlyListed)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {isLoading === false && isWhitelisted && (
            <Table striped bordered hover>
              <thead><th><strong>WHITELIST LISTENER</strong></th></thead>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>User Status</th>
                </tr>
              </thead>
              <tbody>
                {whtListEvent.map((event, index) => (
                  <tr key={index}>
                    <td>
                      {new Date(event.timestamp * 1000).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        timeZoneName: 'short',
                        hour12: true
                      })} GMT {new Date(event.timestamp * 1000).getTimezoneOffset() / -60}
                    </td>
                    <td>{event.userNumber.toString()}</td>
                    <td>{event.nameForAddress}</td>
                    <td>{event.isListed ? "Listed" : "Not Listed"}</td>
                    <td>{console.log("Status: ", event.isListed)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
}

export default function RouterApp() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}