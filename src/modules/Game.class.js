'use strict';

/**
 * Класс, отвечающий за всю логику игры 2048 (Model в MVC).
 */
class Game {
  // =========================================================================
  // 1. ИНИЦИАЛИЗАЦИЯ И ГЕТТЕРЫ (Состояние)
  // =========================================================================

  constructor(initialState) {
    // Если передали начальное поле — берем его, иначе создаем сетку 4х4 из нулей.
    // Оператор ?? (Nullish Coalescing) сработает, только если initialState === null или undefined
    this.board = initialState ?? [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    // Начальный счет игры
    this.score = 0;

    // Статус игры: 'idle' (не начата), 'playing' (в процессе), 'win' (победа), 'lose' (поражение)
    this.status = 'idle';
  }

  // Возвращает текущую матрицу поля
  getState() {
    return this.board;
  }

  // Возвращает текущее количество очков
  getScore() {
    return this.score;
  }

  // Возвращает текущий статус
  getStatus() {
    return this.status;
  }

  // =========================================================================
  // 2. ДВИЖЕНИЯ ПОЛЕЙ (Управление)
  // =========================================================================

  moveLeft() {
    // Если игра уже выиграна или проиграна — просто игнорируем нажатия
    if (this.status !== 'playing') {
      return;
    }

    // 1. Делаем текстовый «слепок» поля ДО хода для будущего сравнения
    const prevBoardState = JSON.stringify(this.board);

    // 2. Сдвигаем каждую строку влево с помощью нашей утилиты slideRow
    const movedBoard = this.board.map(row => this.slideRow(row));

    // 3. Если текстовый слепок ПОСЛЕ сдвига отличается от слепка ДО
    if (prevBoardState !== JSON.stringify(movedBoard)) {
      // Значит, ход валиден: обновляем состояние поля...
      this.board = movedBoard;
      // ...и спавним новую случайную плиточку (2 или 4)
      this.addRandomTile(); // 1. Появилась новая плитка
      this.checkGameStatus(); // 2. Вот ТЕПЕРЬ оцениваем новое состояние поля!
    }
  }

  moveRight() {
    // Если игра уже выиграна или проиграна — просто игнорируем нажатия
    if (this.status !== 'playing') {
      return;
    }

    // 1. Сохраняем «слепок» поля до хода
    const prevBoardState = JSON.stringify(this.board);

    // 2. Обрабатываем каждую строку для сдвига ВПРАВО:
    const movedBoard = this.board.map(row => {
      // а) [...row] — делаем копию строки, чтобы не испортить оригинал
      // б) .reverse() — разворачиваем строку задом наперед
      // в) this.slideRow(...) — сдвигаем элементы к левому краю
      // г) .reverse() — разворачиваем обратно (в итоге элементы прижаты вправо!)
      return this.slideRow([...row].reverse()).reverse();
    });

    // 3. Если поле изменилось — перезаписываем его и спавним новую цифру
    if (prevBoardState !== JSON.stringify(movedBoard)) {
      this.board = movedBoard;
      this.addRandomTile(); // 1. Появилась новая плитка
      this.checkGameStatus(); // 2. Вот ТЕПЕРЬ оцениваем новое состояние поля!
    }
  }

  moveUp() {
    // Если игра уже выиграна или проиграна — просто игнорируем нажатия
    if (this.status !== 'playing') {
      return;
    }

    // 1. Сохраняем «слепок» поля до хода
    const prevBoardState = JSON.stringify(this.board);

    // 2. Поворачиваем матрицу: столбцы становятся строками
    const transposed = this.transpose(this.board);

    // 3. Сдвигаем строки «влево» (для исходной матрицы это сдвиг ВВЕРХ)
    const movedTransposed = transposed.map(row => this.slideRow(row));

    // 4. Поворачиваем матрицу обратно в исходное положение
    const newBoard = this.transpose(movedTransposed);

    // 5. Если произошли изменения — обновляем поле и спавним цифру
    if (prevBoardState !== JSON.stringify(newBoard)) {
      this.board = newBoard;
      this.addRandomTile(); // 1. Появилась новая плитка
      this.checkGameStatus(); // 2. Вот ТЕПЕРЬ оцениваем новое состояние поля!
    }
  }

  moveDown() {
    // Если игра уже выиграна или проиграна — просто игнорируем нажатия
    if (this.status !== 'playing') {
      return;
    }

    // 1. Сохраняем «слепок» поля до хода
    const prevBoardState = JSON.stringify(this.board);

    // 2. Поворачиваем матрицу (столбцы -> строки)
    const transposed = this.transpose(this.board);

    // 3. Сдвигаем «вправо» (разворот -> slideRow -> обратный разворот)
    const movedTransposed = transposed.map(row =>
      this.slideRow([...row].reverse()).reverse(),
    );

    // 4. Возвращаем столбцы на свои места
    const newBoard = this.transpose(movedTransposed);

    // 5. Проверяем изменения
    if (prevBoardState !== JSON.stringify(newBoard)) {
      this.board = newBoard;
      this.addRandomTile(); // 1. Появилась новая плитка
      this.checkGameStatus(); // 2. Вот ТЕПЕРЬ оцениваем новое состояние поля!
    }
  }

  // =========================================================================
  // 3. ВСПОМОГАТЕЛЬНЫЕ ДВИЖКИ (Внутренняя математика)
  // =========================================================================

  /**
   * Сдвигает одну строку из 4 чисел влево, объединяет одинаковые соседние числа
   * и увеличивает счет игры.
   */
  slideRow(row) {
    // Шаг 1: Фильтруем строку, оставляя только числа без нулей (например: [2, 0, 2, 4] -> [2, 2, 4])
    let cleanRow = row.filter(num => num !== 0);

    // Шаг 2: Ищем одинаковые соседние элементы для объединения
    for (let i = 0; i < cleanRow.length - 1; i++) {
      // Если текущий элемент равен следующему (например, 2 === 2)
      if (cleanRow[i] === cleanRow[i + 1]) {
        cleanRow[i] *= 2; // Удваиваем левый элемент (2 становится 4)
        this.score += cleanRow[i]; // Прибавляем получившиеся очки к общему счету
        cleanRow[i + 1] = 0; // Правый элемент обнуляем
        i++; // Пропускаем следующий индекс, чтобы не было двойного слияния подряд
      }
    }

    // Шаг 3: Снова убираем образовавшиеся нули после слияния (например: [4, 0, 4] -> [4, 4])
    cleanRow = cleanRow.filter(num => num !== 0);

    // Шаг 4: Добиваем массив нулями справа до исходной длины строки (чтобы снова стало 4 элемента)
    while (cleanRow.length < row.length) {
      cleanRow.push(0);
    }

    // Возвращаем итоговую сдвинутую строку
    return cleanRow;
  }

  /**
   * Транспонирует матрицу (поворачивает по диагонали: строки <-> столбцы)
   */
  transpose(matrix) {
    const arr = [];

    // Идем по строкам
    for (let i = 0; i < matrix.length; i++) {
      const row = [];

      // Идем по столбцам
      for (let j = 0; j < matrix[i].length; j++) {
        // Меняем местами индексы j и i, превращая столбец j в строку
        row.push(matrix[j][i]);
      }

      arr.push(row);
    }

    return arr;
  }

  // transpose(matrix) {
  //   return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  // }

  /**
   * Ищет пустые ячейки (значение 0) и помещает в одну случайную цифру 2 (90%) или 4 (10%)
   */
  addRandomTile() {
    const emptyCells = [];

    // Двойным циклом сканируем всю матрицу
    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        // Если ячейка пустая (0) — сохраняем ее координаты [строка, столбец]
        if (this.board[r][c] === 0) {
          emptyCells.push([r, c]);
        }
      }
    }

    // Если свободных клеток нет — завершаем работу
    if (emptyCells.length === 0) {
      return;
    }

    // Выбираем случайный индекс из массива найденных пустых клеток
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    // Достаем координаты [r, c] по этому индексу
    const [r, c] = emptyCells[randomIndex];

    // Записываем по этим координатам 2 (с вероятностью 90%) или 4 (с вероятностью 10%)
    this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  // =========================================================================
  // 4. СТАРТ И ПЕРЕЗАПУСК (Реализуем на следующем шаге)
  // =========================================================================

  restart() {
    this.score = 0;
    this.board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    this.status = 'playing';

    // 4. По правилам 2048 в начале игры на поле должны появиться 2 плашки
    this.addRandomTile();
    this.addRandomTile();
  }

  start() {
    this.restart();
  }

  checkGameStatus() {
    // 1. Проверка на ПОБЕДУ: есть ли на поле хотя бы одна плитка 2048?
    // (Подсказка: можно использовать .some() или обычный двойной цикл)
    // 2. Проверка на ПРОДОЛЖЕНИЕ ИГРЫ: есть ли хотя бы один 0 ИЛИ соседние равные числа?
    // Если есть — игра продолжается, ничего не меняем.
    // 3. Если победы нет, нулей нет и состыковать ничего нельзя:
    // this.status = 'lose';

    const has2048 = this.board.some(row => row.includes(2048));
    if (has2048) {
      this.status = 'win';
      return;
    }

    // Двойным циклом сканируем всю матрицу
    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        const current = this.board[r][c];

        // 1. Если нашли ноль — ход есть, играем дальше
        if (current === 0) {
          return;
        }

        // 2. Есть ли такой же сосед СПРАВА? (проверяем, чтобы не выйти за границу массива c < 3)
        if (c < 3 && current === this.board[r][c + 1]) return;

        // 3. Есть ли такой же сосед СНИЗУ? (проверяем boundary r < 3)
        if (r < 3 && current === this.board[r + 1][c]) return;
      }
    }

    // Если цикл полностью завершился и не сработал ни один return...
    this.status = 'lose';
  }
}

module.exports = Game;
