/*
    FLOOD FILL & FINALIZE
    - Handles grid logic for converting trails into borders.
    - Performs area captures to trap enemies.
*/

function floodFill(startCx, startCy) {
    let stack = [{ cx: startCx, cy: startCy }];
    let visited = new Set();
    let region = [];

    while (stack.length) {
        let { cx, cy } = stack.pop();
        let key = cx + "," + cy;

        if (visited.has(key))
            continue;

        visited.add(key);

        if (!insideGrid(cx, cy))
            continue;

        if (grid[cy][cx] !== 0)
            continue;

        region.push({ cx, cy });

        stack.push({ cx: cx + 1, cy });
        stack.push({ cx: cx - 1, cy });
        stack.push({ cx, cy: cy + 1 });
        stack.push({ cx, cy: cy - 1 });
    }

    return region;
}

function enemiesInRegion(region) {
    for (let e of enemies) {
        let { cx, cy } = toCell(e.x, e.y);
        for (let c of region) {
            if (cx === c.cx && cy === c.cy)
                return true;
        }
    }
    return false;
}

function finalizeFill() {
    let cellsFilled = 0;
    if (trailCells.length < 2) {
        cellsFilled = trailCells.length;
        for (let t of trailCells) {
            grid[t.cy][t.cx] = 1;
        }
        gameState.score += cellsFilled;
        document.getElementById("scoreDisplay").textContent = gameState.score;
        trailCells = [];
        return;
    }

    // Convert trail to border
    cellsFilled += trailCells.length;
    for (let t of trailCells) {
        grid[t.cy][t.cx] = 1;
    }

    // Find all empty regions
    let allRegions = [];
    let checked = new Set();

    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            if (grid[y][x] === 0 && !checked.has(x + "," + y)) {
                let region = floodFill(x, y);
                if (region.length > 0) {
                    allRegions.push(region);
                    for (let c of region) {
                        checked.add(c.cx + "," + c.cy);
                    }
                }
            }
        }
    }

    // Fill regions without enemies
    for (let region of allRegions) {
        if (!enemiesInRegion(region)) {
            cellsFilled += region.length;
            for (let c of region) {
                grid[c.cy][c.cx] = 1;
            }
        }
    }

    gameState.score += cellsFilled;
    document.getElementById("scoreDisplay").textContent = gameState.score;
    trailCells = [];
}

/*
    SCORE PERCENTAGE (%)
    - Calculates the current percentage of the grid that has been successfully captured.
*/

function getFillPercent() {
    let empty = 0, filled = 0;
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            // Count empty cells (0) and trail cells (3) as unfilled
            if (grid[y][x] === 0 || grid[y][x] === 3)
                empty++;

            // Only count permanently filled cells (1) as filled
            if (grid[y][x] === 1)
                filled++;
        }
    }
    return filled / (empty + filled);
}
