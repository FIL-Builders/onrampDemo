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

const ONRAMP_CONTRACT_ADDRESS_SRC_CHAIN = "0xACd64568CDDdF173d65ED6d3B304ad17E98Cca2F";
const WETH_ADDRESS = "0xb44cc5FB8CfEdE63ce1758CE0CDe0958A7702a16";

export const GetFileDealParams = () => {
  const [pieceSize, setPieceSize] = useState<number | null>(null);
  const [commP, setCommP] = useState<any | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [cidStr, setCidStr] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("file", file);
      const carFile = await convertToCAR(file);
      setPieceSize(carFile.pieceSize);
      setCommP(carFile.commP);
      setIpfsUrl(carFile.ipfsUrl);
      setCidStr(carFile.cidStr);

      return carFile;
    }
  };

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async () => {
    if (!pieceSize || !commP || !ipfsUrl || !cidStr) {
      console.error("Missing required data for the offer: ", { pieceSize, commP, ipfsUrl, cidStr });
      return;
    }

    console.log("cidStr", cidStr);
    console.log("commP", commP);
    console.log("pieceSize", pieceSize);
    console.log("ipfsUrl", ipfsUrl);
    console.log("commP.size", commP.size);
    console.log("commP.merkleTree", commP.tree as MerkleTree);
    console.log("commP.tree.root", commP.tree.root);

    const serializedCommP = serializeCommP(commP.size, commP.tree as MerkleTree);

    const offer = {
      commP: serializedCommP as `0x${string}`,
      size: BigInt(pieceSize),
      cid: cidStr,
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
        // accept everything
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

async function convertToCAR(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(arrayBuffer);

    const cid = await generateCID(fileContent);
    console.log("V1 cid String is: ", cid.toString());

    const commP = await generateCommP(fileContent);
    console.log("commP is: ", commP);

    const pieceSize = commP.pieceSize;
    console.log("pieceSize is: ", pieceSize);

    // Generating CAR for the uploaded file
    const { writer, out } = CarWriter.create([cid]);
    writer.put({ cid, bytes: fileContent });
    writer.close();

    const carChunks: Uint8Array[] = [];
    for await (const chunk of out) {
      carChunks.push(chunk);
    }

    const ipfsResp = await uploadToIPFS(fileContent, file.type);
    const ipfsUrl = ipfsResp.url;
    const cidStr = ipfsResp.cid;
    console.log("ipfsURL is: ", ipfsUrl);

    return { pieceSize, cidStr, commP, ipfsUrl };
  } catch (error) {
    console.error("Error creating CAR file:", error);
    throw error;
  }
}

// Generate a CID using sha256
async function generateCID(content: Uint8Array) {
  const hash = await sha256.digest(content);
  return CID.create(1, raw.code, hash);
}

async function generateCommP(bytes: Uint8Array) {
  const commP = await CommP.build(bytes);
  return commP;
}

const serializeCommP = (size: number, merkleTree: MerkleTree): `0x${string}` => {
  const sizeBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(size)), 8);

  const merkleBytes = ethers.utils.arrayify(merkleTree.root);

  const combinedBytes = ethers.utils.concat([sizeBytes, merkleBytes]);
  return ethers.utils.hexlify(combinedBytes) as `0x${string}`;
};
