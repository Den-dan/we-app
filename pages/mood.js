async function renderMood() {
  const el = document.getElementById('page-mood');
  const user = window.currentUser;
  const today = new Date().toISOString().split('T')[0];

  const { data: myMood } = await db.from('mood').select().eq('user_id', user.id).eq('date', today).single();
  const { data: partner } = await db.from('profiles').select().eq('couple_id', user.couple_id).neq('id', user.id).single();
  const { data: partnerMood } = partner ? await db.from('mood').select().eq('user_id', partner.id).eq('date', today).single() : { data: null };
  const { data: history } = await db.from('mood').select().eq('couple_id', user.couple_id).order('date', { ascending: false }).limit(14);

  const moodEmoji = ['😔','😕','😐','🙂','😊'];
  const moodLabel = ['Плохо','Так себе','Нормально','Хорошо','Отлично'];

  el.innerHTML = `
    <div class="fade-in">
      <h2 class="page-title">Настроение</h2>

      <!-- Сегодня -->
      <div class="card" style="margin-bottom:16px;">
        <p class="section-title" style="margin-bottom:16px;">как ты сегодня?</p>
        <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
          ${[1,2,3,4,5].map(i => `
            <button onclick="setMood(${i})" style="
              font-size:32px; padding:8px; border-radius:var(--radius-sm);
              background:${myMood?.score === i ? 'var(--accent-glow)' : 'transparent'};
              border:2px solid ${myMood?.score === i ? 'var(--accent-primary)' : 'transparent'};
              transition:all 0.2s;
            ">${moodEmoji[i-1]}</button>
          `).join('')}
        </div>
        ${myMood ? `<p style="text-align:center; color:var(--accent-secondary); font-weight:600;">${moodLabel[myMood.score-1]}</p>` : `<p style="text-align:center; color:var(--text-muted); font-size:13px;">выбери своё настроение</p>`}
      </div>

      <!-- Партнёр -->
      <div class="card" style="margin-bottom:16px;">
        <p class="section-title" style="margin-bottom:12px;">${partner?.name || 'партнёр'} сегодня</p>
        <div style="text-align:center; font-size:48px;">
          ${partnerMood ? moodEmoji[partnerMood.score-1] : '—'}
        </div>
        ${partnerMood ? `<p style="text-align:center; color:var(--text-muted); margin-top:8px;">${moodLabel[partnerMood.score-1]}</p>` : `<p style="text-align:center; color:var(--text-muted); font-size:13px; margin-top:8px;">ещё не отметил(а)</p>`}
      </div>

      <!-- История -->
      <p class="section-title" style="margin-bottom:12px;">последние 14 дней</p>
      <div class="card">
        ${history?.length ? history.map(m => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border);">
            <p style="font-size:13px; color:var(--text-muted);">${new Date(m.date).toLocaleDateString('ru', {day:'numeric', month:'short'})}</p>
            <span style="font-size:24px;">${moodEmoji[m.score-1]}</span>
            <p style="font-size:13px; color:var(--text-secondary);">${moodLabel[m.score-1]}</p>
          </div>
        `).join('') : `<p style="text-align:center; color:var(--text-muted);">История пуста</p>`}
      </div>
    </div>
  `;
}

async function setMood(score) {
  const user = window.currentUser;
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await db.from('mood').select().eq('user_id', user.id).eq('date', today).single();

  if (existing) {
    await db.from('mood').update({ score }).eq('id', existing.id);
  } else {
    await db.from('mood').insert({ user_id: user.id, couple_id: user.couple_id, date: today, score });
  }
  renderMood();
}