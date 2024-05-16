import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";  // Assuming you have a separate JSON file for the deployed 
import MyTokenJson from "../contracts/MyToken.json";
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount, open } from '@web3modal/ethers/react';
import { Link, useParams } from 'react-router-dom';

function DashboardPage() {
    const { contractAddress } = useParams(); // Get the contract address from the URL
    const [tokenDetails, setTokenDetails] = useState({ name: '', symbol: '', supply: '' });
    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount();
    const { open, close } = useWeb3Modal();

    async function connectWallet() {
        try {
            await open();
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    }

    async function fetchTokenDetails() {
        if (!contractAddress || !isConnected) return;
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(contractAddress, MyTokenJson.abi, provider);
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const supply = await tokenContract.totalSupply();

        setTokenDetails({
            name,
            symbol,
            supply: supply.toString()
        });
    }
    async function createPair() {
        if (!contractAddress || !isConnected) return;
    
        try {
            // Check if wallet is connected
            if (!isConnected) {
                console.error("Wallet is not connected");
                return;
            }
    
            // Get the signer from the provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log("Account:", await signer.getAddress()); 
    
            // Prepare contract interaction with factory contract
            const factoryAddress = "0x8073bef1728a47dA7C370842A1D2a41af7761a0c"; // Replace with your actual factory contract address
            const factoryAbi = MyFactoryJson.abi;
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);
    
            // Call the function to create the pair on the factory contract
            const txResponse = await factoryContract.createPoolForToken(contractAddress);
            console.log("Transaction sent: ", txResponse.hash);
    
            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
            console.log("Block number: ", receipt.blockNumber);
    
            // Accessing logs for emitted events
            const logs = receipt.logs;
            console.log("Logs found: ", logs.length);
    
            if (logs && logs.length > 0) {
                // Process the logs if needed
                console.log("Logs:", logs);
            } else {
                console.error("No logs found in the transaction receipt.");
            }
        } catch (error) {
            console.error("Error creating pair:", error);
        }
    }
    

    useEffect(() => {
        fetchTokenDetails();
    }, [contractAddress, isConnected]); // Re-fetch if contractAddress or connection status changes

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            {isConnected ? (
                <>
                    <p>Connected Wallet: {connectedWallet}</p>
                    <p>Token Name: {tokenDetails.name}</p>
                    <p>Token Symbol: {tokenDetails.symbol}</p>
                    <p>Total Supply: {tokenDetails.supply}</p>
                    <p>Your Deployed Token Contract Address: <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">{contractAddress}</a></p>
                    <Link to="/factory">Back to Factory</Link>
                    <button onClick={createPair}>Create Pair</button> {/* Call createPair function on button click */}
                </>
            ) : (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
}

export default DashboardPage;
