import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { GhostUpdateWebhookPayload, NewNocoDBRow, NocoDBJob, NocoDBPayment, NocoDBRowBase } from './types';
import { JOBS_TABLE, PAYMENTS_TABLE, createNocoDBRow, getJobPostCompany, getJobPostLink, getJobPostLocation, getJobPostRemote, getNocoDBRowByGhostId, updateNocoDBRow } from './utils';
import { contentClient, stripe, stripeWebhookSecret } from './services';
import Stripe from 'stripe';

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.json({ status: "ok" })
})

app.post('/ghost/post/updated', express.json(), async (req, res) => {
    const data = req.body as GhostUpdateWebhookPayload;
    console.log(req.path);
    console.log(data);
    try {
        const nocoRecord = await getNocoDBRowByGhostId<NocoDBJob>(JOBS_TABLE, data.post.current.id);
        if (!nocoRecord) {
            console.log("No noco record found for ghost post: ", data.post.current.id);
            let location = "";
            if (data.post.current.status === "published"){
                location = getJobPostLocation(data.post.current);
            }
            const newRecord: NewNocoDBRow<NocoDBJob> = {
                Title: data.post.current.title,
                Available: data.post.current.status === "published",
                Company: getJobPostCompany(data.post.current) || "",
                JobURL: getJobPostLink(data.post.current) || "",
                Slug: data.post.current.slug,
                GhostId: data.post.current.id,
                GhostURL: data.post.current.url,
                GhostPublishedAt: data.post.current.published_at,
                Description: data.post.current.excerpt,
                Remote: getJobPostRemote(data.post.current),
                CompanyURL: "",
                Location: location,
                SalaryHigh: 0,
                SalaryLow: 0,
            };
            await createNocoDBRow(JOBS_TABLE, newRecord as NocoDBJob);
            console.log("Created new noco record for ghost post: ", data.post.current.id);
        } else {
            const updatedRecord: Partial<NocoDBJob> = {
                Id: nocoRecord.Id,
                Title: data.post.current.title,
                Available: data.post.current.status === "published",
                Company: getJobPostCompany(data.post.current) || "",
                JobURL: getJobPostLink(data.post.current) || "",
                Slug: data.post.current.slug,
                GhostId: data.post.current.id,
                GhostURL: data.post.current.url,
                GhostPublishedAt: data.post.current.published_at,
                Description: data.post.current.excerpt,
                Remote: getJobPostRemote(data.post.current),
            }
            await updateNocoDBRow(JOBS_TABLE, updatedRecord as NocoDBJob);
            console.log("Updated noco record for ghost post: ", data.post.current.id);
        }

        res.send();
    } catch(e){
        console.error(e);
    }
})

app.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, stripeWebhookSecret as string);
        console.log("Received stripe event: ", event.type)
    } catch (err) {
        console.log(err);
        return res.status(400).send(`Webhook Error`);
    }

    if (event.type === 'payment_intent.succeeded'){
        const session = event.data.object as Stripe.PaymentIntent;
        let customerName = session.customer;
        if (typeof session.customer === "object" && session.customer !== null){
            customerName = session.customer.object;
        }
        let customerEmail: string | null;
        if (typeof session.customer !== "string" && session.customer !== null){
            customerEmail = (session.customer as Stripe.Customer).email;
        } else if (session.receipt_email){
            customerEmail = session.receipt_email;
        } else if (session.metadata.email){
            customerEmail = session.metadata.email;
        } else {
            customerEmail = null;
        }

        const payment: NewNocoDBRow<NocoDBPayment> = {
            StripeId: session.id,
            Amount: session.amount,
            CustomerEmail: customerEmail || "",
            CustomerName: customerName as string || "",
            CustomerTikTok: session.metadata.tiktok || "",
            StripeStatus: session.status,
            StripeCreatedAt: new Date(session.created * 1000).toISOString(),
        }

        const record = await createNocoDBRow(PAYMENTS_TABLE, payment);
        console.log("Created payment record: ", record.Id);
    }

    return res.send();
})

app.listen(3000, () => {
    console.log("Listening on port 3000");
});