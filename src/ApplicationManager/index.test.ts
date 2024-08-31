import * as mysql from 'mysql2';
import { promisify } from 'util';
import ApplicationManager, { CreateAppID, CreateAppSecret } from '.';

describe('Application Manager Sub Module Test', () => {
    test('Create Application ID', () => {
        const AppID = CreateAppID();
        expect(AppID).toMatch(/^app-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    });

    test('Create Application Secret', () => {
        const AppSecret = CreateAppSecret();
        expect(AppSecret).toMatch(/^[0-9a-zA-Z]{64}$/);
    });
});

describe('Application Manager All Test', () => {
    const DeveloperID = '4010404006753';
    const Application = new ApplicationManager();
    beforeAll(async () => {
        const dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'root',
        };
        const checkMariaDBConnection = async () => {
            const connection = mysql.createConnection(dbConfig);
            const connect = promisify(connection.connect.bind(connection));
            try {
                await connect();
                connection.end();
            } catch (error) {
                setTimeout(checkMariaDBConnection, 1000); // 1秒ごとに再試行
            }
        };
        return await checkMariaDBConnection();
    });

    test('Create Application', async () => {
        const ApplicationInfo = await Application.CreateApp(DeveloperID, {
            name: 'Test Application',
            description: 'This is a test application.',
            redirect_uri: ['https://example.com'],
            privacy_policy: 'https://example.com/privacy_policy',
            terms_of_service: 'https://example.com/terms_of_service',
            public: false,
        });
        expect(ApplicationInfo.client_id).toMatch(/^app-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
        expect(ApplicationInfo.client_secret).toMatch(/^[0-9a-zA-Z]{64}$/);
    });
});