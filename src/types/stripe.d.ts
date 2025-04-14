// src/types/stripe.d.ts
// This file helps TypeScript find the Stripe types

declare module '@stripe/stripe-js' {
    export interface Stripe {
      redirectToCheckout(options: {
        sessionId: string;
      }): Promise<{ error?: { message: string } }>;
    }
    
    export function loadStripe(publicKey: string): Promise<Stripe | null>;
  }