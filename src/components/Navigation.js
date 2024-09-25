import { useState, useEffect, useCallback } from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import logo from '../music_note icon.png';

const Navigation = ({ web3Handler, disconnectFromWeb3, provider, account, handleShow, artnft, whtList }) => {
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const getWhiteListedUsers = useCallback(async () => {
    setIsWhitelisted(false);
    try {
      const signer = await provider.getSigner();
      const count = await whtList.getCurrentWhtListCounter();
      console.log(count.toString())
      const items = [];

      for (let i = 0; i < count; i++) {
        const userInfo = await whtList.getUserByNumber(i + 1);
        console.log(userInfo)
        items.push(userInfo);
      }
      console.log(items)

      const currentUserAddress = await signer.getAddress();
      const isCurrentUserWhitelisted = items.some(user => user.userAddress === currentUserAddress);
      setIsWhitelisted(isCurrentUserWhitelisted);
    } catch (error) {
      console.error('Error fetching whitelist:', error);
    }
  }, [provider, account, whtList]);

  const getAdmin = useCallback(async () => {
    setIsAdmin(false);
    try {
      const signer = await provider.getSigner();
      const currentUserAddress = await signer.getAddress();
        console.log("currentUser:", currentUserAddress)
      const adminAddress = await artnft.getCreatorAddress();
        console.log("AdminAddress:", adminAddress)
        const boolValue = currentUserAddress === adminAddress
      setIsAdmin(currentUserAddress === adminAddress);
      console.log("setIsAdmin:", boolValue )
    } catch (error) {
      console.error('Error fetching Admin:', error);
    }
  }, [provider, artnft]);

  const handleScroll = useCallback(() => {
    const offset = window.scrollY;
    setIsScrolled(offset > 200);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (account) {
      getWhiteListedUsers();
      getAdmin();
    }
  }, [account, getWhiteListedUsers, getAdmin]);

  return (
    <Navbar expand="lg" bg={isScrolled ? 'dark' : 'dark'} variant="dark" fixed="top">
      <img
        alt="logo"
        src={logo}
        width="40"
        height="40"
        className="d-inline-block align-top mx-3"
      />
      <Container>
        <Navbar.Brand as={Link} to="/Home">Artist NFT Webpage Template</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/Home">Home</Nav.Link>
            <Nav.Link as={Link} to="/About">About</Nav.Link>
            <Nav.Link as={Link} to="/Contact">Contact</Nav.Link>
            <Nav.Link as={Link} to="/Donate">Donate</Nav.Link>
            <Nav.Link as={Link} to="/NFTShop">NFT Shop</Nav.Link>
          </Nav>
          <Nav>
            <DropdownButton id="dropdown-basic-button" title="Menu" variant="outline-light">
              <Dropdown.Item>
                {account ? (
                  <Dropdown.Item onClick={disconnectFromWeb3}>Disconnect Wallet</Dropdown.Item>
                ) : (
                  <Dropdown.Item onClick={web3Handler}>Connect Wallet</Dropdown.Item>
                )}
              </Dropdown.Item>
              {account && !isWhitelisted && (
                <>
                  <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/MyNFTs" style={{ color: 'black' }}>My NFTs</Nav.Link></Dropdown.Item>
                  <Dropdown.Item className='text-center' variant="primary" onClick={handleShow}>Listen To Events</Dropdown.Item>
                </>
              )}
              {account && isWhitelisted && (
                <>
                  <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/MyNFTs" style={{ color: 'black' }}>My NFTs</Nav.Link></Dropdown.Item>
                  <Dropdown.Item className='text-center' variant="primary" onClick={handleShow}>Listen To Events</Dropdown.Item>
                  <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/Mint" style={{ color: 'black' }}>Mint</Nav.Link></Dropdown.Item>
                  <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/WhiteList" style={{ color: 'black' }}>Whitelist Manager</Nav.Link></Dropdown.Item>
                  <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/ManageNFTs" style={{ color: 'black' }}>Manage NFTs</Nav.Link></Dropdown.Item>
                  <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/Funds" style={{ color: 'black' }}>Manage Funds</Nav.Link></Dropdown.Item>
                </>
              )}
              {account && isAdmin && (
                <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/Admin" style={{ color: 'black' }}>Admin Functions</Nav.Link></Dropdown.Item>
              )}
            </DropdownButton>
            <Nav>
              {account ? (
                <Nav.Link
                  href={`https://sepolia.etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button nav-button btn-sm mx-4">
                  <Button variant="outline-light">
                      {account.slice(0, 5) + '...' + account.slice(38, 42)}
                  </Button>
                </Nav.Link>
              ) : (
                <Button variant="outline-light">Please Connect Wallet</Button>
              )}
            </Nav>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
