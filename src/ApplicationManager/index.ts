import ManagerBase from '../ManagerBase';
import { v4 as uuidv4 } from 'uuid';
import { generate } from 'randomstring';
import { ToHash } from '@meigetsusoft/hash';
import { OverwriteMode, readJson, writeJson } from 'nodeeasyfileio';
import { existsSync, unlinkSync } from 'fs';

export type ApplicationInformation = {
    name: string;
    description?: string;
    redirect_uri: string[];
    privacy_policy: string;
    terms_of_service?: string;
};

export type CreateApplicationArg = ApplicationInformation & {
    public: boolean;
};

export type ResApplicationInformation = ApplicationInformation & {
    client_id: string;
    developer: string;
};

export type UpdateApplicationInformation = Partial<ApplicationInformation> & {
    regenerate_secret: boolean;
};

type DiskSaveRecord = {
    secret: string;
    description?: string;
    redirect_uri: string[];
    privacy_policy: string;
    terms_of_service?: string;
};

export function CreateAppID() {
    return `app-${uuidv4().replace(/-/g, '')}`;
}

export function CreateAppSecret() {
    return generate({ length: 64, charset: 'alphanumeric' });
}

export function CreateApplicationInformationResponse(
    AppID: string,
    AppName: string,
    Developer: string
): ResApplicationInformation {
    const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
    return {
        client_id: AppID,
        name: AppName,
        description: DiskRecord.description,
        redirect_uri: DiskRecord.redirect_uri,
        privacy_policy: DiskRecord.privacy_policy,
        terms_of_service: DiskRecord.terms_of_service,
        developer: Developer,
    };
}

export default class ApplicationManager extends ManagerBase {
    private static readonly Public =
        'EAD6C0F0123381BE2204A8F8778060C7D0CEC9A3F23C72D2532A75A57742B8A8FCBA3FB725F04DAB5AF4CD4823A44DC098167F50941C8CCDFA13131D23642A09';
    constructor(SupervisorScopeName: string) {
        super(SupervisorScopeName);
    }
    /* v8 ignore next 3 */
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.application;
    }
    private async IsAppIDFree(AppID: string): Promise<boolean> {
        return await this.mysql
            .count({
                where: {
                    AppID: AppID,
                },
            })
            .then(result => result === 0);
    }
    /**
     * アプリケーションを作成する
     * @param arg アプリケーションの作成情報
     */
    public async CreateApp(
        DeveloperID: string,
        arg: CreateApplicationArg
    ): Promise<{ client_id: string; client_secret?: string } | null> {
        if (await this.DB.masteruserrecord.count({ where: { ID: DeveloperID } }).then(cnt => cnt === 0)) return null;
        const AppID = CreateAppID();
        const AppSecret = arg.public ? 'public' : CreateAppSecret();
        /* v8 ignore next */
        if (!(await this.IsAppIDFree(AppID))) return await this.CreateApp(DeveloperID, arg);
        const DiskWriteInfo: DiskSaveRecord = {
            secret: ToHash(AppSecret, 'echo'),
            description: arg.description,
            redirect_uri: arg.redirect_uri,
            privacy_policy: arg.privacy_policy,
            terms_of_service: arg.terms_of_service,
        };
        await this.mysql.create({
            data: {
                AppID: AppID,
                AppName: arg.name,
                DeveloperID: DeveloperID,
            },
        });
        writeJson(`./system/application/data/${AppID}.dat`, DiskWriteInfo);
        return arg.public
            ? { client_id: AppID }
            : {
                  client_id: AppID,
                  client_secret: AppSecret,
              };
    }
    public async GetApp(AppID: string): Promise<ResApplicationInformation | null> {
        return await this.mysql
            .findUnique({
                select: {
                    AppName: true,
                    Account: {
                        select: {
                            UserName: true,
                        },
                    },
                },
                where: {
                    AppID: AppID,
                },
            })
            .then(record => {
                return record
                    ? CreateApplicationInformationResponse(AppID, record.AppName, record.Account.UserName)
                    : null;
            });
    }
    public async GetApps(DeveloperID: string): Promise<ResApplicationInformation[]> {
        return await this.mysql
            .findMany({
                select: {
                    AppID: true,
                    AppName: true,
                    Account: {
                        select: {
                            UserName: true,
                        },
                    },
                },
                where: {
                    DeveloperID: DeveloperID,
                },
            })
            .then(records => {
                return records.map(record =>
                    CreateApplicationInformationResponse(record.AppID, record.AppName, record.Account.UserName)
                );
            });
    }
    public async UpdateApp(
        AppID: string,
        DeveloperID: string,
        arg: UpdateApplicationInformation
    ): Promise<{ client_id: string; client_secret?: string } | null> {
        const AppInfo = await this.mysql.findUnique({ where: { AppID: AppID } });
        if (!AppInfo || AppInfo.DeveloperID !== DeveloperID) return null;
        const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
        if (arg.regenerate_secret && DiskRecord.secret === ApplicationManager.Public)
            throw new Error('This application cannot regenerate client secret.');
        const AppSecret = arg.regenerate_secret ? CreateAppSecret() : undefined;
        if (AppSecret) DiskRecord.secret = ToHash(AppSecret, 'echo');
        if (arg.name) {
            await this.mysql.update({
                where: {
                    AppID: AppID,
                },
                data: {
                    AppName: arg.name,
                },
            });
        }
        Object.keys(DiskRecord).forEach(key => {
            if (arg[key]) DiskRecord[key] = arg[key];
        });
        writeJson(`./system/application/data/${AppID}.dat`, DiskRecord, OverwriteMode.Replace);
        return AppSecret
            ? {
                  client_id: AppID,
                  client_secret: AppSecret,
              }
            : {
                  client_id: AppID,
              };
    }
    public async DeleteApp(AppID: string, DeveloperID: string): Promise<boolean> {
        const AppInfo = await this.mysql.findUnique({ where: { AppID: AppID } });
        if (!AppInfo || AppInfo.DeveloperID !== DeveloperID) return false;
        await this.mysql.delete({
            where: {
                AppID: AppID,
            },
        });
        unlinkSync(`./system/application/data/${AppID}.dat`);
        return true;
    }
    public async DeleteApps(DeveloperID: string): Promise<boolean> {
        return await this.mysql
            .findMany({
                select: {
                    AppID: true,
                },
                where: {
                    DeveloperID: DeveloperID,
                },
            })
            .then(records => {
                if (records.length === 0) return false;
                return this.mysql
                    .deleteMany({
                        where: {
                            DeveloperID: DeveloperID,
                        },
                    })
                    .then(() => {
                        records.forEach(record => {
                            unlinkSync(`./system/application/data/${record.AppID}.dat`);
                        });
                        return true;
                    });
            });
    }
    public async AuthApp(
        AppID: string,
        RedirectUri: string
    ): Promise<{ developer: string; account_type: number, public_app: boolean } | null> {
        return await this.mysql
            .findUnique({
                select: {
                    DeveloperID: true,
                    Account: {
                        select: {
                            AccountType: true,
                        },
                    },
                },
                where: {
                    AppID: AppID,
                },
            })
            .then(record => {
                if (!record) return null;
                const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
                return DiskRecord.redirect_uri.some(uri => uri === RedirectUri)
                    ? { developer: record.DeveloperID, account_type: record.Account.AccountType, public_app: DiskRecord.secret === ApplicationManager.Public }
                    : null;
            });
    }
    public AuthConfidentialApp(AppID: string, AppSecret: string): boolean {
        if (AppSecret === 'public' || !existsSync(`./system/application/data/${AppID}.dat`)) return false;
        const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
        return DiskRecord.secret === ToHash(AppSecret, 'echo');
    }
}
