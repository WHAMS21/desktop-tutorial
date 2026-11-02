# WHAMSY pillow shop

WHAMSY is a Kenya-first pillow shop built from the supplied brand idea. The home page is a moving dreamland: each falling pillow is a link into its collection. Customers can browse, search, filter, add pillows to a bag, and send an order request to WhatsApp.

## Run the preview

Open `index.html` in a browser. Choose one of the falling pillows or enter the shop. The included concept products and prices are examples. In local preview mode, product edits made in `admin.html` stay in that browser only.

## Manage products

Open `admin.html` to add, edit, publish, hide a price, feature, unpublish, or remove a product. Connect Supabase using `SUPABASE_SETUP.md` to enable owner sign-in, shared product updates and image uploads. Never add a Supabase secret or service-role key to the website.

## WhatsApp orders and payment

Checkout prepares a message for WHAMSY at **0759 807 444**. Customers review and send the message themselves. WHAMSY confirms the product, final amount and delivery, then gives payment instructions. The website does not collect money or automatically confirm M-Pesa payment.

## Publish

The included GitHub Actions workflow publishes the website from the `main` branch to GitHub Pages. The setup guide explains how to connect the online catalogue and enable Pages. The published page works without a build server; Supabase provides the shared catalogue and owner authentication.

## Project files

- `index.html` — animated entry page and brand homepage
- `shop.html`, `product.html`, `cart.html`, `checkout.html` — customer shopping journey
- `admin.html` — product manager
- `config.js` — public WhatsApp and Supabase project settings
- `store.js`, `app.js`, `admin.js` — catalogue, bag and owner tools
- `supabase/schema.sql` — tables, access rules, image bucket and hidden starter concepts
- `SUPABASE_SETUP.md` — step-by-step online catalogue setup
- `OWNER_SETUP.md` — launch and product-preparation checklist
