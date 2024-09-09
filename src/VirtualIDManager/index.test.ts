import VirtualIDManager, { CreateVirtualIDText } from '.';
import { CreateAppID } from '../ApplicationManager';
const SystemID = '4010404006753';

describe('Virtual ID Manager Sub Module Test', () => {
    test('CreateVirtualIDText', () => {
        expect(CreateVirtualIDText()).toMatch(/^vid-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    });
});

describe('Virtual ID Manager Test', () => {
    const VirtualID = new VirtualIDManager();
    test('Get Virtual ID', async () => {
        const AppID = CreateAppID();
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, SystemID);
        expect(IssuedVirtualID).toMatch(/^vid-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
        const Result = await VirtualID.GetVirtualID(AppID, SystemID);
        expect(Result).toBe(IssuedVirtualID);
    });

    test('Delete App', async () => {
        const AppID = CreateAppID();
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, SystemID);
        const Result = await VirtualID.DeleteApp(AppID);
        expect(Result).toBe(true);
        const Result2 = await VirtualID.GetVirtualID(AppID, SystemID);
        expect(Result2).not.toBe(IssuedVirtualID);
    });

    test('Delete Account', async () => {
        const AppID = CreateAppID();
        const DelTestSystemID = '3010404006753';
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, DelTestSystemID);
        const Result = await VirtualID.DeleteAccount(DelTestSystemID);
        expect(Result).toBe(true);
        const Result2 = await VirtualID.GetVirtualID(AppID, DelTestSystemID);
        expect(Result2).not.toBe(IssuedVirtualID);
    });
});
