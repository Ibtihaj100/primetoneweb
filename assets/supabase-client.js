(function () {
  if (!window.supabase || !window.PRIME_TONE_SUPABASE_URL || window.PRIME_TONE_SUPABASE_URL.includes('YOUR-PROJECT')) return;
  window.primeToneSupabase = window.supabase.createClient(
    window.PRIME_TONE_SUPABASE_URL,
    window.PRIME_TONE_SUPABASE_KEY
  );
})();
