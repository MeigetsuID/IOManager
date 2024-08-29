import { existsSync, mkdirSync } from 'node:fs';
import DatabaseConnector from '../DatabaseConnector';
import MailAddressEncryption from './MailAddressEncryption';
import { ToHash } from '@meigetsusoft/hash';

export type CreateAccountArg = {
    id: string;
    user_id: string;
    name: string;
    mailaddress: string;
    password: string;
    account_type: number;
};

export type GetAccountRes = {
    user_id: string;
    name: string;
    account_type: number;
};

export type GetAccountResS = GetAccountRes & {
    mailaddress: string;
};

export type UpdateAccountArg = Partial<{
    user_id: string;
    name: string;
    mailaddress: string;
    password: string;
    account_type: number;
}>;

export type CheckAvailableArg = Partial<{
    corp_number: string;
    user_id: string;
    mailaddress: string;
}>;

export default class AccountManager extends DatabaseConnector {
    private MailEnc: MailAddressEncryption;
    constructor() {
        super();
        if (!existsSync('./system/account')) mkdirSync('./system/account', { recursive: true });
        this.MailEnc = new MailAddressEncryption();
    }
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.masteruserrecord;
    }
    /**
     * アカウントを作成する
     * @param arg アカウントの作成情報
     */
    public async CreateAccount(arg: CreateAccountArg) {
        await this.mysql.create({
            data: {
                ID: arg.id,
                UserID: arg.user_id,
                UserName: arg.name,
                MailAddress: this.MailEnc.encrypt(arg.mailaddress),
                Password: ToHash(arg.password, 'foxtrot'),
                AccountType: arg.account_type,
            },
        });
    }
    /**
     * システムIDからアカウントを取得する
     * @param id システムID
     * @returns
     */
    public async SGetAccount(id: string): Promise<GetAccountResS | null> {
        return await this.mysql
            .findUnique({
                select: {
                    ID: true,
                    UserID: true,
                    UserName: true,
                    MailAddress: true,
                    AccountType: true,
                },
                where: {
                    ID: id,
                },
            })
            .then(data => {
                if (!data) return null;
                return {
                    id: data.ID,
                    user_id: data.UserID,
                    name: data.UserName,
                    mailaddress: this.MailEnc.decrypt(data.MailAddress),
                    account_type: data.AccountType,
                };
            });
    }
    /**
     * ユーザーIDからアカウントを取得する
     * @param id ユーザーID
     * @returns
     */
    public async GetAccount(id: string): Promise<GetAccountRes | null> {
        return await this.mysql
            .findUnique({
                select: {
                    UserID: true,
                    UserName: true,
                    AccountType: true,
                },
                where: {
                    UserID: id,
                },
            })
            .then(data => {
                if (!data) return null;
                return {
                    user_id: data.UserID,
                    name: data.UserName,
                    account_type: data.AccountType,
                };
            });
    }
    /**
     * アカウント情報を更新する
     * @param id システムID
     * @param arg 更新情報
     */
    public async UpdateAccount(id: string, arg: UpdateAccountArg) {
        if (Object.keys(arg).length === 0) throw new Error('Update information is empty.');
        const AccountInfo = await this.SGetAccount(id);
        if (AccountInfo == null) return null;
        await this.mysql.update({
            data: {
                UserID: arg.user_id,
                UserName: arg.name,
                MailAddress: arg.mailaddress ? this.MailEnc.encrypt(arg.mailaddress) : undefined,
                Password: arg.password ? ToHash(arg.password, 'foxtrot') : undefined,
                AccountType: arg.account_type,
            },
            where: {
                ID: id,
            },
        });
        Object.keys(arg).forEach(i => {
            AccountInfo[i] = arg[i]
        });
        return AccountInfo;
    }
    /**
     * アカウントを削除する
     * @param id システムID
     */
    public async DeleteAccount(id: string): Promise<boolean> {
        const AccountInfo = await this.SGetAccount(id);
        if (AccountInfo == null) return false;
        await this.mysql.delete({
            where: {
                ID: id,
            },
        });
        return true;
    }
    /**
     * IDとパスワードを用いてサインインの認証を行う
     * @param id システムID、ユーザーIDまたはメールアドレス
     * @param password パスワード
     */
    public async SignIn(id: string, password: string): Promise<string | null> {
        return await this.mysql
            .findMany({
                where: {
                    OR: [{ ID: id }, { UserID: id }, { MailAddress: this.MailEnc.encrypt(id) }],
                },
            })
            .then(data => {
                if (data.length !== 1 || data[0].Password !== ToHash(password, 'foxtrot')) return null;
                return data[0].ID;
            });
    }

    public async Available(arg: CheckAvailableArg): Promise<boolean> {
        let total = 0;
        if (arg.corp_number) {
            await this.mysql
                .count({
                    where: {
                        ID: arg.corp_number,
                    },
                })
                .then(cnt => {
                    total += cnt;
                });
        }
        if (arg.user_id) {
            await this.mysql
                .count({
                    where: {
                        UserID: arg.user_id,
                    },
                })
                .then(cnt => {
                    total += cnt;
                });
        }
        if (arg.mailaddress) {
            await this.mysql
                .count({
                    where: {
                        MailAddress: this.MailEnc.encrypt(arg.mailaddress),
                    },
                })
                .then(cnt => {
                    total += cnt;
                });
        }
        return total === 0;
    }
}
