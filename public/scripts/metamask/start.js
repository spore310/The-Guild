window.addEventListener("load", async () => {

    const buttonNFT = document.querySelector("#btn-nft");
    if(window.ethereum){
    document.querySelector('#greetings-inject').innerText = ethereum.selectedAddress;
    }
    buttonNFT.addEventListener("click", async () => {
        document.querySelector('#nft').innerText = 'Fetching NFT Data';
        const nft = await window.contract.methods.buyerName(ethereum.selectedAddress).call();
        if (!nft) {
            document.querySelector('#nft').innerText = 'try another account';
            return
        }
        document.querySelector('#nft').innerText = `NFT hash: ${nft}`;
        console.log('result: ', nft)
    });



});

