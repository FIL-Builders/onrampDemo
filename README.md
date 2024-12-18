# Filecoin Onrammp contract demo

This MVP is built using Fil-Frame, and it demonstrates how to onboard data to Filecoin via a onchain data onramp contracts integreate with Lighthouse deal engine to process storage on Filecoin. 

It will potentially integreate with multichain data bridge which process the data storage coming from multichain, such as Linea, Avalance, Base, Arbitrum, etc.

The MVP consists of the following componenet:
- **Demo UI**: upload file via onramp contract
- **Onramp Contracts**: accepting storage requests & posdi proof verification.
- **xClientClient**: listen to the storage requests from smart contract, and dealing with Lighthouse Deal Engine for storage and proofing.
- **Lighthouse Deal Engine**: data aggregation and Filecoin storage.

### Getting started

Ensure you have the following installed:

- Node.js
- Yarn
- Hardhat
- Foundry

1. Clone the repository 
    ```
    git clone https://github.com/FIL-Builders/onrampDemo.git
    cd onrampDemo
    ```
1. Install dependencies
    ```
    yarn install
    ```
1. Configuration

   Copy the sample environment files, and fill in the required values with your own values.
    ```
    cp packages/hardhat/.env.example packages/hardhat/.env
    cp packages/nextjs/.env.example packages/nextjs/.env.local
    ```
1. Run the app

    Then you can run the web app  with the following command.  
    ```
    yarn run dev
    ```

<img width="1194" alt="image" src="https://github.com/user-attachments/assets/6309463a-1d01-48dc-8561-13d5b496f68e" />

