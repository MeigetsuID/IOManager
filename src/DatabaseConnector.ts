import { PrismaClient } from '@prisma/client';

export default class DatabaseConnector {
    private static instance: PrismaClient;
    private static connection: number = 0;
    /**
     * Represents the constructor of the Database class.
     * Initializes a new instance of the Database class and increments the connection count.
     */
    constructor() {
        if (DatabaseConnector.connection === 0) DatabaseConnector.instance = new PrismaClient();
        DatabaseConnector.connection++;
    }
    /* v8 ignore next 5 */
    [Symbol.asyncDispose]() {
        DatabaseConnector.connection--;
        if (DatabaseConnector.connection === 0) return DatabaseConnector.instance.$disconnect();
        return Promise.resolve();
    }
    /**
     * Returns the PrismaClient instance used for database operations.
     * @returns The PrismaClient instance.
     */
    protected get DB(): PrismaClient {
        return DatabaseConnector.instance;
    }
}
