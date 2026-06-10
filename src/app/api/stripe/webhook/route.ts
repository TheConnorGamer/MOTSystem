import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { message: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[STRIPE WEBHOOK] Signature verification failed:", message);
    return NextResponse.json(
      { message: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log("[STRIPE WEBHOOK] Event received:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;

        if (!userId) {
          console.error("[STRIPE WEBHOOK] Missing userId in metadata");
          return NextResponse.json({ message: "Missing userId" }, { status: 400 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: "PRO",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionExpiry: null, // subscription is active, no expiry needed
          },
        });

        await prisma.activityLog.create({
          data: {
            userId,
            action: "SUBSCRIPTION_CREATED",
            details: JSON.stringify({
              customerId,
              subscriptionId,
              sessionId: checkoutSession.id,
            }),
          },
        });

        console.log(`[STRIPE WEBHOOK] User ${userId} upgraded to PRO`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: "FREE",
              stripeSubscriptionId: null,
            },
          });

          console.log(`[STRIPE WEBHOOK] User ${userId} downgraded to FREE`);
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Processing error:", error);
    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
