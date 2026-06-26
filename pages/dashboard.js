async function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  const user = window.currentUser;

  const { data: couple } = await db.from('couples').select().eq('id', user.couple_id).single();
  const { data: partner } = await db.from('profiles').select().eq('couple_id', user.couple_id).neq('id', user.id).single();

  const start = couple?.anniversary_date ? new Date(couple.anniversary_date) : new Date(couple.created_at);
  const days = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));

  const { data: myMood } = await db.from('mood').select().eq('user_id', user.id).eq('date', new Date().toISOString().split('T')[0]).single();
  const { data: partnerMood } = partner ? await db.from('mood').select().eq('user_id', partner.id).eq('date', new Date().toISOString().split('T')[0]).single() : { data: null };

  const moodEmoji = ['😔','😕','😐','🙂','😊'];

  el.innerHTML = `
    <div class="fade-in">
      <!-- Шапка -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-top:8px;">
        <div>
          <p style="color:var(--text-muted); font-size:13px;">привет,</p>
          <h2 style="font-size:22px; font-weight:700;">${user.name} 👋</h2>
        </div>
        <div style="font-size:28px;">${user.avatar_url || '🧑'}</div>
      </div>

      <!-- Счётчик дней -->
      <div class="card" style="text-align:center; margin-bottom:16px; background: linear-gradient(135deg, var(--bg-card), var(--bg-card-hover)); border-color: var(--border-hover);">
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:4px;">вместе уже</p>
        <p style="font-size:56px; font-weight:700; color:var(--accent-primary); line-height:1;">${days}</p>
        <p style="color:var(--text-muted); font-size:14px;">дней</p>
        ${couple?.couple_name ? `<p style="margin-top:8px; color:var(--text-secondary); font-size:15px; font-weight:600;">${couple.couple_name}</p>` : ''}
      </div>

      <!-- Настроение сегодня -->
      <div class="card" style="margin-bottom:16px;">
        <p class="section-title" style="margin-bottom:16px;">настроение сегодня</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div style="text-align:center;">
            <p style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">${user.name}</p>
            <div style="font-size:36px;">${myMood ? moodEmoji[myMood.score - 1] : '—'}</div>
            ${!myMood ? `<button class="btn btn-secondary" style="margin-top:8px; padding:6px 12px; font-size:12px;" onclick="navigateTo('mood', null)">отметить</button>` : ''}
          </div>
          <div style="text-align:center;">
            <p style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">${partner?.name || 'партнёр'}</p>
            <div style="font-size:36px;">${partnerMood ? moodEmoji[partnerMood.score - 1] : '—'}</div>
          </div>
        </div>
      </div>

      <!-- Быстрые действия -->
      <p class="section-title" style="margin-bottom:12px;">быстрые действия</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
        <button class="card" style="text-align:left; cursor:pointer;" onclick="navigateTo('planner', null)">
          <div style="font-size:24px; margin-bottom:8px;">📅</div>
          <p style="font-size:14px; font-weight:600;">Планы</p>
          <p style="font-size:12px; color:var(--text-muted);">свидания и задачи</p>
        </button>
        <button class="card" style="text-align:left; cursor:pointer;" onclick="navigateTo('more', null)">
          <div style="font-size:24px; margin-bottom:8px;">💬</div>
          <p style="font-size:14px; font-weight:600;">Вопрос дня</p>
          <p style="font-size:12px; color:var(--text-muted);">узнай партнёра лучше</p>
        </button>
        <button class="card" style="text-align:left; cursor:pointer;" onclick="navigateTo('intimate', null)">
          <div style="font-size:24px; margin-bottom:8px;">❤️</div>
          <p style="font-size:14px; font-weight:600;">Близость</p>
          <p style="font-size:12px; color:var(--text-muted);">настроение и цикл</p>
        </button>
        <button class="card" style="text-align:left; cursor:pointer;" onclick="navigateTo('more', null)">
          <div style="font-size:24px; margin-bottom:8px;">💰</div>
          <p style="font-size:14px; font-weight:600;">Финансы</p>
          <p style="font-size:12px; color:var(--text-muted);">бюджет и копилки</p>
        </button>
      </div>

      <!-- Код приглашения -->
      ${!partner ? `
      <div class="card" style="border-color:var(--accent-primary); background:var(--accent-glow);">
        <p style="font-size:14px; font-weight:600; margin-bottom:8px;">🔗 Пригласи партнёра</p>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Отправь этот код своей второй половинке</p>
        <div style="background:var(--bg-primary); border-radius:var(--radius-sm); padding:12px; text-align:center; letter-spacing:6px; font-size:20px; font-weight:700; color:var(--accent-secondary);">
          ${couple?.invite_code || '—'}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function renderMore() {
  const el = document.getElementById('page-more');
  el.innerHTML = `
    <div class="fade-in">
      <h2 class="page-title">Ещё</h2>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${moreMenuItem('💬', 'Вопросы дня', 'узнайте друг друга глубже', 'showQuestions()')}
        ${moreMenuItem('🙏', 'Благодарности', 'скажи спасибо партнёру', 'showGratitude()')}
        ${moreMenuItem('💰', 'Финансы', 'бюджет и копилки', 'showFinances()')}
        ${moreMenuItem('🏥', 'Здоровье', 'сон, стресс, усталость', 'showHealth()')}
        ${moreMenuItem('⚡', 'Конфликт-менеджер', 'поговорим спокойно', 'showConflict()')}
        ${moreMenuItem('📸', 'Воспоминания', 'наши моменты', 'showMemories()')}
        ${moreMenuItem('👤', 'Профиль пары', 'настройки', 'showProfile()')}
      </div>
    </div>
  `;
}

function moreMenuItem(icon, title, subtitle, onclick) {
  return `
    <button class="card" style="display:flex; align-items:center; gap:16px; text-align:left; width:100%; cursor:pointer;" onclick="${onclick}">
      <div style="font-size:28px; min-width:40px;">${icon}</div>
      <div>
        <p style="font-size:15px; font-weight:600;">${title}</p>
        <p style="font-size:12px; color:var(--text-muted);">${subtitle}</p>
      </div>
      <svg style="margin-left:auto; color:var(--text-muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg>
    </button>
  `;
}

// Заглушки для страниц из меню "Ещё" (заполним позже)
function showQuestions() {
  const el = document.getElementById('page-more');
  el.innerHTML = `
    <div class="fade-in">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px; padding-top:8px;">
        <button onclick="renderMore()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:4px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <h2 class="page-title" style="margin:0;">Вопросы дня</h2>
      </div>
      <div id="questions-content"></div>
      <div style="margin-top:2rem;">
        <h3 style="margin-bottom:1rem; color:var(--text-secondary); font-size:14px;">Прошлые вопросы</h3>
        <div id="past-questions"></div>
      </div>
    </div>
  `;
  loadQuestionsPage();
}
function showGratitude() { alert('Скоро! 🙏'); }
function showFinances() { alert('Скоро! 💰'); }
function showHealth() { alert('Скоро! 🏥'); }
function showConflict() { alert('Скоро! ⚡'); }
function showMemories() { alert('Скоро! 📸'); }
function showProfile() { alert('Скоро! 👤'); }