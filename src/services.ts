import GhostAdminAPI from "@tryghost/admin-api"
import GhostContentAPI from "@tryghost/content-api"
import { Api as NocoDBAPI } from 'nocodb-sdk';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

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

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2022-11-15',
});