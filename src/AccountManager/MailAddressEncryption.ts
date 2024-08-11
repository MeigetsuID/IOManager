import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import Aes from './Aes';

export default class MailAddressEncryption {
    private encTextTable: string[];
    private txtEncode: TextEncoder;
    private txtDecode: TextDecoder;
    private static createTextTable(): string[] {
        const textTable = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'];
        const shuffleArray = (array: string[]) => {
            const cloneArray = [...array];

            for (let i = cloneArray.length - 1; i >= 0; i--) {
                const rand = Math.floor(Math.random() * (i + 1));
                // 配列の要素の順番を入れ替える
                const tmpStorage = cloneArray[i];
                cloneArray[i] = cloneArray[rand];
                cloneArray[rand] = tmpStorage;
            }
            return cloneArray;
        };
        const useText = shuffleArray(textTable).slice(0, 16);
        const table: string[] = [];
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) table.push(useText[i] + useText[j]);
        }
        writeFileSync('./system/account/emailenc.csv', table.join(','));
        return table;
    }
    constructor(private AESMgr: Aes) {
        this.encTextTable = existsSync('./system/account/emailenc.csv')
            ? readFileSync('./system/account/emailenc.csv', 'utf-8').split(',')
            : MailAddressEncryption.createTextTable();
        this.txtEncode = new TextEncoder();
        this.txtDecode = new TextDecoder();
    }
    private toByte(text: string): number[] {
        return Array.from(this.txtEncode.encode(text));
    }
    public encrypt(email: string) {
        const positionRecord = {
            len: email.length,
        };
        [...email].forEach((char, index) => {
            if (!positionRecord[char]) positionRecord[char] = [];
            positionRecord[char].push(index);
        });
        const jsonText = JSON.stringify(positionRecord);
        return this.AESMgr.encrypt(
            this.toByte(jsonText)
                .map((byteVal: number) => this.encTextTable[byteVal])
                .join('')
        );
    }
    public decrypt(encryptedEmail: string) {
        const textArr = this.AESMgr.decrypt(encryptedEmail).match(/.{2}/g);
        if (textArr === null) throw new Error('Invalid encrypted email');
        const byteNumArr = textArr.map(text => this.encTextTable.indexOf(text));
        if (byteNumArr.includes(-1)) throw new Error('Invalid encrypted email');
        const byteArr = new Uint8Array(byteNumArr);
        const json = JSON.parse(this.txtDecode.decode(byteArr));
        const MailAddressTextArr = new Array(json.len);
        Object.keys(json).forEach(char => {
            json[char].forEach(index => {
                MailAddressTextArr[index] = char;
            });
        });
        return MailAddressTextArr.join('');
    }
}
