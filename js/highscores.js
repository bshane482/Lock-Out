/*
    HIGH SCORES
    - Contains logic to save, retrieve, and format leaderboard values from HTML5 localStorage.
*/

function getHighScores() {
    const scores = localStorage.getItem('lockOutHighScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScore(name, level, score) {
    let scores = getHighScores();
    scores.push({ name, level, score, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Keep top 10
    localStorage.setItem('lockOutHighScores', JSON.stringify(scores));
}

function showHighScores() {
    closeAllMenus(); // Relies on menu.js
    const scores = getHighScores();
    const tbody = document.getElementById('scoresTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No high scores yet!</td></tr>';
    }
    else {
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.level}</td>
                <td>${score.score}</td>
            `;
            tbody.appendChild(row);
        });
    }

    const modal = document.getElementById('highScoresModal');

    if (modal)
        modal.classList.add('show');
}
