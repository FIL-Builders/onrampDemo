"use server";

import { CID } from "multiformats/cid";

async function uploadToIPFS(carChunks: Uint8Array[]) {
  try {
    const carBlob = new Blob(carChunks, { type: "application/car" });
    const data = new FormData();
    data.append("file", carBlob);

    const pinataMetadata = JSON.stringify({
      name: "file.car",
    });
    data.append("pinataMetadata", pinataMetadata);

    const options = JSON.stringify({
      cidVersion: 1
    })
    data.append("pinataOptions", options)

    console.log("start sending file to ipfs using Pinata");
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
      },
      body: data,
    });

    if (!res.ok) {
      throw new Error(`Failed to upload to IPFS: ${res.statusText}`);
    }

    const resData = await res.json();
    console.log(resData);
    console.log(CID.parse(resData.IpfsHash).toV1().toString());

    if ("IpfsHash" in resData) {
      const cid = resData.IpfsHash;
      const url = `ipfs://${cid}`;
      return {cid, url};
    }

    throw new Error(`No IPFS hash found in response: ${JSON.stringify(resData)}`);
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
}

export default uploadToIPFS;
