const DEFAULT_TRACTOR_LEFT = [
  "     /\\  ,-,---,",
  "    //\\\\/|_|___|  Y",
  ",__//  \\\\|/``\\ |--'-q  _",
  " \\_/    {( () ) {(===t||",
  "          \\__/````\\_/  \\",
];

const MIRROR_CHARACTER_MAP = new Map([
  ["/", "\\"],
  ["\\", "/"],
  ["(", ")"],
  [")", "("],
  ["[", "]"],
  ["]", "["],
  ["{", "}"],
  ["}", "{"],
  ["<", ">"],
  [">", "<"],
  ["q", "p"],
  ["p", "q"],
]);

function hashStringToUint32(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), state | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeSpriteRows(spriteRows) {
  const spriteWidth = spriteRows.reduce((maxWidth, row) => {
    return Math.max(maxWidth, row.length);
  }, 0);
  return spriteRows.map((row) => row.padEnd(spriteWidth, " "));
}

function mirrorCharacter(character) {
  return MIRROR_CHARACTER_MAP.get(character) ?? character;
}

function mirrorSpriteRows(spriteRows) {
  return spriteRows.map((row) => {
    const mirrored = [];
    for (let index = row.length - 1; index >= 0; index -= 1) {
      mirrored.push(mirrorCharacter(row[index]));
    }
    return mirrored.join("");
  });
}

function normalizeCorpusLines(corpusLines) {
  return corpusLines.map((line, index) => {
    const normalizedLine = line.replace(/\r/g, "").replace(/\t/g, "  ");
    if (/^[ 0-9]{4}\|/.test(normalizedLine)) {
      return normalizedLine;
    }
    const lineId = String((index % 9999) + 1).padStart(4, " ");
    return `${lineId}|${normalizedLine}`;
  });
}

function fitLineToWidth(line, width) {
  if (line.length >= width) {
    return line.slice(0, width);
  }
  return line.padEnd(width, " ");
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function seedKey(seed, width, height) {
  return `${seed}|${width}x${height}`;
}

export function parseCorpusText(corpusText) {
  const lines = corpusText
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.length > 0);
  return normalizeCorpusLines(lines);
}

export class FarmingSimulation {
  constructor(options) {
    const {
      width,
      height,
      seed,
      corpusLines,
      tractorRows = DEFAULT_TRACTOR_LEFT,
    } = options;

    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("width must be a positive integer");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("height must be a positive integer");
    }
    if (!Array.isArray(corpusLines) || corpusLines.length === 0) {
      throw new Error("corpusLines must be a non-empty array");
    }

    const normalizedTractorRows = normalizeSpriteRows(tractorRows);
    this.leftSpriteRows = normalizedTractorRows;
    this.rightSpriteRows = mirrorSpriteRows(normalizedTractorRows);
    this.spriteHeight = normalizedTractorRows.length;
    this.spriteWidth = normalizedTractorRows[0].length;

    if (height < this.spriteHeight) {
      throw new Error("height must be at least tractor sprite height");
    }

    this.width = width;
    this.height = height;
    this.seed = seed;
    this.seedKey = seedKey(seed, width, height);
    this.random = createMulberry32(hashStringToUint32(this.seedKey));

    this.corpusLines = normalizeCorpusLines(corpusLines);
    this.activeTractors = [];
    this.nextTractorId = 1;

    this.fieldChars = Array.from({ length: height }, () => {
      return Array.from({ length: width }, () => " ");
    });

    this.fieldOccupancy = Array.from({ length: height }, () => {
      return Array.from({ length: width }, () => false);
    });
  }

  randomInt(minimum, maximum) {
    const span = maximum - minimum + 1;
    return Math.floor(this.random() * span) + minimum;
  }

  calculateOppositeRatio(mode, topRow) {
    let oppositeCount = 0;
    const totalCells = this.spriteHeight * this.width;
    for (let rowOffset = 0; rowOffset < this.spriteHeight; rowOffset += 1) {
      const rowIndex = topRow + rowOffset;
      for (let columnIndex = 0; columnIndex < this.width; columnIndex += 1) {
        const occupied = this.fieldOccupancy[rowIndex][columnIndex];
        if (mode === "clear" && occupied) {
          oppositeCount += 1;
          continue;
        }
        if (mode === "plant" && !occupied) {
          oppositeCount += 1;
        }
      }
    }
    return oppositeCount / totalCells;
  }

  isRowDisjoint(topRow) {
    const candidateStart = topRow;
    const candidateEnd = topRow + this.spriteHeight;
    return this.activeTractors.every((tractor) => {
      const tractorStart = tractor.topRow;
      const tractorEnd = tractor.topRow + tractor.height;
      return !intervalsOverlap(candidateStart, candidateEnd, tractorStart, tractorEnd);
    });
  }

  selectPlantBlock() {
    const startIndex = this.randomInt(0, this.corpusLines.length - 1);
    const block = [];
    for (let rowOffset = 0; rowOffset < this.spriteHeight; rowOffset += 1) {
      const corpusIndex = (startIndex + rowOffset) % this.corpusLines.length;
      block.push(fitLineToWidth(this.corpusLines[corpusIndex], this.width));
    }
    return block;
  }

  createTractor(mode, direction, topRow) {
    return {
      id: this.nextTractorId++,
      mode,
      direction,
      topRow,
      x: direction === "ltr" ? -this.spriteWidth : this.width,
      width: this.spriteWidth,
      height: this.spriteHeight,
      spriteRows: direction === "ltr" ? this.leftSpriteRows : this.rightSpriteRows,
      plantBlock: mode === "plant" ? this.selectPlantBlock() : null,
    };
  }

  attemptSpawn() {
    const mode = this.random() < 0.5 ? "clear" : "plant";
    const direction = this.random() < 0.5 ? "ltr" : "rtl";
    const topRow = this.randomInt(0, this.height - this.spriteHeight);
    const rowDisjoint = this.isRowDisjoint(topRow);
    const oppositeRatio = this.calculateOppositeRatio(mode, topRow);
    const majorityOpposite = oppositeRatio > 0.5;

    const spawnAttempt = {
      mode,
      direction,
      topRow,
      rowDisjoint,
      oppositeRatio,
      majorityOpposite,
      modeValid: majorityOpposite,
      spawned: false,
      tractorId: null,
    };

    if (!rowDisjoint || !majorityOpposite) {
      return spawnAttempt;
    }

    const tractor = this.createTractor(mode, direction, topRow);
    this.activeTractors.push(tractor);
    spawnAttempt.spawned = true;
    spawnAttempt.tractorId = tractor.id;
    return spawnAttempt;
  }

  applyTrailingColumn(tractor) {
    const trailingColumn = tractor.direction === "ltr" ? tractor.x - 1 : tractor.x + tractor.width;
    if (trailingColumn < 0 || trailingColumn >= this.width) {
      return;
    }

    for (let rowOffset = 0; rowOffset < tractor.height; rowOffset += 1) {
      const rowIndex = tractor.topRow + rowOffset;
      if (tractor.mode === "clear") {
        this.fieldChars[rowIndex][trailingColumn] = " ";
        this.fieldOccupancy[rowIndex][trailingColumn] = false;
        continue;
      }

      const plantedLine = tractor.plantBlock[rowOffset];
      const plantedCharacter = plantedLine[trailingColumn] ?? " ";
      this.fieldChars[rowIndex][trailingColumn] = plantedCharacter;
      this.fieldOccupancy[rowIndex][trailingColumn] = true;
    }
  }

  advanceTractors() {
    for (const tractor of this.activeTractors) {
      tractor.x += tractor.direction === "ltr" ? 1 : -1;
      this.applyTrailingColumn(tractor);
    }
  }

  removeExitedTractors() {
    this.activeTractors = this.activeTractors.filter((tractor) => {
      if (tractor.direction === "ltr") {
        return tractor.x < this.width;
      }
      return tractor.x + tractor.width > 0;
    });
  }

  tick() {
    this.advanceTractors();
    this.removeExitedTractors();
    const spawnAttempt = this.attemptSpawn();
    return {
      spawnAttempt,
      activeCount: this.activeTractors.length,
    };
  }

  renderFrame() {
    const frameRows = this.fieldChars.map((row) => row.slice());

    for (const tractor of this.activeTractors) {
      for (let rowOffset = 0; rowOffset < tractor.height; rowOffset += 1) {
        const frameRow = tractor.topRow + rowOffset;
        const spriteRow = tractor.spriteRows[rowOffset];
        for (let spriteColumn = 0; spriteColumn < tractor.width; spriteColumn += 1) {
          const frameColumn = tractor.x + spriteColumn;
          if (frameColumn < 0 || frameColumn >= this.width) {
            continue;
          }
          frameRows[frameRow][frameColumn] = spriteRow[spriteColumn];
        }
      }
    }

    return frameRows.map((row) => row.join("")).join("\n");
  }
}
