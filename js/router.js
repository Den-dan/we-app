function navigateTo(page, btn) {
  // Убираем активный класс со всех страниц и кнопок
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  // Активируем нужную страницу и кнопку
  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');

  // Рендерим страницу
  renderPage(page);
}

function renderPage(page) {
  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'planner': renderPlanner(); break;
    case 'mood': renderMood(); break;
    case 'intimate': renderIntimate(); break;
    case 'more': renderMore(); break;
  }
}