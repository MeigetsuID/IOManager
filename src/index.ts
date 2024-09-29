import AccountManager from './AccountManager';
import ApplicationManager from './ApplicationManager';
import VirtualIDManager from './VirtualIDManager';
import TokenManager from './TokenManager';

const IOManager = {
    Account: AccountManager,
    Application: ApplicationManager,
    VirtualID: VirtualIDManager,
    Token: TokenManager,
};

export default IOManager;
