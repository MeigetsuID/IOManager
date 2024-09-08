import DatabaseConnector from '../DatabaseConnector';
import { generate } from 'randomstring';
import { ToHash } from '@meigetsusoft/hash';

export function CreateAccessTokenText() {
    return generate({ length: 256, charset: 'alphanumeric' });
}

export default class AccessTokenManager extends DatabaseConnector {
    constructor(private SupervisorScopeName: string) {
        super();
    }
    /* v8 ignore next 3 */
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.accesstoken;
    }
    private async TokenExists(TokenText: string): Promise<boolean> {
        return await this.mysql.count({ where: { Token: TokenText } }).then(cnt => cnt > 0);
    }
    public async CreateAccessToken(
        VirtualID: string,
        Scopes: string[],
        TokenExpireMin: number = 180
    ): Promise<{ token: string; expires_at: Date }> {
        const TokenText = CreateAccessTokenText();
        /* v8 ignore next */
        if (await this.TokenExists(TokenText)) return await this.CreateAccessToken(VirtualID, Scopes, TokenExpireMin);
        return await this.mysql
            .create({
                data: {
                    Token: ToHash(TokenText, 'hotel'),
                    VirtualID: VirtualID,
                    Scopes: Scopes.join(','),
                    ExpiresAt: new Date(Date.now() + TokenExpireMin * 60000),
                },
            })
            .then(data => {
                return {
                    token: data.Token,
                    expires_at: data.ExpiresAt,
                };
            });
    }
    public async Check(
        TokenText: string,
        RequireScopes: string[],
        GetSystemID: boolean = false
    ): Promise<string | null> {
        const TokenData = await this.mysql.findFirst({
            select: {
                VirtualID: true,
                Scopes: true,
                ExpiresAt: true,
                VirutalIDTable: {
                    select: {
                        ID: GetSystemID,
                    },
                },
            },
            where: { Token: ToHash(TokenText, 'hotel') },
        });
        if (!TokenData || TokenData.ExpiresAt < new Date()) return null;
        const RetID = GetSystemID ? TokenData.VirutalIDTable.ID : TokenData.VirtualID;
        if (RequireScopes.length > 0) {
            if (TokenData.Scopes === this.SupervisorScopeName) return RetID;
            const Scopes = TokenData.Scopes.split(',');
            return RequireScopes.some(scope => Scopes.includes(scope)) ? RetID : null;
        }
        return RetID;
    }
    public async Revoke(TokenText: string): Promise<boolean> {
        if (!(await this.TokenExists(TokenText))) return false;
        await this.mysql.delete({ where: { Token: ToHash(TokenText, 'hotel') } });
        return true;
    }
}
