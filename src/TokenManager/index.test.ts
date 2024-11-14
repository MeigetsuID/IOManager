import CreateID from '@meigetsuid/idgenerator';
import TokenManager, { CreateTokenText } from '.';
import AccountManager from '../AccountManager';
import ApplicationManager from '../ApplicationManager';
import VirtualIDManager, { CreateVirtualIDText } from '../VirtualIDManager';
import { generate } from 'randomstring';
const SystemID = '2010404006753';

describe('Access Token Manager Sub Module Test', () => {
    test('Create Access Token Text', () => {
        const TokenText = CreateTokenText();
        expect(TokenText).toMatch(/^[0-9a-zA-Z]{256}$/);
    });
});

describe('Token Manager Test', () => {
    const Token = new TokenManager('supervisor');
    const VirtualID = new VirtualIDManager('supervisor');
    const AppMgr = new ApplicationManager('supervisor');
    let AppID = '';
    beforeAll(async () => {
        await AppMgr.CreateApp(SystemID, {
            name: 'TestApp',
            description: 'Test Application',
            redirect_uri: ['http://localhost'],
            privacy_policy: 'http://localhost/privacy',
            terms_of_service: 'http://localhost/terms',
            public: false,
        }).then(data => {
            if (!data) throw new Error('Developer is not found.');
            AppID = data.client_id;
        });
    });
    describe('Create Token', () => {
        test('Create Token', async () => {
            const Now = new Date();
            Now.setMilliseconds(0);
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], Now);
            expect(TokenInfo).toStrictEqual({
                token_type: 'Bearer',
                access_token: expect.stringMatching(/^[0-9a-zA-Z]{256}$/),
                refresh_token: expect.stringMatching(/^[0-9a-zA-Z]{256}$/),
                expires_at: {
                    access_token: new Date(Now.getTime() + 180 * 60000),
                    refresh_token: new Date(Now.getTime() + 10080 * 60000),
                },
            });
        });
        test('Invalid Virtual ID', async () => {
            const TokenInfo = await Token.CreateToken(CreateVirtualIDText(), ['supervisor']);
            expect(TokenInfo).toBeNull();
        });
    });
    describe('Check Access Token', () => {
        test('Supervisor Cover Check', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBe(VID);
        });

        test('OK', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, [
                'user.read',
                'user.write',
                'application.read',
                'application.write',
            ]);
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBe(VID);
        });

        test('Scope NG', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['user.read', 'application.read']);
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBeNull();
        });

        test('No Scope Reserve', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const Check = await Token.Check(TokenInfo.access_token, []);
            expect(Check).toBe(VID);
        });

        test('Invalid Token Text', async () => {
            const Check = await Token.Check('NGToken', ['user.read', 'user.write']);
            expect(Check).toBeNull();
        });

        test('Expired Token', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], new Date(), { access_token: -1 });
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBeNull();
        });
    });

    describe('Refresh Token', () => {
        test('OK', async () => {
            const Now = new Date();
            Now.setMilliseconds(0);
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], Now);
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const RefreshResult = await Token.Refresh(TokenInfo.refresh_token, Now);
            if (!RefreshResult) throw new Error('Refresh Failed');
            expect(RefreshResult).toStrictEqual({
                token_type: 'Bearer',
                access_token: expect.stringMatching(/^[0-9a-zA-Z]{256}$/),
                refresh_token: expect.stringMatching(/^[0-9a-zA-Z]{256}$/),
                expires_at: {
                    access_token: new Date(Now.getTime() + 180 * 60000),
                    refresh_token: new Date(Now.getTime() + 10080 * 60000),
                },
            });
            expect(RefreshResult.access_token).not.toBe(TokenInfo.access_token);
            expect(RefreshResult.refresh_token).not.toBe(TokenInfo.refresh_token);
        });

        test('Expired Token', async () => {
            const Now = new Date();
            Now.setMilliseconds(0);
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], Now, { refresh_token: -1 });
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const RefreshResult = await Token.Refresh(TokenInfo.refresh_token, Now);
            expect(RefreshResult).toBeNull();
        });

        test('Invalid Token Text', async () => {
            const RefreshResult = await Token.Refresh('NGToken');
            expect(RefreshResult).toBeNull();
        });
    });

    describe('Revoke Token', () => {
        test('OK', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
            if (!TokenInfo) throw new Error('Invalid Virtual ID.');
            const Revoke = await Token.Revoke(TokenInfo.access_token);
            expect(Revoke).toBe(true);
            const RefreshResult = await Token.Refresh(TokenInfo.refresh_token);
            expect(RefreshResult).toBeNull();
        });

        test('NG', async () => {
            const Revoke = await Token.Revoke('NGToken');
            expect(Revoke).toBe(false);
        });
    });

    describe('Revoke All', () => {
        test('Single Virtual ID', async () => {
            const App = await AppMgr.CreateApp(SystemID, {
                name: 'TestApp',
                description: 'Test Application',
                redirect_uri: ['http://localhost'],
                privacy_policy: 'http://localhost/privacy',
                terms_of_service: 'http://localhost/terms',
                public: false,
            });
            if (!App) throw new Error('Invalid Developer ID');
            const VID = await VirtualID.GetVirtualID(App.client_id, SystemID);
            if (!VID) throw new Error('Invalid AppID or SystemID.');
            const CreateTokens = [...Array(10)].map(() => Token.CreateToken(VID, ['supervisor']));
            const TokenRecords = await Promise.all(CreateTokens);
            const RevokeResult = await Token.RevokeAll(VID);
            expect(RevokeResult).toBe(true);
            const CheckTokens = TokenRecords.map(token => {
                if (!token) throw new Error('Invalid Virtual ID.');
                return Token.Check(token.access_token, []);
            });
            expect(await Promise.all(CheckTokens)).toStrictEqual(Array(10).fill(null));
        });

        test('Multiple Virtual ID', async () => {
            const Account = new AccountManager('supervisor');
            const App = await AppMgr.CreateApp(SystemID, {
                name: 'TestApp',
                description: 'Test Application',
                redirect_uri: ['http://localhost'],
                privacy_policy: 'http://localhost/privacy',
                terms_of_service: 'http://localhost/terms',
                public: false,
            });
            if (!App) throw new Error('Invalid Developer ID');
            const CreateVIDs = [...Array(10)].map(async () => {
                const UserID = generate({ length: 20, charset: 'alphanumeric' });
                const GeneratedSystemID = await CreateID(UserID);
                await Account.CreateAccount({
                    id: GeneratedSystemID,
                    user_id: UserID,
                    name: 'トークンマネージャーテスト',
                    mailaddress: `${generate({ length: 10, charset: 'alphanumeric' })}@mail.meigetsu.jp`,
                    password: generate({ length: 20, charset: 'alphanumeric' }),
                    account_type: 0,
                });
                return await VirtualID.GetVirtualID(App.client_id, GeneratedSystemID);
            });
            const VirtualIDs = await Promise.all(CreateVIDs);
            const CreateTokens = VirtualIDs.map(vid => {
                if (!vid) throw new Error('Invalid AppID or SystemID.');
                return Token.CreateToken(vid, ['supervisor']);
            });
            const TokenRecords = await Promise.all(CreateTokens);
            const RevokeResult = await Token.RevokeAll(VirtualIDs.filter(vid => vid !== null) as string[]);
            expect(RevokeResult).toBe(true);
            const CheckTokens = TokenRecords.map(token => {
                if (!token) throw new Error('Invalid Virtual ID.');
                return Token.Check(token.access_token, []);
            });
            expect(await Promise.all(CheckTokens)).toStrictEqual(Array(10).fill(null));
        });

        test('No Token', async () => {
            expect(await Token.RevokeAll(CreateVirtualIDText())).toBe(false);
        });
    });

    describe('Expired Token All Remove', () => {
        test('10 Token Check', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const CreateExpiredTokens = [...Array(10)].map(() => {
                if (!VID) throw new Error('Invalid AppID or SystemID.');
                return Token.CreateToken(VID, ['supervisor'], new Date(), { refresh_token: -1 });
            });
            const TokenRecords = await Promise.all(CreateExpiredTokens);
            await Token.RemoveExpiredTokens();
            const CheckTokens = TokenRecords.map(token => {
                if (!token) throw new Error('Invalid Virtual ID.');
                return Token.Check(token.access_token, []);
            });
            expect(await Promise.all(CheckTokens)).toStrictEqual(Array(10).fill(null));
        });
    });

    describe('Revoke For Delete', () => {
        const AccountMgr = new AccountManager('supervisor');
        const CacheInfo = {
            SystemID: '',
            AppID: '',
            AccessToken: {
                ForSelf: '',
                ForOther: '',
            },
        };
        beforeAll(async () => {
            CacheInfo.SystemID = await CreateID(generate({ length: 20, charset: 'alphanumeric' }));
            await AccountMgr.CreateAccount({
                id: CacheInfo.SystemID,
                user_id: generate({ length: 20, charset: 'alphanumeric' }),
                name: 'トークンマネージャーテスト',
                mailaddress: `${generate({ length: 10, charset: 'alphanumeric' })}@mail.meigetsu.jp`,
                password: generate({ length: 20, charset: 'alphanumeric' }),
                account_type: 0,
            });
            await AppMgr.CreateApp(CacheInfo.SystemID, {
                name: 'TestApp',
                description: 'Test Application',
                redirect_uri: ['http://localhost'],
                privacy_policy: 'http://localhost/privacy',
                terms_of_service: 'http://localhost/terms',
                public: false,
            }).then(data => {
                if (!data) throw new Error('Developer is not found.');
                CacheInfo.AppID = data.client_id;
            });
            const SelfVID = await VirtualID.GetVirtualID(CacheInfo.AppID, CacheInfo.SystemID);
            const OtherVID = await VirtualID.GetVirtualID(CacheInfo.AppID, '4010404006753');
            if (!SelfVID || !OtherVID) throw new Error('Virtual ID Issue Error.');
            await Token.CreateToken(SelfVID, ['supervisor']).then(data => {
                if (!data) throw new Error('Token Issue Error.');
                CacheInfo.AccessToken.ForSelf = data.access_token;
            });
            await Token.CreateToken(OtherVID, ['supervisor']).then(data => {
                if (!data) throw new Error('Token Issue Error.');
                CacheInfo.AccessToken.ForOther = data.access_token;
            });
        });
        test('Check', async () => {
            await Token.RevokeForDelete(CacheInfo.SystemID).then(result => expect(result).toBeTruthy());
            await Token.Check(CacheInfo.AccessToken.ForSelf, []).then(data => expect(data).toBeNull());
            await Token.Check(CacheInfo.AccessToken.ForOther, []).then(data => expect(data).toBeNull());
        });
    });
});
