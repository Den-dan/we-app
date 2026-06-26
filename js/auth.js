function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name || !email || !password) return showError('Заполни все поля');

  const { data, error } = await db.auth.signUp({ email, password });
  if (error) return showError(error.message);

  await db.from('profiles').insert({ id: data.user.id, name });
  checkUser();
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showError('Заполни все поля');

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return showError('Неверный email или пароль');

  checkUser();
}

async function createCouple() {
  const user = (await db.auth.getUser()).data.user;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: couple } = await db.from('couples').insert({
    couple_name: 'Наша пара',
    invite_code: code
  }).select().single();

  await db.from('profiles').update({ couple_id: couple.id }).eq('id', user.id);

  const { data: profile } = await db.from('profiles').select().eq('id', user.id).single();
  window.currentUser = profile;

  alert(`Твой код приглашения: ${code}\nОтправь его партнёру!`);
  showMainApp();
}

async function joinCouple() {
  const code = document.getElementById('invite-code-input').value.trim().toUpperCase();
  const user = (await db.auth.getUser()).data.user;

  const { data: couple } = await db.from('couples').select().eq('invite_code', code).single();

  if (!couple) {
    document.getElementById('couple-error').textContent = 'Неверный код';
    document.getElementById('couple-error').style.display = 'block';
    return;
  }

  await db.from('profiles').update({ couple_id: couple.id }).eq('id', user.id);
  showMainApp();
}

function showMainApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('couple-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  renderPage('dashboard');
}