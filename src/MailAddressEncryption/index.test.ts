import { existsSync, unlinkSync } from 'fs';
import MailAddressEncryption from '.';

test('Encryption Table Generation', () => {
    new MailAddressEncryption('./system/account/emailenc.test.csv');
    expect(existsSync('./system/account/emailenc.test.csv')).toBe(true);
    unlinkSync('./system/account/emailenc.test.csv');
});

test('Mail Address Encryption', async () => {
    const mailEnc = new MailAddressEncryption();
    const encryptedMailAddress = mailEnc.encrypt('hello@mail.meigetsu.jp');
    expect(mailEnc.decrypt(encryptedMailAddress)).toBe('hello@mail.meigetsu.jp');
});

test('Mail Address Decryption/AES Decrypted Text Error 1', async () => {
    const mailEnc = new MailAddressEncryption();
    expect(() =>
        mailEnc.decrypt(
            '3b19d4129fcc25905ccd5a423efb144b092f409160f561aad37ff3d59766ec95fbdf49b0bbad2a8db92142c8761dd60b'
        )
    ).toThrow('Invalid encrypted email');
});

test('Mail Address Decryption/AES Decrypted Text Error 2', async () => {
    const mailEnc = new MailAddressEncryption();
    expect(() =>
        mailEnc.decrypt(
            '3b19d4129fcc25905ccd5a423efb144b092f409160f561aad37ff3d59766ec9597df46fb70e92ca78889db920c9f5d19'
        )
    ).toThrow('Invalid encrypted email');
});
