import { useState, useEffect } from 'react'
import { Navbar, Nav, Button, Container }  from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import logo from '../logo.png';

const Navigation = ({ web3Handler, disconnectFromWeb3, provider, account, listenToEvent, artnft, funcs, whtList }) => {
  const [isWhitelisted, setIsWhitelisted] = useState(false)

  const getWhiteListedUsers = async () => {
    setIsWhitelisted(false)
    try {
      const signer = await provider.getSigner()
      
      const usersOnWhtList = await artnft.connect(signer).getAllUsersOnWhiteList()
      usersOnWhtList.forEach(user => {
        console.log("User Address: ", user.userAddress);
      })
      console.log("All Users on WhiteList", usersOnWhtList.toString())

      // Check if the current user's address is in the whitelist
      const currentUserAddress = await signer.getAddress()
      const isCurrentUserWhitelisted = usersOnWhtList.some(user => user.userAddress === currentUserAddress)
      console.log(isCurrentUserWhitelisted)
      setIsWhitelisted(isCurrentUserWhitelisted)

    } catch (error) {
      console.error('Error fetching whitelist:', error)
    }
}

useEffect(() => {
  console.log(account)
  console.log(isWhitelisted)
  getWhiteListedUsers()
  console.log("useEffect")
}, [account]);

  return (
    <Navbar expand="lg" bg="secondary" variant="dark">
      <img
        alt="logo"
        src={logo}
        width="40"
        height="40"
        className="d-inline-block align-top mx-3"
      />
      <Container>
        <Navbar.Brand href="#">Artist NFT Webpage Template</Navbar.Brand>
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
              {account && (
                <Dropdown.Item className='text-center' onClick={listenToEvent}>Listen To Events</Dropdown.Item> 
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
              
            </DropdownButton>
            <Nav>
              {account ? (
                <Nav.Link
                  href={`http://127.0.0.1:8545/address/${account}`}
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