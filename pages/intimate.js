async function renderIntimate() {
  const el = document.getElementById('page-intimate');
  const user = window.currentUser;
  const today = new Date().toISOString().split('T')[0];

  const { data: myIntimate } = await db.from('intimate').select().eq('user_id', user.id).eq('date', today).single();
  const { data: partner } = await db.from('profiles').select().eq('couple_id', user.couple_id).neq('id', user.id).single();
  const { data: partnerIntimate } = partner ? await db.from('intimate').select().eq('user_id', partner.id).eq('date', today).single() : { data: null };
  const { data: cycle } = await db.from('cycle').select().eq('couple_id', user.couple_id).order('period_start', { ascending: false }).limit(3);

  const libidoEmoji = ['🥱','😐','🙂','😏','🔥'];
  const libidoLabel = ['Нет желания','Слабое','Среднее','Высокое','Очень высокое'];

  el.innerHTML = `
    <div class="fade-in">
      <h2 class="page-title">Близость</h2>

      <!-- Либидо -->
      <div class="card" style="margin-bottom:16px;">
        <p class="section-title" style="margin-bottom:16px;">твоё желание сегодня</p>
        <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
          ${[1,2,3,4,5].map(i => `
            <button onclick="setLibido(${i})" style="
              font-size:32px; padding:8px; border-radius:var(--radius-sm);
              background:${myIntimate?.libido === i ? 'var(--accent-glow)' : 'transparent'};
              border:2px solid ${myIntimate?.libido === i ? 'var(--accent-primary)' : 'transparent'};
              transition:all 0.2s;
            ">${libidoEmoji[i-1]}</button>
          `).join('')}
        </div>
        ${myIntimate ? `<p style="text-align:center; color:var(--accent-secondary); font-weight:600;">${libidoLabel[myIntimate.libido-1]}</p>` : `<p style="text-align:center; color:var(--text-muted); font-size:13px;">отметь своё желание</p>`}
      </div>

      <!-- Совместимость -->
      <div class="card" style="margin-bottom:16px;">
        <p class="section-title" style="margin-bottom:12px;">совместимость сегодня</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; text-align:center;">
          <div>
            <p style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">${user.name}</p>
            <div style="font-size:40px;">${myIntimate ? libidoEmoji[myIntimate.libido-1] : '—'}</div>
          </div>
          <div>
            <p style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">${partner?.name || 'партнёр'}</p>
            <div style="font-size:40px;">${partnerIntimate ? libidoEmoji[partnerIntimate.libido-1] : '—'}</div>
          </div>
        </div>
        ${myIntimate && partnerIntimate ? `
          <div style="margin-top:16px; padding:12px; background:var(--accent-glow); border-radius:var(--radius-sm); text-align:center;">
            ${Math.abs(myIntimate.libido - partnerIntimate.libido) <= 1
              ? `<p style="color:var(--accent-secondary); font-weight:600;">💫 Отличное совпадение!</p>`
              : `<p style="color:var(--text-muted);">Поговорите друг с другом 💬</p>`
            }
          </div>
        ` : ''}
      </div>

      <!-- Менструальный календарь -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <p class="section-title" style="margin:0;">менструальный календарь</p>
        <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="showAddCycle()">+ добавить</button>
      </div>
      <div class="card">
        ${cycle?.length ? cycle.map(c => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
            <div>
              <p style="font-size:14px; font-weight:600;">🩸 Цикл</p>
              <p style="font-size:12px; color:var(--text-muted);">
                ${new Date(c.period_start).toLocaleDateString('ru', {day:'numeric', month:'short'})}
                ${c.period_end ? ' — ' + new Date(c.period_end).toLocaleDateString('ru', {day:'numeric', month:'short'}) : ''}
              </p>
            </div>
            ${c.notes ? `<p style="font-size:12px; color:var(--text-muted);">${c.notes}</p>` : ''}
          </div>
        `).join('') : `<div class="empty-state" style="padding:24px;"><div class="icon">🩸</div><p>Нет записей</p></div>`}
      </div>
    </div>
  `;
}

async function setLibido(score) {
  const user = window.currentUser;
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await db.from('intimate').select().eq('user_id', user.id).eq('date', today).single();

  if (existing) {
    await db.from('intimate').update({ libido: score }).eq('id', existing.id);
  } else {
    await db.from('intimate').insert({ user_id: user.id, couple_id: user.couple_id, date: today, libido: score });
  }
  renderIntimate();
}

function showAddCycle() {
  const modal = `
    <div class="modal-overlay active" id="modal-cycle" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="modal-handle"></div>
        <p class="section-title" style="margin-bottom:16px;">новая запись цикла</p>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">Начало</p>
        <input class="input" id="cycle-start" type="date" style="margin-bottom:12px;">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">Конец (необязательно)</p>
        <input class="input" id="cycle-end" type="date" style="margin-bottom:12px;">
        <input class="input" id="cycle-notes" placeholder="Заметки (необязательно)" style="margin-bottom:20px;">
        <button class="btn btn-primary btn-full" onclick="addCycle()">Сохранить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function addCycle() {
  const user = window.currentUser;
  const start = document.getElementById('cycle-start').value;
  const end = document.getElementById('cycle-end').value;
  const notes = document.getElementById('cycle-notes').value;
  if (!start) return;
  await db.from('cycle').insert({
    user_id: user.id,
    couple_id: user.couple_id,
    period_start: start,
    period_end: end || null,
    notes: notes || null
  });
  document.getElementById('modal-cycle').remove();
  renderIntimate();
}