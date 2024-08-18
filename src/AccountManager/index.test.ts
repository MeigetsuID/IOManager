import AccountManager from ".";
const Account = new AccountManager();

test('Get Account/System ID', async () => {
    const AccountInfo = await Account.SGetAccount('4010404006753');
    const Expect = {
        id: '4010404006753',
        user_id: 'meigetsu2020',
        name: '明月',
        mailaddress: 'info@mail.meigetsu.jp',
        account_type: 0,
    };
    expect(AccountInfo).toStrictEqual(Expect);
});

test('Get Account/User ID', async () => {
    const AccountInfo = await Account.GetAccount('meigetsu2020');
    const Expect = {
        user_id: 'meigetsu2020',
        name: '明月',
        account_type: 0,
    };
    expect(AccountInfo).toStrictEqual(Expect);
});

test('Get Account/Sign In/System ID', async () => {
    const AccountInfo = await Account.SignIn('4010404006753', 'password01');
    expect(AccountInfo).toBe('4010404006753');
});

test('Get Account/Sign In/User ID', async () => {
    const AccountInfo = await Account.SignIn('meigetsu2020', 'password01');
    expect(AccountInfo).toBe('4010404006753');
});


test('Get Account/Sign In/Mail Address', async () => {
    const AccountInfo = await Account.SignIn('info@mail.meigetsu.jp', 'password01');
    expect(AccountInfo).toBe('4010404006753');
});

