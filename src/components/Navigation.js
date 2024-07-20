import { useState, useEffect } from 'react'
import { Navbar, Nav, Button, Container }  from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import logo from '../music_note icon.png';

const Navigation = ({ web3Handler, disconnectFromWeb3, provider, account, handleShow, artnft, whtList, pose }) => {
  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false);


  const getWhiteListedUsers = async () => {
    setIsWhitelisted(false)
    try {
      const signer = await provider.getSigner()
      
      /*const usersOnWhtList = await artnft.connect(signer).getAllUsersOnWhiteList()
      usersOnWhtList.forEach(user => {
        console.log("User Address: ", user.userAddress);
      })
      console.log("All Users on WhiteList", usersOnWhtList.toString())*/

      const count = await whtList._numbers()
      const items = []

        for(var i = 0; i < count; i++) {
            const userInfo = await whtList.whtList(i + 1)
            items.push(userInfo)
        }

      // Check if the current user's address is in the whitelist
      const currentUserAddress = await signer.getAddress()
      const isCurrentUserWhitelisted = items.some(user => user.userAddress === currentUserAddress)
      console.log(isCurrentUserWhitelisted)
      setIsWhitelisted(isCurrentUserWhitelisted)

    } catch (error) {
      console.error('Error fetching whitelist:', error)
    }
  }

  const getAdmin = async () => {
    setIsAdmin(false)
    try {
      const signer = await provider.getSigner()

      // Check if the current user's address is the Admin's address
      const currentUserAddress = await signer.getAddress()
      console.log("Current User Address: ", currentUserAddress)
      const adminAddress = await artnft.connect(signer).getCreatorAddress()
      console.log("Admin Address: ", adminAddress)
      const isCreator = currentUserAddress === adminAddress
      setIsAdmin(isCreator)
    } catch (error) {
      console.log('Error fetching Admin:', error)
    }
  }

  const handleScroll = () => {
    const offset = window.scrollY;
    setIsScrolled(offset > 200);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    //console.log(account)
    //console.log(isWhitelisted)
    getWhiteListedUsers()
    getAdmin()
    //console.log("useEffect")
  }, [account]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              {(account) && (!isWhitelisted) && (
                <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/MyNFTs" style={{ color: 'black' }}>My NFTs</Nav.Link></Dropdown.Item>
              )}
              {(account) && (!isWhitelisted) && ( 
                <Dropdown.Item className='text-center' variant="primary" onClick={handleShow}>Listen To Events</Dropdown.Item> 
              )}
              {(isWhitelisted) && (
                <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/Mint" style={{ color: 'black' }}>Mint</Nav.Link></Dropdown.Item> 
              )} 
              {(isWhitelisted) && (
                <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/WhiteList" style={{ color: 'black' }}>Whitelist Manager</Nav.Link></Dropdown.Item>
              )}
              {(isWhitelisted) && (
                <Dropdown.Item className='text-center'><Nav.Link as={Link} to="/Funds" style={{ color: 'black' }}>Manage Funds</Nav.Link></Dropdown.Item>
              )}
              {(isAdmin) && (
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
}

export default Navigation;