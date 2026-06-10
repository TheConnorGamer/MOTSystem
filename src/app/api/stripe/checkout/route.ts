import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe, isStripeConfigured, STRIPE_PRICE_ID } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured() || !STRIPE_PRICE_ID) {
    return NextResponse.json(
      { message: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/settings?success=true`,
      cancel_url: `${process.env.APP_URL}/settings?cancelled=true`,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE CHECKOUT] Error:", error);
    return NextResponse.json(
      { message: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
