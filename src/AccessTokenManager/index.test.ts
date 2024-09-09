import AccessTokenManager, { CreateAccessTokenText } from '.';
import { CreateAppID } from '../ApplicationManager';
import VirtualIDManager from '../VirtualIDManager';
const FakeTime = new Date('2024-07-01T00:00:00Z');
const SystemID = '2010404006753';

describe('Access Token Manager Sub Module Test', () => {
    test('Create Access Token Text', () => {
        const TokenText = CreateAccessTokenText();
        expect(TokenText).toMatch(/^[0-9a-zA-Z]{256}$/);
    });
});

describe('Access Token Manager Test', () => {
    const AccessToken = new AccessTokenManager('supervisor');
    const VirtualID = new VirtualIDManager();
    beforeAll(() => {
        Date.now = jest.fn(() => FakeTime.getTime());
    });
    afterAll(() => {
        Date.now = Date.now.bind(globalThis);
    });
    test('Create Access Token', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await AccessToken.CreateAccessToken(VID, ['supervisor']);
        expect(TokenInfo).toStrictEqual({
            token: expect.stringMatching(/^[0-9a-zA-Z]{256}$/),
            expires_at: new Date(FakeTime.getTime() + 10800000),
        });
    });

    test('Check Access Token/Suervisor Cover Check/Return Virtual ID', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await AccessToken.CreateAccessToken(VID, ['supervisor']);
        const TokenText = TokenInfo.token;
        const Check = await AccessToken.Check(TokenText, ['user.read', 'user.write']);
        expect(Check).toBe(VID);
    });

    test('Check Access Token/Suervisor Cover Check/Return System ID', async () => {
        const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
        const TokenInfo = await AccessToken.CreateAccessToken(VID, ['supervisor']);
        const Check = await AccessToken.Check(TokenInfo.token, ['user.read', 'user.write'], true);
        expect(Check).toBe(SystemID);
    });
});
