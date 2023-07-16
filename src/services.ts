import GhostAdminAPI from "@tryghost/admin-api"
import GhostContentAPI from "@tryghost/content-api"
import { Api as NocoDBAPI } from 'nocodb-sdk';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

export const db = new NocoDBAPI<{ jobs: any[] }>({
    baseURL: process.env.NOCODB_API_URL as string,
    headers: {
        'xc-token': process.env.NOCODB_API_KEY as string,
    }
})

export const client = new GhostAdminAPI({
    url: process.env.GHOST_API_URL as string,
    key: process.env.GHOST_API_KEY as string,
    version: "v5.0",
})

export const contentClient = new GhostContentAPI({
    url: process.env.GHOST_API_URL as string,
    key: process.env.GHOST_CONTENT_API_KEY as string,
    version: "v5.0",
})

export const stripeApiKey = isProd
    ? process.env.STRIPE_SECRET_KEY 
    : process.env.STRIPE_SECRET_KEY__TEST;
export const stripeWebhookSecret = isProd
    ? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET__TEST;
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2022-11-15',
});