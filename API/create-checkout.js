// netlify/functions/create-checkout.js
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  IRRIGOLD_2: process.env.STRIPE_PRICE_IRRIGOLD_2,
  IRRIGOLD_3: process.env.STRIPE_PRICE_IRRIGOLD_3,
  IRRIGOLD_4: process.env.STRIPE_PRICE_IRRIGOLD_4,
  IRRIGOLD_5: process.env.STRIPE_PRICE_IRRIGOLD_5,
  IRRIGOLD_6: process.env.STRIPE_PRICE_IRRIGOLD_6,
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { model, qty, notes, province } = JSON.parse(event.body || "{}");
    const quantity = Math.max(1, Math.min(10, parseInt(qty || 1, 10)));

    const price = PRICE_MAP[model];
    if (!price) return { statusCode: 400, body: "Modello non valido" };

    const origin = event.headers.origin || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity }],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#checkout`,
      metadata: {
        product: "IRRIGOLD",
        model: String(model),
        notes: String(notes || "").slice(0, 450),
        province: String(province || "").slice(0, 40),
      },
      shipping_address_collection: { allowed_countries: ["IT"] },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
};
