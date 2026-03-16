import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pro tier prices
export const PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_MONTHLY;
export const PRICE_PRO_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY || process.env.STRIPE_PRICE_YEARLY;

// Max tier prices
export const PRICE_MAX_MONTHLY = process.env.STRIPE_PRICE_MAX_MONTHLY;
export const PRICE_MAX_YEARLY = process.env.STRIPE_PRICE_MAX_YEARLY;

// Legacy exports for backward compatibility
export const PRICE_MONTHLY = PRICE_PRO_MONTHLY;
export const PRICE_YEARLY = PRICE_PRO_YEARLY;

// Map price IDs to plan names
export function getPlanFromPriceId(priceId) {
  if (priceId === PRICE_PRO_MONTHLY || priceId === PRICE_PRO_YEARLY) return 'pro';
  if (priceId === PRICE_MAX_MONTHLY || priceId === PRICE_MAX_YEARLY) return 'max';
  return 'pro'; // default fallback
}

export default stripe;
