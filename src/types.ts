import { GhostPostAdminTag } from "@tryghost/admin-api";

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
    jobLink: string | null;
    url: string;
}


export interface NocoDBJob {
    Id: number;
    Title: string;
    Company: string;
    SalaryLow: number;
    SalaryHigh: number;
    Remote: boolean;
    JobURL: string;
    Description: string;
    CreatedAt: string;
    UpdatedAt: string;
    Available: boolean;
    CompanyURL: string;
    Location: string;
    Slug: string;
    GhostId: string;
    GhostURL: string;
    GhostPublishedAt: string | null;
}

export type NocoDBPayment = {
    Id: number;
    CreatedAt: string;
    UpdatedAt: string;
    Amount: number;
    CustomerName: string;
    CustomerEmail: string;
    CustomerTikTok: string;
    StripeId: string;
    StripeStatus: string;
    StripeCreatedAt: string;
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type NocoDBRowBase = { Id: number; CreatedAt: string; UpdatedAt: string; };
export type NewNocoDBRow<T extends NocoDBRowBase> = Optional<T, "Id" | "CreatedAt" | "UpdatedAt">;
export type NewNoCoDBJob = Optional<NocoDBJob, "Id" | "CreatedAt" | "UpdatedAt">;


export type GhostAuthor = {
    id: string;
    name: string;
    slug: string;
    email: string;
    profile_image: string | null;
    cover_image: string;
    bio: string | null;
    website: string | null;
    location: string | null;
    facebook: string | null;
    twitter: string | null;
}
export type GhostCount = { 
    clicks: number; 
    positive_feedback: number; 
    negative_feedback: number; 
};

export type GhostUpdateWebhookPostDetails = {
    id: string;
    uuid: string;
    title: string;
    slug: string;
    mobiledoc: string;
    feature_image: string | null;
    featured: boolean;
    status: "published" | "sent" | "draft";
    visibility: "public" | string;
    created_at: string;
    updated_at: string;
    published_at: string;
    custom_excerpt: string;
    codeinjection_head: string | null;
    codeinjection_foot: string | null;
    custom_template: string | null;
    canonical_url: string | null;
    authors: GhostAuthor[];
    tags: GhostPostAdminTag[];
    post_revisions: unknown[];
    tiers: any[];
    count: GhostCount;
    primary_author: GhostAuthor;
    primary_tag: string | null;
    email_segment: "all",
    url: string;
    excerpt: string;
    reading_time: number;
    og_image: string | null;
    og_title: string | null;
    og_description: string | null;
    email_only: boolean;
}

export type GhostUpdateWebhookPayload = {
    post: {
        current: GhostUpdateWebhookPostDetails;
        previous: { mobiledoc: string };
    }
}