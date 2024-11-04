import CreateID from '@meigetsuid/idgenerator';
import DiaryManager, { CreateDiaryID } from '.';
import AccountManager from '../AccountManager';

describe('Diary Manager Sub Module Test', () => {
    it('Create Diary ID', () => {
        expect(CreateDiaryID()).toMatch(/^did-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    });
});

describe('Diary Manager All Test', () => {
    const Diary = new DiaryManager();
    const Account = new AccountManager();
    describe('Create Diary', () => {
        it('Main Content', async () => {
            const Result = await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            });
            expect(Result).toMatch(/^did-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
        });
        it('Comment', async () => {
            const MainContent = await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            });
            const Result = await Diary.CreateDiary('4010404006753', {
                title: 'Test Comment',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Comment',
                comment_target: MainContent,
            });
            expect(Result).toMatch(/^did-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
        });
    });
    describe('Get Diary', () => {
        const DiaryID = {
            NoComment: '',
            ContainComment: '',
            CommentID: '',
        };
        beforeAll(async () => {
            await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            }).then(ID => {
                DiaryID.NoComment = ID;
            });
            await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            }).then(ID => {
                DiaryID.ContainComment = ID;
            });
            await Diary.CreateDiary('4010404006753', {
                title: 'Test Comment',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Comment',
                comment_target: DiaryID.ContainComment,
            }).then(ID => {
                DiaryID.CommentID = ID;
            });
        });
        it('No Comment', async () => {
            const Result = await Diary.GetDiary(DiaryID.NoComment);
            expect(Result).toStrictEqual({
                id: DiaryID.NoComment,
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
                writer_name: '明月',
                writer_id: 'meigetsu2020',
                upload_date: expect.any(Date),
                last_update_date: expect.any(Date),
                comments: [],
            });
        });
        it('Comment Exist', async () => {
            const Result = await Diary.GetDiary(DiaryID.ContainComment);
            expect(Result).toStrictEqual({
                id: DiaryID.ContainComment,
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
                writer_name: '明月',
                writer_id: 'meigetsu2020',
                upload_date: expect.any(Date),
                last_update_date: expect.any(Date),
                comments: [
                    {
                        id: DiaryID.CommentID,
                        title: 'Test Comment',
                        scope_of_disclosure: 0,
                        allow_comment: true,
                        content: 'Test Comment',
                        writer_name: '明月',
                        writer_id: 'meigetsu2020',
                        upload_date: expect.any(Date),
                        last_update_date: expect.any(Date),
                        comments: [],
                    },
                ],
            });
        });
    });
    describe('Get Diaries', () => {
        const Cache = {
            AccountID: '',
            DiaryID: {
                NoComment: '',
                ContainComment: '',
                CommentID: '',
            },
        };
        beforeAll(async () => {
            Cache.AccountID = await CreateID('diary_test01');
            await Account.CreateAccount({
                id: Cache.AccountID,
                user_id: 'diary_test01',
                name: 'TestUser',
                mailaddress: 'get-diaries-test@mail.meigetsu.jp',
                password: 'password01',
                account_type: 4,
            });
            await Diary.CreateDiary(Cache.AccountID, {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            }).then(DiaryID => {
                Cache.DiaryID.NoComment = DiaryID;
            });
            await Diary.CreateDiary(Cache.AccountID, {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            }).then(DiaryID => {
                Cache.DiaryID.ContainComment = DiaryID;
            });
            await Diary.CreateDiary(Cache.AccountID, {
                title: 'Test Comment',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Comment',
                comment_target: Cache.DiaryID.ContainComment,
            }).then(DiaryID => {
                Cache.DiaryID.CommentID = DiaryID;
            });
        });
        it('Exists', async () => {
            const Result = await Diary.GetDiaries(Cache.AccountID);
            expect(Result.sort()).toStrictEqual(
                [
                    {
                        id: Cache.DiaryID.NoComment,
                        title: 'Test Diary',
                        scope_of_disclosure: 0,
                        upload_date: expect.any(Date),
                        last_update_date: expect.any(Date),
                        comments: 0,
                    },
                    {
                        id: Cache.DiaryID.ContainComment,
                        title: 'Test Diary',
                        scope_of_disclosure: 0,
                        upload_date: expect.any(Date),
                        last_update_date: expect.any(Date),
                        comments: 1,
                    },
                ].sort()
            );
        });
        it('Not Exists', async () => {
            const Result = await Diary.GetDiaries('4010404006754');
            expect(Result).toStrictEqual([]);
        });
    });
    describe('Update Diary', () => {
        it('Exists', async () => {
            const DiaryID = await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            });
            const UpdateExecuteResult = await Diary.UpdateDiary(DiaryID, {
                title: 'Updated Diary',
                scope_of_disclosure: 1,
                allow_comment: false,
                content: 'Updated Content',
            });
            expect(UpdateExecuteResult).toBe(true);
            const Result = await Diary.GetDiary(DiaryID);
            expect(Result).toStrictEqual({
                id: DiaryID,
                title: 'Updated Diary',
                scope_of_disclosure: 1,
                allow_comment: false,
                content: 'Updated Content',
                writer_name: '明月',
                writer_id: 'meigetsu2020',
                upload_date: expect.any(Date),
                last_update_date: expect.any(Date),
                comments: [],
            });
        });
        it('Not Exists', async () => {
            const Result = await Diary.UpdateDiary('did-notfound', {
                title: 'Updated Diary',
                scope_of_disclosure: 1,
                allow_comment: false,
                content: 'Updated Content',
            });
            expect(Result).toBe(false);
        });
    });
});
