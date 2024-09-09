import DatabaseConnector from '../DatabaseConnector';
import { generate } from 'randomstring';
import { ToHash } from '@meigetsusoft/hash';

export function CreateRefreshTokenText() {
    return generate({ length: 256, charset: 'alphanumeric' });
}

export default class RefreshTokenManager extends DatabaseConnector {
    constructor() {
        super();
    }
    /* v8 ignore next 3 */
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.refreshtoken;
    }
    private async TokenExists(HashedTokenText: string): Promise<boolean> {
        return await this.mysql.count({ where: { Token: HashedTokenText } }).then(cnt => cnt > 0);
    }
    public async CreateRefreshToken(
        VirtualID: string,
        Scopes: string[],
        TokenExpireMin: number = 10080
    ): Promise<{ token: string; expires_at: Date }> {
        const TokenText = CreateRefreshTokenText();
        const HashedTokenText = ToHash(TokenText, 'november');
        /* v8 ignore next */
        if (await this.TokenExists(HashedTokenText)) return await this.CreateRefreshToken(VirtualID, Scopes, TokenExpireMin);
        return await this.mysql
            .create({
                data: {
                    Token: HashedTokenText,
                    VirtualID: VirtualID,
                    Scopes: Scopes.join(','),
                    ExpiresAt: new Date(Date.now() + TokenExpireMin * 60000),
                },
            })
            .then(data => {
                return {
                    token: TokenText,
                    expires_at: data.ExpiresAt,
                };
            });
    }
    public async Check(
        TokenText: string
    ): Promise<{ virtual_id: string, scopes: string[] } | null> {
        const TokenData = await this.mysql.findUnique({
            select: {
                VirtualID: true,
                Scopes: true,
                ExpiresAt: true,
            },
            where: { Token: ToHash(TokenText, 'november') },
        });
        return (TokenData && TokenData.ExpiresAt.getTime() >= Date.now()) 
            ? { virtual_id: TokenData.VirtualID, scopes: TokenData.Scopes.split(',') }
            : null
        
    }
    public async Revoke(TokenText: string): Promise<boolean> {
        const HashedTokenText = ToHash(TokenText, 'november');
        if (!(await this.TokenExists(HashedTokenText))) return false;
        await this.mysql.delete({ where: { Token: HashedTokenText } });
        return true;
    }
}
