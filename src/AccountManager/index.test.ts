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
});
