import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// ─── Helper: call Stripe REST API directly ────────────────────────────────────
async function stripePost<T>(path: string, body: Record<string, string>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  const params = new URLSearchParams(body).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as Record<string, string> | undefined;
    throw new Error(err?.message ?? `Stripe error ${res.status}`);
  }
  return json as T;
}

// ─── POST /api/payments/stripe ─────────────────────────────────────────────────
// Creates a Stripe Checkout Session and returns { url }
router.post("/payments/stripe", async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      amount,
      returnUrl = "https://veraapp.app/payment/return",
      cancelUrl = "https://veraapp.app/payment/cancel",
      currency = "aed",
    } = req.body as {
      orderId?: string;
      amount?: number;
      returnUrl?: string;
      cancelUrl?: string;
      currency?: string;
    };

    if (!orderId || !amount) {
      res.status(400).json({ error: "orderId and amount are required" });
      return;
    }

    // Amount in Stripe is in smallest currency unit (fils for AED)
    const amountInFils = Math.round(Number(amount) * 100);

    const session = await stripePost<{ id: string; url: string }>("/checkout/sessions", {
      "payment_method_types[]": "card",
      "line_items[0][price_data][currency]": currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(amountInFils),
      "line_items[0][price_data][product_data][name]": `طلب رقم ${orderId}`,
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: returnUrl.includes("?")
        ? `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`
        : `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      "metadata[orderId]": orderId,
    });

    req.log.info({ orderId, sessionId: session.id }, "Stripe session created");
    res.json({ url: session.url, sessionId: session.id, status: "pending" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initialization failed";
    req.log.error({ err }, "Stripe payment error");
    res.status(500).json({ error: message });
  }
});

// ─── GET /api/payments/stripe/session/:id ─────────────────────────────────────
// Verify a Stripe Checkout Session status
router.get("/payments/stripe/session/:id", async (req: Request, res: Response) => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });
      return;
    }

    const sessionRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${req.params.id}`,
      {
        headers: { Authorization: `Bearer ${key}` },
      },
    );
    const session = await sessionRes.json() as { payment_status: string; metadata?: { orderId?: string } };
    res.json({
      status: session.payment_status,
      orderId: session.metadata?.orderId,
    });
  } catch (err) {
    req.log.error({ err }, "Stripe session verify error");
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// ─── GET /api/payments/stripe/config ─────────────────────────────────────────
// Returns the publishable key so the app can use Stripe Elements if needed
router.get("/payments/stripe/config", (_req: Request, res: Response) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }
  res.json({ publishableKey });
});

export default router;
