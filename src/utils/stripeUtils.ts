// utils/stripeUtils.ts
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Define the publishable key directly in the code for development
// In production, you'd want to use environment variables properly
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51R7H4J2HnHW7tLHFEN8McrwWHqYLOKQsrcMdZYKmYrPqcTCysJAS8vlPJVXVF2AUKf6tmsvxkpi4JK3h86bODjsA00u8osOvnP';

// Create a singleton Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Initialize Stripe
 * @returns A Promise that resolves to a Stripe instance
 */
export const initStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    console.log('Initializing Stripe with publishable key');
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

/**
 * Redirect to Stripe Checkout
 * @param sessionId The Stripe checkout session ID
 * @returns A Promise that resolves when redirection is complete
 */
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  try {
    console.log(`Redirecting to checkout with session ID: ${sessionId}`);
    
    // Reset stripe promise to get a fresh instance
    stripePromise = null;
    
    // Get Stripe instance
    const stripe = await initStripe();
    
    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }
    
    // Redirect to checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId.trim().replace(/\s+/g, '') // Ensure no whitespace
    });
    
    // Handle any errors
    if (error) {
      console.error('Stripe redirect error:', error);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error('Error redirecting to Stripe checkout:', err);
    throw err;
  }
};