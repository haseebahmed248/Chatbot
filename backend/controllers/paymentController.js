import Stripe from 'stripe';
import dotenv from 'dotenv';
import encryptData from '../utils/encryptData.js';
import prisma from "../prisma/client.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Define credit amounts for each plan
const PLAN_CREDITS = {
  'Basic': 10000,    // Words for Basic plan
  'Premium': 30000,  // Words for Premium plan
  'Diamond': 60000   // Words for Diamond plan
};

// Update in your paymentController.js on the backend

export const createCheckoutSession = async (req, res) => {
  const { plan, price, userId } = req.body;

  if (!plan || price === undefined || !userId) {
    const encryptedResponse = encryptData({ message: "All fields are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Store plan metadata to use when payment completes
    const metadata = {
      userId: userId.toString(),
      plan: plan,
      creditsAmount: PLAN_CREDITS[plan].toString(),
      displayPrice: price.toString(),
      isDevelopment: 'true' // Flag to indicate this is a development transaction
    };

    // For development - use Stripe's test mode with a small amount instead of zero
    // This prevents issues with Stripe's validation while still not charging real money
    const unitAmount = process.env.NODE_ENV === 'production' ? Math.round(price * 100) : 200; // 200 cents in test mode
    
    console.log(`Creating checkout session for plan: ${plan}, user: ${userId}, amount: ${unitAmount} cents`);

    // Create the checkout session with minimal configuration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: `${plan} Plan ${process.env.NODE_ENV !== 'production' ? '(Development)' : ''}`,
              description: `${PLAN_CREDITS[plan]} words per month`,
            },
            unit_amount: unitAmount, // Small amount for test mode, real price for production
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/payment-result?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&result=success`,
      cancel_url: `${frontendUrl}/payment-result?session_id={CHECKOUT_SESSION_ID}&result=failure`,
      metadata: metadata
    });

    console.log(`Session created with ID: ${session.id}`);
    
    // For development, auto-fulfill free plans without requiring payment
    if (plan === 'Basic' || (process.env.NODE_ENV !== 'production' && price === 0)) {
      // For completely free plans or in development mode with price=0, fulfill immediately
      try {
        console.log(`Auto-fulfilling free plan: ${plan} for user: ${userId}`);
        
        await fulfillSubscription({
          metadata: {
            userId: userId.toString(),
            plan: plan,
            creditsAmount: PLAN_CREDITS[plan].toString()
          },
          id: `dev_${Date.now()}_${userId}` // Fake session ID for tracking
        });
        
        // Return both the session ID (for normal flow) and a flag indicating it was auto-fulfilled
        const encryptedResponse = encryptData({ 
          id: session.id,
          autoFulfilled: true,
          message: "Free plan activated immediately"
        });
        return res.status(200).json({ data: encryptedResponse });
      } catch (fulfillError) {
        console.error("Error auto-fulfilling free plan:", fulfillError);
        // Even if auto-fulfill fails, still return the session ID for normal checkout flow
      }
    }

    const encryptedResponse = encryptData({ id: session.id });
    return res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    console.error(error.stack);

    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

export const verifySession = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    const encryptedResponse = encryptData({ valid: false, message: "Session ID is required" });
    return res.status(400).json({ data: encryptedResponse });
  }

  // Handle development auto-fulfilled sessions
  if (sessionId.startsWith('dev_')) {
    const encryptedResponse = encryptData({ 
      valid: true,
      message: "Development mode - subscription already activated",
      newBalance: 0, // You might want to query the database for actual values
      plan: "Development"
    });
    return res.status(200).json({ data: encryptedResponse });
  }

  try {
    console.log(`Verifying session: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`Session status: ${session.status}, payment status: ${session.payment_status}`);

    // For development mode, consider any session as paid
    const isPaid = process.env.NODE_ENV !== 'production' || session.payment_status === 'paid';

    if (session && (isPaid || session.status === 'complete')) {
      // Extract metadata from the session
      const userId = parseInt(session.metadata.userId);
      const plan = session.metadata.plan;
      const creditsAmount = parseInt(session.metadata.creditsAmount);
      
      if (!userId || !creditsAmount) {
        const encryptedResponse = encryptData({ 
          valid: false, 
          message: "Invalid session metadata" 
        });
        return res.status(400).json({ data: encryptedResponse });
      }
      
      // Add credits to user account
      try {
        console.log(`Fulfilling subscription for user: ${userId}, plan: ${plan}, credits: ${creditsAmount}`);
        
        // Start a transaction
        const result = await prisma.$transaction(async (prisma) => {
          // First add the transaction record
          const transaction = await prisma.credit_transactions.create({
            data: {
              user_id: userId,
              amount: creditsAmount,
              description: `Added ${creditsAmount} credits for ${plan} plan subscription`,
              transaction_type: "subscription",
              payment_id: session.id
            }
          });
          
          // Then update the user's credits
          const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: {
              credits: {
                increment: creditsAmount
              },
              subscription_plan: plan,
              subscription_start_date: new Date(),
              // Set expiration date to 30 days from now for monthly, 365 for yearly
              subscription_end_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) 
            },
            select: { credits: true, subscription_plan: true }
          });
          
          return { transaction, updatedUser };
        });
        
        console.log(`Credits added successfully, new balance: ${result.updatedUser.credits}`);
        
        const encryptedResponse = encryptData({ 
          valid: true,
          message: `Successfully added ${creditsAmount} credits for ${plan} plan`,
          newBalance: result.updatedUser.credits,
          plan: result.updatedUser.subscription_plan
        });
        return res.status(200).json({ data: encryptedResponse });
        
      } catch (dbError) {
        console.error("Error adding credits to user account:", dbError);
        const encryptedResponse = encryptData({ 
          valid: false, 
          message: dbError.message 
        });
        return res.status(500).json({ data: encryptedResponse });
      }
    } else if (session && session.status === 'cancelled') {
      const encryptedResponse = encryptData({ 
        valid: false, 
        message: "Payment was cancelled" 
      });
      return res.status(200).json({ data: encryptedResponse });
    } else {
      const encryptedResponse = encryptData({ 
        valid: false,
        message: "Invalid session status"
      });
      return res.status(200).json({ data: encryptedResponse });
    }

  } catch (error) {
    console.error('Session verification error:', error);

    const encryptedResponse = encryptData({ valid: false, message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Webhook handler for asynchronous events
export const handleWebhook = async (req, res) => {
  // For Stripe webhooks, we need raw body
  const rawBody = req.rawBody || req.body;
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!sig || !endpointSecret) {
    console.warn('Missing webhook signature or endpoint secret');
    return res.status(400).send('Webhook configuration error');
  }
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received webhook event: ${event.type}`);

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Call a function to fulfill the subscription
    try {
      await fulfillSubscription(session);
    } catch (err) {
      console.error(`Error fulfilling subscription: ${err.message}`);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send({ received: true });
};

// Function to fulfill subscription (can be called by webhook or directly)
const fulfillSubscription = async (session) => {
  const userId = parseInt(session.metadata.userId);
  const plan = session.metadata.plan;
  const creditsAmount = parseInt(session.metadata.creditsAmount);
  
  if (!userId || !creditsAmount) {
    throw new Error("Invalid session metadata");
  }
  
  console.log(`Fulfilling subscription via dedicated function - User: ${userId}, Plan: ${plan}, Credits: ${creditsAmount}`);
  
  // Transaction to add credits and update subscription details
  return await prisma.$transaction(async (prisma) => {
    // First add the transaction record
    const transaction = await prisma.credit_transactions.create({
      data: {
        user_id: userId,
        amount: creditsAmount,
        description: `Added ${creditsAmount} credits for ${plan} plan subscription`,
        transaction_type: "subscription",
        payment_id: session.id
      }
    });
    
    // Then update the user's credits and subscription details
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditsAmount
        },
        subscription_plan: plan,
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
      }
    });
    
    return { transaction, updatedUser };
  });
};