/*
    MENU SYSTEM
    - Sets up event listeners for the top navigation dropdowns, managing which menus
      are actively displaying and closing them when clicking away.
*/

// Menu click handlers
document.getElementById('gameMenu')?.addEventListener('click', function (e) {
    toggleMenu('gameDropdown', this);
    e.stopPropagation();
});

document.getElementById('optionsMenu')?.addEventListener('click', function (e) {
    toggleMenu('optionsDropdown', this);
    e.stopPropagation();
});

document.getElementById('helpMenu')?.addEventListener('click', function (e) {
    toggleMenu('helpDropdown', this);
    e.stopPropagation();
});

// Close menus when clicking outside
document.addEventListener('click', function () {
    closeAllMenus();
});

function toggleMenu(dropdownId, menuItem) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown)
        return;

    const wasOpen = dropdown.classList.contains('show');

    closeAllMenus();

    if (!wasOpen) {
        dropdown.classList.add('show');
        menuItem.classList.add('active');
        currentOpenMenu = dropdownId;
    }
}

function closeAllMenus() {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    currentOpenMenu = null;
}

/*
    GAME MENU FUNCTIONS
    - Connects the "Game" menu options to the core loop states, allowing resets
      or application exits.
*/

function newGame() {
    closeAllMenus();
    startGame(gameState.difficulty);
}

function exitGame() {
    closeAllMenus();
    if (confirm('Are you sure you want to exit?')) {
        window.close();
    }
}

/*
    OPTIONS MENU FUNCTIONS  
    - Handles the "Options" dropdown, tracking difficulty checkmarks and syncing the global
      settings. Also handles resetting progress displays when an option is selected.
*/

function setDifficulty(level) {
    gameState.difficulty = level;

    // Update checkmarks using Unicode escape sequence \u2714
    const begin = document.getElementById('check-beginner');
    if (begin) begin.textContent = level === 1 ? '\u2714' : '';
    const inter = document.getElementById('check-intermediate');
    if (inter) inter.textContent = level === 2 ? '\u2714' : '';
    const adv = document.getElementById('check-advanced');
    if (adv) adv.textContent = level === 3 ? '\u2714' : '';

    // Update lives and stats immediately, regardless of playing state
    gameState.lives = (level === 1) ? 4 : 3;
    gameState.score = 0;
    gameState.level = 1;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('scoreDisplay').textContent = 0;
    document.getElementById('percentDisplay').textContent = "0.0%";

    closeAllMenus();

    // Restart/Reset game board
    gameState.gameOver = false; // Reset game over status

    // Explicitly unpause if the game was paused
    gameState.paused = false;
    const icon = document.getElementById("pauseIcon");
    if (icon) {
        icon.src = "icons/pause.svg";
        icon.alt = "Pause";
    }

    resetLevel(false, false);

    if (!gameState.playing)
        draw();
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundCheck = document.getElementById('check-sound');
    if (soundCheck) soundCheck.textContent = gameState.soundEnabled ? '\u2714' : '';
}

/*
    HELP MENU FUNCTIONS
    - Connected to the "Help" item to display the system about modal overtop the gameplay.
*/

function showAbout() {
    closeAllMenus();
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) aboutModal.classList.add('show');
}

/*
    MODAL FUNCTIONS
    - Generic functionality to close specifically targeted modals and establish
      background click-off closing logic.
*/

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('show');
}

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
});
