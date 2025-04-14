import CryptoJS from "crypto-js";

const encryptionKey = process.env.REACT_APP_ENCRYPTION_SECRET_KEY || '';

const encryptData = (data: any) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();

};

export default encryptData;
