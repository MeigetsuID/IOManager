import DiaryManager, { CreateDiaryID } from '.';

describe('Diary Manager Sub Module Test', () => {
    it('Create Diary ID', () => {
        expect(CreateDiaryID()).toMatch(/^did-[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);
    });
});

describe('Diary Manager All Test', () => {
    const Diary = new DiaryManager();
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
                        comments: [],
                    },
                ],
            });
        });
    });
});
