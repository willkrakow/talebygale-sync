export type UnifiedPost = {
    id: string;
    title: string;
    slug: string;
    html: string;
    plaintext: string;
    excerpt: string;
    meta_title: string;
    meta_description: string;
    tags: string[];
    status: string;
}


export type NocoDBPost = {
    id: string;
    title: string;
    slug: string;
    html: string;
    plaintext: string;
    excerpt: string;
    meta_title: string;
    meta_description: string;
    tags: string[];
    status: string;
    updated_at: string;
}