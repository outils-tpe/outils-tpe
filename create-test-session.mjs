// Script de test — crée une Checkout Session Stripe et affiche l'URL
// Usage : node create-test-session.mjs
import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{
    price: 'price_1TUjTE1mUe2uxKMxS9cypwVx',
    quantity: 1,
  }],
  metadata: {
    file_key: 'tresorerie-electricien.xlsx',
    product_slug: 'tresorerie-electricien',
  },
  customer_email: 'achatsthomas@gmail.com',
  success_url: 'http://localhost:3000',
  cancel_url: 'http://localhost:3000',
});

console.log('\n✅ Checkout Session créée');
console.log('👉 Ouvre cette URL dans ton navigateur :\n');
console.log(session.url);
console.log('\nCarte de test : 4242 4242 4242 4242 — exp: 12/34 — CVC: 123\n');
