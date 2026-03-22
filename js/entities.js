/*
    UTILS
    - Common helpers for grid math calculation.
*/

function toCell(x, y) {
    return {
        cx: Math.floor(x / CELL),
        cy: Math.floor(y / CELL)
    };
}

function insideGrid(cx, cy) {
    return cx >= 0 && cy >= 0 && cx < GRID_COLS && cy < GRID_ROWS;
}

function isAtCenter(val) {
    return Math.abs((val % CELL) - CELL / 2) < 0.1;
}

/*
    ENEMY INITIALIZATION
    - Initializes bouncing red enemy marbles around the board.
*/

function initEnemies() {
    enemies = [];
    const count = 2 + gameState.difficulty;
    const speed = 2.5; // Fixed speed for grid snapping

    for (let i = 0; i < count; i++) {
        // Find a random empty cell (0) to spawn in
        let emptyCells = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (grid[y][x] === 0) emptyCells.push({ x, y });
            }
        }

        let cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        enemies.push({
            x: cell.x * CELL + CELL / 2,
            y: cell.y * CELL + CELL / 2,
            vx: speed * (Math.random() < 0.5 ? 1 : -1),
            vy: speed * (Math.random() < 0.5 ? 1 : -1),
            r: 7
        });
    }
}

/*
    BORDER MARBLE
    - Enemy silver marble that traverses the outer perimeter.
*/

function initBorderMarble() {
    const speed = 2.5;

    // Spawn at Bottom Row (GRID_ROWS-1), Cell 18 (x=17)
    borderMarble = {
        x: (17 * CELL) + CELL / 2,
        y: (GRID_ROWS - 1) * CELL + CELL / 2,
        vx: speed * (Math.random() < 0.5 ? 1 : -1),
        vy: speed * (Math.random() < 0.5 ? 1 : -1),
        r: 7
    };
}

function moveBorderMarble() {
    if (!borderMarble)
        return;

    let nextX = borderMarble.x + borderMarble.vx;
    let nextY = borderMarble.y + borderMarble.vy;

    // Check walls separately for snapping
    let tx = toCell(nextX, borderMarble.y);
    let ty = toCell(borderMarble.x, nextY);

    let xBlocked = !insideGrid(tx.cx, tx.cy) || grid[tx.cy][tx.cx] === 0 || grid[tx.cy][tx.cx] === 3;
    let yBlocked = !insideGrid(ty.cx, ty.cy) || grid[ty.cy][ty.cx] === 0 || grid[ty.cy][ty.cx] === 3;

    if (xBlocked && yBlocked) {
        // Hit exact corner or both directions blocked - reverse both
        borderMarble.vx *= -1;
        borderMarble.vy *= -1;
    }
    else if (xBlocked) {
        // Only X direction blocked
        borderMarble.vx *= -1;
    }
    else if (yBlocked) {
        // Only Y direction blocked
        borderMarble.vy *= -1;
    }
    else {
        borderMarble.x = nextX;
        borderMarble.y = nextY;
    }

    // Check collision with player
    if (!capturing) {
        let dist = Math.hypot(borderMarble.x - player.x, borderMarble.y - player.y);
        if (dist < borderMarble.r + player.radius) {
            loseLife(); // relies on game.js
            return;
        }
    }
}

/*
    PLAYER / ENEMY LOGIC
    - Core movement, wall collisions, and capture pathing logic.
*/

function movePlayer() {
    // Apply requested direction if at center
    if (player.requestedDir && isAtCenter(player.x) && isAtCenter(player.y)) {
        player.dir = player.requestedDir;
        player.requestedDir = null;
    }

    if (!player.dir)
        return;

    let oldX = player.x;
    let oldY = player.y;

    if (player.dir === "up")
        player.y -= PLAYER_SPEED;

    if (player.dir === "down")
        player.y += PLAYER_SPEED;

    if (player.dir === "left")
        player.x -= PLAYER_SPEED;

    if (player.dir === "right")
        player.x += PLAYER_SPEED;

    player.x = Math.max(player.radius, Math.min(W - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(H - player.radius, player.y));

    // Only update grid logic when at the center of a cell
    if (!isAtCenter(player.x) || !isAtCenter(player.y))
        return;

    let { cx, cy } = toCell(player.x, player.y);

    if (!insideGrid(cx, cy)) {
        player.x = oldX;
        player.y = oldY;
        player.dir = null;
        return;
    }

    let cell = grid[cy][cx];

    // If not capturing, player can walk freely on border (2) and filled areas (1)
    if (!capturing) {
        // Start capturing when leaving border/filled area into empty space
        if (cell === 0) {
            capturing = true;
            trailCells = [];
            trailCells.push({ cx, cy });
            grid[cy][cx] = 3;
        }
        return;
    }

    // If capturing:
    if (capturing) {
        // Reached border or filled area - complete capture successfully
        if (cell === 2 || cell === 1) {
            finalizeFill(); // relies on capture.js
            capturing = false;
            return;
        }

        // Add to trail if in empty space
        if (cell === 0) {
            // Only add to trail if we've moved into a NEW cell
            let lastTrail = trailCells[trailCells.length - 1];
            if (lastTrail.cx !== cx || lastTrail.cy !== cy) {
                trailCells.push({ cx, cy });
                grid[cy][cx] = 3;
            }
        }
    }
}

function moveEnemies() {
    for (let e of enemies) {
        let nextX = e.x + e.vx;
        let nextY = e.y + e.vy;

        // Check collisions with trail (3)
        let nt = toCell(nextX, nextY);
        if (insideGrid(nt.cx, nt.cy) && grid[nt.cy][nt.cx] === 3) {
            loseLife();
            return;
        }

        // Check walls separately for snapping
        let tx = toCell(nextX, e.y);
        let ty = toCell(e.x, nextY);

        let xBlocked = !insideGrid(tx.cx, tx.cy) || grid[tx.cy][tx.cx] === 1 || grid[tx.cy][tx.cx] === 2;
        let yBlocked = !insideGrid(ty.cx, ty.cy) || grid[ty.cy][ty.cx] === 1 || grid[ty.cy][ty.cx] === 2;

        if (xBlocked && yBlocked) {
            // Hit exact corner - reverse both directions and nudge away
            e.vx *= -1;
            e.vy *= -1;
        }
        else if (xBlocked) {
            e.vx *= -1;
        }
        else if (yBlocked) {
            e.vy *= -1;
        }
        else {
            e.x = nextX;
            e.y = nextY;
        }

        // Check collision with player during capture
        if (capturing) {
            let dist = Math.hypot(e.x - player.x, e.y - player.y);
            if (dist < e.r + player.radius) {
                loseLife();
                return;
            }
        }
    }
}
