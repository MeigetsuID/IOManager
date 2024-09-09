import RefreshTokenManager, { CreateRefreshTokenText } from '.';
import { CreateAppID } from '../ApplicationManager';
import VirtualIDManager from '../VirtualIDManager';
const FakeTime = new Date('2024-07-01T00:00:00Z');
const SystemID = '2010404006753';

describe('Refresh Token Manager Sub Module Test', () => {
    test('Create Refresh Token Text', () => {
        const TokenText = CreateRefreshTokenText();
        expect(TokenText).toMatch(/^[0-9a-zA-Z]{256}$/);
    });
});

describe('Refresh Token Manager Test', () => {
    const RefreshToken = new RefreshTokenManager();
    const VirtualID = new VirtualIDManager();
    describe('Use Time Mock', () => {
        beforeAll(() => {
            jest.useFakeTimers({ now: FakeTime.getTime() });
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        test('Create Refresh Token', async () => {
            const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
            const TokenInfo = await RefreshToken.CreateRefreshToken(VID, ['supervisor']);
            expect(TokenInfo).toStrictEqual({
                token: expect.stringMatching(/^[0-9a-zA-Z]{256}$/),
                expires_at: new Date(FakeTime.getTime() + 10080 * 60 * 1000),
            });
        });
    });

    describe('No Time Mock', () => {
        test('Check Refresh Token/OK', async () => {
            const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
            const TokenInfo = await RefreshToken.CreateRefreshToken(VID, ['supervisor']);
            const Check = await RefreshToken.Check(TokenInfo.token);
            expect(Check).toStrictEqual({ virtual_id: VID, scopes: ['supervisor'] });
        });

        test('Check Refresh Token/Invalid Token Text', async () => {
            const Check = await RefreshToken.Check('NGToken');
            expect(Check).toBeNull();
        });

        test('Check Refresh Token/Expired Token', async () => {
            const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
            const TokenInfo = await RefreshToken.CreateRefreshToken(VID, ['supervisor'], 0);
            const Check = await RefreshToken.Check(TokenInfo.token);
            expect(Check).toBeNull();
        });

        test('Revoke Refresh Token/OK', async () => {
            const VID = await VirtualID.GetVirtualID(CreateAppID(), SystemID);
            const TokenInfo = await RefreshToken.CreateRefreshToken(VID, ['supervisor']);
            const Revoke = await RefreshToken.Revoke(TokenInfo.token);
            expect(Revoke).toBe(true);
        });

        test('Revoke Refresh Token/NG', async () => {
            const Revoke = await RefreshToken.Revoke('NGToken');
            expect(Revoke).toBe(false);
        });
    });
});
