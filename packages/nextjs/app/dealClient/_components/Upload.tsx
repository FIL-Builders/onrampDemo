import uploadToIPFS from "./Pinata";
import { CarWriter } from "@ipld/car";
import { CommP } from "@web3-storage/data-segment";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";

export const GetFileDealParams = () => {
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("file", file);
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
