async function checkUser() {
  const { data: { user } } = await db.auth.getUser();

  document.getElementById('loader').style.display = 'none';

  if (!user) {
    document.getElementById('auth-screen').style.display = 'block';
    return;
  }

  const { data: profile } = await db.from('profiles').select().eq('id', user.id).single();

  if (!profile || !profile.couple_id) {
    document.getElementById('couple-screen').style.display = 'block';
    return;
  }

  window.currentUser = profile;
  showMainApp();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', checkUser);