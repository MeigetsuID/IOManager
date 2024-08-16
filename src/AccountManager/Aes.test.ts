import { existsSync, unlinkSync } from 'fs';
import Aes from './Aes';

test('AES Key Auto Creation', () => {
    new Aes('./system/account/aes_auto_creation.dat');
    expect(existsSync('./system/account/aes_auto_creation.dat')).toBe(true);
    unlinkSync('./system/account/aes_auto_creation.dat');
});

test('AES Encryption', () => {
    const aes = new Aes();
    const text = 'test';
    expect(aes.encrypt(text)).toBe('a3ef13ef24baddd815802f87c1e59142');
});

test('AES Decryption', () => {
    const aes = new Aes();
    const text = 'a3ef13ef24baddd815802f87c1e59142';
    expect(aes.decrypt(text)).toBe('test');
});

test('AES Execution Error/Key file is deleted', () => {
    const aes = new Aes('./system/account/aes.del.dat');
    unlinkSync('./system/account/aes.del.dat');
    expect(() => aes.encrypt('test')).toThrow('No encryption key found');
});
