(async function () {
  if (!window.primeToneSupabase) return;
  const target = document.querySelector('[data-project-grid]');
  if (!target) return;
  try {
    const { data: projects, error } = await window.primeToneSupabase
      .from('projects').select('id,title,category,project_type,suburb,description,completed_date')
      .eq('published', true).order('created_at', { ascending: false });
    if (error) throw error;
    if (!projects?.length) return;
    target.innerHTML = '';
    for (const p of projects) {
      const { data: images } = await window.primeToneSupabase.from('project_images')
        .select('storage_path,image_type,sort_order').eq('project_id', p.id).order('sort_order');
      const cover = images?.find(i => i.image_type === 'cover') || images?.[0];
      const url = cover ? window.primeToneSupabase.storage.from('project-images').getPublicUrl(cover.storage_path).data.publicUrl : '';
      const card = document.createElement('article');
      card.className = 'card project-card';
      card.innerHTML = `${url ? `<img src="${url}" alt="${escapeHtml(p.title)}" loading="lazy">` : ''}<div class="card-body"><div class="eyebrow">${escapeHtml(p.category)} · ${escapeHtml(p.project_type)}</div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description || '')}</p><small>${escapeHtml(p.suburb || '')}</small></div>`;
      target.appendChild(card);
    }
  } catch (e) { console.warn('Project feed unavailable:', e); }

  function escapeHtml(v) { return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
})();
