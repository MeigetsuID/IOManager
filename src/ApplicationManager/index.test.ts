import ApplicationManager, { CreateAppID, CreateAppSecret } from '.';
import { v4 as uuidv4 } from 'uuid';
import pkg from '@json-spec/core';
const { spec, object, isValid } = pkg;
const AppIDReg = /^app-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/;
const AppSecretReg = /^[0-9a-zA-Z]{64}$/;

const cAppIDAndSecretSpec = object({
    required: {
        client_id: spec(i => AppIDReg.test(i)),
        client_secret: spec(i => AppSecretReg.test(i)),
    }
});

describe('Application Manager Sub Module Test', () => {
    test('Create Application ID', () => {
        const AppID = CreateAppID();
        expect(AppID).toMatch(AppIDReg);
    });

    test('Create Application Secret', () => {
        const AppSecret = CreateAppSecret();
        expect(AppSecret).toMatch(AppSecretReg);
    });
});

describe('Application Manager All Test', () => {
    const DeveloperID = '4010404006753';
    const Application = new ApplicationManager();
    test('Create Application', async () => {
        const ApplicationInfo = await Application.CreateApp(DeveloperID, {
            name: 'Test Application',
            description: 'This is a test application.',
            redirect_uri: ['https://example.com'],
            privacy_policy: 'https://example.com/privacy_policy',
            terms_of_service: 'https://example.com/terms_of_service',
            public: false,
        });
        expect(isValid(cAppIDAndSecretSpec, ApplicationInfo)).toBe(true);
    });

    test('Get Application/OK', async () => {
        const AppBaseInfo = {
            name: 'Test Application',
            description: 'This is a test application.',
            redirect_uri: ['https://example.com'],
            privacy_policy: 'https://example.com/privacy_policy',
            terms_of_service: 'https://example.com/terms_of_service',
            public: false,
        };
        const Expect = {
            name: 'Test Application',
            description: 'This is a test application.',
            redirect_uri: ['https://example.com'],
            privacy_policy: 'https://example.com/privacy_policy',
            terms_of_service: 'https://example.com/terms_of_service',
            developer: '明月',
        };
        const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
        const ApplicationInfo = await Application.GetApp(AppIDAndSecret.client_id);
        expect(ApplicationInfo).toStrictEqual(Expect);
    });

    test('Get Application/Not Found', async () => {
        const ApplicationInfo = await Application.GetApp(`app-${uuidv4()}`);
        expect(ApplicationInfo).toBe(null);
    });

    test('Get Applications', async () => {
        const Apps = [
            {
                name: 'App 1',
                description: 'This is application 1.',
                redirect_uri: ['https://example.com/app1'],
                privacy_policy: 'https://example.com/app1/privacy_policy',
                terms_of_service: 'https://example.com/app1/terms_of_service',
                public: false,
            },
        ];
        const CreateApps = Apps.map(async app => {
            const AppInfo = await Application.CreateApp('4010404006743', app);
            return {
                client_id: AppInfo.client_id,
                name: app.name,
                description: app.description,
                redirect_uri: app.redirect_uri,
                privacy_policy: app.privacy_policy,
                terms_of_service: app.terms_of_service,
                developer: 'アプリケーションマネージャーテスト用アカウント',
            };
        });
        const Expect = await Promise.all(CreateApps);
        const ApplicationInfos = await Application.GetApps('4010404006743');
        expect(ApplicationInfos).toStrictEqual(Expect);
    });

    test('Get Applications/Not Found', async () => {
        const ApplicationInfos = await Application.GetApps('4010404006744');
        expect(ApplicationInfos).toStrictEqual([]);
    });

    test('Update Applications', async () => {
        const AppBaseInfo = {
            name: 'Test Application',
            description: 'This is a test application.',
            redirect_uri: ['https://example.com'],
            privacy_policy: 'https://example.com/privacy_policy',
            terms_of_service: 'https://example.com/terms_of_service',
            public: false,
        };
        const Expect = {
            name: 'Test Application 2',
            description: 'This is a test application.',
            redirect_uri: ['https://example.com', 'https://example.com/test'],
            privacy_policy: 'https://example.com/privacy_policy',
            terms_of_service: 'https://example.com/terms_of_service',
            developer: '明月',
        };
        const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
        const UpdateRes = await Application.UpdateApp(AppIDAndSecret.client_id, {
            regenerate_secret: false,
            name: 'Test Application 2',
            redirect_uri: ['https://example.com', 'https://example.com/test'],
        });
        const ApplicationInfo = await Application.GetApp(AppIDAndSecret.client_id);
        expect(UpdateRes).toStrictEqual({ client_id: AppIDAndSecret.client_id });
        expect(ApplicationInfo).toStrictEqual(Expect);
    });
});
