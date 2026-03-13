/* ============================================================
   KGR PROPERTIES – Supabase Client
   All database and storage operations for the website.
   Falls back gracefully to localStorage when Supabase is
   not configured (development / offline mode).
   ============================================================ */

// ── Initialise Supabase client ─────────────────────────────────
let _supabase = null;

function getSupabaseClient() {
  if (!SUPABASE_CONFIGURED) return null;
  if (_supabase) return _supabase;
  try {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _supabase;
  } catch (e) {
    console.error('[KGR Supabase] Failed to create client:', e);
    return null;
  }
}

// ── Connection test (call on app start) ───────────────────────
async function testSupabaseConnection() {
  const client = getSupabaseClient();
  if (!client) return { ok: false, reason: 'Not configured' };
  const { error } = await client.from('properties').select('id').limit(1);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/* ================================================================
   DATABASE  –  Properties Table
   ================================================================ */

/**
 * Fetch all properties from Supabase.
 * Falls back to localStorage if not configured.
 */
async function fetchProperties(filters = {}) {
  const client = getSupabaseClient();
  if (!client) return getLocalProperties();

  let query = client
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.location) query = query.eq('location', filters.location);
  if (filters.type)     query = query.eq('type', filters.type);
  if (filters.featured) query = query.eq('featured', true);

  const { data, error } = await query;
  if (error) {
    console.error('[KGR Supabase] fetchProperties error:', error.message);
    return getLocalProperties();
  }
  return (data || []).map(normaliseRow);
}

/**
 * Insert a new property.
 * Also uploads image / layout files to Storage if provided.
 */
async function insertProperty(prop, photoFile = null, layoutFile = null) {
  const client = getSupabaseClient();

  // Upload images first
  let imageUrl  = prop.image  || '';
  let layoutUrl = prop.layoutUrl || '';

  if (photoFile) {
    const url = await uploadFile(BUCKET_PROPERTIES, photoFile);
    if (url) imageUrl = url;
  }
  if (layoutFile) {
    const url = await uploadFile(BUCKET_LAYOUTS, layoutFile);
    if (url) layoutUrl = url;
  }

  const row = toRow({ ...prop, image: imageUrl, layoutUrl });

  if (!client) {
    // localStorage fallback
    return saveLocalProperty(row);
  }

  const { data, error } = await client.from('properties').insert([row]).select().single();
  if (error) {
    console.error('[KGR Supabase] insertProperty error:', error.message);
    throw new Error(error.message);
  }
  return normaliseRow(data);
}

/**
 * Update an existing property.
 */
async function updateProperty(id, changes, newPhotoFile = null) {
  const client = getSupabaseClient();

  let imageUrl = changes.image || '';
  if (newPhotoFile) {
    const url = await uploadFile(BUCKET_PROPERTIES, newPhotoFile);
    if (url) imageUrl = url;
  }
  const row = toRow({ ...changes, image: imageUrl });

  if (!client) {
    return updateLocalProperty(id, row);
  }

  const { data, error } = await client
    .from('properties')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[KGR Supabase] updateProperty error:', error.message);
    throw new Error(error.message);
  }
  return normaliseRow(data);
}

/**
 * Delete a property by ID.
 */
async function deleteProperty(id) {
  const client = getSupabaseClient();
  if (!client) {
    return deleteLocalProperty(id);
  }
  const { error } = await client.from('properties').delete().eq('id', id);
  if (error) {
    console.error('[KGR Supabase] deleteProperty error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

/* ================================================================
   STORAGE  –  Image Upload / URL helpers
   ================================================================ */

/**
 * Upload a file to a Supabase Storage bucket.
 * Returns the public URL of the uploaded file, or null on failure.
 */
async function uploadFile(bucket, file) {
  const client = getSupabaseClient();
  if (!client || !file) return null;

  const ext  = file.name.split('.').pop();
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (upErr) {
    console.error(`[KGR Supabase] uploadFile error (${bucket}/${path}):`, upErr.message);
    return null;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
async function deleteStorageFile(bucket, publicUrl) {
  const client = getSupabaseClient();
  if (!client || !publicUrl) return;
  try {
    const path = publicUrl.split(`/${bucket}/`)[1];
    if (path) await client.storage.from(bucket).remove([path]);
  } catch (e) {
    console.warn('[KGR Supabase] deleteStorageFile skipped:', e);
  }
}

/**
 * List all files in a storage bucket.
 */
async function listStorageFiles(bucket) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.storage.from(bucket).list();
  if (error) return [];
  return (data || []).map(f => ({
    name: f.name,
    size: f.metadata?.size,
    url: client.storage.from(bucket).getPublicUrl(f.name).data?.publicUrl,
  }));
}

/* ================================================================
   DATA SHAPE HELPERS
   ================================================================ */

/** Convert app object → Supabase row (snake_case) */
function toRow(p) {
  return {
    title:      p.title      || '',
    type:       p.type       || '',
    location:   p.location   || '',
    area:       p.area       || '',
    price:      p.price      || '',
    price_num:  Number(p.priceNum || p.price_num || 0),
    description:p.description || '',
    contact:    p.contact    || '',
    map_link:   p.mapLink    || p.map_link || '',
    image_url:  p.image      || p.image_url || '',
    layout_url: p.layoutUrl  || p.layout_url || '',
    featured:   !!p.featured,
  };
}

/** Convert Supabase row (snake_case) → app object (camelCase) */
function normaliseRow(r) {
  return {
    id:          r.id,
    title:       r.title,
    type:        r.type,
    location:    r.location,
    area:        r.area,
    price:       r.price,
    priceNum:    r.price_num,
    description: r.description,
    contact:     r.contact,
    mapLink:     r.map_link,
    image:       r.image_url,
    layoutUrl:   r.layout_url,
    featured:    r.featured,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
  };
}

/* ================================================================
   LOCALSTORAGE FALLBACK  (used when Supabase is not configured)
   ================================================================ */

function getLocalProperties() {
  // Reuse existing getProperties() from main.js
  if (typeof getProperties === 'function') return getProperties();
  try { return JSON.parse(localStorage.getItem('kgr_properties') || '[]'); }
  catch { return []; }
}

function saveLocalProperty(row) {
  const props = getLocalProperties();
  const newId = Math.max(0, ...props.map(p => Number(p.id) || 0)) + 1;
  const newProp = normaliseRow({ id: newId, ...row, created_at: new Date().toISOString() });
  props.push(newProp);
  if (typeof saveProperties === 'function') saveProperties(props);
  else localStorage.setItem('kgr_properties', JSON.stringify(props));
  return newProp;
}

function updateLocalProperty(id, row) {
  const props = getLocalProperties();
  const idx = props.findIndex(p => String(p.id) === String(id));
  if (idx === -1) throw new Error('Property not found');
  props[idx] = { ...props[idx], ...normaliseRow({ id, ...row, updated_at: new Date().toISOString() }) };
  if (typeof saveProperties === 'function') saveProperties(props);
  else localStorage.setItem('kgr_properties', JSON.stringify(props));
  return props[idx];
}

function deleteLocalProperty(id) {
  let props = getLocalProperties();
  props = props.filter(p => String(p.id) !== String(id));
  if (typeof saveProperties === 'function') saveProperties(props);
  else localStorage.setItem('kgr_properties', JSON.stringify(props));
  return true;
}

/* ================================================================
   CONNECTION STATUS BANNER
   Shows a banner in admin pages if Supabase is not configured.
   ================================================================ */

function showSupabaseBanner() {
  if (SUPABASE_CONFIGURED) return;
  const banner = document.createElement('div');
  banner.id = 'supabase-banner';
  banner.innerHTML = `
    <style>
      #supabase-banner {
        position:fixed; top:0; left:0; right:0; z-index:9999;
        background:linear-gradient(90deg,#f59e0b,#d97706);
        color:#1a1a1a; padding:10px 20px;
        display:flex; align-items:center; justify-content:center; gap:12px;
        font-size:13px; font-weight:600; font-family:'Inter',sans-serif;
        box-shadow:0 2px 12px rgba(0,0,0,0.2);
      }
      #supabase-banner a {
        color:#1a1a1a; text-decoration:underline; font-weight:700;
      }
      #supabase-banner button {
        background:rgba(0,0,0,0.15); border:none; color:#1a1a1a;
        padding:2px 8px; border-radius:4px; cursor:pointer; font-size:12px;
      }
      body { padding-top: 40px; }
    </style>
    <i class="fa fa-database"></i>
    ⚠️ Supabase not connected – running on <strong>localStorage</strong>.
    <a href="#" onclick="openSupabaseSetup()">Connect Supabase →</a>
    <button onclick="document.getElementById('supabase-banner').remove(); document.body.style.paddingTop=''">✕</button>
  `;
  document.body.prepend(banner);
}

function openSupabaseSetup() {
  alert(
    'To connect Supabase:\n\n' +
    '1. Go to https://supabase.com and create a free project.\n' +
    '2. Open js/supabase-config.js in your editor.\n' +
    '3. Replace YOUR_SUPABASE_URL_HERE with your Project URL.\n' +
    '4. Replace YOUR_SUPABASE_ANON_KEY_HERE with your anon/public key.\n' +
    '5. Run the SQL schema from the setup guide.\n' +
    '6. Refresh this page.'
  );
}
