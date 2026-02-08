<?php
session_start();
header('Content-Type: application/json');

const GRID = 10;
const SHIPS = [2,3,5];

// ---------- INIT CPU IF NOT SET ----------
if (!isset($_SESSION['cpu'])) {
    $_SESSION['cpu'] = [
        'ships' => placeShips(),
        'hits' => [],
        'shots' => []
    ];
}

$data = json_decode(file_get_contents('php://input'), true);

// ---------- PLAYER PLACEMENT (NEW GAME START) ----------
if (($data['action'] ?? '') === 'place') {

    // Reset entire game state
    $_SESSION['cpu'] = [
        'ships' => placeShips(),
        'hits' => [],
        'shots' => []
    ];

    $_SESSION['player'] = [
        'ships' => $data['ships'],
        'hits' => [],
        'shots' => []
    ];

    echo json_encode(['ok' => true]);
    exit;
}

// ---------- FIRE ----------
$cell = $data['cell'] ?? null;

if (!$cell || !isset($_SESSION['player'])) {
    echo json_encode(['error' => 'Invalid state']);
    exit;
}

// ----- PLAYER FIRES -----
$playerHit = in_array($cell, $_SESSION['cpu']['ships']);
$_SESSION['player']['shots'][] = $cell;

if ($playerHit) {
    $_SESSION['cpu']['hits'][] = $cell;
}

// ----- CPU FIRES -----
$cpuCell = randomCell($_SESSION['cpu']['shots']);
$_SESSION['cpu']['shots'][] = $cpuCell;

$cpuHit = in_array($cpuCell, $_SESSION['player']['ships']);

if ($cpuHit) {
    $_SESSION['player']['hits'][] = $cpuCell;
}

// ----- GAME OVER CHECK -----
$gameOver = count($_SESSION['cpu']['hits']) === count($_SESSION['cpu']['ships']);

echo json_encode([
    'player' => [
        'cell' => $cell,
        'result' => $playerHit ? 'hit' : 'miss'
    ],
    'computer' => [
        'cell' => $cpuCell,
        'result' => $cpuHit ? 'hit' : 'miss'
    ],
    'gameOver' => $gameOver
]);

// ================= FUNCTIONS =================

function placeShips() {
    $ships = [];

    foreach (SHIPS as $size) {
        while (true) {
            $horizontal = rand(0,1) === 1;
            $row = rand(0,9);
            $col = rand(0,9);

            $cells = [];
            $valid = true;

            for ($i = 0; $i < $size; $i++) {
                $r = $horizontal ? $row : $row + $i;
                $c = $horizontal ? $col + $i : $col;

                if ($r > 9 || $c > 9) {
                    $valid = false;
                    break;
                }

                $cell = chr(65 + $r) . ($c + 1);

                if (in_array($cell, $ships)) {
                    $valid = false;
                    break;
                }

                $cells[] = $cell;
            }

            if ($valid) {
                $ships = array_merge($ships, $cells);
                break;
            }
        }
    }

    return $ships;
}

function randomCell($shots) {
    while (true) {
        $cell = chr(65 + rand(0,9)) . rand(1,10);
        if (!in_array($cell, $shots)) {
            return $cell;
        }
    }
}
