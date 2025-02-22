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
    },
});

const cAppIDSpec = object({
    required: {
        client_id: spec(i => AppIDReg.test(i)),
    },
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
    const Application = new ApplicationManager('supervisor');
    describe('Create Application', () => {
        test('Confidential', async () => {
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
        test('Public', async () => {
            const ApplicationInfo = await Application.CreateApp(DeveloperID, {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: true,
            });
            expect(isValid(cAppIDSpec, ApplicationInfo)).toBe(true);
        });
        test('Developer Not Found', async () => {
            const ApplicationInfo = await Application.CreateApp('4010404006754', {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            });
            expect(ApplicationInfo).toBeNull();
        });
    });
    describe('Get Application', () => {
        test('OK', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            const Expect = {
                client_id: AppIDAndSecret.client_id,
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                developer: '明月',
            };
            const ApplicationInfo = await Application.GetApp(AppIDAndSecret.client_id);
            expect(ApplicationInfo).toStrictEqual(Expect);
        });

        test('Not Found', async () => {
            const ApplicationInfo = await Application.GetApp(`app-${uuidv4()}`);
            expect(ApplicationInfo).toBe(null);
        });
    });
    describe('Get Applications', () => {
        test('Exists', async () => {
            const Apps = [
                {
                    name: 'App 1',
                    description: 'This is application 1.',
                    redirect_uri: ['https://example.com/app1'],
                    privacy_policy: 'https://example.com/app1/privacy_policy',
                    terms_of_service: 'https://example.com/app1/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 3',
                    description: 'This is application 3.',
                    redirect_uri: ['https://example.com/app3'],
                    privacy_policy: 'https://example.com/app3/privacy_policy',
                    terms_of_service: 'https://example.com/app3/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 4',
                    description: 'This is application 4.',
                    redirect_uri: ['https://example.com/app4'],
                    privacy_policy: 'https://example.com/app4/privacy_policy',
                    terms_of_service: 'https://example.com/app4/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 5',
                    description: 'This is application 5.',
                    redirect_uri: ['https://example.com/app5'],
                    privacy_policy: 'https://example.com/app5/privacy_policy',
                    terms_of_service: 'https://example.com/app5/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 6',
                    description: 'This is application 6.',
                    redirect_uri: ['https://example.com/app6'],
                    privacy_policy: 'https://example.com/app6/privacy_policy',
                    terms_of_service: 'https://example.com/app6/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 7',
                    description: 'This is application 7.',
                    redirect_uri: ['https://example.com/app7'],
                    privacy_policy: 'https://example.com/app7/privacy_policy',
                    terms_of_service: 'https://example.com/app7/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 8',
                    description: 'This is application 8.',
                    redirect_uri: ['https://example.com/app8'],
                    privacy_policy: 'https://example.com/app8/privacy_policy',
                    terms_of_service: 'https://example.com/app8/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 9',
                    description: 'This is application 9.',
                    redirect_uri: ['https://example.com/app9'],
                    privacy_policy: 'https://example.com/app9/privacy_policy',
                    terms_of_service: 'https://example.com/app9/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 10',
                    description: 'This is application 10.',
                    redirect_uri: ['https://example.com/app10'],
                    privacy_policy: 'https://example.com/app10/privacy_policy',
                    terms_of_service: 'https://example.com/app10/terms_of_service',
                    public: false,
                },
            ];
            const CreateApps = Apps.map(async app => {
                const AppIDAndSecret = await Application.CreateApp('4010404006743', app);
                if (!AppIDAndSecret) throw new Error('Developer is not found.');
                return {
                    client_id: AppIDAndSecret.client_id,
                    name: app.name,
                    description: app.description,
                    redirect_uri: app.redirect_uri,
                    privacy_policy: app.privacy_policy,
                    terms_of_service: app.terms_of_service,
                    developer: 'アプリケーションマネージャーテスト用アカウント',
                };
            });
            const Expect = await Promise.all(CreateApps);
            Expect.sort((a, b) => a.client_id.localeCompare(b.client_id));
            const ApplicationInfos = await Application.GetApps('4010404006743');
            ApplicationInfos.sort((a, b) => {
                if (!a.client_id || !b.client_id) throw new Error('client_id is not found.');
                return a.client_id.localeCompare(b.client_id);
            });
            expect(ApplicationInfos.sort()).toStrictEqual(Expect.sort());
        });

        test('Not Found', async () => {
            const ApplicationInfos = await Application.GetApps('4010404006744');
            expect(ApplicationInfos).toStrictEqual([]);
        });
    });
    describe('Update Application', () => {
        describe('Confidential', () => {
            test('No Regenerate Secret', async () => {
                const AppBaseInfo = {
                    name: 'Test Application',
                    description: 'This is a test application.',
                    redirect_uri: ['https://example.com'],
                    privacy_policy: 'https://example.com/privacy_policy',
                    terms_of_service: 'https://example.com/terms_of_service',
                    public: false,
                };
                const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
                if (!AppIDAndSecret) throw new Error('Developer is not found.');
                const Expect = {
                    client_id: AppIDAndSecret.client_id,
                    name: 'Test Application 2',
                    description: 'This is a test application.',
                    redirect_uri: ['https://example.com', 'https://example.com/test'],
                    privacy_policy: 'https://example.com/privacy_policy',
                    terms_of_service: 'https://example.com/terms_of_service',
                    developer: '明月',
                };
                const UpdateRes = await Application.UpdateApp(AppIDAndSecret.client_id, DeveloperID, {
                    regenerate_secret: false,
                    name: 'Test Application 2',
                    redirect_uri: ['https://example.com', 'https://example.com/test'],
                });
                const ApplicationInfo = await Application.GetApp(AppIDAndSecret.client_id);
                expect(UpdateRes).toStrictEqual({ client_id: AppIDAndSecret.client_id });
                expect(ApplicationInfo).toStrictEqual(Expect);
            });
            test('Regenerate Secret', async () => {
                const AppBaseInfo = {
                    name: 'Test Application',
                    description: 'This is a test application.',
                    redirect_uri: ['https://example.com'],
                    privacy_policy: 'https://example.com/privacy_policy',
                    terms_of_service: 'https://example.com/terms_of_service',
                    public: false,
                };
                const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
                if (!AppIDAndSecret) throw new Error('Developer is not found.');
                const UpdateRes = await Application.UpdateApp(AppIDAndSecret.client_id, DeveloperID, {
                    regenerate_secret: true,
                    name: 'Test Application 2',
                    redirect_uri: ['https://example.com', 'https://example.com/test'],
                });
                const iAppIDAndSecretSpec = object({
                    required: {
                        client_id: spec(i => i === AppIDAndSecret.client_id),
                        client_secret: spec(i => AppSecretReg.test(i)),
                    },
                });
                expect(isValid(iAppIDAndSecretSpec, UpdateRes)).toBe(true);
            });
        });
        describe('Public', () => {
            test('No Regenerate Secret', async () => {
                const AppBaseInfo = {
                    name: 'Test Application',
                    description: 'This is a test application.',
                    redirect_uri: ['https://example.com'],
                    privacy_policy: 'https://example.com/privacy_policy',
                    terms_of_service: 'https://example.com/terms_of_service',
                    public: true,
                };
                const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
                if (!AppIDAndSecret) throw new Error('Developer is not found.');
                const Expect = {
                    client_id: AppIDAndSecret.client_id,
                    name: 'Test Application 2',
                    description: 'This is a test application.',
                    redirect_uri: ['https://example.com', 'https://example.com/test'],
                    privacy_policy: 'https://example.com/privacy_policy',
                    terms_of_service: 'https://example.com/terms_of_service',
                    developer: '明月',
                };
                const UpdateRes = await Application.UpdateApp(AppIDAndSecret.client_id, DeveloperID, {
                    regenerate_secret: false,
                    name: 'Test Application 2',
                    redirect_uri: ['https://example.com', 'https://example.com/test'],
                });
                const ApplicationInfo = await Application.GetApp(AppIDAndSecret.client_id);
                expect(UpdateRes).toStrictEqual({ client_id: AppIDAndSecret.client_id });
                expect(ApplicationInfo).toStrictEqual(Expect);
            });

            test('Regenerate Secret', async () => {
                const AppBaseInfo = {
                    name: 'Test Application',
                    description: 'This is a test application.',
                    redirect_uri: ['https://example.com'],
                    privacy_policy: 'https://example.com/privacy_policy',
                    terms_of_service: 'https://example.com/terms_of_service',
                    public: true,
                };
                const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
                if (!AppIDAndSecret) throw new Error('Developer is not found.');
                await expect(
                    Application.UpdateApp(AppIDAndSecret.client_id, DeveloperID, {
                        regenerate_secret: true,
                        name: 'Test Application 2',
                        redirect_uri: ['https://example.com', 'https://example.com/test'],
                    })
                ).rejects.toThrow('This application cannot regenerate client secret.');
            });
        });
        test('Not Found', async () => {
            const UpdateRes = await Application.UpdateApp(`app-${uuidv4()}`, DeveloperID, {
                regenerate_secret: false,
                name: 'Test Application 2',
                redirect_uri: ['https://example.com', 'https://example.com/test'],
            });
            expect(UpdateRes).toBe(null);
        });
        test('Not Developer', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: true,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            const UpdateRes = await Application.UpdateApp(AppIDAndSecret.client_id, '4010404006754', {
                regenerate_secret: false,
                name: 'Test Application 2',
                redirect_uri: ['https://example.com', 'https://example.com/test'],
            });
            expect(UpdateRes).toBe(null);
        });
    });
    describe('Delete Application', () => {
        test('OK', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            const GetResultBeforeDelete = await Application.GetApp(AppIDAndSecret.client_id);
            expect(GetResultBeforeDelete).toStrictEqual({
                client_id: AppIDAndSecret.client_id,
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                developer: '明月',
            });
            const DeleteRes = await Application.DeleteApp(AppIDAndSecret.client_id, DeveloperID);
            expect(DeleteRes).toBe(true);
            const GetResultAfterDelete = await Application.GetApp(AppIDAndSecret.client_id);
            expect(GetResultAfterDelete).toBe(null);
        });
        test('Not Found', async () => {
            const DeleteRes = await Application.DeleteApp(`app-${uuidv4()}`, DeveloperID);
            expect(DeleteRes).toBe(false);
        });
        test('Not Developer', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: true,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            const DeleteRes = await Application.DeleteApp(`app-${uuidv4()}`, '4010404006754');
            expect(DeleteRes).toBe(false);
        });
    });
    describe('Delete Applications', () => {
        test('OK', async () => {
            const Apps = [
                {
                    name: 'App 1',
                    description: 'This is application 1.',
                    redirect_uri: ['https://example.com/app1'],
                    privacy_policy: 'https://example.com/app1/privacy_policy',
                    terms_of_service: 'https://example.com/app1/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 3',
                    description: 'This is application 3.',
                    redirect_uri: ['https://example.com/app3'],
                    privacy_policy: 'https://example.com/app3/privacy_policy',
                    terms_of_service: 'https://example.com/app3/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 4',
                    description: 'This is application 4.',
                    redirect_uri: ['https://example.com/app4'],
                    privacy_policy: 'https://example.com/app4/privacy_policy',
                    terms_of_service: 'https://example.com/app4/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 5',
                    description: 'This is application 5.',
                    redirect_uri: ['https://example.com/app5'],
                    privacy_policy: 'https://example.com/app5/privacy_policy',
                    terms_of_service: 'https://example.com/app5/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 6',
                    description: 'This is application 6.',
                    redirect_uri: ['https://example.com/app6'],
                    privacy_policy: 'https://example.com/app6/privacy_policy',
                    terms_of_service: 'https://example.com/app6/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 7',
                    description: 'This is application 7.',
                    redirect_uri: ['https://example.com/app7'],
                    privacy_policy: 'https://example.com/app7/privacy_policy',
                    terms_of_service: 'https://example.com/app7/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 8',
                    description: 'This is application 8.',
                    redirect_uri: ['https://example.com/app8'],
                    privacy_policy: 'https://example.com/app8/privacy_policy',
                    terms_of_service: 'https://example.com/app8/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 9',
                    description: 'This is application 9.',
                    redirect_uri: ['https://example.com/app9'],
                    privacy_policy: 'https://example.com/app9/privacy_policy',
                    terms_of_service: 'https://example.com/app9/terms_of_service',
                    public: false,
                },
                {
                    name: 'App 10',
                    description: 'This is application 10.',
                    redirect_uri: ['https://example.com/app10'],
                    privacy_policy: 'https://example.com/app10/privacy_policy',
                    terms_of_service: 'https://example.com/app10/terms_of_service',
                    public: false,
                },
            ];
            const CreateApps = Apps.map(async app => {
                const AppIDAndSecret = await Application.CreateApp('4010404006723', app);
                if (!AppIDAndSecret) throw new Error('Developer is not found.');
                return {
                    client_id: AppIDAndSecret.client_id,
                    name: app.name,
                    description: app.description,
                    redirect_uri: app.redirect_uri,
                    privacy_policy: app.privacy_policy,
                    terms_of_service: app.terms_of_service,
                    developer: 'アプリケーションマネージャーテスト用アカウント',
                };
            });
            const Expect = await Promise.all(CreateApps);
            Expect.sort((a, b) => a.client_id.localeCompare(b.client_id));
            const ApplicationInfosBeforeDelete = await Application.GetApps('4010404006723');
            ApplicationInfosBeforeDelete.sort((a, b) => {
                if (!a.client_id || !b.client_id) throw new Error('client_id is not found.');
                return a.client_id.localeCompare(b.client_id);
            });
            const DeleteRes = await Application.DeleteApps('4010404006723');
            expect(DeleteRes).toBe(true);
            const ApplicationInfos = await Application.GetApps('4010404006723');
            expect(ApplicationInfos).toStrictEqual([]);
            const DeleteResEmpty = await Application.DeleteApps('4010404006723');
            expect(DeleteResEmpty).toBe(false);
        });
    });
    describe('Auth Application', () => {
        test('Confidential/OK', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            if (!AppIDAndSecret.client_secret) throw new Error('client_secret is not found.');
            const AuthRes = await Application.AuthApp(
                AppIDAndSecret.client_id,
                AppBaseInfo.redirect_uri[0]
            );
            expect(AuthRes).toStrictEqual({
                developer: DeveloperID,
                account_type: 0,
                public_app: false,
            });
        });

        test('Public/OK', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: true,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            const AuthRes = await Application.AuthApp(AppIDAndSecret.client_id, AppBaseInfo.redirect_uri[0]);
            expect(AuthRes).toStrictEqual({
                developer: DeveloperID,
                account_type: 0,
                public_app: true,
            });
        });

        test('Not Found', async () => {
            const AuthRes = await Application.AuthApp(`app-${uuidv4()}`, 'https://example.com');
            expect(AuthRes).toBe(null);
        });

        test('Redirect URI Error', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            if (!AppIDAndSecret.client_secret) throw new Error('client_secret is not found.');
            const AuthRes = await Application.AuthApp(
                AppIDAndSecret.client_id,
                'https://example.com/test'
            );
            expect(AuthRes).toBe(null);
        });
    });
    describe('Auth Confidential Application', () => {
        test('OK', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            if (!AppIDAndSecret.client_secret) throw new Error('client_secret is not found.');
            expect(Application.AuthConfidentialApp(AppIDAndSecret.client_id, AppIDAndSecret.client_secret)).toBeTruthy();
        });
        test('Public App', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: true,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            expect(Application.AuthConfidentialApp(AppIDAndSecret.client_id, 'public')).toBeFalsy();
        });
        test('Not Found', () => {
            expect(Application.AuthConfidentialApp(`app-${uuidv4()}`, CreateAppSecret())).toBeFalsy();
        });
        test('Secret Error', async () => {
            const AppBaseInfo = {
                name: 'Test Application',
                description: 'This is a test application.',
                redirect_uri: ['https://example.com'],
                privacy_policy: 'https://example.com/privacy_policy',
                terms_of_service: 'https://example.com/terms_of_service',
                public: false,
            };
            const AppIDAndSecret = await Application.CreateApp(DeveloperID, AppBaseInfo);
            if (!AppIDAndSecret) throw new Error('Developer is not found.');
            if (!AppIDAndSecret.client_secret) throw new Error('client_secret is not found.');
            expect(Application.AuthConfidentialApp(AppIDAndSecret.client_id, 'error')).toBeFalsy();
        });
    });
});
