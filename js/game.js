/*
    INPUT
    - Keyboard event listeners for moving the player.
*/

document.addEventListener("keydown", e => {
    if (!gameState.playing) return;

    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }

    if (gameState.paused) return;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();

    if (e.key === "ArrowUp")
        player.requestedDir = "up";

    if (e.key === "ArrowDown")
        player.requestedDir = "down";

    if (e.key === "ArrowLeft")
        player.requestedDir = "left";

    if (e.key === "ArrowRight")
        player.requestedDir = "right";
});

/*
    GAME CONTROL & LOSS
    - Level transitioning, resets, and death handling.
*/

function playHitSound() {
    if (!gameState.soundEnabled) return;
    hitSound.currentTime = 0;
    hitSound.play().catch(e => console.log("Sound play prevented:", e));
}

function loseLife() {
    if (!gameState.playing || gameState.gameOver) return;

    playHitSound();
    gameState.lives--;
    if (gameState.lives < 0) gameState.lives = 0;
    document.getElementById("livesDisplay").textContent = gameState.lives;

    if (gameState.lives <= 0) {
        gameState.playing = false;
        gameState.gameOver = true; // Set flag immediately for visibility
        // Use setTimeout to allow the HUD to update to 0 before the prompt/alert blocks execution
        setTimeout(() => {
            const finalScore = gameState.score;

            // Check if this is a high score
            const highScores = getHighScores();
            const isHighScore = finalScore > 0 && (highScores.length < 10 || (highScores.length > 0 && finalScore > highScores[highScores.length - 1].score));

            if (isHighScore) {
                const playerName = prompt(`Game Over!\n\nLevels Complete: ${gameState.level - 1}\nScore: ${finalScore}\n\nYou made the high score list!\nEnter your name:`, 'Player');
                if (playerName) {
                    saveHighScore(playerName.substring(0, 20), gameState.level - 1, finalScore);
                    showHighScores();
                }
            }
            else {
                alert(`Game Over!\n\nLevels Complete: ${gameState.level - 1}\nScore: ${finalScore}`);
            }
        }, 10);
    }
    else {
        resetLevel(true, true);
    }
}

function nextLevel() {
    gameState.level++;
    gameState.score += 100;
    document.getElementById("scoreDisplay").textContent = gameState.score;
    if (gameState.level % 3 === 0 && gameState.difficulty < 3) {
        gameState.difficulty++;
    }
    resetLevel(false, false);
}

function resetLevel(keepGrid = false, keepEnemies = false) {
    if (!keepGrid) {
        initGrid();
    }
    else {
        // Clear any leftover trail (value 3)
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (grid[y][x] === 3)
                    grid[y][x] = 0;
            }
        }
    }

    if (!keepEnemies)
        initEnemies();

    initBorderMarble();
    player.x = (17 * CELL) + CELL / 2; // Cell 18
    player.y = (0 * CELL) + CELL / 2;  // Top Row
    player.dir = null;
    player.requestedDir = null;
    capturing = false;
    trailCells = [];
    levelCompleteShown = false;
}

function startGame(d) {
    gameState.playing = true;
    gameState.gameOver = false;
    gameState.lives = (gameState.difficulty === 1) ? 4 : 3;
    gameState.level = 1;
    gameState.score = 0;
    document.getElementById("livesDisplay").textContent = gameState.lives;
    document.getElementById("scoreDisplay").textContent = 0;

    // Reset pause state when starting a new game
    gameState.paused = false;
    const icon = document.getElementById("pauseIcon");
    if (icon) {
        icon.src = "icons/pause.svg";
        icon.alt = "Pause";
    }

    resetLevel(false, false);
}

function togglePause() {
    if (!gameState.playing) return;
    gameState.paused = !gameState.paused;
    const icon = document.getElementById("pauseIcon");
    if (icon) {
        icon.src = gameState.paused ? "icons/play.svg" : "icons/pause.svg";
        icon.alt = gameState.paused ? "Play" : "Pause";
    }
}

/*
    GRID INIT    
    - Populates the 2D array matrix with empty / border tiles.
*/
function initGrid() {
    grid = [];
    for (let y = 0; y < GRID_ROWS; y++) {
        grid[y] = new Array(GRID_COLS).fill(0);
    }

    for (let x = 0; x < GRID_COLS; x++) {
        for (let i = 0; i < BORDER; i++) {
            grid[i][x] = 2;
            grid[GRID_ROWS - 1 - i][x] = 2;
        }
    }

    for (let y = 0; y < GRID_ROWS; y++) {
        for (let i = 0; i < BORDER; i++) {
            grid[y][i] = 2;
            grid[y][GRID_COLS - 1 - i] = 2;
        }
    }
}

/*
    DRAW
    - Renders the canvas pixels each frame based on state.
*/

function drawGrid() {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)"; // Light, transparent grid lines
    for (let x = 0; x <= GRID_COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, H);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(W, y * CELL);
        ctx.stroke();
    }
}

function draw() {
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    drawGrid();

    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            if (grid[y][x] === 2) {
                ctx.fillStyle = "#111";
                ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
                ctx.strokeStyle = "#777";
                ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
            }
            if (grid[y][x] === 1) {
                ctx.fillStyle = "#111";
                ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
                ctx.strokeStyle = "#777";
                ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
            }
            if (grid[y][x] === 3) {
                ctx.fillStyle = "#0849fc";
                ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            }
        }
    }

    if (gameState.playing || gameState.gameOver) {
        enemies.forEach(e => {
            let grad = ctx.createRadialGradient(e.x - e.r / 3, e.y - e.r / 3, e.r / 10, e.x, e.y, e.r);
            grad.addColorStop(0, "#ff8888");
            grad.addColorStop(1, "#aa0000");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.fill();
        });

        if (borderMarble) {
            let grad = ctx.createRadialGradient(borderMarble.x - borderMarble.r / 3, borderMarble.y - borderMarble.r / 3, borderMarble.r / 10, borderMarble.x, borderMarble.y, borderMarble.r);
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(1, "#666666");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(borderMarble.x, borderMarble.y, borderMarble.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Determine when to draw the blue capture box
    let drawBox = capturing;
    if (drawBox) {
        let leftEdge = player.x - player.radius;
        let rightEdge = player.x + player.radius;
        let topEdge = player.y - player.radius;
        let bottomEdge = player.y + player.radius;

        let minX = Math.max(0, Math.floor(leftEdge / CELL));
        let maxX = Math.min(GRID_COLS - 1, Math.floor(rightEdge / CELL));
        let minY = Math.max(0, Math.floor(topEdge / CELL));
        let maxY = Math.min(GRID_ROWS - 1, Math.floor(bottomEdge / CELL));

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (grid[y][x] === 1 || grid[y][x] === 2) {
                    drawBox = false;
                    break;
                }
            }
            if (!drawBox)
                break;
        }
    }

    // Draw the blue capture box
    if (drawBox) {
        ctx.fillStyle = "#0849fc";
        ctx.fillRect(player.x - (CELL / 2), player.y - (CELL / 2), CELL, CELL);
    }

    let pGrad = ctx.createRadialGradient(player.x - player.radius / 3, player.y - player.radius / 3, player.radius / 10, player.x, player.y, player.radius);
    pGrad.addColorStop(0, "#88ccff");
    pGrad.addColorStop(1, "#0055aa");
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Update HUD and check win condition
    if (gameState.playing) {
        let pct = getFillPercent();
        document.getElementById("percentDisplay").textContent = (pct * 100).toFixed(1) + "%";

        if (pct >= WIN_PERCENT && !levelCompleteShown) {
            levelCompleteShown = true;
            setTimeout(() => {
                alert("Level Complete!");
                nextLevel();
            }, 100);
        }
    }
}

/*
    LOOP ENTRY
    - The primary recursive update loop.
*/

function gameLoop() {
    if (gameState.playing && !gameState.paused) {
        movePlayer();
        moveEnemies();
        moveBorderMarble();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Initial game loop
if (canvas) {
    initGrid();
    gameLoop();
}
