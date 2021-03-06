import * as crypto from 'crypto';


const ENC_KEY = 'e06f1086e5f819655c630136abdbe77ecd3ec30bf9bdbe51da8cba3db21f287e';
const ENCRYPTION_ALGO = 'aes-256-gcm';


export interface EncryptedData {
  iv: string;
  data: string;
}

export class CryptoService {
  static encrypt(data: string) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(ENCRYPTION_ALGO, Buffer.from(ENC_KEY as string, 'hex'), iv);
    let encryptedData = cipher.update(data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    return {iv: iv.toString('hex'), encryptedData: encryptedData.toString('hex')};
  }

  static decrypt(encryptedData: EncryptedData) {
    let iv = Buffer.from(encryptedData.iv, 'hex');
    const encryptedText = Buffer.from(encryptedData.data, 'hex');
    let decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, Buffer.from(ENC_KEY as string, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    return Buffer.from(decrypted).toString();
  }

  static hashingData(data: string, pepper: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedData = crypto.pbkdf2Sync(data, salt + pepper, 1000, 64, 'sha512').toString('hex');
    return {salt, hashedData};
  }

}
