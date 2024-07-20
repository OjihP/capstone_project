import React from 'react';

const Home = () => {
    return (
        <div className="padding-fromNav text-center">
            <header>
                <h1>Welcome to NuWav Artist</h1>
                <p>Your gateway to the best NFT experience!</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat magna felis.</p>
            </header>
            <section className="bio">
                <h2>Bio</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vehicula eu leo a venenatis.</p>
            </section>
            <section className="albums">
                <h2>Albums</h2>
                <ul>
                    <li>Album Title 1</li>
                    <li>Album Title 2</li>
                    <li>Album Title 3</li>
                </ul>
            </section>
            <section className="videos">
                <h2>Videos</h2>
                <div className="video">
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID_HERE" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
                </div>
                <div className="video">
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/ANOTHER_VIDEO_ID_HERE" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
                </div>
            </section>
        </div>
    );
};

export default Home;

