import { NocoDBPost } from './types';
import { comparePostHashes, unifyPost } from './hashing';
import { client, contentClient, db } from './services';


async function getGhostPosts() {
    return client.posts.browse({ limit: 1000, include: "tags" });
}

async function getNocoDBPosts() {
    const { list } = await db.dbTableRow.list(process.env.NOCO_ORG!, process.env.NOCO_PROJECT!, '');
    return list as NocoDBPost[];
}

async function main() {
    const ghostPosts = await getGhostPosts();
    const nocoDBPosts = await getNocoDBPosts();
    const ghostPostIds = ghostPosts.map(p => p.id);
    const nocoDBPostIds = nocoDBPosts.map(p => p.id);
    const missingPosts = nocoDBPosts.filter(p => !ghostPostIds.includes(p.id));
    const extraPosts = ghostPosts.filter(p => !nocoDBPostIds.includes(p.id));
    console.log("Missing posts", missingPosts.length);
    console.log("Extra posts", extraPosts.length);

    for await (const post of missingPosts) {
        await db.dbTableRow.delete(process.env.NOCO_ORG!, process.env.NOCO_PROJECT!, '', post.id);
        console.info("Deleted post", post.id);
    }

    for await (const post of extraPosts) {
        const postContent = await contentClient.posts.read({ id: post.id });

        await db.dbTableRow.create(process.env.NOCO_ORG!, process.env.NOCO_PROJECT!, '', unifyPost(post, postContent));
        console.info("Created post", post.id);
    }

    for await (const post of ghostPosts) {
        const postContent = await contentClient.posts.read({ id: post.id });
        const nocoPost = nocoDBPosts.find(p => p.id === post.id);
        if (!nocoPost) {
            console.log("No post found in NocoDB for", post.id);
            continue;
        }

        const truePost = unifyPost(post, postContent);
        if (!comparePostHashes(truePost, nocoPost)) {
            const rowLastUpdated = new Date(nocoPost.updated_at);
            const postLastUpdated = new Date(post.updated_at);

            // Whichever has been updated most recently, update the other
            if (rowLastUpdated > postLastUpdated) {
                // Update Ghost
                await client.posts.edit({
                    id: post.id,
                    title: nocoPost.title,
                    slug: nocoPost.slug,
                    excerpt: nocoPost.excerpt,
                    meta_title: nocoPost.meta_title as string,
                    meta_description: nocoPost.meta_description as string,
                    tags: nocoPost.tags as string[],
                    status: nocoPost.status as string,
                    updated_at: rowLastUpdated.toISOString(),
                });
                console.info("Updated Ghost post", post.id);
            }
            else {
                // Update NocoDB
                await db.dbTableRow.update(process.env.NOCO_ORG!, process.env.NOCO_PROJECT!, '', post.id, truePost);
                console.info("Updated NocoDB post", post.id);
            }
        }
    }
}

main()
    .then(() => console.log("Sync complete"))
    .catch(e => console.error(e))
    .finally(() => process.exit(0));
