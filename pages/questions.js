// pages/questions.js

function renderQuestions() {
  const container = document.getElementById('page-more');
  // questions рендерится внутри more — см. ниже
}

async function loadQuestionsPage() {
  const userId = window.currentUser.id;
  const coupleId = window.currentUser.couple_id;
  const today = new Date().toISOString().split('T')[0];

  const container = document.getElementById('questions-content');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:2rem;">Загрузка...</div>';

  try {
    const { data: questions, error } = await db
      .from('questions')
      .select('*, question_answers(*)')
      .eq('couple_id', coupleId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    const question = questions?.[0];
    if (!question) {
      renderNoQuestion(container, userId, coupleId, today);
    } else {
      renderQuestionCard(container, question, userId, coupleId, today);
    }

    loadPastQuestions(userId, coupleId, today);
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    console.error(e);
  }
}

function renderNoQuestion(container, userId, coupleId, today) {
  container.innerHTML = `
    <div class="card" style="text-align:center; padding:2rem;">
      <div style="font-size:3rem; margin-bottom:1rem;">💬</div>
      <p style="color:var(--text-secondary); margin-bottom:1.5rem;">Вопроса на сегодня пока нет.<br>Задай первым!</p>
      <button class="btn btn-primary" onclick="showQuestionForm()">Задать вопрос</button>
    </div>
    <div id="question-form-block" style="display:none;" class="card">
      <span class="label">Твой вопрос партнёру</span>
      <textarea id="question-text" class="input" rows="3" placeholder="Что ты думаешь о..."></textarea>
      <button class="btn btn-primary" style="margin-top:1rem; width:100%;" onclick="submitQuestion('${coupleId}', '${userId}', '${today}')">Отправить</button>
    </div>
  `;
}

function showQuestionForm() {
  document.getElementById('question-form-block').style.display = 'block';
  event.target.style.display = 'none';
}

async function submitQuestion(coupleId, userId, today) {
  const text = document.getElementById('question-text').value.trim();
  if (!text) return;

  const { error } = await db.from('questions').insert({
    couple_id: coupleId,
    created_by: userId,
    text,
    date: today
  });

  if (error) { alert('Ошибка: ' + error.message); return; }
  loadQuestionsPage();
}

function renderQuestionCard(container, question, userId, coupleId, today) {
  const myAnswer = question.question_answers?.find(a => a.user_id === userId);
  const partnerAnswer = question.question_answers?.find(a => a.user_id !== userId);
  const bothAnswered = question.question_answers?.length >= 2;
  const iCreated = question.created_by === userId;

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
        <span class="badge">${iCreated ? 'Ты спросил(а)' : 'Партнёр спросил(а)'}</span>
        <span style="color:var(--text-muted); font-size:0.8rem;">Сегодня</span>
      </div>
      <p style="font-size:1.1rem; font-weight:600; margin:1rem 0;">${escHtml(question.text)}</p>

      ${myAnswer ? `
        <div class="answer-block">
          <div class="answer-label">Твой ответ</div>
          <div class="answer-text">${escHtml(myAnswer.answer)}</div>
        </div>
      ` : `
        <textarea id="my-answer" class="input" rows="3" placeholder="Твой ответ..." style="margin-top:0.75rem;"></textarea>
        <button class="btn btn-primary" style="margin-top:0.75rem; width:100%;"
          onclick="submitAnswer('${question.id}', '${userId}', '${coupleId}', '${today}')">Ответить</button>
      `}

      <div style="margin-top:1.25rem; padding-top:1.25rem; border-top:1px solid var(--border);">
        <div class="answer-label">Ответ партнёра</div>
        ${bothAnswered ? `
          <div class="answer-text" style="margin-top:0.5rem;">${escHtml(partnerAnswer?.answer ?? '')}</div>
        ` : `
          <div style="color:var(--text-muted); font-size:0.9rem; margin-top:0.5rem;">
            ${myAnswer ? '⏳ Ждём ответа партнёра...' : '🔒 Появится когда оба ответят'}
          </div>
        `}
      </div>
    </div>
  `;
}

async function submitAnswer(questionId, userId, coupleId, today) {
  const answer = document.getElementById('my-answer').value.trim();
  if (!answer) return;

  const { error } = await db.from('question_answers').insert({
    question_id: questionId,
    user_id: userId,
    answer
  });

  if (error) { alert('Ошибка: ' + error.message); return; }
  loadQuestionsPage();
}

async function loadPastQuestions(userId, coupleId, todayStr) {
  const container = document.getElementById('past-questions');
  if (!container) return;

  const { data, error } = await db
    .from('questions')
    .select('*, question_answers(*)')
    .eq('couple_id', coupleId)
    .neq('date', todayStr)
    .order('date', { ascending: false })
    .limit(10);

  if (error || !data?.length) {
    container.innerHTML = '<div class="empty-state" style="padding:1rem 0;">Пока нет прошлых вопросов</div>';
    return;
  }

  container.innerHTML = data.map(q => {
    const answers = q.question_answers ?? [];
    const bothAnswered = answers.length >= 2;
    const myA = answers.find(a => a.user_id === userId);
    const partnerA = answers.find(a => a.user_id !== userId);

    return `
      <div class="card" style="margin-bottom:0.75rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span style="font-weight:600; font-size:0.95rem;">${escHtml(q.text)}</span>
          <span style="color:var(--text-muted); font-size:0.75rem; white-space:nowrap; margin-left:0.5rem;">${formatDate(q.date)}</span>
        </div>
        ${bothAnswered ? `
          <div style="font-size:0.85rem; color:var(--text-secondary);">
            <div><b>Ты:</b> ${escHtml(myA?.answer ?? '—')}</div>
            <div style="margin-top:0.25rem;"><b>Партнёр:</b> ${escHtml(partnerA?.answer ?? '—')}</div>
          </div>
        ` : '<div style="color:var(--text-muted); font-size:0.85rem;">🔒 Оба не ответили</div>'}
      </div>
    `;
  }).join('');
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}