import React from 'react';

const About = () => {
  return (
    <div className="padding-fromNav">
    <header>
        <h1>About Page</h1>
    </header>
    <div>
        <p>
            Artist NFT Webpage Template is a prototype platform that aims to empower artists to mint, list, and sell their unique digital assets, specifically Non-Fungible Tokens (NFTs).
            The platform is designed to be a comprehensive marketplace where artists and collectors can interact securely, transparently, and have complete ownership of their digital creations.
        </p>

        <h2>Key Features</h2>

        <h5>1. NFT Minting</h5>
        <ul>
            <li>Artists can create and mint their own NFTs through the ArtistMint contract. This contract allows artists to define the details of their NFTs, including the name, creator details, pricing, and associated digital files (e.g., images, music, videos).</li>
            <li>The minted NFTs are stored on the blockchain, ensuring authenticity, ownership, and traceability.</li>
        </ul>

        <h5>2. Marketplace for Buying and Selling NFTs</h5>
        <ul>
            <li>Once minted, NFTs can be listed for sale on the ArtistMarketplace. This marketplace contract handles the listing, buying, and selling of NFTs in a secure and decentralized manner.</li>
            <li>Buyers can purchase listed NFTs directly from the marketplace by paying the specified price. The transaction is facilitated through smart contracts, ensuring a trustless and transparent exchange.</li>
            <li>The platform supports fractional ownership and sale of NFTs, allowing buyers to purchase a specified number of units from a larger supply.</li>
        </ul>

        <h5>3. White List for Access Control</h5>
        <ul>
            <li>The ArtistWhiteList contract allows the platform to manage a whitelist of approved artists and users. Only whitelisted users can mint NFTs, ensuring that the platform maintains a high standard of quality and authenticity.</li>
            <li>This whitelist feature also enables exclusive access to certain functionalities or content on the platform, enhancing security and user trust.</li>
        </ul>

        <h5>4. Proposals and Voting</h5>
        <ul>
            <li>The Proposals contract enables community governance on the platform. Artists and users can create proposals for new features, initiatives, or changes to the platform.</li>
            <li>The community can vote on these proposals, and once a proposal reaches a specified quorum, it can be executed and implemented. This democratic approach ensures that the platform evolves in line with the needs and desires of its users.</li>
        </ul>

        <h5>5. ERC1155 Token Support</h5>
        <ul>
            <li>The platform supports the ERC1155 token standard, which allows for the creation of semi-fungible tokens. This means that multiple units of a single token can be minted and managed efficiently.</li>
            <li>Artists can leverage this feature to create multiple copies of a single artwork or asset, offering more flexibility in how they sell and distribute their digital creations.</li>
        </ul>

        <h2>How It Works</h2>

        <h5>1. Minting an NFT</h5>
        <ul>
            <li>Artists create an account and get whitelisted.</li>
            <li>They then mint an NFT by uploading the digital files and metadata through the ArtistMint contract. The NFT is assigned a unique token ID and stored on the blockchain.</li>
        </ul>

        <h5>Listing and Selling</h5>
        <ul>
            <li>The minted NFT can be listed for sale on the ArtistMarketplace. Artists set the price and supply for their NFT.</li>
            <li>Buyers can browse the marketplace, select NFTs, and purchase them using cryptocurrency. The smart contract automatically transfers the ownership and funds securely.</li>
        </ul>

        <h5>Community Participation</h5>
        <ul>
            <li>Users can propose changes or enhancements to the platform through the Proposals contract.</li>
            <li>Other users can vote on these proposals. If a proposal gains enough support, it can be executed, leading to changes on the platform.</li>
        </ul>

        <h5>Governance and Security</h5>
        <ul>
            <li>The platform's governance is managed through smart contracts, ensuring that decisions are made transparently and democratically.</li>
            <li>The use of smart contracts also enhances security, as all transactions and interactions are recorded on the blockchain.</li>
        </ul>

        <h2>Why Choose ArtistMarketplace?</h2>
        <ul>
            <li>Decentralized: The platform operates on a blockchain, ensuring transparency, security, and ownership.</li>
            <li>Community-Driven: Users have a say in the platform's evolution through proposals and voting.</li>
            <li>Flexible NFT Management: Artists can mint and manage NFTs with multiple copies and diverse pricing models.</li>
            <li>Secure and Trustless: Transactions are managed by smart contracts, eliminating the need for intermediaries and ensuring trust between buyers and sellers.</li>
        </ul>

        <p>Join us on ArtistMarketplace and be part of a vibrant community where creativity meets technology, and where artists can truly own and control their digital creations.</p>
    </div>
</div>
  );
};

export default About;