declare module "@tryghost/admin-api" {
    interface GhostPost {
        id: string;
        title: string;
        slug: string;
        published_at: string | null;
        updated_at: string;
        created_at: string;
        created_by: string;
        updated_by: string;
        published_by: string | null;
        custom_excerpt: string;
        codeinjection_head: string;
        codeinjection_foot: string;
        custom_template: string;
        canonical_url: string;
        tags: string[];
        authors: string[];
        primary_author: string;
        primary_tag: string;
        url: string;
        excerpt: string;
        meta_title: string;
        meta_description: string;
        og_image: string;
        og_title: string;
        og_description: string;
        twitter_image: string;
        twitter_title: string;
        twitter_description: string;
        status: string;
    }

    export interface GhostAdminAPIOptions {
        limit?: number;
        page?: number;
        filter?: string;
        order?: string;
        include?: string;
        formats?: string;
        fields?: string;
    }

    export default class GhostAdminAPI {
        constructor(options: {
            url: string;
            key: string;
            version: string;
        });
        posts: {
            browse: (options?: GhostAdminAPIOptions) => Promise<GhostPost[]>;
            edit: (options: Partial<GhostPost> & { id: string }) => Promise<GhostPost>;
            read: (options: { id: string }) => Promise<GhostPost>;
        };
    }
}