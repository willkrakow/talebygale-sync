import { JSDOM } from 'jsdom';
import { NewNocoDBRow, NocoDBJob, NocoDBRowBase } from './types';
import { GhostPost, GhostPostAdminTag } from '@tryghost/admin-api';
import { client, db } from './services';
export const JOBS_TABLE = 'jobs';
export const REVIEWS_TABLE = 'reviews';
export const PAYMENTS_TABLE = 'payments';

export function getJobPostLink<T extends {html?: string | null, [key: string]: any}>(post: T): string | null {
    if (!post.html) {
        return null
    }
    const postHTML = new JSDOM(post.html);
    const link = postHTML.window.document.querySelector("a");
    if (!link) {
        return null
    }

    return link.href;
}

export function getJobPostCompany<T extends {slug: string}>(post: T): string | null {
    return post.slug.split('-')[1].toLocaleUpperCase();
}

export function getJobPostLocation<T extends {tags: GhostPostAdminTag[]}>(post: T) {
    const locationTag = post.tags.find(t => t.slug.match(/hash-(.*)_license/));
    return locationTag?.name.replace('#', '').replace('_license', '') || "";
}

export function getJobPostRemote<T extends {excerpt: string}>(post: T){
    return post.excerpt.includes("Fully Remote")
}

const NOCO = "NocoDB", GHOST = "Ghost";
export function compareGhostToNoco(ghostPost: GhostPost, nocoDBPost: NocoDBJob) {
    const ghostcopy = { ...ghostPost };
    const nocoCopy = { ...nocoDBPost };
    let differences = 0;

    const nocoLastUpdated = new Date(nocoDBPost.UpdatedAt);
    const ghostLastUpdated = new Date(ghostPost.updated_at);

    const trueVersion = nocoLastUpdated > ghostLastUpdated ? NOCO : GHOST;

    if (ghostPost.title !== nocoDBPost.Title) {
        differences++;
        trueVersion === GHOST ? nocoCopy.Title = ghostPost.title : ghostcopy.title = nocoDBPost.Title;
    }

    if (ghostPost.status === "draft" && nocoDBPost.Available) {
        differences++;
        trueVersion === GHOST ? nocoCopy.Available = false : ghostcopy.status = "published";
    }

    if (ghostPost.status === "published" && !nocoDBPost.Available) {
        differences++;
        trueVersion === GHOST ? nocoCopy.Available = true : ghostcopy.status = "draft";
    }

    return {
        ghost: ghostcopy,
        noco: nocoCopy,
        differences
    }
}


export async function getGhostPosts() {
    return client.posts.browse({ limit: 1000, include: "tags" });
}

export async function getNocoDBPosts() {
    const { list, pageInfo } = await db.dbTableRow.list(process.env.NOCO_ORG!, process.env.NOCO_PROJECT!, JOBS_TABLE, { limit: 1000 });
    console.log(pageInfo);
    return list as NocoDBJob[];
}

export async function getNocoDBRow<T extends NocoDBRowBase>(table: string, id: string) {
    return db.dbTableRow.read(process.env.NOCO_ORG!,
        process.env.NOCO_PROJECT!,
        table,
        id
    ) as Promise<T>;
}

export async function getNocoDBRowByGhostId<T extends NocoDBRowBase>(table: string, id: string) {
    const { list } = await db.dbTableRow.list(process.env.NOCO_ORG!,
        process.env.NOCO_PROJECT!,
        table,
        { limit: 1, where: `GhostId = ${id}` }
    );
    return list[0] as T;
}

export async function createNocoDBRow<T extends NocoDBRowBase>(table: string, data: NewNocoDBRow<T>) {
    return db.dbTableRow.create(process.env.NOCO_ORG!,
        process.env.NOCO_PROJECT!,
        table,
        data
    ) as Promise<NocoDBJob>;
}


export async function updateNocoDBRow<T extends NocoDBRowBase>(table: string, data: T){
    return db.dbTableRow.update(process.env.NOCO_ORG!,
        process.env.NOCO_PROJECT!,
        table,
        data.Id,
        data
    );
}