import { CarWriter } from '@ipld/car';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';

export const GetFileDealParams = ({
  dealDurationInMonths,
}: {
  handleGetDealParams: (params: string) => void;
  dealDurationInMonths: number;
}) => {

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const carFile = await convertToCAR(file);
      event.target.value = "";
      return carFile;
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
    </>
  );
};

async function convertToCAR(file: File) {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const fileContent = new Uint8Array(arrayBuffer);

    const cid = await generateCID(fileContent);

    const { writer, out } = CarWriter.create([cid]);

    // Write the file content to the CAR writer
    await writer.put({ cid, bytes: fileContent });
    await writer.close();

    const carChunks = [];
    for await (const chunk of out) {
      console.log("chunk", chunk);
      carChunks.push(chunk);
    }

    const carBlob = new Blob(carChunks, { type: "application/car" });

    return carBlob;
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

async function uploadToIPFS(carBlob: Blob) {
  // TODO: Not implemented
  // try {
  //   const data = new FormData();
  //   data.append("file", carBlob, "file.car");

  //   const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${process.env.PINATA_API_KEY}`,
  //       "Content-Type": "multipart/form-data",
  //     },
  //     body: data,
  //   });

  //   console.log("res", res);

  //   if (!res.ok) {
  //     throw new Error(`Failed to upload to IPFS: ${res.statusText}`);
  //   }

  //   const resData = await res.json();

  //   if ("IpfsHash" in resData) {
  //     return `ipfs://${resData.IpfsHash}`;
  //   }

  //   throw new Error(`No IPFS hash found in response: ${JSON.stringify(resData)}`);
  // } catch (error) {
  //   console.error("Error uploading to IPFS:", error);
  //   throw error;
  // }
}