import { client, contentClient } from "./services";
import { NewNoCoDBJob, NocoDBJob } from "./types";
import { JOBS_TABLE, compareGhostToNoco, createNocoDBRow, getGhostPosts, getJobPostCompany, getJobPostLink, getJobPostLocation, getJobPostRemote, getNocoDBPosts, updateNocoDBRow } from "./utils";

export async function syncGhostAndNoco() {
    const ghostPosts = await getGhostPosts();
    const nocoDBPosts = await getNocoDBPosts();

    const ghostJobPostIds = ghostPosts
        .filter(p => p.tags.some(t => t.slug === "remote-jobs"))
        .map(p => p?.id);
    const nocoDBPostIds = nocoDBPosts
        .map(p => p?.GhostId);

    const postsNotInGhost = nocoDBPosts
        .filter(p => !ghostJobPostIds.includes(p?.GhostId));
    const postsNotInDB = ghostPosts
        .filter(p => p.tags.some(t => t.slug === "remote-jobs"))
        .filter(p => !nocoDBPostIds.includes(p?.id));

    console.log("Posts not in Ghost: ", postsNotInGhost.length);
    console.log("Posts not in DB: ", postsNotInDB.length);

    for await (const post of postsNotInDB) {
        let jobRecord: NocoDBJob;

        const location = getJobPostLocation(post);
        const company = getJobPostCompany(post);

        const nocoData: NewNoCoDBJob = {
            GhostId: post.id,
            GhostURL: post.url,
            Title: post.title,
            Company: company || "",
            SalaryHigh: 0,
            SalaryLow: 0,
            Remote: getJobPostRemote(post),
            JobURL: "",
            Description: post.excerpt,
            Available: false,
            CompanyURL: "",
            Location: location,
            Slug: post.slug,
            GhostPublishedAt: post.published_at,
        }

        if (post.status === "published") {
            const contentPost = await contentClient.posts.read({ id: post.id });
            const jobUrl = getJobPostLink(contentPost) || "";

            nocoData.JobURL = jobUrl;
            nocoData.Available = true;
        }

        try {
            jobRecord = await createNocoDBRow(JOBS_TABLE, nocoData);
            console.log(jobRecord.Id);
        } catch (e) {
            console.error("Error creating job record in DB", e);
        }
    }

    let totalDifferenPosts = 0;

    for await (const post of ghostPosts) {
        const nocoDBPost = nocoDBPosts.find(p => p.GhostId === post.id);
        if (!nocoDBPost) continue;
        const { noco: updatedNoco, ghost: updatedGhost, differences } = compareGhostToNoco(post, nocoDBPost);

        if (differences === 0) {
            console.log("No differences found for post: ", updatedNoco.Id);
            continue;
        }
        totalDifferenPosts++;
        console.log("Updating job post: ", updatedNoco.Id)
        try {
            await updateNocoDBRow(JOBS_TABLE, updatedNoco);
            await client.posts.edit(updatedGhost);
        } catch (e) {
            console.error("Error updating job post: ", e);
        }
    }

    console.log("Total posts with differences: ", totalDifferenPosts);
}