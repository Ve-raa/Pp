import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// ─── JWT payload decode (no verification — buyer already authenticated with veraapp.app) ──
function decodeBuyerToken(token: string): { id?: string; sub?: string } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(json) as { id?: string; sub?: string };
  } catch {
    return null;
  }
}

function getBuyerIdFromRequest(req: Request): string | null {
  // Try cookie first
  const cookieToken: string | undefined = req.cookies?.buyer_token;
  if (cookieToken) {
    const payload = decodeBuyerToken(cookieToken);
    if (payload?.id ?? payload?.sub) return (payload?.id ?? payload?.sub) as string;
  }
  // Try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = decodeBuyerToken(token);
    if (payload?.id ?? payload?.sub) return (payload?.id ?? payload?.sub) as string;
  }
  // Try x-buyer-id header (fallback)
  const headerBuyerId = req.headers["x-buyer-id"];
  if (typeof headerBuyerId === "string" && headerBuyerId) return headerBuyerId;
  // Try body
  const bodyBuyerId = (req.body as Record<string, unknown>)?.buyerId;
  if (typeof bodyBuyerId === "string" && bodyBuyerId) return bodyBuyerId;
  return null;
}

// ─── POST /api/buyer/orders ────────────────────────────────────────────────────
// Create a new order
router.post("/buyer/orders", async (req: Request, res: Response) => {
  try {
    const buyerId = getBuyerIdFromRequest(req);
    const {
      items = [],
      paymentMethod,
      promoCode,
      address,
      notes,
      cartId,
    } = req.body as {
      items?: { serviceId: string; quantity: number; notes?: string }[];
      paymentMethod?: string;
      promoCode?: string;
      address?: string;
      notes?: string;
      cartId?: string;
    };

    if (!paymentMethod) {
      res.status(400).json({ error: "paymentMethod is required" });
      return;
    }

    const effectiveBuyerId = buyerId ?? cartId ?? "anonymous";

    const [created] = await db
      .insert(ordersTable)
      .values({
        buyerId: effectiveBuyerId,
        items: items as { serviceId: string; quantity: number; notes?: string }[],
        paymentMethod,
        promoCode: promoCode ?? null,
        address: address ?? null,
        notes: notes ?? null,
        status: "pending",
        paymentStatus: "unpaid",
      })
      .returning();

    req.log.info({ orderId: created.id, buyerId: effectiveBuyerId }, "Order created");
    res.status(201).json({ order: created, ...created });
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ─── GET /api/buyer/orders ─────────────────────────────────────────────────────
// List orders for the authenticated buyer
router.get("/buyer/orders", async (req: Request, res: Response) => {
  try {
    const buyerId = getBuyerIdFromRequest(req);
    if (!buyerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.buyerId, buyerId))
      .orderBy(ordersTable.createdAt);

    res.json({ orders, total: orders.length, page: 1, totalPages: 1 });
  } catch (err) {
    req.log.error({ err }, "List orders error");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── GET /api/buyer/orders/:id ────────────────────────────────────────────────
// Get a single order by ID
router.get("/buyer/orders/:id", async (req: Request, res: Response) => {
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, String(req.params.id)));

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order, ...order });
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ─── POST /api/buyer/orders/:id/cancel ───────────────────────────────────────
// Cancel an order
router.post("/buyer/orders/:id/cancel", async (req: Request, res: Response) => {
  try {
    const buyerId = getBuyerIdFromRequest(req);
    const orderId = String(req.params.id);
    const where = buyerId
      ? and(eq(ordersTable.id, orderId), eq(ordersTable.buyerId, buyerId))
      : eq(ordersTable.id, orderId);

    const [updated] = await db
      .update(ordersTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(where)
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ message: "Order cancelled", order: updated });
  } catch (err) {
    req.log.error({ err }, "Cancel order error");
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// ─── PATCH /api/buyer/orders/:id/payment ─────────────────────────────────────
// Update payment status after successful payment
router.patch("/buyer/orders/:id/payment", async (req: Request, res: Response) => {
  try {
    const { paymentId, paymentStatus = "paid" } = req.body as {
      paymentId?: string;
      paymentStatus?: string;
    };

    const [updated] = await db
      .update(ordersTable)
      .set({
        paymentId: paymentId ?? null,
        paymentStatus,
        status: paymentStatus === "paid" ? "confirmed" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, String(req.params.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ message: "Payment updated", order: updated });
  } catch (err) {
    req.log.error({ err }, "Update order payment error");
    res.status(500).json({ error: "Failed to update payment" });
  }
});

export default router;
