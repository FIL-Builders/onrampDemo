"use server";

async function uploadToIPFS(carChunks: Uint8Array[]) {
  try {
    const carBlob = new Blob(carChunks, { type: "application/car" });
    const file = new File([carBlob], "file.car", { type: "application/car" });
    const data = new FormData();
    data.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_API_KEY}`,
      },
      body: data,
    });

    console.log("res", res);

    if (!res.ok) {
      throw new Error(`Failed to upload to IPFS: ${res.statusText}`);
    }

    const resData = await res.json();

    if ("IpfsHash" in resData) {
      return `ipfs://${resData.IpfsHash}`;
    }

    throw new Error(`No IPFS hash found in response: ${JSON.stringify(resData)}`);
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
}

export default uploadToIPFS;
