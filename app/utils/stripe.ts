// Stripe utility functions for payment processing
import { pb } from './pb';

type StripeElements = unknown;
type StripePaymentIntent = unknown;
type StripeConfirmResult = { error?: { message?: string }; paymentIntent?: StripePaymentIntent };
type StripeInstance = {
  confirmPayment(args: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect: 'if_required';
  }): Promise<StripeConfirmResult>;
};
type StripeFactory = (publishableKey: string) => Promise<StripeInstance | null>;

let stripeInstance: StripeInstance | null = null;
let stripeConfig: { publishable_key: string; environment: string } | null = null;

const STRIPE_SCRIPT_SRC = 'https://js.stripe.com/v3/';
const STRIPE_SCRIPT_ID = 'stripe-js-sdk';

declare global {
  interface Window {
    Stripe?: StripeFactory;
  }
}

async function loadStripeFactory(): Promise<StripeFactory> {
  if (typeof window === 'undefined') {
    throw new Error('Stripe is only available in the browser');
  }

  if (window.Stripe) {
    return window.Stripe;
  }

  const existing = document.getElementById(STRIPE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Stripe SDK')), { once: true });
    });
    if (!window.Stripe) {
      throw new Error('Stripe SDK is unavailable after script load');
    }
    return window.Stripe;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = STRIPE_SCRIPT_ID;
    script.src = STRIPE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Stripe SDK'));
    document.head.appendChild(script);
  });

  if (!window.Stripe) {
    throw new Error('Stripe SDK is unavailable after script load');
  }
  return window.Stripe;
}

/**
 * Load Stripe configuration from backend
 */
export async function loadStripeConfig() {
  try {
    const config = await pb.send('/api/v1/stripe/config', {
      method: 'GET'
    });
    stripeConfig = config;
    return config;
  } catch (error) {
    console.error('Error loading Stripe config:', error);
    throw new Error('Stripe is not configured. Please contact support.');
  }
}

/**
 * Initialize Stripe.js with publishable key
 */
export async function initializeStripe(): Promise<StripeInstance> {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!stripeConfig) {
    await loadStripeConfig();
  }

  if (!stripeConfig?.publishable_key) {
    throw new Error('Stripe publishable key not found');
  }

  const factory = await loadStripeFactory();
  const stripe = await factory(stripeConfig.publishable_key);
  
  if (!stripe) {
    throw new Error('Failed to initialize Stripe');
  }

  stripeInstance = stripe;
  return stripe;
}

/**
 * Create a payment intent for one-time purchases
 */
export async function createPaymentIntent(type: 'course' | 'module', id: string) {
  try {
    const response = await pb.send('/api/v1/stripe/create-payment-intent', {
      method: 'POST',
      body: {
        type,
        id
      }
    });
    return response;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(error.message || 'Failed to create payment intent');
  }
}

/**
 * Confirm payment with Stripe Elements
 */
export async function confirmPayment(
  clientSecret: string, 
  elements: StripeElements,
  returnUrl?: string
) {
  const stripe = await initializeStripe();
  
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: returnUrl || window.location.href
    },
    redirect: 'if_required'
  });

  if (error) {
    throw new Error(error.message || 'Payment failed');
  }

  return paymentIntent;
}

/**
 * Create a checkout session for subscriptions
 */
export async function createCheckoutSession(
  tier: string, 
  interval: 'month' | 'year' = 'month'
) {
  try {
    const response = await pb.send('/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        tier,
        tier_id: tier,
        interval
      }
    });
    return response;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

/**
 * Redirect to Stripe Checkout for subscriptions
 */
export async function redirectToCheckout(
  tier: string, 
  interval: 'month' | 'year' = 'month'
) {
  const session = await createCheckoutSession(tier, interval);
  
  if (session.url) {
    window.location.href = session.url;
  } else {
    throw new Error('No checkout URL received');
  }
}

/**
 * Verify payment status
 */
export async function verifyPayment(paymentIntentId?: string, sessionId?: string) {
  try {
    const query: any = {};
    if (paymentIntentId) query.payment_intent_id = paymentIntentId;
    if (sessionId) query.session_id = sessionId;
    
    const response = await pb.send('/api/v1/stripe/verify-payment', {
      method: 'GET',
      query
    });
    return response;
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
}

/**
 * Get billing portal URL
 */
export async function getBillingPortalUrl() {
  try {
    const response = await pb.send('/api/v1/stripe/billing-portal', {
      method: 'GET'
    });
    return response.url;
  } catch (error: any) {
    console.error('Error getting billing portal URL:', error);
    throw new Error(error.message || 'Failed to get billing portal');
  }
}

/**
 * Open billing portal in new window
 */
export async function openBillingPortal() {
  const url = await getBillingPortalUrl();
  window.open(url, '_blank');
}

/**
 * Get subscription pricing
 */
export function getSubscriptionPricing() {
  return {
    basic: {
      month: 9.99,
      year: 99.99,
      name: 'Basic',
      features: ['Access to Basic tier courses', 'Monthly updates', 'Community support']
    },
    pro: {
      month: 19.99,
      year: 199.99,
      name: 'Pro',
      features: ['Access to Basic + Pro tier courses', 'Priority support', 'Advanced content', 'Certificates']
    },
    enterprise: {
      month: 49.99,
      year: 499.99,
      name: 'Enterprise',
      features: ['Access to all courses', 'Premium support', 'Exclusive content', 'Custom training', '1-on-1 mentoring']
    }
  };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}
