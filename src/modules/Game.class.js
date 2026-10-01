'use strict';

/**
 * Класс игровой логики 2048 (Модель / Model в архитектуре MVC).
 * Отвечает за хранение состояния поля, очков, статуса
 *  и выполнение всех математических сдвигов.
 */
class Game {
  // =========================================================================
  // 1. ИНИЦИАЛИЗАЦИЯ И ГЕТТЕРЫ (Состояние)
  // =========================================================================

  constructor(initialState) {
    // Если передали готовое поле (например, в тестах) — берем его.
    // Иначе создаем пустую сетку 4х4 из нулей через вспомогательный метод.
    // Оператор ?? (Nullish Coalescing) срабатывает
    //  только на null или undefined.
    this.board = initialState ?? this._createEmptyBoard();

    // Текущий счёт
    this.score = 0;

    // Статус игры: 'idle' (ожидание), 'playing' (игра идёт),
    //  'win' (победа), 'lose' (поражение)
    this.status = 'idle';
  }

  // Возвращает текущую матрицу поля (4x4)
  getState() {
    return this.board;
  }

  // Возвращает текущее количество очков
  getScore() {
    return this.score;
  }

  // Возвращает текущий статус игры
  getStatus() {
    return this.status;
  }

  // =========================================================================
  // 2. УПРАВЛЕНИЕ ИГРОЙ (Старт и Сброс)
  // =========================================================================

  /**
   * Сбрасывает состояние и спавнит 2 начальные плитки.
   */
  restart() {
    this.score = 0;
    this.board = this._createEmptyBoard();
    this.status = 'playing';

    // По правилам 2048 новая игра начинается с двух случайных плашек
    this.addRandomTile();
    this.addRandomTile();
  }

  start() {
    this.restart();
  }

  // =========================================================================
  // 3. ОСНОВНЫЕ ДВИЖЕНИЯ (Сдвиги поля)
  // =========================================================================

  moveLeft() {
    if (this.status !== 'playing') {
      return;
    }

    // 1. Делаем текстовый «слепок» поля ДО хода для будущего сравнения
    const prevBoardState = JSON.stringify(this.board);

    // 2. Сдвигаем каждую строку влево с помощью утилиты slideRow
    const movedBoard = this.board.map(row => this.slideRow(row));

    // 3. Если поле реально изменилось — ход считаем совершенным
    if (prevBoardState !== JSON.stringify(movedBoard)) {
      this.board = movedBoard;
      this.addRandomTile(); // Добавляем новую цифру
      this.checkGameStatus(); // Проверяем, не выиграл или не проиграл ли игрок
    }
  }

  moveRight() {
    if (this.status !== 'playing') {
      return;
    }

    const prevBoardState = JSON.stringify(this.board);

    // ТРЮК СДВИГА ВПРАВО:
    // Разворачиваем строку -> сдвигаем влево -> разворачиваем обратно
    const movedBoard = this.board.map(row => {
      return this.slideRow([...row].reverse()).reverse();
    });

    if (prevBoardState !== JSON.stringify(movedBoard)) {
      this.board = movedBoard;
      this.addRandomTile();
      this.checkGameStatus();
    }
  }

  moveUp() {
    if (this.status !== 'playing') {
      return;
    }

    const prevBoardState = JSON.stringify(this.board);

    // ТРЮК СДВИГА ВВЕРХ:
    // 1. Поворачиваем матрицу (столбцы становятся строками)
    const transposed = this.transpose(this.board);
    // 2. Сдвигаем строки «влево»
    const movedTransposed = transposed.map(row => this.slideRow(row));
    // 3. Поворачиваем матрицу обратно
    const newBoard = this.transpose(movedTransposed);

    if (prevBoardState !== JSON.stringify(newBoard)) {
      this.board = newBoard;
      this.addRandomTile();
      this.checkGameStatus();
    }
  }

  moveDown() {
    if (this.status !== 'playing') {
      return;
    }

    const prevBoardState = JSON.stringify(this.board);

    // ТРЮК СДВИГА ВНИЗ:
    // Транспонируем -> Разворачиваем -> Сдвигаем влево ->
    //  Разворачиваем обратно -> Транспонируем обратно
    const transposed = this.transpose(this.board);
    const movedTransposed = transposed.map(row => {
      return this.slideRow([...row].reverse()).reverse();
    });
    const newBoard = this.transpose(movedTransposed);

    if (prevBoardState !== JSON.stringify(newBoard)) {
      this.board = newBoard;
      this.addRandomTile();
      this.checkGameStatus();
    }
  }

  // =========================================================================
  // 4. МАТЕМАТИЧЕСКИЕ УТИЛИТЫ И ПРАВИЛА
  // =========================================================================

  /**
   * Сдвигает одну строку из 4 чисел влево и объединяет
   *  одинаковые соседние элементы.
   * Пример: [2, 0, 2, 4] -> [2, 2, 4] -> [4, 0, 4] -> [4, 4] -> [4, 4, 0, 0]
   */
  slideRow(row) {
    // 1. Убираем все нули: [2, 0, 2, 4] -> [2, 2, 4]
    let cleanRow = row.filter(num => num !== 0);

    // 2. Объединяем одинаковые соседние элементы
    for (let i = 0; i < cleanRow.length - 1; i++) {
      if (cleanRow[i] === cleanRow[i + 1]) {
        cleanRow[i] *= 2; // Удваиваем левое число
        this.score += cleanRow[i]; // Начисляем очки
        cleanRow[i + 1] = 0; // Обнуляем правое число
        i++; // Пропускаем следующий элемент,
        //  чтобы не было цепного слияния за 1 ход
      }
    }

    // 3. Снова очищаем от образовавшихся нулей: [4, 0, 4] -> [4, 4]
    cleanRow = cleanRow.filter(num => num !== 0);

    // 4. Добиваем массив нулями справа до исходной длины строки (4 элемента)
    while (cleanRow.length < row.length) {
      cleanRow.push(0);
    }

    return cleanRow;
  }

  /**
   * Транспонирует матрицу (поворачивает по диагонали:
   *  меняет местами строки и столбцы).
   */
  transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  // transpose(matrix) {
  //   const arr = [];

  //   for (let i = 0; i < matrix.length; i++) {
  //     const row = [];
  //     for (let j = 0; j < matrix[i].length; j++) {
  //       row.push(matrix[j][i]);
  //     }
  //     arr.push(row);
  //   }

  //   return arr;
  // }

  /**
   * Спавнит новую плиточку в случайную пустую ячейку (0).
   * Вероятность: 90% для двойки, 10% для четверки.
   */
  addRandomTile() {
    const emptyCells = [];

    // Сканируем матрицу и находим координаты всех нулей
    for (let row = 0; row < this.board.length; row++) {
      for (let col = 0; col < this.board[row].length; col++) {
        if (this.board[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }

    if (emptyCells.length === 0) {
      return;
    }

    // Выбираем случайную пустую ячейку
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [r, c] = emptyCells[randomIndex];

    this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  /**
   * Проверяет условия победы (появление 2048)
   *  или поражения (нет свободных ходов).
   */
  checkGameStatus() {
    // 1. Проверка на победу
    const has2048 = this.board.some(row => row.includes(2048));

    if (has2048) {
      this.status = 'win';

      return;
    }

    // 2. Проверка на наличие доступных ходов
    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        const current = this.board[r][c];

        // А) Если есть хотя бы один ноль — ходы есть
        if (current === 0) {
          return;
        }

        // Б) Есть совпадающий сосед СПРАВА (проверяем boundary c < 3)
        if (c < 3 && current === this.board[r][c + 1]) {
          return;
        }

        // В) Есть совпадающий сосед СНИЗУ (проверяем boundary r < 3)
        if (r < 3 && current === this.board[r + 1][c]) {
          return;
        }
      }
    }

    // Если свободных клеток нет и состыковать нечего — проигрыш
    this.status = 'lose';
  }

  /**
   * Вспомогательный метод для генерации чистой матрицы 4х4 из нулей
   */
  _createEmptyBoard() {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }
}

module.exports = Game;
