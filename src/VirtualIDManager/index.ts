import { v4 as uuidv4 } from 'uuid';
import DatabaseConnector from '../DatabaseConnector';

export function CreateVirtualIDText(): string {
    return `vid-${uuidv4().replace(/-/g, '')}`;
}

export default class VirtualIDManager extends DatabaseConnector {
    constructor() {
        super();
    }
    /* v8 ignore next 3 */
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.virtualid;
    }
    private async VirtualIDExists(VirtualID: string): Promise<boolean> {
        return await this.mysql.count({ where: { VirtualID: VirtualID } }).then(cnt => cnt > 0);
    }
    private async CreateVirtualID(AppID: string, SystemID: string): Promise<string> {
        const VirtualID = CreateVirtualIDText();
        /* v8 ignore next */
        if (await this.VirtualIDExists(VirtualID)) return await this.CreateVirtualID(AppID, SystemID);
        await this.mysql.create({
            data: {
                VirtualID: VirtualID,
                AppID: AppID,
                ID: SystemID,
            },
        });
        return VirtualID;
    }
    public async GetVirtualID(AppID: string, SystemID: string): Promise<string> {
        const Record = await this.mysql.findMany({
            select: {
                VirtualID: true,
            },
            where: {
                AppID: AppID,
                ID: SystemID,
            },
        });
        return Record.length === 1 ? Record[0].VirtualID : await this.CreateVirtualID(AppID, SystemID);
    }
    public async DeleteApp(AppID: string): Promise<boolean> {
        const CurrentVirtualIDCount = await this.mysql.count({ where: { AppID: AppID } });
        return await this.mysql
            .deleteMany({ where: { AppID: AppID } })
            .then(val => val.count === CurrentVirtualIDCount);
    }
    public async DeleteAccount(SystemID: string): Promise<boolean> {
        const CurrentVirtualIDCount = await this.mysql.count({ where: { ID: SystemID } });
        return await this.mysql
            .deleteMany({ where: { ID: SystemID } })
            .then(val => val.count === CurrentVirtualIDCount);
    }
}
