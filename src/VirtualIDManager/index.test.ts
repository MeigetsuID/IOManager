import { generate } from 'randomstring';
import VirtualIDManager, { CreateVirtualIDText } from '.';
import AccountManager from '../AccountManager';
import ApplicationManager from '../ApplicationManager';
import { v4 as uuidv4 } from 'uuid';
import CreateID from '@meigetsuid/idgenerator';
const SystemID = '4010404006753';

describe('Virtual ID Manager Sub Module Test', () => {
    test('CreateVirtualIDText', () => {
        expect(CreateVirtualIDText()).toMatch(/^vid-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    });
});

describe('Virtual ID Manager Test', () => {
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
            if (!data) throw new Error('Invalid Developer ID');
            AppID = data.client_id;
        });
    });
    test('Get Virtual ID/OK', async () => {
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, SystemID);
        expect(IssuedVirtualID).toMatch(/^vid-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
        const Result = await VirtualID.GetVirtualID(AppID, SystemID);
        expect(Result).toBe(IssuedVirtualID);
    });

    test('Get Virtual ID/App Not Found', async () => {
        const Result = await VirtualID.GetVirtualID('appid-notfound', SystemID);
        expect(Result).toBe(null);
    });

    test('Get Virtual ID/Account Not Found', async () => {
        const Result = await VirtualID.GetVirtualID(AppID, 'systemid-notfound');
        expect(Result).toBe(null);
    });

    test('Get Linked Information/OK', async () => {
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, SystemID);
        if (!IssuedVirtualID) throw new Error('Invalid AppID or SystemID');
        const Expected = {
            app: AppID,
            id: SystemID,
            user_id: 'meigetsu2020',
            name: '明月',
            mailaddress: 'info@mail.meigetsu.jp',
            account_type: 0,
        };
        const Result = await VirtualID.GetLinkedInformation(IssuedVirtualID);
        expect(Result).toStrictEqual(Expected);
    });

    test('Get Linked Information/Not Found', async () => {
        const Result = await VirtualID.GetLinkedInformation(`vid-${uuidv4().replace(/-/g, '')}`);
        expect(Result).toBe(null);
    });

    test('Get All Virtual ID/From System ID', async () => {
        const Apps = [...Array(10)].map(() =>
            AppMgr.CreateApp(SystemID, {
                name: 'TestApp',
                description: 'Test Application',
                redirect_uri: ['http://localhost'],
                privacy_policy: 'http://localhost/privacy',
                terms_of_service: 'http://localhost/terms',
                public: false,
            })
        );
        const AppIDs = await Promise.all(Apps).then(data => {
            if (data.some(app => !app)) throw new Error('Invalid Developer ID');
            return data.map(app => (app as { client_id: string, client_secret: string }).client_id);
        });
        const VirtualIDs = await Promise.all(AppIDs.map(app => VirtualID.GetVirtualID(app, '3010404006752')));
        const Result = await VirtualID.GetAllVirtualIDBySystemID('3010404006752');
        expect(Result.sort()).toStrictEqual(VirtualIDs.sort());
    });

    test('Get All Virtual ID/From App ID', async () => {
        const AccountMgr = new AccountManager();
        const AppInfo = await AppMgr.CreateApp(SystemID, {
            name: 'TestApp',
            description: 'Test Application',
            redirect_uri: ['http://localhost'],
            privacy_policy: 'http://localhost/privacy',
            terms_of_service: 'http://localhost/terms',
            public: false,
        });
        if (!AppInfo) throw new Error('Invalid Developer ID');
        const CreateVIDs = [...Array(10)].map(async () => {
            const UserID = generate({ length: 20, charset: 'alphanumeric' });
            const GeneratedSystemID = await CreateID(UserID);
            await AccountMgr.CreateAccount({
                id: GeneratedSystemID,
                user_id: UserID,
                name: '仮想IDマネージャーテスト',
                mailaddress: `${generate({ length: 10, charset: 'alphanumeric' })}@mail.meigetsu.jp`,
                password: generate({ length: 20, charset: 'alphanumeric' }),
                account_type: 0,
            });
            return await VirtualID.GetVirtualID(AppInfo.client_id, GeneratedSystemID);
        });
        const VIDs = await Promise.all(CreateVIDs);
        const Result = await VirtualID.GetAllVirtualIDByAppID(AppInfo.client_id);
        expect(Result.sort()).toStrictEqual(VIDs.sort());
    });

    test('Delete App', async () => {
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, SystemID);
        const Result = await VirtualID.DeleteApp(AppID);
        expect(Result).toBe(true);
        const Result2 = await VirtualID.GetVirtualID(AppID, SystemID);
        expect(Result2).not.toBe(IssuedVirtualID);
    });

    test('Delete Account', async () => {
        const DelTestSystemID = '3010404006753';
        const IssuedVirtualID = await VirtualID.GetVirtualID(AppID, DelTestSystemID);
        const Result = await VirtualID.DeleteAccount(DelTestSystemID);
        expect(Result).toBe(true);
        const Result2 = await VirtualID.GetVirtualID(AppID, DelTestSystemID);
        expect(Result2).not.toBe(IssuedVirtualID);
    });
});
