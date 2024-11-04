import { writeFile, readFile, writeJson } from 'nodeeasyfileio';
import DatabaseConnector from '../DatabaseConnector';
import { v4 as uuidv4 } from 'uuid';
import { createWriteStream, renameSync, unlinkSync } from 'node:fs';
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
    last_update_date: Date | null;
    comments: DiaryInformation[];
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
        writeFile(`./diaries/${DiaryID}.txt`, arg.content);
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
        const Content = readFile(`./diaries/${DiaryID}.txt`);
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
        Object.keys(Ret).forEach(key => {
            if (Ret[key] == null) delete Ret[key];
        });
        return Ret;
    }
    public async GetDiaries(WriterID: string): Promise<DiaryInformation[]> {
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
        return Promise.all(DiaryIDs.map(diaryID => this.GetDiary(diaryID).then(diary => diary!)));
    }
    public async UpdateDiary(DiaryID: string, arg: Partial<DiaryBaseData>): Promise<void> {
        await this.mysql.update({
            data: {
                Title: arg.title,
                ScopeOfDisclosure: arg.scope_of_disclosure,
                LastUpdateDate: new Date(),
            },
            where: {
                ID: DiaryID,
            },
        });
        if (arg.content) writeFile(`./diaries/${DiaryID}.txt`, arg.content, true);
    }
    public async DeleteDiary(DiaryID: string): Promise<void> {
        const Targets = await this.mysql.findMany({
            where: {
                OR: [{ ID: DiaryID }, { Comment: DiaryID }],
            },
        });
        await this.mysql.deleteMany({
            where: {
                OR: [{ ID: DiaryID }, { Comment: DiaryID }],
            },
        });
        Targets.forEach(target => {
            writeJson(`./diaries/archived/${DiaryID}/${target.ID}.json`, target);
            renameSync(`./diaries/${target.ID}.txt`, `./diaries/archived/${DiaryID}/${target.ID}.txt`);
        });
        const archive = archiver.create('zip', { zlib: { level: 9 } });
        const output = createWriteStream(`./diaries/archived/${DiaryID}.zip`);
        archive.pipe(output);
        archive.glob(`./diaries/archived/${DiaryID}/**/*`);
        archive.finalize();
        output.on('close', () => {
            unlinkSync(`./diaries/archived/${DiaryID}`);
        });
    }
}
