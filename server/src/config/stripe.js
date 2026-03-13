import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY;
export const PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY;

export default stripe;
