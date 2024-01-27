import { Navbar, Nav, Button, Container }  from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../logo.png';

const Navigation = ({ web3Handler, account }) => {
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
        <Navbar.Brand href="#">Dapp University Template</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Nav className="me-auto">
              <Nav.Link as={Link} to="/Home">Home</Nav.Link>
              <Nav.Link as={Link} to="/About">About</Nav.Link>
              <Nav.Link as={Link} to="/Contact">Contact</Nav.Link>
              <Nav.Link as={Link} to="/Donate">Donate</Nav.Link>
              <Nav.Link as={Link} to="/NFTShop">NFT Shop</Nav.Link>
              <Nav.Link as={Link} to="/Mint">Mint</Nav.Link>
          </Nav>
          <Nav>
            {account ? (
              <Nav.Link
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button nav-button btn-sm mx-4">
                <Button variant="outline-light">
                    {account.slice(0, 5) + '...' + account.slice(38, 42)}
                </Button>
              </Nav.Link>
            ) : (
              <Button onClick={web3Handler} variant="outline-light">Connect Wallet</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;