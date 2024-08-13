import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export default class Aes {
    private static readonly algorithm = 'aes-256-gcm';
    private static readInitConfig() {
        const initInfo = JSON.parse(readFileSync('./system/account/aes.dat', 'utf-8'));
        return {
            key: Buffer.from(initInfo.key, 'hex'),
            iv: Buffer.from(initInfo.iv, 'hex'),
        };
    }
    private static createKey(keyPath: string) {
        const key = randomBytes(32);
        const iv = randomBytes(12);
        writeFileSync(keyPath, JSON.stringify({ key: key.toString('hex'), iv: iv.toString('hex') }));
        return {
            key: key,
            iv: iv,
        };
    }
    constructor(private keyPath: string) {
        if (!existsSync(keyPath)) Aes.createKey(keyPath);
    }
    encrypt(text: string) {
        /* v8 ignore next */
        if (!existsSync(this.keyPath)) throw new Error('No encryption key found');
        const { key, iv } = Aes.readInitConfig();
        const cipher = createCipheriv(Aes.algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);
        return encrypted.toString('hex');
    }
    decrypt(encryptedText: string) {
        /* v8 ignore next */
        if (!existsSync(this.keyPath)) throw new Error('No encryption key found');
        const { key, iv } = Aes.readInitConfig();
        const decipher = createDecipheriv(Aes.algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);
        return decrypted.toString('utf-8');
    }
}
