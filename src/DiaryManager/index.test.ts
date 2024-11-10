import CreateID from '@meigetsuid/idgenerator';
import DiaryManager, { CreateDiaryID } from '.';
import AccountManager from '../AccountManager';
import { existsSync } from 'node:fs';

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
            const Expect = [
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
            ].sort((a, b) => a.comments - b.comments);
            expect(Result.sort((a, b) => a.comments - b.comments)).toStrictEqual(Expect);
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
            const UpdateExecuteResult = await Diary.UpdateDiary('4010404006753', DiaryID, {
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
            const Result = await Diary.UpdateDiary('4010404006753', 'did-notfound', {
                title: 'Updated Diary',
                scope_of_disclosure: 1,
                allow_comment: false,
                content: 'Updated Content',
            });
            expect(Result).toBe(false);
        });
        it('Not Writer', async () => {
            const DiaryID = await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            });
            const Result = await Diary.UpdateDiary('4010404006754', DiaryID, {
                title: 'Updated Diary',
                scope_of_disclosure: 1,
                allow_comment: false,
                content: 'Updated Content',
            });
            expect(Result).toBe(false);
        });
    });
    describe('Delete Diary', () => {
        describe('Exists', () => {
            it('No Comment', async () => {
                const DiaryID = await Diary.CreateDiary('4010404006753', {
                    title: 'Test Diary',
                    scope_of_disclosure: 0,
                    allow_comment: true,
                    content: 'Test Content',
                });
                const Result = await Diary.DeleteDiary('4010404006753', DiaryID);
                expect(Result).toBeTruthy();
                expect(await Diary.GetDiary(DiaryID)).toBeNull();
                expect(existsSync(`./system/diaries/${DiaryID}.txt`)).toBeFalsy();
                expect(existsSync(`./system/diaries/archived/${DiaryID}.zip`)).toBeTruthy();
            });
            it('Contain Comment', async () => {
                const MainContent = await Diary.CreateDiary('4010404006753', {
                    title: 'Test Diary',
                    scope_of_disclosure: 0,
                    allow_comment: true,
                    content: 'Test Content',
                });
                const CommentContent = await Diary.CreateDiary('4010404006753', {
                    title: 'Test Comment',
                    scope_of_disclosure: 0,
                    allow_comment: true,
                    content: 'Test Comment',
                    comment_target: MainContent,
                });
                const Result = await Diary.DeleteDiary('4010404006753', MainContent);
                expect(Result).toBeTruthy();
                expect(await Diary.GetDiary(MainContent)).toBeNull();
                expect(await Diary.GetDiary(CommentContent)).toBeNull();
                expect(existsSync(`./system/diaries/${MainContent}.txt`)).toBeFalsy();
                expect(existsSync(`./system/diaries/${CommentContent}.txt`)).toBeFalsy();
                expect(existsSync(`./system/diaries/archived/${MainContent}.zip`)).toBeTruthy();
                expect(existsSync(`./system/diaries/archived/${CommentContent}.zip`)).toBeFalsy();
            });
        });
        it('Not Exists', async () => {
            const Result = await Diary.DeleteDiary('4010404006753', 'did-notfound');
            expect(Result).toBeFalsy();
            expect(existsSync('./system/diaries/archived/did-notfound.zip')).toBeFalsy();
        });
        it('Not Writer', async () => {
            const DiaryID = await Diary.CreateDiary('4010404006753', {
                title: 'Test Diary',
                scope_of_disclosure: 0,
                allow_comment: true,
                content: 'Test Content',
            });
            const Result = await Diary.DeleteDiary('4010404006754', DiaryID);
            expect(Result).toBeFalsy();
            expect(await Diary.GetDiary(DiaryID)).not.toBeNull();
        });
    });
    describe('Delete All Diaries', () => {
        const Cache = {
            AccountID: '',
            DiaryIDs: [] as string[],
        };
        beforeAll(async () => {
            Cache.AccountID = await CreateID('diary_test02');
            await Account.CreateAccount({
                id: Cache.AccountID,
                user_id: 'diary_test02',
                name: 'TestUser',
                mailaddress: 'del-all-diary-test@mail.meigetsu.jp',
                password: 'password01',
                account_type: 4,
            });
            await Promise.all(
                [...Array(20)].map(async () => {
                    await Diary.CreateDiary(Cache.AccountID, {
                        title: 'Test Diary',
                        scope_of_disclosure: 0,
                        allow_comment: true,
                        content: 'Test Content',
                    }).then(DiaryID => {
                        Cache.DiaryIDs.push(DiaryID);
                    });
                })
            );
        });
        it('Test', async () => {
            await Diary.DeleteAllDiaries(Cache.AccountID);
            await Promise.all(
                Cache.DiaryIDs.map(async ID => {
                    expect(await Diary.GetDiary(ID)).toBeNull();
                    expect(existsSync(`./system/diaries/${ID}.txt`)).toBeFalsy();
                    expect(existsSync(`./system/diaries/archived/${ID}.zip`)).toBeTruthy();
                })
            );
        });
    });
});
