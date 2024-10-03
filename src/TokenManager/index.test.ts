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
    const VirtualID = new VirtualIDManager();
    const AppMgr = new ApplicationManager();
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
            AppID = data.client_id;
        });
    });
    test('Create Token', async () => {
        const Now = new Date();
        Now.setMilliseconds(0);
        const VID = await VirtualID.GetVirtualID(AppID, SystemID);
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
    describe('Check Access Token', () => {
        test('Supervisor Cover Check', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBe(VID);
        });

        test('OK', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const TokenInfo = await Token.CreateToken(VID, [
                'user.read',
                'user.write',
                'application.read',
                'application.write',
            ]);
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBe(VID);
        });

        test('Scope NG', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const TokenInfo = await Token.CreateToken(VID, ['user.read', 'application.read']);
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBeNull();
        });

        test('No Scope Reserve', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
            const Check = await Token.Check(TokenInfo.access_token, []);
            expect(Check).toBe(VID);
        });

        test('Invalid Token Text', async () => {
            const Check = await Token.Check('NGToken', ['user.read', 'user.write']);
            expect(Check).toBeNull();
        });

        test('Expired Token', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], new Date(), { access_token: -1 });
            const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
            expect(Check).toBeNull();
        });
    });

    describe('Refresh Token', () => {
        test('OK', async () => {
            const Now = new Date();
            Now.setMilliseconds(0);
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], Now);
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
            const TokenInfo = await Token.CreateToken(VID, ['supervisor'], Now, { refresh_token: -1 });
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
            const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
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
            const VID = await VirtualID.GetVirtualID(App.client_id, SystemID);
            const CreateTokens = [...Array(10)].map(() => Token.CreateToken(VID, ['supervisor']));
            const TokenRecords = await Promise.all(CreateTokens);
            const RevokeResult = await Token.RevokeAll(VID);
            expect(RevokeResult).toBe(true);
            const CheckTokens = TokenRecords.map(token => Token.Check(token.access_token, []));
            expect(await Promise.all(CheckTokens)).toStrictEqual(Array(10).fill(null));
        });

        test('Multiple Virtual ID', async () => {
            const Account = new AccountManager();
            const App = await AppMgr.CreateApp(SystemID, {
                name: 'TestApp',
                description: 'Test Application',
                redirect_uri: ['http://localhost'],
                privacy_policy: 'http://localhost/privacy',
                terms_of_service: 'http://localhost/terms',
                public: false,
            });
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
            const CreateTokens = VirtualIDs.map(vid => Token.CreateToken(vid, ['supervisor']));
            const TokenRecords = await Promise.all(CreateTokens);
            const RevokeResult = await Token.RevokeAll(VirtualIDs);
            expect(RevokeResult).toBe(true);
            const CheckTokens = TokenRecords.map(token => Token.Check(token.access_token, []));
            expect(await Promise.all(CheckTokens)).toStrictEqual(Array(10).fill(null));
        });

        test('No Token', async () => {
            expect(await Token.RevokeAll(CreateVirtualIDText())).toBe(false);
        });
    });

    describe('Expired Token All Remove', () => {
        test('10 Token Check', async () => {
            const VID = await VirtualID.GetVirtualID(AppID, SystemID);
            const CreateExpiredTokens = [...Array(10)].map(() =>
                Token.CreateToken(VID, ['supervisor'], new Date(), { refresh_token: -1 })
            );
            const TokenRecords = await Promise.all(CreateExpiredTokens);
            await Token.RemoveExpiredTokens();
            const CheckTokens = TokenRecords.map(token => Token.Check(token.access_token, []));
            expect(await Promise.all(CheckTokens)).toStrictEqual(Array(10).fill(null));
        });
    });
});
