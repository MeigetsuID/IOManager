import { existsSync } from 'node:fs';
import Aes from './Aes';
import { readCSV, writeCSV } from 'nodeeasyfileio';

export default class MailAddressEncryption {
    private encTextTable: string[];
    private txtEncode: TextEncoder;
    private txtDecode: TextDecoder;
    private static createTextTable(textTableFilePath: string): string[] {
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
        writeCSV(textTableFilePath, table);
        return table;
    }
    constructor(
        textTableFilePath: string = './system/account/emailenc.csv',
        private AESMgr: Aes = new Aes('./system/account/aes.dat')
    ) {
        this.encTextTable = existsSync(textTableFilePath)
            ? readCSV(textTableFilePath).flatMap((row: string[]) => row)
            : MailAddressEncryption.createTextTable(textTableFilePath);
        this.txtEncode = new TextEncoder();
        this.txtDecode = new TextDecoder();
    }
    private toByte(text: string): number[] {
        return Array.from(this.txtEncode.encode(text));
    }
    public encrypt(email: string) {
        const toJson = (email: string) => {
            const mailSplitData = email.split('@');
            const positionRecord = {
                len: mailSplitData[0].length,
                domain: mailSplitData[1],
                positions: {},
            };
            [...mailSplitData[0]].forEach((char, index) => {
                if (!positionRecord.positions[char]) positionRecord.positions[char] = [];
                positionRecord.positions[char].push(index);
            });
            return positionRecord;
        };
        const convertedEmail = toJson(email);
        const jsonText = JSON.stringify(convertedEmail);
        return this.AESMgr.encrypt(
            this.toByte(jsonText)
                .map((byteVal: number) => this.encTextTable[byteVal])
                .join('')
        );
    }
    public decrypt(encryptedEmail: string) {
        const decryptedText = this.AESMgr.decrypt(encryptedEmail);
        const textArr = decryptedText.match(/.{2}/g);
        if (textArr === null || textArr.length !== decryptedText.length / 2) throw new Error('Invalid encrypted email');
        const byteNumArr = textArr.map(text => this.encTextTable.indexOf(text));
        if (byteNumArr.includes(-1)) throw new Error('Invalid encrypted email');
        const byteArr = new Uint8Array(byteNumArr);
        const json = JSON.parse(this.txtDecode.decode(byteArr));
        const MailAddressTextArr = new Array<string>(json.len);
        Object.keys(json.positions).forEach(char => {
            json.positions[char].forEach((index: number) => {
                MailAddressTextArr[index] = char;
            });
        });
        return MailAddressTextArr.join('') + `@${json.domain}`;
    }
}
