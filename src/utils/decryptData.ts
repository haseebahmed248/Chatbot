import CryptoJS from "crypto-js";

const encryptionKey = process.env.REACT_APP_ENCRYPTION_SECRET_KEY || '';

const decryptData = (encryptedData: any) => {
  if (!encryptionKey) {
    throw new Error("Encryption key is not defined");
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

export default decryptData;
