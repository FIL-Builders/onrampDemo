import React, { useState } from "react";
import { uploadToIPFS } from "./Pinata";
import { CarWriter } from "@ipld/car";
import { CommP, MerkleTree } from "@web3-storage/data-segment";
import { ethers } from "ethers";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { onRampContractAbi } from "~~/contracts/generated";

const PINATA_CONFIGS = JSON.stringify({
  cidVersion: 1,
});
const PINATA_CLOUD_ROOT = "https://gateway.pinata.cloud/ipfs/";
const ONRAMP_CONTRACT_ADDRESS_SRC_CHAIN = "0xACd64568CDDdF173d65ED6d3B304ad17E98Cca2F";
const WETH_ADDRESS = "0xb44cc5FB8CfEdE63ce1758CE0CDe0958A7702a16";

export const GetFileDealParams = () => {
  const [pieceSize, setPieceSize] = useState<number | null>(null);
  const [commP, setCommP] = useState<any | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("file", file);
      const uploadedFile = await uploadFile(file);
      setPieceSize(uploadedFile.pieceSize);
      setCommP(uploadedFile.commP);
      setIpfsUrl(uploadedFile.ipfsUrl);
      setCid(uploadedFile.cid);
      console.log("File uploaded successfully, params are: ", uploadedFile);

      return uploadedFile;
    }
  };

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async () => {
    if (!pieceSize || !commP || !ipfsUrl || !cid) {
      console.error("Missing required data for the offer:", { pieceSize, commP, ipfsUrl, cid });
      return;
    }

    console.log("IPFS CID is:", cid);
    console.log("IPFS commP is:", commP);
    console.log("pieceSize", pieceSize);
    console.log("ipfsUrl", ipfsUrl);
    console.log("commP.size", commP.size);
    console.log("commP.merkleTree", commP.tree as MerkleTree);
    console.log("commP.tree.root", commP.tree.root);

    const serializedCommP = serializeCommP(commP.size, commP.tree as MerkleTree);

    const offer = {
      commP: serializedCommP as `0x${string}`,
      size: BigInt(pieceSize),
      cid: cid,
      location: ipfsUrl,
      amount: BigInt(0),
      token: WETH_ADDRESS as `0x${string}`,
    };

    try {
      writeContract({
        address: ONRAMP_CONTRACT_ADDRESS_SRC_CHAIN,
        abi: onRampContractAbi,
        functionName: "offerData",
        args: [offer],
      });
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  return (
    <>
      <input
        type="file"
        onChange={handleUpload}
        accept={"*"}
        className="file-input border-base-300 border shadow-md shadow-secondary rounded-3xl"
      />
      <button onClick={handleSubmit}>Submit</button>
      {isPending && <div>Transaction pending...</div>}
      {isConfirming && <div>Confirming transaction...</div>}
      {isConfirmed && <div>Transaction confirmed!</div>}
      {hash && <div>Transaction hash: {hash}</div>}
    </>
  );
};

async function uploadFile(file: File) {
  try {
    const data = new FormData();
    data.append("file", file);
    data.append("pinataOptions", PINATA_CONFIGS);

    const response = await uploadToIPFS(data);

    const fileIPFSHash = response?.ipfsHash;
    const ipfsURL = `${PINATA_CLOUD_ROOT}${fileIPFSHash}`;

    const cid = await generateCID(file);

    const commP = await generateCommP(file);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const carChunks = await packToCAR(cid, file);

    const pieceSize = commP.pieceSize;

    return { pieceSize, cid: cid.toString(), commP, ipfsUrl: ipfsURL };
  } catch (error) {
    console.error("Error creating CAR file:", error);
    throw error;
  }
}

// Generate a CID using sha256
async function generateCID(file: File) {
  const content = new Uint8Array(await file.arrayBuffer());
  const hash = await sha256.digest(content);
  return CID.create(1, raw.code, hash);
}

async function generateCommP(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const commP = await CommP.build(bytes);
  return commP;
}

const serializeCommP = (size: number, merkleTree: MerkleTree): `0x${string}` => {
  const sizeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(size)), 8);

  const merkleBytes = ethers.utils.arrayify(merkleTree.root);

  const combinedBytes = ethers.utils.concat([sizeBytes, merkleBytes]);
  return ethers.utils.hexlify(combinedBytes) as `0x${string}`;
};

const packToCAR = async (cid: CID, file: File) => {
  // Generating CAR for the uploaded file
  const { writer, out } = CarWriter.create([cid]);
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  writer.put({ cid, bytes: fileBytes });
  writer.close();

  const carChunks: Uint8Array[] = [];
  for await (const chunk of out) {
    carChunks.push(chunk);
  }

  return carChunks;
};
