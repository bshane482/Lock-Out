/*
    GLOBAL VARIABLES
    - Defines constants for grid dimensions, colors, and game state.
*/

// 36 x 21 grid
const GRID_COLS = 36;
const GRID_ROWS = 21;
const CELL = 20;

const canvas = document.getElementById("game");
if (canvas) {
    canvas.width = GRID_COLS * CELL;
    canvas.height = GRID_ROWS * CELL;
}
const ctx = canvas ? canvas.getContext("2d") : null;

const W = canvas ? canvas.width : (GRID_COLS * CELL);
const H = canvas ? canvas.height : (GRID_ROWS * CELL);

const BORDER = 2;
const PLAYER_SPEED = 2.5;
const WIN_PERCENT = 0.75;

let grid = [];

let gameState = {
    lives: 4,
    level: 1,
    difficulty: 1,
    playing: false,
    paused: false,
    gameOver: false,
    score: 0,
    soundEnabled: true
};

let currentOpenMenu = null;

let player = {
    x: (17 * CELL) + CELL / 2, // Cell 18
    y: (0 * CELL) + CELL / 2,  // Top Row
    radius: CELL / 2,
    dir: null,
    requestedDir: null,
    color: "#00bfff"
};

let enemies = [];
let borderMarble = null;
let capturing = false;
let trailCells = [];
let levelCompleteShown = false;

const hitSound = new Audio('sounds/hit.wav');
