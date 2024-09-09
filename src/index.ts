import AccountManager from './AccountManager';
import ApplicationManager from './ApplicationManager';
import VirtualIDManager from './VirtualIDManager';
import AccessTokenManager from './AccessTokenManager';
import RefreshTokenManager from './RefreshTokenManager';

const IOManager = {
    Account: AccountManager,
    Application: ApplicationManager,
    VirtualID: VirtualIDManager,
    AccessToken: AccessTokenManager,
    RefreshToken: RefreshTokenManager,
};

export default IOManager;
