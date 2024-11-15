import ManagerBase from '../ManagerBase';
import { generate } from 'randomstring';
import { ToHash } from '@meigetsusoft/hash';

export function CreateTokenText() {
    return generate({ length: 256, charset: 'alphanumeric' });
}

export type TokenResponse = {
    token_type: 'Bearer';
    access_token: string;
    refresh_token: string;
    expires_at: {
        access_token: Date;
        refresh_token: Date;
    };
};

export type TokenExpiresMinInformation = {
    access_token: number;
    refresh_token: number;
};

export default class TokenManager extends ManagerBase {
    constructor(SupervisorScopeName: string) {
        super(SupervisorScopeName);
    }
    /* v8 ignore next 3 */
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.token;
    }
    private async TokenExists(RawToken: string): Promise<boolean>;
    private async TokenExists(AccessToken: string, RefreshToken: string): Promise<boolean>;
    private async TokenExists(pArg: string, sArg?: string): Promise<boolean> {
        return sArg
            ? await this.mysql
                  .count({
                      where: {
                          OR: [{ AccessToken: ToHash(pArg, 'hotel') }, { RefreshToken: ToHash(sArg, 'november') }],
                      },
                  })
                  .then(count => count > 0)
            : await this.mysql
                  .count({
                      where: {
                          OR: [{ AccessToken: ToHash(pArg, 'hotel') }, { RefreshToken: ToHash(pArg, 'november') }],
                      },
                  })
                  .then(count => count > 0);
    }
    public async CreateToken(
        VirtualID: string,
        Scopes: string[],
        Now: Date = new Date(),
        TokenExpireMin: Partial<TokenExpiresMinInformation> = { access_token: 180, refresh_token: 10080 }
    ): Promise<TokenResponse | null> {
        const ExpiresMin = {
            access_token: TokenExpireMin.access_token || 180,
            refresh_token: TokenExpireMin.refresh_token || 10080,
        };
        const TokenText = {
            access_token: CreateTokenText(),
            refresh_token: CreateTokenText(),
        };
        if (await this.TokenExists(TokenText.access_token, TokenText.refresh_token))
            /* v8 ignore next */
            return await this.CreateToken(VirtualID, Scopes, Now, TokenExpireMin);
        if (await this.DB.virtualid.count({ where: { VirtualID: VirtualID } }).then(cnt => cnt === 0)) return null;
        return await this.mysql
            .create({
                data: {
                    AccessToken: ToHash(TokenText.access_token, 'hotel'),
                    RefreshToken: ToHash(TokenText.refresh_token, 'november'),
                    VirtualID: VirtualID,
                    Scopes: Scopes.join(','),
                    AExpiresAt: new Date(Now.getTime() + ExpiresMin.access_token * 60000),
                    RExpiresAt: new Date(Now.getTime() + ExpiresMin.refresh_token * 60000),
                },
            })
            .then(data => {
                return {
                    token_type: 'Bearer',
                    access_token: TokenText.access_token,
                    refresh_token: TokenText.refresh_token,
                    expires_at: {
                        access_token: data.AExpiresAt,
                        refresh_token: data.RExpiresAt,
                    },
                };
            });
    }
    public async Check(TokenText: string, RequireScopes: string[], ReturnSystemID: boolean = false): Promise<string | null> {
        return this.CheckAccessToken(TokenText, RequireScopes, ReturnSystemID);
    }
    public async Refresh(
        RefreshToken: string,
        Now: Date = new Date(),
        TokenExpireMin: Partial<TokenExpiresMinInformation> = { access_token: 180, refresh_token: 10080 }
    ): Promise<TokenResponse | null> {
        const HashedToken = ToHash(RefreshToken, 'november');
        const TokenData = await this.mysql.findUnique({
            select: {
                VirtualID: true,
                Scopes: true,
                RExpiresAt: true,
            },
            where: { RefreshToken: HashedToken },
        });
        if (!TokenData || TokenData.RExpiresAt.getTime() < Date.now()) return null;
        await this.mysql.delete({ where: { RefreshToken: HashedToken } });
        return this.CreateToken(TokenData.VirtualID, TokenData.Scopes.split(','), Now, TokenExpireMin);
    }
    public async Revoke(AccessToken: string): Promise<boolean> {
        if (!(await this.TokenExists(AccessToken))) return false;
        await this.mysql.delete({ where: { AccessToken: ToHash(AccessToken, 'hotel') } });
        return true;
    }
    public async RevokeAll(VirtualID: string): Promise<boolean>;
    public async RevokeAll(VirtualID: string[]): Promise<boolean>;
    public async RevokeAll(VirtualID: string | string[]): Promise<boolean> {
        if (Array.isArray(VirtualID))
            return await this.mysql
                .deleteMany({ where: { VirtualID: { in: VirtualID } } })
                .then(result => result.count > 0);
        else return await this.mysql.deleteMany({ where: { VirtualID: VirtualID } }).then(result => result.count > 0);
    }
    public async RevokeForDelete(SystemID: string): Promise<boolean> {
        return await this.mysql
            .deleteMany({
                where: {
                    VirutalIDTable: {
                        OR: [
                            {
                                ID: SystemID,
                            },
                            {
                                Application: {
                                    DeveloperID: SystemID,
                                },
                            },
                        ],
                    },
                },
            })
            .then(result => result.count > 0);
    }
    public async RemoveExpiredTokens(): Promise<void> {
        await this.mysql.deleteMany({
            where: {
                RExpiresAt: {
                    lte: new Date(),
                },
            },
        });
    }
}
