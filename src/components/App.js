import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const [balance, setBalance] = useState(0);
  const [_fileItemArray, setFileItemArray] = useState([]);
  const [show, setShow] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [latestBlock, setLatestBlock] = useState(null);

  const handleClose = () => setShow(false);
  const handleShow = () => {
    listenToEvent();
    setShow(true);
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

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
      
      let balance = await provider.getBalance(account);
      balance = ethers.utils.formatUnits(balance, 18);
      setBalance(balance);

      setIsLoading(false);
    } catch (error) {
      console.error('Error in web3Handler:', error);
    }
  };

  const disconnectFromWeb3 = () => {
    setProvider(null);
    setArtNFT(null);
    setWhtList(null);
    setProposals(null);
    setMinter(null);
    setAccount(null);
    setBalance(null);
  };

  const existingEventIds = new Set();

  const startListeningToEvents = () => {
    if (artnft) {
        artnft.on("TokenListedSuccess", (supplyAmount, tokenId, nftName, creator, CreatorAddress, owner, seller, price, fileNames, fileTypes, tokenCIDS, currentlyListed, timestamp, log) => {
            const eventData = {
                supplyAmount: supplyAmount.toString(),
                tokenId: tokenId.toString(),
                nftName,
                creator,
                CreatorAddress,
                price: fromWei(price.toString()),
                blockTimestamp: timestamp ? timestamp.toNumber() : null,
            };

            if (!existingEventIds.has(log.logIndex)) {
                existingEventIds.add(log.logIndex);
                setEvents((prevEvents) => [...prevEvents, eventData]);
                console.log("Most recent event: ", eventData);
            }
        });
    }
  };

  const fetchPastEvents = async () => {
    if (artnft) {
      try {
        const latestBlock = await provider.getBlockNumber();
        const pastEvents = await artnft.queryFilter('TokenListedSuccess', latestBlock - 100, latestBlock);

        pastEvents.forEach((log) => {
          const parsedLog = artnft.interface.parseLog(log);
          const supplyAmount = parsedLog.args[0];
          const tokenId = parsedLog.args[1];
          const nftName = parsedLog.args[2];
          const creator = parsedLog.args[3];
          const price = parsedLog.args[7];
          const timestamp = parsedLog.args[11];

          const eventData = {
            supplyAmount: supplyAmount.toString(),
            tokenId: tokenId.toString(),
            nftName,
            creator,
            price: fromWei(price.toString()),
            blockTimestamp: timestamp ? timestamp.toNumber() : null,
          };

          if (!existingEventIds.has(log.logIndex)) {
            existingEventIds.add(log.logIndex);
            setEvents((prevEvents) => [...prevEvents, eventData]);
            console.log("Past event: ", eventData);
          }
        });
      } catch (error) {
        console.error("Error querying or processing past events: ", error);
      }
    }
  };

  const listenToEvent = async () => {
    await fetchPastEvents();
    startListeningToEvents();
  };
  
  useEffect(() => {
    if (isLoading) {
      web3Handler();
    }
  }, [isLoading]);
  
  useEffect(() => {
    if (!account) {
      console.error("No account detected, navigating to home.");
      navigate('/home');
    }
  }, [account, navigate]);

  useEffect(() => {
    /*if (artnft) {
      startListeningToEvents();
      return () => {
        artnft.off("TokenListedSuccess");
      };
    }*/
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
        <Route path="/donate" element={<Donate provider={provider} artnft={artnft} whtList={whtList} account={account} />} />
        <Route path="/nftshop" element={<NFTShop provider={provider} artnft={artnft} account={account} minter={minter} />} />
        <Route path="/myNFTs" element={<MyNFTs provider={provider} artnft={artnft} minter={minter} account={account} fileItemArray={_fileItemArray} />} />
        <Route path="/mint" element={<Mint provider={provider} artnft={artnft} account={account} minter={minter} whtList={whtList} setFileItemArray={setFileItemArray} />} />
        <Route path="/whiteList" element={<WhiteList provider={provider} artnft={artnft} whtList={whtList} pose={pose} account={account} />} />
        <Route path="/funds" element={<Funds provider={provider} artnft={artnft} minter={minter} pose={pose} account={account} />} />
        <Route path="/manageNFTs" element={<ManageNFTs provider={provider} artnft={artnft} minter={minter} account={account} fileItemArray={_fileItemArray} />} />
        <Route path="/admin" element={<Admin provider={provider} artnft={artnft} minter={minter} whtList={whtList} pose={pose} account={account} />} />
      </Routes>

      <Offcanvas show={show} onHide={handleClose} placement="end" className="custom-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Event Listener</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="light" />
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Timestamp</th>
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
                    <td>{event.blockTimestamp ? new Date(event.blockTimestamp * 1000).toLocaleString() : 'N/A'}</td>
                    <td>{event.tokenId}</td>
                    <td>{event.nftName}</td>
                    <td>{event.creator}</td>
                    <td>{event.price.toString()}</td>
                    <td>{event.supplyAmount.toString()}</td>
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
