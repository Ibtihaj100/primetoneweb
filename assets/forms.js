(function () {
  const db = () => window.primeToneSupabase;
  const endpoint = () => `${window.PRIME_TONE_SUPABASE_URL}/functions/v1/notify-submission`;

  function msg(form, text, ok) {
    const el = form.querySelector('.form-message');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    el.style.color = ok ? '#2f9e67' : '#c0392b';
  }

  async function notify(type, id) {
    const res = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: window.PRIME_TONE_SUPABASE_KEY,
        Authorization: `Bearer ${window.PRIME_TONE_SUPABASE_KEY}`
      },
      body: JSON.stringify({ type, id })
    });
    if (!res.ok) throw new Error('Notification request failed');
  }

  function value(form, name) {
    const el = form.querySelector(`[name="${name}"]`);
    return el ? el.value.trim() : '';
  }

  async function handleQuote(form) {
    if (!db()) return msg(form, 'Please connect the Supabase settings before using the live form.', false);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const { data, error } = await db().from('inquiries').insert({
        name: value(form, 'name'), phone: value(form, 'phone'), email: value(form, 'email'),
        property_type: value(form, 'property_type'), project_type: value(form, 'project_type'),
        suburb: value(form, 'suburb'), preferred_date: value(form, 'preferred_date'),
        message: value(form, 'message'), source: 'quote-page'
      }).select('id').single();
      if (error) throw error;
      await notify('inquiry', data.id);
      form.reset();
      msg(form, 'Thank you. Your quote request has been received.', true);
    } catch (e) {
      console.error(e);
      msg(form, 'We could not send your request. Please call us directly or try again.', false);
    } finally {
      button.disabled = false;
      button.textContent = 'Send Quote Request →';
    }
  }

  async function handleContact(form) {
    if (!db()) return msg(form, 'Please connect the Supabase settings before using the live form.', false);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Sending…';
    try {
      const { data, error } = await db().from('inquiries').insert({
        name: value(form, 'name'), phone: value(form, 'phone'), email: value(form, 'email'),
        message: value(form, 'message'), source: 'contact-page'
      }).select('id').single();
      if (error) throw error;
      await notify('inquiry', data.id);
      form.reset();
      msg(form, 'Thanks — your message has been sent.', true);
    } catch (e) {
      console.error(e);
      msg(form, 'We could not send your message. Please try again.', false);
    } finally { button.disabled = false; button.textContent = 'Send Message →'; }
  }

  async function handleReview(form) {
    if (!db()) return msg(form, 'Please connect the Supabase settings before using the live form.', false);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Submitting…';
    try {
      const { data, error } = await db().from('comments').insert({
        customer_name: value(form, 'customer_name'), email: value(form, 'email') || null,
        rating: Number(value(form, 'rating')), project_type: value(form, 'project_type'),
        comment: value(form, 'comment')
      }).select('id').single();
      if (error) throw error;
      await notify('comment', data.id);
      form.reset();
      msg(form, 'Thank you for your review. It has been submitted for approval.', true);
    } catch (e) {
      console.error(e);
      msg(form, 'We could not submit your review. Please try again.', false);
    } finally { button.disabled = false; button.textContent = 'Submit Review →'; }
  }

  document.querySelectorAll('[data-quote-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); handleQuote(f); }));
  document.querySelectorAll('[data-contact-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); handleContact(f); }));
  document.querySelectorAll('[data-review-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); handleReview(f); }));
})();
