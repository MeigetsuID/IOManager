import DatabaseConnector from '../DatabaseConnector';
import { v4 as uuidv4 } from 'uuid';
import { generate } from 'randomstring';
import { ToHash } from '@meigetsusoft/hash';
import { readJson, writeJson } from 'nodeeasyfileio';
import { unlinkSync } from 'fs';

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
    client_id?: string;
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
    Developer: string,
    ContainAppID: boolean = false
): ResApplicationInformation {
    const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
    return ContainAppID
        ? {
              client_id: AppID,
              name: AppName,
              description: DiskRecord.description,
              redirect_uri: DiskRecord.redirect_uri,
              privacy_policy: DiskRecord.privacy_policy,
              terms_of_service: DiskRecord.terms_of_service,
              developer: Developer,
          }
        : {
              name: AppName,
              description: DiskRecord.description,
              redirect_uri: DiskRecord.redirect_uri,
              privacy_policy: DiskRecord.privacy_policy,
              terms_of_service: DiskRecord.terms_of_service,
              developer: Developer,
          };
}

export default class ApplicationManager extends DatabaseConnector {
    constructor() {
        super();
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
    ): Promise<{ client_id: string; client_secret: string }> {
        const AppID = CreateAppID();
        const AppSecret = arg.public ? 'public' : CreateAppSecret();
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
        return {
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
                    CreateApplicationInformationResponse(record.AppID, record.AppName, record.Account.UserName, true)
                );
            });
    }
    public async UpdateApp(
        AppID: string,
        arg: UpdateApplicationInformation
    ): Promise<{ client_id: string; client_secret?: string } | null> {
        if (await this.IsAppIDFree(AppID)) return null;
        const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
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
        writeJson(`./system/application/data/${AppID}.dat`, DiskRecord, true);
        return {
            client_id: AppID,
            client_secret: AppSecret,
        };
    }
    public async DeleteApp(AppID: string) {
        if (await this.IsAppIDFree(AppID)) return false;
        await this.mysql.delete({
            where: {
                AppID: AppID,
            },
        });
        unlinkSync(`./system/application/data/${AppID}.dat`);
        return true;
    }
    public async AuthApp(AppID: string, AppSecret: string): Promise<string | null> {
        return await this.mysql
            .findUnique({
                select: {
                    DeveloperID: true,
                },
                where: {
                    AppID: AppID,
                },
            })
            .then(record => {
                if (!record) return null;
                const DiskRecord = readJson<DiskSaveRecord>(`./system/application/data/${AppID}.dat`);
                return ToHash(AppSecret, 'echo') === DiskRecord.secret ? record.DeveloperID : null;
            });
    }
}
