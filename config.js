/* Public storefront settings. Never put a Supabase secret/service-role key here. */
window.WHAMSY_CONFIG = Object.freeze({
  // The shop can run in local preview mode until a Supabase project is connected.
  supabaseUrl: "",
  supabasePublishableKey: "",
  // WhatsApp requires country code and digits only. 0759807444 is normalized to Kenya's 254 format by the site.
  whatsappNumber: "0759807444"
});
