import React from 'react';

const Home = () => {
    return (
        <div className="padding-fromNav text-center">
            <header>
                <h1>Welcome to Artist NFT Webpage Template!</h1>
                <p>Prototype webpage for aspiring artists and musicians.</p>
                <p>The video below will guide you on how the website functions. Please take a look!</p>
            </header>
    
            <section className="videos">
                <h2>Explanation Video</h2>
                <div className="video">
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID_HERE" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
                </div>
            </section>
        </div>
    );
};

export default Home;

