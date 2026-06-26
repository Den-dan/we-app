async function renderPlanner() {
  const el = document.getElementById('page-planner');
  el.innerHTML = `<div class="fade-in"><h2 class="page-title">Планы</h2><div id="planner-content"><div class="empty-state"><div class="icon">⏳</div><p>Загрузка...</p></div></div></div>`;
  await loadPlanner();
}

async function loadPlanner() {
  const user = window.currentUser;
  const { data: dates } = await db.from('dates_planner').select().eq('couple_id', user.couple_id).order('date');
  const { data: wishes } = await db.from('wishlist').select().eq('couple_id', user.couple_id);
  const { data: tasks } = await db.from('tasks').select().eq('couple_id', user.couple_id);

  const statusLabel = { idea: '💡 Идея', planned: '📅 Запланировано', done: '✅ Готово' };

  document.getElementById('planner-content').innerHTML = `
    <!-- Свидания -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <p class="section-title" style="margin:0;">свидания</p>
      <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="showAddDate()">+ добавить</button>
    </div>
    ${dates?.length ? dates.map(d => `
      <div class="card" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <p style="font-size:15px; font-weight:600;">${d.title}</p>
          ${d.date ? `<p style="font-size:12px; color:var(--text-muted);">${new Date(d.date).toLocaleDateString('ru')}</p>` : ''}
          <span class="badge badge-accent" style="margin-top:4px;">${statusLabel[d.status]}</span>
        </div>
        <button onclick="deleteDate('${d.id}')" style="color:var(--text-muted); font-size:18px; padding:4px;">×</button>
      </div>
    `).join('') : `<div class="empty-state" style="padding:24px;"><div class="icon">💑</div><p>Добавьте первое свидание</p></div>`}

    <div class="divider"></div>

    <!-- Список желаний -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <p class="section-title" style="margin:0;">список желаний</p>
      <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="showAddWish()">+ добавить</button>
    </div>
    ${wishes?.length ? wishes.map(w => `
      <div class="card" style="margin-bottom:8px; display:flex; align-items:center; gap:12px;">
        <input type="checkbox" ${w.done ? 'checked' : ''} onchange="toggleWish('${w.id}', this.checked)" style="width:18px; height:18px; accent-color:var(--accent-primary);">
        <p style="font-size:15px; ${w.done ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${w.title}</p>
        <button onclick="deleteWish('${w.id}')" style="color:var(--text-muted); font-size:18px; margin-left:auto;">×</button>
      </div>
    `).join('') : `<div class="empty-state" style="padding:24px;"><div class="icon">✨</div><p>Добавьте мечты</p></div>`}

    <div class="divider"></div>

    <!-- Задачи -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <p class="section-title" style="margin:0;">задачи</p>
      <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="showAddTask()">+ добавить</button>
    </div>
    ${tasks?.length ? tasks.map(t => `
      <div class="card" style="margin-bottom:8px; display:flex; align-items:center; gap:12px;">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask('${t.id}', this.checked)" style="width:18px; height:18px; accent-color:var(--accent-primary);">
        <p style="font-size:15px; ${t.done ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${t.title}</p>
        <button onclick="deleteTask('${t.id}')" style="color:var(--text-muted); font-size:18px; margin-left:auto;">×</button>
      </div>
    `).join('') : `<div class="empty-state" style="padding:24px;"><div class="icon">📋</div><p>Добавьте задачи</p></div>`}
  `;
}

// Добавление свидания
function showAddDate() {
  const modal = `
    <div class="modal-overlay active" id="modal-date" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="modal-handle"></div>
        <p class="section-title" style="margin-bottom:16px;">новое свидание</p>
        <input class="input" id="date-title" placeholder="Название" style="margin-bottom:12px;">
        <input class="input" id="date-date" type="date" style="margin-bottom:12px;">
        <select class="input" id="date-status" style="margin-bottom:20px;">
          <option value="idea">💡 Идея</option>
          <option value="planned">📅 Запланировано</option>
          <option value="done">✅ Готово</option>
        </select>
        <button class="btn btn-primary btn-full" onclick="addDate()">Добавить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function addDate() {
  const user = window.currentUser;
  const title = document.getElementById('date-title').value.trim();
  const date = document.getElementById('date-date').value;
  const status = document.getElementById('date-status').value;
  if (!title) return;
  await db.from('dates_planner').insert({ couple_id: user.couple_id, title, date, status, created_by: user.id });
  document.getElementById('modal-date').remove();
  loadPlanner();
}

async function deleteDate(id) {
  await db.from('dates_planner').delete().eq('id', id);
  loadPlanner();
}

// Список желаний
function showAddWish() {
  const modal = `
    <div class="modal-overlay active" id="modal-wish" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="modal-handle"></div>
        <p class="section-title" style="margin-bottom:16px;">новое желание</p>
        <input class="input" id="wish-title" placeholder="Чего хотим?" style="margin-bottom:20px;">
        <button class="btn btn-primary btn-full" onclick="addWish()">Добавить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function addWish() {
  const user = window.currentUser;
  const title = document.getElementById('wish-title').value.trim();
  if (!title) return;
  await db.from('wishlist').insert({ couple_id: user.couple_id, title, created_by: user.id });
  document.getElementById('modal-wish').remove();
  loadPlanner();
}

async function toggleWish(id, done) {
  await db.from('wishlist').update({ done }).eq('id', id);
}

async function deleteWish(id) {
  await db.from('wishlist').delete().eq('id', id);
  loadPlanner();
}

// Задачи
function showAddTask() {
  const modal = `
    <div class="modal-overlay active" id="modal-task" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="modal-handle"></div>
        <p class="section-title" style="margin-bottom:16px;">новая задача</p>
        <input class="input" id="task-title" placeholder="Что нужно сделать?" style="margin-bottom:20px;">
        <button class="btn btn-primary btn-full" onclick="addTask()">Добавить</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function addTask() {
  const user = window.currentUser;
  const title = document.getElementById('task-title').value.trim();
  if (!title) return;
  await db.from('tasks').insert({ couple_id: user.couple_id, title, created_by: user.id });
  document.getElementById('modal-task').remove();
  loadPlanner();
}

async function toggleTask(id, done) {
  await db.from('tasks').update({ done }).eq('id', id);
}

async function deleteTask(id) {
  await db.from('tasks').delete().eq('id', id);
  loadPlanner();
}