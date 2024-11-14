import { ToHash } from '@meigetsusoft/hash';
import { PrismaClient } from '@prisma/client';

export default class ManagerBase {
    private static instance: PrismaClient;
    private static connection: number = 0;
    /**
     * Represents the constructor of the Database class.
     * Initializes a new instance of the Database class and increments the connection count.
     */
    constructor(private SupervisorScopeName: string) {
        if (ManagerBase.connection === 0) ManagerBase.instance = new PrismaClient();
        ManagerBase.connection++;
    }
    /* v8 ignore next 5 */
    [Symbol.asyncDispose]() {
        ManagerBase.connection--;
        if (ManagerBase.connection === 0) return ManagerBase.instance.$disconnect();
        return Promise.resolve();
    }
    /**
     * Returns the PrismaClient instance used for database operations.
     * @returns The PrismaClient instance.
     */
    protected get DB(): PrismaClient {
        return ManagerBase.instance;
    }
    protected async CheckAccessToken(TokenText: string, RequireScopes: string[], ReturnSystemID: boolean = false): Promise<string | null> {
        const TokenData = await this.DB.token.findUnique({
            select: {
                VirtualID: true,
                Scopes: true,
                AExpiresAt: true,
                VirutalIDTable: {
                    select: {
                        ID: true,
                    },
                },
            },
            where: { AccessToken: ToHash(TokenText, 'hotel') },
        });
        if (!TokenData || TokenData.AExpiresAt.getTime() < Date.now()) return null;
        if (RequireScopes.length > 0) {
            if (TokenData.Scopes === this.SupervisorScopeName) return TokenData.VirtualID;
            const Scopes = TokenData.Scopes.split(',');
            return RequireScopes.every(scope => Scopes.includes(scope)) ? TokenData.VirtualID : null;
        }
        return ReturnSystemID ? TokenData.VirutalIDTable.ID : TokenData.VirtualID;
    }
}
