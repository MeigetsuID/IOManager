import { PrismaClient } from '@prisma/client';
import AccountManager from './AccountManager';
import ApplicationManager from './ApplicationManager';
import VirtualIDManager from './VirtualIDManager';
import TokenManager, { TokenResponse } from './TokenManager';

describe('Cascade Test', () => {
    const Account = new AccountManager('supervisor');
    const Application = new ApplicationManager('supervisor');
    const VirtualID = new VirtualIDManager('supervisor');
    const Token = new TokenManager('supervisor');
    const prisma = new PrismaClient();
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('Update System ID', () => {
        describe('Check App Developer', () => {
            beforeAll(async () => {
                await Account.CreateAccount({
                    id: '4010404006763',
                    user_id: 'cascade_test01',
                    name: 'Cascade Test',
                    mailaddress: 'cascade-test@mail.meigetsu.jp',
                    password: 'password01',
                    account_type: 4,
                });
            });
            it('Check', async () => {
                const AppInfos = await Promise.all(
                    [...Array(10)].map((_, index) =>
                        Application.CreateApp('4010404006763', {
                            name: 'Cascade Test',
                            description: 'Test Application',
                            redirect_uri: ['https://cascade-test.meigetsu.jp'],
                            privacy_policy: 'https://cascade-test.meigetsu.jp/privacy',
                            terms_of_service: 'https://cascade-test.meigetsu.jp/terms',
                            public: index % 2 === 0,
                        })
                    )
                );
                await prisma.masteruserrecord.update({
                    data: {
                        ID: '4010404006762',
                    },
                    where: {
                        ID: '4010404006763',
                    },
                });
                const AccountInfo = await Account.SGetAccount('4010404006762');
                expect(AccountInfo).toStrictEqual({
                    id: '4010404006762',
                    user_id: 'cascade_test01',
                    name: 'Cascade Test',
                    mailaddress: 'cascade-test@mail.meigetsu.jp',
                    account_type: 4,
                });
                const AppInfosAfterUpdate = await Promise.all(
                    AppInfos.map(app => {
                        if (!app) throw new Error('Invalid Developer ID');
                        return Application.GetApp(app.client_id);
                    })
                );
                AppInfosAfterUpdate.forEach((app, index) => {
                    const AppData = AppInfos[index];
                    if (!AppData) throw new Error('Invalid Developer ID');
                    expect(app).toStrictEqual({
                        client_id: AppData.client_id,
                        name: 'Cascade Test',
                        description: 'Test Application',
                        redirect_uri: ['https://cascade-test.meigetsu.jp'],
                        privacy_policy: 'https://cascade-test.meigetsu.jp/privacy',
                        terms_of_service: 'https://cascade-test.meigetsu.jp/terms',
                        developer: 'Cascade Test',
                    });
                });
            });
        });
        describe('Check Virtual ID', () => {
            beforeAll(async () => {
                await Account.CreateAccount({
                    id: '4010404006773',
                    user_id: 'cascade_test02',
                    name: 'Cascade Test',
                    mailaddress: 'cascade-test02@mail.meigetsu.jp',
                    password: 'password01',
                    account_type: 4,
                });
            });
            it('Check', async () => {
                const AppInfos = await Promise.all(
                    [...Array(10)].map((_, index) =>
                        Application.CreateApp('4010404006753', {
                            name: 'Cascade Test',
                            description: 'Test Application',
                            redirect_uri: ['https://cascade-test.meigetsu.jp'],
                            privacy_policy: 'https://cascade-test.meigetsu.jp/privacy',
                            terms_of_service: 'https://cascade-test.meigetsu.jp/terms',
                            public: index % 2 === 0,
                        })
                    )
                );
                const IssuedVirtualIDs = await Promise.all(
                    AppInfos.map(async AppInfo => {
                        if (!AppInfo) throw new Error('Invalid Developer ID');
                        return {
                            vid: await VirtualID.GetVirtualID(AppInfo.client_id, '4010404006773'),
                            app: AppInfo.client_id,
                        };
                    })
                );
                await Promise.all(
                    IssuedVirtualIDs.map(IssuedVirtualID => {
                        if (!IssuedVirtualID.vid) throw new Error('Invalid AppID or SystemID');
                        return VirtualID.GetLinkedInformation(IssuedVirtualID.vid).then(record => {
                            expect(record).toStrictEqual({
                                app: IssuedVirtualID.app,
                                id: '4010404006773',
                                user_id: 'cascade_test02',
                                name: 'Cascade Test',
                                mailaddress: 'cascade-test02@mail.meigetsu.jp',
                                account_type: 4,
                            });
                        });
                    })
                );
                await prisma.masteruserrecord.update({
                    data: {
                        ID: '4010404006772',
                    },
                    where: {
                        ID: '4010404006773',
                    },
                });
                await Promise.all(
                    IssuedVirtualIDs.map(IssuedVirtualID => {
                        if (!IssuedVirtualID.vid) throw new Error('Invalid Virtual ID');
                        return VirtualID.GetLinkedInformation(IssuedVirtualID.vid).then(record => {
                            expect(record).toStrictEqual({
                                app: IssuedVirtualID.app,
                                id: '4010404006772',
                                user_id: 'cascade_test02',
                                name: 'Cascade Test',
                                mailaddress: 'cascade-test02@mail.meigetsu.jp',
                                account_type: 4,
                            });
                        });
                    })
                );
            });
        });
    });
    describe('Delete Account', () => {
        const CacheRecords = {
            client_id: {
                meigetsu2020: '',
                cascade_test: '',
            },
            virtual_id: {
                for_meigetsu2020: {
                    meigetsu2020: '',
                    cascade_test: '',
                },
                for_cascade_test: {
                    meigetsu2020: '',
                    cascade_test: '',
                },
            },
            token: {
                for_meigetsu2020: {
                    meigetsu2020: {
                        token_type: '',
                        access_token: '',
                        refresh_token: '',
                        expires_at: {
                            access_token: new Date(),
                            refresh_token: new Date(),
                        },
                    },
                    cascade_test: {
                        token_type: '',
                        access_token: '',
                        refresh_token: '',
                        expires_at: {
                            access_token: new Date(),
                            refresh_token: new Date(),
                        },
                    },
                },
                for_cascade_test: {
                    meigetsu2020: {
                        token_type: '',
                        access_token: '',
                        refresh_token: '',
                        expires_at: {
                            access_token: new Date(),
                            refresh_token: new Date(),
                        },
                    },
                    cascade_test: {
                        token_type: '',
                        access_token: '',
                        refresh_token: '',
                        expires_at: {
                            access_token: new Date(),
                            refresh_token: new Date(),
                        },
                    },
                },
            },
        };
        beforeAll(async () => {
            await Account.CreateAccount({
                id: '4010404006783',
                user_id: 'cascade_test03',
                name: 'Cascade Test',
                mailaddress: 'cascade-test10@mail.meigetsu.jp',
                password: 'password01',
                account_type: 4,
            });
            const AppInfoMeigetsu2020 = await Application.CreateApp('4010404006753', {
                name: 'Meigetsu2020',
                description: 'Test Application',
                redirect_uri: ['https://meigetsu2020.meigetsu.jp'],
                privacy_policy: 'https://meigetsu2020.meigetsu.jp/privacy',
                terms_of_service: 'https://meigetsu2020.meigetsu.jp/terms',
                public: true,
            });
            if (!AppInfoMeigetsu2020) throw new Error('Invalid Developer ID');
            CacheRecords.client_id.meigetsu2020 = AppInfoMeigetsu2020.client_id;
            const AppInfoCascadeTest = await Application.CreateApp('4010404006783', {
                name: 'Cascade Test',
                description: 'Test Application',
                redirect_uri: ['https://cascade-test.meigetsu.jp'],
                privacy_policy: 'https://cascade-test.meigetsu.jp/privacy',
                terms_of_service: 'https://cascade-test.meigetsu.jp/terms',
                public: true,
            });
            if (!AppInfoCascadeTest) throw new Error('Invalid Developer ID');
            CacheRecords.client_id.cascade_test = AppInfoCascadeTest.client_id;
            const IssuedVirtualIDForMeigetsu2020 = {
                meigetsu2020: await VirtualID.GetVirtualID(AppInfoMeigetsu2020.client_id, '4010404006753'),
                cascade_test: await VirtualID.GetVirtualID(AppInfoCascadeTest.client_id, '4010404006753'),
            };
            if (!IssuedVirtualIDForMeigetsu2020.meigetsu2020 || !IssuedVirtualIDForMeigetsu2020.cascade_test)
                throw new Error('Invalid AppID or SystemID');
            CacheRecords.virtual_id.for_meigetsu2020 = IssuedVirtualIDForMeigetsu2020 as {
                meigetsu2020: string;
                cascade_test: string;
            };
            const IssuedVirtualIDForCascadeTest = {
                meigetsu2020: await VirtualID.GetVirtualID(AppInfoMeigetsu2020.client_id, '4010404006783'),
                cascade_test: await VirtualID.GetVirtualID(AppInfoCascadeTest.client_id, '4010404006783'),
            };
            if (!IssuedVirtualIDForCascadeTest.meigetsu2020 || !IssuedVirtualIDForCascadeTest.cascade_test)
                throw new Error('Invalid AppID or SystemID');
            CacheRecords.virtual_id.for_cascade_test = IssuedVirtualIDForCascadeTest as {
                meigetsu2020: string;
                cascade_test: string;
            };
            const IssuedTokenForMeigetsu2020 = {
                meigetsu2020: await Token.CreateToken(IssuedVirtualIDForMeigetsu2020.meigetsu2020, ['supervisor']),
                cascade_test: await Token.CreateToken(IssuedVirtualIDForMeigetsu2020.cascade_test, ['user.read']),
            };
            if (!IssuedTokenForMeigetsu2020.meigetsu2020 || !IssuedTokenForMeigetsu2020.cascade_test)
                throw new Error('Invalid VirtualID');
            CacheRecords.token.for_meigetsu2020 = IssuedTokenForMeigetsu2020 as {
                meigetsu2020: TokenResponse;
                cascade_test: TokenResponse;
            };
            const IssuedTokenForCascadeTest = {
                meigetsu2020: await Token.CreateToken(IssuedVirtualIDForCascadeTest.meigetsu2020, ['supervisor']),
                cascade_test: await Token.CreateToken(IssuedVirtualIDForCascadeTest.cascade_test, ['user.read']),
            };
            if (!IssuedTokenForCascadeTest.meigetsu2020 || !IssuedTokenForCascadeTest.cascade_test)
                throw new Error('Invalid VirtualID');
            CacheRecords.token.for_cascade_test = IssuedTokenForCascadeTest as {
                meigetsu2020: TokenResponse;
                cascade_test: TokenResponse;
            };
        });
        it('Check', async () => {
            await Account.DeleteAccount('4010404006783');

            // Check Token and Virutal ID

            // AppDev: 4010404006753 User: 4010404006753
            expect(await Token.Check(CacheRecords.token.for_meigetsu2020.meigetsu2020.access_token, [])).not.toBeNull();
            expect(await Token.Refresh(CacheRecords.token.for_meigetsu2020.meigetsu2020.refresh_token)).not.toBeNull();
            expect(await VirtualID.GetVirtualID(CacheRecords.client_id.meigetsu2020, '4010404006753')).not.toBeNull();

            // AppDev: 4010404006783 User: 4010404006753
            expect(await Token.Check(CacheRecords.token.for_meigetsu2020.cascade_test.access_token, [])).toBeNull();
            expect(await Token.Refresh(CacheRecords.token.for_meigetsu2020.cascade_test.refresh_token)).toBeNull();
            expect(await VirtualID.GetVirtualID(CacheRecords.client_id.meigetsu2020, '4010404006783')).toBeNull();

            // AppDev: 4010404006753 User: 4010404006783
            expect(await Token.Check(CacheRecords.token.for_cascade_test.meigetsu2020.access_token, [])).toBeNull();
            expect(await Token.Refresh(CacheRecords.token.for_cascade_test.meigetsu2020.refresh_token)).toBeNull();
            expect(await VirtualID.GetVirtualID(CacheRecords.client_id.cascade_test, '4010404006753')).toBeNull();

            // AppDev: 4010404006783 User: 4010404006783
            expect(await Token.Check(CacheRecords.token.for_cascade_test.cascade_test.access_token, [])).toBeNull();
            expect(await Token.Refresh(CacheRecords.token.for_cascade_test.cascade_test.refresh_token)).toBeNull();
            expect(await VirtualID.GetVirtualID(CacheRecords.client_id.cascade_test, '4010404006783')).toBeNull();

            // Check Application

            // AppDev: 4010404006753
            expect(await Application.GetApp(CacheRecords.client_id.meigetsu2020)).not.toBeNull();

            // AppDev: 4010404006783
            expect(await Application.GetApp(CacheRecords.client_id.cascade_test)).toBeNull();

            // Check Account
            // System ID: 4010404006753
            expect(await Account.SGetAccount('4010404006753')).not.toBeNull();

            // System ID: 4010404006783
            expect(await Account.SGetAccount('4010404006783')).toBeNull();
        });
    });
});
