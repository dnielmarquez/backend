import { PrismaClient, User } from "@prisma/client";
import Web3 from "web3";
import Axios from "axios";
import FormData from "form-data";
import fs, { readFileSync } from "fs";

const contractABI = JSON.parse(
  readFileSync("./src/contracts/SitiStorage.json", "utf-8")
);
const prisma = new PrismaClient();
const JWT = process.env.PINATA_JWT;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const web3 = new Web3("https://data-seed-prebsc-1-s1.bnbchain.org:8545");
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

export const Web3Service = {
  uploadFileToBlockchain: async (req: any, res: any) => {
    const allowedExtensions = ["pdf"];
    const extension = req.file.originalname.split(".").pop();
    const name = req.file.originalname.split(".").shift();

    if (!allowedExtensions.includes(extension)) {
      return res
        .status(400)
        .send("Supported file format is PNG, JPG, JPEG, MP3, or MP4");
    }
    if (!req.file) {
      return res.status(400).send("No file was provided");
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // getUTCMonth() retorna meses de 0-11
    const day = now.getUTCDate();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();

    // Añadiendo ceros iniciales donde sea necesario para cumplir con el formato deseado
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    const currentDateTimeUTC = `${formattedDate} ${formattedTime} UTC`;

    const formData = new FormData();

    formData.append("file", req.file.buffer, req.file.originalname);

    const pinataMetadata = JSON.stringify({
      name,
      dateUploaded: currentDateTimeUTC,
      fileFormat: extension,
    });
    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append("pinataOptions", pinataOptions);

    const response = await Axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${JWT}`,
          ...formData.getHeaders(),
        },
      }
    );
    const ipfsHash = response.data.IpfsHash;

    const account = web3.eth.accounts.privateKeyToAccount(
      `0x${WALLET_PRIVATE_KEY}`
    );

    web3.eth.accounts.wallet.add(account);
    const data = contract.methods
      .addFile(
        ipfsHash,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        currentDateTimeUTC,
        "pdf"
      )
      .encodeABI();
    // Get the nonce for the account
    const nonce = await web3.eth.getTransactionCount(account.address, "latest");

    // Estimar el gas necesario para la transacción
    const estimatedGas = await web3.eth.estimateGas({
      from: account.address,
      to: CONTRACT_ADDRESS,
      data: data,
      nonce: nonce,
    });

    // Obtener el precio actual del gas
    const gasPrice = await web3.eth.getGasPrice();

    // Aumentar un poco el límite de gas para asegurarnos de que la transacción se complete
    const gasLimit = (BigInt(estimatedGas) * BigInt(12)) / BigInt(10);
    console.log("Tx Data", {
      from: account.address,
      to: CONTRACT_ADDRESS,
      nonce: nonce,
      gas: gasLimit, // Usar el límite de gas calculado
      gasPrice: gasPrice,
      data: data,
    });
    // Crear la transacción con el gas estimado
    const tx = {
      from: account.address,
      to: CONTRACT_ADDRESS,
      nonce: nonce,
      gas: gasLimit, // Usar el límite de gas calculado
      gasPrice: gasPrice,
      data: data,
    };

    // Firmar y enviar la transacción
    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );
    console.log("Receipt", receipt);
    return { ipfsHash: ipfsHash, txHash: receipt.transactionHash };
  },
};
