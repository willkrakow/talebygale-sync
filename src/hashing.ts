import { GhostPost } from "@tryghost/admin-api";
import { PostOrPage } from "@tryghost/content-api";
import { NocoDBPost, UnifiedPost } from "./types";
import { createHash } from "crypto";

export function unifyPost(adminPost: GhostPost, contentPost: PostOrPage): Omit<NocoDBPost, "updated_at"> {
    return {
        id: adminPost.id,
        title: adminPost.title,
        slug: adminPost.slug,
        html: contentPost.html || '',
        plaintext: contentPost.plaintext || '',
        excerpt: contentPost.excerpt || '',
        meta_title: contentPost.meta_title || '',
        meta_description: contentPost.meta_description || '',
        tags: contentPost.tags?.map(t => t.name || '') || [],
        status: adminPost.status,
    }
}

export function comparePostHashes(post1: UnifiedPost, post2: UnifiedPost) {
    const hash1 = hashPost(post1);
    const hash2 = hashPost(post2);
    return hash1 === hash2;
}

export function hashPost(post: UnifiedPost) {
    // Create an MD5 hash of the post
    const hash = createHash('md5');

    // Add the post title, slug, html, plaintext, excerpt, meta_title, meta_description, tags, status
    hash.cork()
    hash.update(post.title)
        .update(post.slug)
        .update(post.html || '')
        .update(post.plaintext || '')
        .update(post.excerpt || '')
        .update(post.meta_title || '')
        .update(post.meta_description || '')
        .update(post.tags?.join(',') || '')
        .update(post.status)
        .uncork();

    return hash.digest('hex');
}