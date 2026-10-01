'use strict';

// 1. ИМПОРТ И ИНИЦИАЛИЗАЦИЯ МОДЕЛИ
// Импортируем класс логики игры (Model) и создаём единый экземпляр
const Game = require('../modules/Game.class.js');
const game = new Game();

// 2. КЭШИРОВАНИЕ ЭЛЕМЕНТОВ DOM
// Находим все элементы один раз при старте, чтобы не
//  тратить ресурсы на их поиск при каждом ходе
const tab = document.querySelector('.game-field');
const score = document.querySelector('.game-score');
const btnStart = document.querySelector('.button');
const messageStart = document.querySelector('.message-start');
const messageWin = document.querySelector('.message-win');
const messageLose = document.querySelector('.message-lose');

/**
 * 3. ФУНКЦИЯ ОТРИСОВКИ (VIEW в архитектуре MVC)
 * Единственная точка правды для UI. Считывает состояние из
 *  `game` и приводит DOM в соответствие.
 */
function render() {
  // А) Обновление текстового содержимого счёта
  score.textContent = game.getScore();

  // Б) Синхронизация матрицы board (4x4) с ячейками HTML-таблицы
  const board = game.getState();

  board.forEach((row, r) => {
    row.forEach((col, c) => {
      // Если в ячейке 0 — оставляем пустую строку, иначе выводим число
      // if (board[r][c] === 0) {
      //   tab.rows[r].cells[c].textContent = '';
      // } else {
      //   tab.rows[r].cells[c].textContent = board[r][c];
      // }
      tab.rows[r].cells[c].textContent = col === 0 ? '' : col;
    });
  });

  // В) Получение актуального статуса игры ('idle' | 'playing' | 'win' | 'lose')
  const statusGame = game.getStatus();

  // Г) Паттерн "Сброс перед отрисовкой": сначала прячем все три оверлея
  messageStart.classList.add('hidden');
  messageWin.classList.add('hidden');
  messageLose.classList.add('hidden');

  // Д) Показываем только то сообщение, которое соответствует текущему статусу
  switch (statusGame) {
    case 'idle':
      messageStart.classList.remove('hidden');
      break;
    case 'win':
      messageWin.classList.remove('hidden');
      break;
    case 'lose':
      messageLose.classList.remove('hidden');
      break;
    case 'playing':
      // Во время игры все сообщения остаются скрытыми
      break;
  }

  // Е) Динамическое управление состоянием кнопки Start/Restart
  // Второй аргумент .toggle(className, force)
  //  добавляет класс если true, и удаляет если false
  btnStart.classList.toggle('restart', statusGame !== 'idle');
  btnStart.classList.toggle('start', statusGame === 'idle');
  btnStart.textContent = statusGame === 'idle' ? 'Start' : 'Restart';
}

// Первоначальный вызов для отображения экрана
//  при загрузке страницы (статус 'idle')
render();

// 4. ОБРАБОТКА КЛИКА ПО КНОПКЕ (START / RESTART)
btnStart.addEventListener('click', () => {
  game.start(); // Модель сбрасывает счет, очищает
  //  доску и генерирует 2 первые плитки
  render(); // View отрисовывает новые данные на экране
});

// 5. ОБРАБОТКА НАЖАТИЙ КЛАВИШ (УПРАВЛЕНИЕ СТРЕЛКАМИ)
window.addEventListener('keydown', e => {
  // Предотвращаем дефолтный скролл страницы браузером при нажатии стрелок
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
  }

  // Передаём команду в модель в зависимости от нажатой клавиши
  switch (e.key) {
    case 'ArrowLeft':
      game.moveLeft();
      break;
    case 'ArrowRight':
      game.moveRight();
      break;
    case 'ArrowUp':
      game.moveUp();
      break;
    case 'ArrowDown':
      game.moveDown();
      break;
  }

  // Обязательно обновляем интерфейс после изменения состояния матрицы
  render();
});
