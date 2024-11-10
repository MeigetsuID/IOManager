import { writeFile, readFile, writeJson } from 'nodeeasyfileio';
import DatabaseConnector from '../DatabaseConnector';
import { v4 as uuidv4 } from 'uuid';
import { createWriteStream, renameSync, rmSync } from 'node:fs';
import * as archiver from 'archiver';

export type DiaryBaseData = {
    title: string;
    content: string;
    scope_of_disclosure: number;
    allow_comment: boolean;
};

export type CreateDiaryArg = DiaryBaseData & {
    comment_target?: string;
};

export type DiaryInformation = DiaryBaseData & {
    id: string;
    writer_name: string;
    writer_id: string;
    upload_date: Date;
    last_update_date: Date;
    comments: DiaryInformation[];
};

export type DiaryOverview = {
    id: string;
    title: string;
    scope_of_disclosure: number;
    upload_date: Date;
    last_update_date: Date;
    comments: number;
};

export function CreateDiaryID() {
    return `did-${uuidv4().replace(/-/g, '')}`;
}

export default class DiaryManager extends DatabaseConnector {
    constructor() {
        super();
    }
    /* v8 ignore next 3 */
    [Symbol.asyncDispose]() {
        return super[Symbol.asyncDispose]();
    }
    private get mysql() {
        return this.DB.diary;
    }
    public async CreateDiary(SystemID: string, arg: CreateDiaryArg): Promise<string> {
        const DiaryID = CreateDiaryID();
        if (await this.mysql.count({ where: { ID: DiaryID } }).then(count => count > 0))
            /* v8 ignore next */
            return this.CreateDiary(SystemID, arg);
        await this.mysql.create({
            data: {
                ID: DiaryID,
                WriterID: SystemID,
                Title: arg.title,
                ScopeOfDisclosure: arg.scope_of_disclosure,
                AllowComment: arg.allow_comment,
                Comment: arg.comment_target,
            },
        });
        writeFile(`./system/diaries/${DiaryID}.txt`, arg.content);
        return DiaryID;
    }
    public async GetDiary(DiaryID: string): Promise<DiaryInformation | null> {
        const DiaryInformation = await this.mysql.findUnique({
            select: {
                Title: true,
                UploadDate: true,
                LastUpdateDate: true,
                ScopeOfDisclosure: true,
                AllowComment: true,
                Comment: true,
                Account: {
                    select: {
                        UserID: true,
                        UserName: true,
                    },
                },
            },
            where: {
                ID: DiaryID,
            },
        });
        if (!DiaryInformation) return null;
        const Content = readFile(`./system/diaries/${DiaryID}.txt`);
        const CommentIDs = await this.mysql
            .findMany({
                select: {
                    ID: true,
                },
                where: {
                    Comment: DiaryID,
                },
            })
            .then(comments => comments.map(comment => comment.ID));
        const Ret = {
            id: DiaryID,
            title: DiaryInformation.Title,
            content: Content,
            scope_of_disclosure: DiaryInformation.ScopeOfDisclosure,
            allow_comment: DiaryInformation.AllowComment,
            writer_name: DiaryInformation.Account.UserName,
            writer_id: DiaryInformation.Account.UserID,
            upload_date: DiaryInformation.UploadDate,
            last_update_date: DiaryInformation.LastUpdateDate,
            comments: await Promise.all(CommentIDs.map(commentID => this.GetDiary(commentID).then(diary => diary!))),
        };
        return Ret;
    }
    public async GetDiaries(WriterID: string): Promise<DiaryOverview[]> {
        return await this.mysql
            .findMany({
                select: {
                    ID: true,
                    Title: true,
                    ScopeOfDisclosure: true,
                    UploadDate: true,
                    LastUpdateDate: true,
                },
                where: {
                    WriterID: WriterID,
                    Comment: null,
                },
            })
            .then(diaries => {
                const CreateDiaryRecordPromises: Promise<DiaryOverview>[] = diaries.map(async diary => {
                    return {
                        id: diary.ID,
                        title: diary.Title,
                        scope_of_disclosure: diary.ScopeOfDisclosure,
                        upload_date: diary.UploadDate,
                        last_update_date: diary.LastUpdateDate,
                        comments: await this.mysql.count({ where: { Comment: diary.ID } }),
                    };
                });
                return Promise.all(CreateDiaryRecordPromises);
            });
    }
    public async UpdateDiary(WriterID: string, DiaryID: string, arg: Partial<DiaryBaseData>): Promise<boolean> {
        if (await this.mysql.count({ where: { ID: DiaryID, WriterID: WriterID } }).then(count => count === 0))
            return false;
        await this.mysql.update({
            data: {
                Title: arg.title,
                ScopeOfDisclosure: arg.scope_of_disclosure,
                AllowComment: arg.allow_comment,
            },
            where: {
                ID: DiaryID,
            },
        });
        if (arg.content) writeFile(`./system/diaries/${DiaryID}.txt`, arg.content, true);
        return true;
    }
    public async DeleteDiary(WriterID: string, DiaryID: string): Promise<boolean> {
        const Targets = await this.mysql.findMany({
            where: {
                OR: [{ ID: DiaryID }, { Comment: DiaryID }],
            },
        });
        if (Targets.length === 0) return false;
        const TargetContent = Targets.find(target => target.ID === DiaryID);
        /* v8 ignore next */
        if (!TargetContent) throw new Error('TargetContent is undefined');
        if (TargetContent.WriterID !== WriterID) return false;
        await this.mysql.deleteMany({
            where: {
                OR: [{ ID: DiaryID }, { Comment: DiaryID }],
            },
        });
        Targets.forEach(target => {
            writeJson(`./system/diaries/archived/${DiaryID}/${target.ID}.json`, target);
            renameSync(`./system/diaries/${target.ID}.txt`, `./system/diaries/archived/${DiaryID}/${target.ID}.txt`);
        });
        const archive = archiver.create('zip', { zlib: { level: 9 } });
        const output = createWriteStream(`./system/diaries/archived/${DiaryID}.zip`);
        archive.pipe(output);
        archive.glob(`./system/diaries/archived/${DiaryID}/**/*`);
        archive.finalize();
        output.on('close', () => {
            rmSync(`./system/diaries/archived/${DiaryID}`, { recursive: true });
        });
        output.end();
        return true;
    }
    public async DeleteAllDiaries(WriterID: string): Promise<void> {
        const DiaryIDs = await this.mysql
            .findMany({
                select: {
                    ID: true,
                },
                where: {
                    WriterID: WriterID,
                },
            })
            .then(diaries => diaries.map(diary => diary.ID));
        await Promise.all(DiaryIDs.map(diaryID => this.DeleteDiary(WriterID, diaryID)));
    }
}
