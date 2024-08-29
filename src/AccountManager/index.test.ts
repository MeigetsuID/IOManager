import * as mysql from 'mysql2';
import { promisify } from 'util';
import AccountManager from '.';

describe('Account Manager All Test', () => {
    const Account = new AccountManager();
    beforeAll(async () => {
        const dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'root',
        };
        const checkMariaDBConnection = async () => {
            const connection = mysql.createConnection(dbConfig);
            const connect = promisify(connection.connect.bind(connection));
            try {
                await connect();
                connection.end();
            } catch (error) {
                setTimeout(checkMariaDBConnection, 1000); // 1秒ごとに再試行
            }
        };
        return await checkMariaDBConnection();
    });
    test('Get Account/System ID/Found', async () => {
        const AccountInfo = await Account.SGetAccount('4010404006753');
        const Expect = {
            id: '4010404006753',
            user_id: 'meigetsu2020',
            name: '明月',
            mailaddress: 'info@mail.meigetsu.jp',
            account_type: 0,
        };
        expect(AccountInfo).toStrictEqual(Expect);
    });

    test('Get Account/System ID/Not Found', async () => {
        const AccountInfo = await Account.SGetAccount('1000011000005');
        expect(AccountInfo).toBe(null);
    });

    test('Get Account/User ID/Found', async () => {
        const AccountInfo = await Account.GetAccount('meigetsu2020');
        const Expect = {
            user_id: 'meigetsu2020',
            name: '明月',
            account_type: 0,
        };
        expect(AccountInfo).toStrictEqual(Expect);
    });

    test('Get Account/User ID/Not Found', async () => {
        const AccountInfo = await Account.GetAccount('meigetsu2021');
        expect(AccountInfo).toBe(null);
    });

    test('Get Account/Sign In/System ID/OK', async () => {
        const AccountInfo = await Account.SignIn('4010404006753', 'password01');
        expect(AccountInfo).toBe('4010404006753');
    });

    test('Get Account/Sign In/User ID/OK', async () => {
        const AccountInfo = await Account.SignIn('meigetsu2020', 'password01');
        expect(AccountInfo).toBe('4010404006753');
    });

    test('Get Account/Sign In/Mail Address/OK', async () => {
        const AccountInfo = await Account.SignIn('info@mail.meigetsu.jp', 'password01');
        expect(AccountInfo).toBe('4010404006753');
    });

    test('Get Account/Sign In/System ID/Not Found', async () => {
        const AccountInfo = await Account.SignIn('1000011000005', 'password01');
        expect(AccountInfo).toBe(null);
    });

    test('Get Account/Sign In/User ID/Not Found', async () => {
        const AccountInfo = await Account.SignIn('meigetsu2021', 'password01');
        expect(AccountInfo).toBe(null);
    });

    test('Get Account/Sign In/Mail Address/Not Found', async () => {
        const AccountInfo = await Account.SignIn('info1@mail.meigetsu.jp', 'password01');
        expect(AccountInfo).toBe(null);
    });

    test('Create Account', async () => {
        const AccountInfo = {
            id: '5000011000001',
            user_id: 'shugiin',
            name: '衆議院',
            mailaddress: 'shugiin@example.com',
            password: 'password01',
            account_type: 0,
        };
        await Account.CreateAccount(AccountInfo);
        const Check = await Account.SGetAccount('5000011000001');
        const Expect = {
            id: '5000011000001',
            user_id: 'shugiin',
            name: '衆議院',
            mailaddress: 'shugiin@example.com',
            account_type: 0,
        };
        expect(Check).toStrictEqual(Expect);
    });

    test('Update Account/OK', async () => {
        const SystemID = '1234567890123';
        const AccountInfo = {
            id: SystemID,
            user_id: 'updatetest001',
            name: '更新テスト001',
            mailaddress: 'updatetest001@mail.meigetsu.jp',
            password: 'password01',
            account_type: 3
        };
        await Account.CreateAccount(AccountInfo);
        const CheckRes = await Account.UpdateAccount(SystemID, { user_id: 'updatetest011', name: '更新テスト011' });
        const CheckDB = await Account.SGetAccount(SystemID);
        const Expect = {
            id: SystemID,
            user_id: 'updatetest011',
            name: '更新テスト011',
            mailaddress: 'updatetest001@mail.meigetsu.jp',
            account_type: 3
        };
        expect(CheckRes).toStrictEqual(Expect);
        expect(CheckDB).toStrictEqual(Expect);
    });

    test('Update Account/Not Found', async () => {
        const Res = await Account.UpdateAccount('9876543210987', { user_id: 'updatetest012' });
        expect(Res).toBe(null);
    });

    test('Update Account/Empty Key', async () => {
        await expect(Account.UpdateAccount('4010404006753', {})).rejects.toThrow('Update information is empty.');
    });

    test('Delete Account/OK', async () => {
        const SystemID = '1234567890124';
        const AccountInfo = {
            id: SystemID,
            user_id: 'deletetest001',
            name: '削除テスト001',
            mailaddress: 'deletetest001@mail.meigetsu.jp',
            password: 'password01',
            account_type: 4
        };
        await Account.CreateAccount(AccountInfo);
        const CheckRes = await Account.DeleteAccount(SystemID);
        const CheckDB = await Account.SGetAccount(SystemID);
        expect(CheckRes).toBe(true);
        expect(CheckDB).toBe(null);
    });

    test('Delete Account/Not Found', async () => {
        const Res = await Account.DeleteAccount('9876543210987');
        expect(Res).toBe(false);
    });
});
