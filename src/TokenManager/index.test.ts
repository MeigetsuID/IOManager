import TokenManager, { CreateTokenText } from '.';
import { CreateAppID } from '../ApplicationManager';
import VirtualIDManager from '../VirtualIDManager';
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
    test('Create Token', async () => {
        const Now = new Date();
        Now.setMilliseconds(0);
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
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

    test('Check Access Token/Supervisor Cover Check', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
        const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
        expect(Check).toBe(VID);
    });

    test('Check Access Token/OK', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, [
            'user.read',
            'user.write',
            'application.read',
            'application.write',
        ]);
        const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
        expect(Check).toBe(VID);
    });

    test('Check Access Token/Scope NG', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, ['user.read', 'application.read']);
        const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
        expect(Check).toBeNull();
    });

    test('Check Access Token/No Scope Reserve', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
        const Check = await Token.Check(TokenInfo.access_token, []);
        expect(Check).toBe(VID);
    });

    test('Check Access Token/Invalid Token Text', async () => {
        const Check = await Token.Check('NGToken', ['user.read', 'user.write']);
        expect(Check).toBeNull();
    });

    test('Check Access Token/Expired Token', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, ['supervisor'], new Date(), { access_token: -1 });
        const Check = await Token.Check(TokenInfo.access_token, ['user.read', 'user.write']);
        expect(Check).toBeNull();
    });

    test('Refresh Token/OK', async () => {
        const Now = new Date();
        Now.setMilliseconds(0);
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
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

    test('Refresh Token/Expired Token', async () => {
        const Now = new Date();
        Now.setMilliseconds(0);
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, ['supervisor'], Now, { refresh_token: -1 });
        const RefreshResult = await Token.Refresh(TokenInfo.refresh_token, Now);
        expect(RefreshResult).toBeNull();
    });

    test('Refresh Token/Invalid Token Text', async () => {
        const RefreshResult = await Token.Refresh('NGToken');
        expect(RefreshResult).toBeNull();
    });

    test('Revoke Access Token/OK', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await Token.CreateToken(VID, ['supervisor']);
        const Revoke = await Token.Revoke(TokenInfo.access_token);
        expect(Revoke).toBe(true);
    });

    test('Revoke Access Token/NG', async () => {
        const Revoke = await Token.Revoke('NGToken');
        expect(Revoke).toBe(false);
    });
});