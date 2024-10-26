import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export default class Aes {
    private static readonly algorithm = 'aes-256-cbc';
    private readInitConfig() {
        if (!existsSync(this.keyPath)) throw new Error('No encryption key found');
        const initInfo = JSON.parse(readFileSync(this.keyPath, 'utf-8'));
        return {
            key: Buffer.from(initInfo.key, 'hex'),
            iv: Buffer.from(initInfo.iv, 'hex'),
        };
    }
    private static createKey(keyPath: string) {
        const key = randomBytes(32);
        const iv = randomBytes(16);
        writeFileSync(keyPath, JSON.stringify({ key: key.toString('hex'), iv: iv.toString('hex') }));
        return {
            key: key,
            iv: iv,
        };
    }
    constructor(private keyPath: string = './system/account/aes.dat') {
        if (!existsSync(keyPath)) Aes.createKey(keyPath);
    }
    encrypt(text: string) {
        const { key, iv } = this.readInitConfig();
        const cipher = createCipheriv(Aes.algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);
        return encrypted.toString('hex');
    }
    decrypt(encryptedText: string) {
        const { key, iv } = this.readInitConfig();
        const decipher = createDecipheriv(Aes.algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);
        return decrypted.toString('utf-8');
    }
}
