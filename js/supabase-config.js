/* ============================================================
   KGR PROPERTIES – Supabase Configuration
   ============================================================
   1. Go to https://supabase.com → Create a project
   2. Dashboard → Project Settings → API
   3. Copy "Project URL" → paste into SUPABASE_URL below
   4. Copy "anon public" key → paste into SUPABASE_ANON_KEY below
   ============================================================ */

const SUPABASE_URL      = 'https://ubntniaruyklhcptregd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibnRuaWFydXlrbGhjcHRyZWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTQ4OTEsImV4cCI6MjA4ODk3MDg5MX0.m4sQIU37LSbFjB04niQr25-C9Ix_ikXop7KNlMGsL8E';

// ── Storage bucket names ──────────────────────────────────────
const BUCKET_PROPERTIES = 'property-images';   // property photos
const BUCKET_LAYOUTS    = 'layout-maps';        // layout / site maps

// ── Auto-detect if Supabase is properly configured ───────────
const SUPABASE_CONFIGURED =
  SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  SUPABASE_URL.startsWith('https://');
