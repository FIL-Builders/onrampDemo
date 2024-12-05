import { useState } from "react";
import { onRampContractAbi } from "~~/contracts/generated";
import uploadToIPFS from "./Pinata";
import { CarWriter } from "@ipld/car";
import { CommP } from "@web3-storage/data-segment";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { useWriteContract } from "wagmi";


const PROVER_CONTRACT_ADDRESS_DEST_CHAIN = "0x61f0ace5ad40466eb43141fa56cf87758b6ffba8";
const ONRAMP_CONTRACT_ADDRESS_SRC_CHAIN = "0x750cbacfbe58c453cea1e5a2617193d60b7cb451";
const ORACLE_CONTRACT_ADDRESS_SRC_CHAIN = "0x8ca5ea3387fff4200cb47b5025fef76f32d553c0";
const WETH_ADDRESS = "0xb44cc5FB8CfEdE63ce1758CE0CDe0958A7702a16";

export const GetFileDealParams = () => {
  const [pieceSize, setPieceSize] = useState<number | null>(null);
  const [cid, setCid] = useState<CID | null>(null);
  const [commP, setCommP] = useState<any | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("file", file);
      const carFile = await convertToCAR(file);
      event.target.value = "";
      setPieceSize(carFile.pieceSize);
      setCid(carFile.cid);
      setCommP(carFile.commP);
      setIpfsUrl(carFile.ipfsUrl);

      return carFile;
    }
  };

  const { writeContract } = useWriteContract();

  const handleSubmit = async () => {
    console.log("pieceSize", pieceSize);
    console.log("commP", commP);
    console.log("ipfsUrl", ipfsUrl);
    console.log("cid", cid);
    if (!pieceSize || !commP || !ipfsUrl) {
      console.error("Missing required data for the offer");
      return;
    }

    const offer = {
      commP: commP.bytes as `0x${string}`,
      size: BigInt(pieceSize),
      location: ipfsUrl,
      amount: BigInt(0),
      token: WETH_ADDRESS as `0x${string}`,
    };

    try {
      const transaction = writeContract({
        address: ONRAMP_CONTRACT_ADDRESS_SRC_CHAIN,
        abi: onRampContractAbi,
        functionName: "offerData",
        args: [offer],
      });
      console.log("Transaction sent:", transaction);
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
    </>
  );
};

async function convertToCAR(file: File) {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const fileContent = new Uint8Array(arrayBuffer);

    const cid = await generateCID(fileContent);
    const commP = await generateCommP(fileContent);
    const pieceSize = commP.pieceSize;

    const { writer, out } = CarWriter.create([cid]);

    // Write the file content to the CAR writer
    writer.put({ cid, bytes: fileContent });
    writer.close();

    const carChunks: Uint8Array[] = [];
    for await (const chunk of out) {
      carChunks.push(chunk);
    }

    const ipfsUrl = await uploadToIPFS(carChunks);

    return { pieceSize, cid, commP, ipfsUrl };
  } catch (error) {
    console.error("Error creating CAR file:", error);
    throw error;
  }
}

function readFileAsArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Generate a CID using sha256
async function generateCID(content: Uint8Array) {
  const hash = await sha256.digest(content);
  return CID.createV1(0x55, hash);
}

async function generateCommP(bytes: Uint8Array) {
  const commP = await CommP.build(bytes);
  return commP;
}