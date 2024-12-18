# Filecoin Onramp Contract Demo

This MVP is built using [fil-frame](https://github.com/FIL-Builders/fil-frame), and it demonstrates how to onboard data to Filecoin via a onchain data onramp contracts integreate with Lighthouse deal engine to process storage on Filecoin. 

It will potentially integreate with multichain data bridge which process the data storage coming from multichain, such as Linea, Avalance, Base, Arbitrum, etc.

The MVP consists of the following componenet:
- **[Demo UI](https://github.com/FIL-Builders/onrampDemo/tree/main/packages/nextjs)**: upload file via onramp contract
- **[Onramp Contracts](https://github.com/FIL-Builders/onramp-contracts/)**: accepting storage requests & posdi proof verification.
- **[xClientClient](https://github.com/FIL-Builders/xchainClient)**: listen to the storage requests from smart contract, and dealing with Lighthouse Deal Engine for storage and proofing.
- **[Lighthouse](https://www.lighthouse.storage/) Deal Engine**: data aggregation and Filecoin storage.

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

