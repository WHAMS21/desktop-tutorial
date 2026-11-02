/* WHAMSY catalogue, WhatsApp and optional Supabase connection. */
(() => {
  "use strict";

  const config = window.WHAMSY_CONFIG || {};
  const apiUrl = String(config.supabaseUrl || "").replace(/\/+$/, "");
  const publishableKey = String(config.supabasePublishableKey || "").trim();
  const sessionKey = "whamsy_admin_session_v1";
  const localProductsKey = "whamsy_local_catalog_v1";
  const demoMode = !(apiUrl && publishableKey);
  const categories = { REST: "WHAMSY REST", HOME: "WHAMSY HOME", PLAY: "WHAMSY PLAY", DREAMS: "WHAMSY DREAMS" };
  const seedProducts = [
    { id: "classic-cloud", slug: "classic-cloud", name: "Classic Cloud Pillow", category: "REST", description: "A calm everyday pillow concept in soft ivory.", price_ksh: 2499, show_price: true, image_url: "assets/product-cloud.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 10 },
    { id: "sage-cushion", slug: "sage-cushion", name: "Sage Cushion", category: "HOME", description: "A gentle green accent for a favourite corner.", price_ksh: 2199, show_price: true, image_url: "assets/product-sage.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 20 },
    { id: "pixel-buddy", slug: "pixel-buddy", name: "Pixel Buddy", category: "PLAY", description: "An original playful character pillow concept.", price_ksh: 2899, show_price: true, image_url: "assets/collection-play.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: true, sort_order: 30 },
    { id: "star-dream", slug: "star-dream", name: "Star Dream Pillow", category: "DREAMS", description: "A playful star-shaped idea for dreamy spaces.", price_ksh: 1999, show_price: true, image_url: "assets/product-star.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 40 },
    { id: "royal-cloud", slug: "royal-cloud", name: "Royal Cloud Pillow", category: "DREAMS", description: "A little cloud character with a golden crown.", price_ksh: 2799, show_price: true, image_url: "assets/product-royal.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 50 },
    { id: "cloud-rest", slug: "cloud-rest", name: "Cloud Rest Pillow", category: "REST", description: "A soft, simple sleeping-pillow concept.", price_ksh: 2399, show_price: true, image_url: "assets/collection-rest.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 60 },
    { id: "layered-home", slug: "layered-home", name: "Layered Home Cushion", category: "HOME", description: "A mix-and-match cushion styling concept.", price_ksh: 2299, show_price: true, image_url: "assets/collection-home.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 70 },
    { id: "moon-dream", slug: "moon-dream", name: "Moon Dream Pillow", category: "DREAMS", description: "A celestial shape concept for a softer room.", price_ksh: 2599, show_price: true, image_url: "assets/collection-dreams.jpg", materials: "", dimensions: "", care_instructions: "", availability: "in_stock", is_active: true, is_featured: false, sort_order: 80 }
  ];

  function money(amount) {
    return amount === null || amount === undefined || amount === "" ? "Price on WhatsApp" : "KSh " + new Intl.NumberFormat("en-KE").format(Number(amount));
  }
  function normalizePhone(raw) {
    let digits = String(raw || "").replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "254" + digits.slice(1);
    if (digits.startsWith("+")) digits = digits.slice(1);
    return digits;
  }
  function normalizeProduct(p) {
    return {
      ...p,
      id: String(p.id),
      name: String(p.name || "Untitled pillow"),
      category: String(p.category || "DREAMS").toUpperCase(),
      description: String(p.description || ""),
      price_ksh: p.price_ksh === "" || p.price_ksh === undefined ? null : (p.price_ksh === null ? null : Number(p.price_ksh)),
      show_price: p.show_price !== false,
      image_url: String(p.image_url || p.image || "assets/product-cloud.jpg"),
      materials: String(p.materials || ""),
      dimensions: String(p.dimensions || ""),
      care_instructions: String(p.care_instructions || ""),
      availability: String(p.availability || "in_stock"),
      is_active: p.is_active !== false,
      is_featured: p.is_featured === true,
      sort_order: Number(p.sort_order || 100)
    };
  }
  function readLocalProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(localProductsKey) || "null");
      if (Array.isArray(saved)) return saved.map(normalizeProduct);
    } catch (_) { /* Fall back to the concept catalogue when storage is unavailable. */ }
    return seedProducts.map(normalizeProduct);
  }
  function writeLocalProducts(products) {
    try {
      localStorage.setItem(localProductsKey, JSON.stringify(products.map(normalizeProduct)));
      return true;
    } catch (_) {
      throw new Error("This browser could not save the preview catalogue. Try a smaller image or connect the online store.");
    }
  }
  function readSession() {
    try { return JSON.parse(localStorage.getItem(sessionKey) || "null"); }
    catch (_) { return null; }
  }
  function saveSession(session) {
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }
  function sessionRecord(data) {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (Number(data.expires_in || 3600) * 1000),
      user: data.user
    };
  }
  async function authJson(path, body, bearer) {
    const headers = { apikey: publishableKey, "content-type": "application/json" };
    if (bearer) headers.authorization = "Bearer " + bearer;
    const response = await fetch(apiUrl + path, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.msg || data.message || data.error_description || "The secure store connection did not respond.");
    return data;
  }
  async function getSession() {
    const session = readSession();
    if (!session || !session.access_token || !session.refresh_token) return null;
    if (Number(session.expires_at || 0) > Date.now() + 60000) return session;
    try {
      const refreshed = await authJson("/auth/v1/token?grant_type=refresh_token", { refresh_token: session.refresh_token });
      const next = sessionRecord(refreshed);
      saveSession(next);
      return next;
    } catch (_) {
      localStorage.removeItem(sessionKey);
      return null;
    }
  }
  async function request(path, options = {}) {
    if (!apiUrl || !publishableKey) throw new Error("The online product store is not connected yet.");
    const headers = { apikey: publishableKey };
    const session = options.auth === false ? null : await getSession();
    headers.authorization = "Bearer " + (session ? session.access_token : publishableKey);
    if (options.body instanceof Blob) headers["content-type"] = options.body.type || "application/octet-stream";
    else if (options.body) headers["content-type"] = "application/json";
    if (options.prefer) headers.prefer = options.prefer;
    const response = await fetch(apiUrl + (options.servicePrefix || "") + path, {
      method: options.method || "GET",
      headers,
      body: options.body ? (options.body instanceof Blob ? options.body : JSON.stringify(options.body)) : undefined
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
    if (!response.ok) throw new Error(data && (data.message || data.msg || data.error_description) ? (data.message || data.msg || data.error_description) : "The online store request could not be completed.");
    return data;
  }
  async function isAdmin() {
    if (demoMode) return true;
    const session = await getSession();
    if (!session || !session.user || !session.user.id) return false;
    const rows = await request("/rest/v1/admin_users?select=user_id&user_id=eq." + encodeURIComponent(session.user.id));
    return Array.isArray(rows) && rows.some(row => row.user_id === session.user.id);
  }
  async function signIn(email, password) {
    if (demoMode) throw new Error("Owner sign-in becomes available after the online store is connected.");
    const data = await authJson("/auth/v1/token?grant_type=password", { email, password });
    saveSession(sessionRecord(data));
    if (!(await isAdmin())) {
      localStorage.removeItem(sessionKey);
      throw new Error("This account is not on the WHAMSY owner list yet. Ask the store owner to grant access in the setup guide.");
    }
    return data.user;
  }
  async function signOut() {
    const session = await getSession();
    try {
      if (session && !demoMode) await request("/auth/v1/logout", { method: "POST" });
    } finally { localStorage.removeItem(sessionKey); }
  }
  async function loadProducts(includeInactive = false) {
    if (demoMode) {
      const all = readLocalProducts();
      return includeInactive ? all : all.filter(product => product.is_active);
    }
    if (includeInactive && !(await isAdmin())) throw new Error("Sign in with the WHAMSY owner account to manage products.");
    const filter = includeInactive ? "" : "&is_active=eq.true";
    const result = await request("/rest/v1/products?select=*&order=sort_order.asc,created_at.desc" + filter, { auth: includeInactive ? true : false });
    return (Array.isArray(result) ? result : []).map(normalizeProduct);
  }
  async function saveProduct(product) {
    const clean = { ...product };
    delete clean.id;
    if (demoMode) {
      const all = readLocalProducts();
      const id = product.id || "local-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const next = normalizeProduct({ ...clean, id });
      const index = all.findIndex(item => item.id === id);
      if (index >= 0) all[index] = next; else all.unshift(next);
      writeLocalProducts(all);
      return next;
    }
    if (!(await isAdmin())) throw new Error("Sign in with the WHAMSY owner account to manage products.");
    const method = product.id ? "PATCH" : "POST";
    const safePath = product.id ? "/rest/v1/products?id=eq." + encodeURIComponent(product.id) + "&select=*" : "/rest/v1/products?select=*";
    const rows = await request(safePath, { method, body: clean, prefer: "return=representation" });
    return normalizeProduct(Array.isArray(rows) ? rows[0] : rows);
  }
  async function deleteProduct(product) {
    if (demoMode) {
      writeLocalProducts(readLocalProducts().filter(item => item.id !== product.id));
      return;
    }
    if (!(await isAdmin())) throw new Error("Sign in with the WHAMSY owner account to manage products.");
    await request("/rest/v1/products?id=eq." + encodeURIComponent(product.id), { method: "DELETE" });
    if (product.image_path) await deleteImage(product.image_path).catch(() => {});
  }
  async function uploadImage(file) {
    if (demoMode) throw new Error("Connect the online store first to upload and share product images. You can use an image URL for this local preview.");
    if (!(await isAdmin())) throw new Error("Sign in with the WHAMSY owner account before uploading an image.");
    if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image smaller than 5 MB.");
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = Date.now().toString(36) + "-" + crypto.randomUUID() + "." + extension;
    const urlPath = "/storage/v1/object/whamsy-products/" + encodeURIComponent(path);
    await request(urlPath, { method: "POST", body: file, prefer: "return=minimal" });
    return { image_path: path, image_url: apiUrl + "/storage/v1/object/public/whamsy-products/" + encodeURIComponent(path) };
  }
  async function deleteImage(path) {
    if (!path || demoMode) return;
    await request("/storage/v1/object/whamsy-products", { method: "DELETE", body: { prefixes: [path] } });
  }

  window.WHAMSY_STORE = Object.freeze({
    categories, demoMode, money, normalizePhone, normalizeProduct,
    loadProducts, saveProduct, deleteProduct, uploadImage, deleteImage,
    signIn, signOut, isAdmin, getSession,
    getWhatsAppNumber: () => normalizePhone(config.whatsappNumber),
    getApiUrl: () => apiUrl,
    getLocalCatalogKey: () => localProductsKey
  });
})();
