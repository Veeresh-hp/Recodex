// Chess Game Logic
let turn = 'W'; // 'W' = White's turn, 'B' = Black's turn
let selectedSquareId = null;
let validMoveSquareIds = [];

// Initialize board data attributes from HTML structure
function initBoardData() {
    document.querySelectorAll('.box').forEach(box => {
        let pieceName = box.innerText.trim();
        box.dataset.piece = pieceName;
    });
}

// Render images and cursor styling based on dataset.piece
function renderBoard() {
    document.querySelectorAll('.box').forEach(box => {
        const piece = box.dataset.piece || "";

        if (piece !== "") {
            const isPawn = piece.endsWith("pawn");
            box.innerHTML = `<img class='allimg${isPawn ? ' allpawn' : ''}' src="${piece}.png" alt="${piece}">`;
            box.style.cursor = 'pointer';
        } else {
            box.innerHTML = "";
            box.style.cursor = 'default';
        }
    });
}

// Reset background colors for board squares
function coloring() {
    document.querySelectorAll('.box').forEach(box => {
        box.classList.remove('selected-piece', 'valid-move', 'valid-capture');
        const id = box.id; // e.g. b801
        const r = parseInt(id.charAt(1));
        const c = parseInt(id.slice(2));

        if ((r + c) % 2 === 0) {
            box.style.backgroundColor = 'rgb(240, 201, 150)';
        } else {
            box.style.backgroundColor = 'rgb(100, 75, 43)';
        }
    });
}

// Helper: Parse row and col from square ID (e.g., "b801" -> { r: 8, c: 1 })
function parseSquareId(id) {
    if (!id || id.length < 4) return null;
    return {
        r: parseInt(id.charAt(1)),
        c: parseInt(id.slice(2))
    };
}

// Helper: Construct square ID from row and col (e.g., r: 8, c: 1 -> "b801")
function getSquareId(r, c) {
    if (r < 1 || r > 8 || c < 1 || c > 8) return null;
    return `b${r}0${c}`;
}

// Helper: Get piece at square ID
function getPieceAt(id) {
    const box = document.getElementById(id);
    return box ? (box.dataset.piece || "") : "";
}

// Calculate all valid moves for a piece at square ID
function getValidMoves(id) {
    const pos = parseSquareId(id);
    if (!pos) return [];

    const r = pos.r;
    const c = pos.c;
    const piece = getPieceAt(id);
    if (!piece) return [];

    const team = piece.charAt(0); // 'W' or 'B'
    const pieceType = piece.slice(1);
    const moves = [];

    // Helper for adding valid move
    function addMoveIfValid(targetR, targetC) {
        const targetId = getSquareId(targetR, targetC);
        if (!targetId) return false;

        const targetPiece = getPieceAt(targetId);
        if (!targetPiece) {
            moves.push(targetId);
            return true; // empty square, can continue sliding
        } else if (targetPiece.charAt(0) !== team) {
            moves.push(targetId);
            return false; // enemy piece, capture and stop sliding
        }
        return false; // same team piece, stop sliding
    }

    // Helper for sliding pieces (Rook, Bishop, Queen)
    function slideDirections(directions) {
        directions.forEach(([dr, dc]) => {
            for (let step = 1; step <= 7; step++) {
                const canContinue = addMoveIfValid(r + dr * step, c + dc * step);
                if (!canContinue) break;
            }
        });
    }

    if (pieceType === "pawn") {
        if (team === 'W') {
            // White Pawn moves UP (row increases)
            const f1 = getSquareId(r + 1, c);
            if (f1 && getPieceAt(f1) === "") {
                moves.push(f1);
                // Initial 2-square move
                if (r === 2) {
                    const f2 = getSquareId(r + 2, c);
                    if (f2 && getPieceAt(f2) === "") {
                        moves.push(f2);
                    }
                }
            }
            // Diagonal captures
            [c - 1, c + 1].forEach(targetC => {
                const capId = getSquareId(r + 1, targetC);
                if (capId) {
                    const enemy = getPieceAt(capId);
                    if (enemy && enemy.startsWith('B')) {
                        moves.push(capId);
                    }
                }
            });
        } else {
            // Black Pawn moves DOWN (row decreases)
            const f1 = getSquareId(r - 1, c);
            if (f1 && getPieceAt(f1) === "") {
                moves.push(f1);
                // Initial 2-square move
                if (r === 7) {
                    const f2 = getSquareId(r - 2, c);
                    if (f2 && getPieceAt(f2) === "") {
                        moves.push(f2);
                    }
                }
            }
            // Diagonal captures
            [c - 1, c + 1].forEach(targetC => {
                const capId = getSquareId(r - 1, targetC);
                if (capId) {
                    const enemy = getPieceAt(capId);
                    if (enemy && enemy.startsWith('W')) {
                        moves.push(capId);
                    }
                }
            });
        }
    } else if (pieceType === "knight") {
        const knightOffsets = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        knightOffsets.forEach(([dr, dc]) => {
            addMoveIfValid(r + dr, c + dc);
        });
    } else if (pieceType === "rook") {
        slideDirections([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    } else if (pieceType === "bishop") {
        slideDirections([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    } else if (pieceType === "queen") {
        slideDirections([
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]);
    } else if (pieceType === "king") {
        const kingOffsets = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        kingOffsets.forEach(([dr, dc]) => {
            addMoveIfValid(r + dr, c + dc);
        });
    }

    return moves;
}

// Check Win Condition (When a King is captured)
function checkWinCondition() {
    let whiteKing = false;
    let blackKing = false;

    document.querySelectorAll('.box').forEach(box => {
        const p = box.dataset.piece;
        if (p === 'Wking') whiteKing = true;
        if (p === 'Bking') blackKing = true;
    });

    if (!whiteKing || !blackKing) {
        const winner = whiteKing ? "White" : "Black";
        const togHeader = document.getElementById('tog');
        if (togHeader) {
            togHeader.innerText = `🎉 ${winner} Wins!`;
            togHeader.style.color = '#e67e22';
        }
        setTimeout(() => {
            alert(`🎉 Game Over! ${winner} Wins!`);
        }, 150);
        return true;
    }
    return false;
}

// Initialize Board & Events
initBoardData();
coloring();
renderBoard();

// Setup single click handler on board squares
document.querySelectorAll('.box').forEach(box => {
    box.addEventListener('click', function () {
        const boxId = this.id;
        const piece = this.dataset.piece || "";
        const boxTeam = piece ? piece.charAt(0) : null;

        // Option 1: Select or switch selection to a piece of the active team
        if (boxTeam === turn) {
            selectedSquareId = boxId;
            coloring();
            this.classList.add('selected-piece');

            validMoveSquareIds = getValidMoves(boxId);
            validMoveSquareIds.forEach(targetId => {
                const targetBox = document.getElementById(targetId);
                if (targetBox) {
                    if (targetBox.dataset.piece) {
                        targetBox.classList.add('valid-capture');
                    } else {
                        targetBox.classList.add('valid-move');
                    }
                }
            });
            return;
        }

        // Option 2: Execute move if a piece is selected and target square is a valid move
        if (selectedSquareId && validMoveSquareIds.includes(boxId)) {
            const sourceBox = document.getElementById(selectedSquareId);
            const movingPiece = sourceBox.dataset.piece;

            // Execute Move
            this.dataset.piece = movingPiece;
            sourceBox.dataset.piece = "";

            // Pawn Promotion Check
            const targetPos = parseSquareId(boxId);
            if (movingPiece === "Wpawn" && targetPos.r === 8) {
                this.dataset.piece = "Wqueen";
            } else if (movingPiece === "Bpawn" && targetPos.r === 1) {
                this.dataset.piece = "Bqueen";
            }

            // Check if King was captured
            const gameOver = checkWinCondition();

            // Clear Selection
            selectedSquareId = null;
            validMoveSquareIds = [];
            coloring();
            renderBoard();

            if (gameOver) return;

            // Switch Turn
            turn = (turn === 'W') ? 'B' : 'W';
            updateTurnUI();
            return;
        }

        // Option 3: Deselect if clicking anywhere else
        selectedSquareId = null;
        validMoveSquareIds = [];
        coloring();
    });
});

function updateTurnUI() {
    const togHeader = document.getElementById('tog');
    const playerWhite = document.getElementById('player-white');
    const playerBlack = document.getElementById('player-black');

    if (togHeader) {
        togHeader.innerText = (turn === 'W') ? "White's Turn" : "Black's Turn";
    }

    if (playerWhite && playerBlack) {
        if (turn === 'W') {
            playerWhite.classList.add('active');
            playerBlack.classList.remove('active');
        } else {
            playerBlack.classList.add('active');
            playerWhite.classList.remove('active');
        }
    }
}

const resetBtn = document.getElementById('reset-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', function() {
        // Reset pieces
        turn = 'W';
        selectedSquareId = null;
        validMoveSquareIds = [];

        // Reset starting board piece setup
        const initialPieces = {
            'b801': 'Brook', 'b802': 'Bknight', 'b803': 'Bbishop', 'b804': 'Bqueen', 'b805': 'Bking', 'b806': 'Bbishop', 'b807': 'Bknight', 'b808': 'Brook',
            'b701': 'Bpawn', 'b702': 'Bpawn', 'b703': 'Bpawn', 'b704': 'Bpawn', 'b705': 'Bpawn', 'b706': 'Bpawn', 'b707': 'Bpawn', 'b708': 'Bpawn',
            'b201': 'Wpawn', 'b202': 'Wpawn', 'b203': 'Wpawn', 'b204': 'Wpawn', 'b205': 'Wpawn', 'b206': 'Wpawn', 'b207': 'Wpawn', 'b208': 'Wpawn',
            'b101': 'Wrook', 'b102': 'Wknight', 'b103': 'Wbishop', 'b104': 'Wqueen', 'b105': 'Wking', 'b106': 'Wbishop', 'b107': 'Wknight', 'b108': 'Wrook'
        };

        document.querySelectorAll('.box').forEach(box => {
            box.dataset.piece = initialPieces[box.id] || "";
        });

        coloring();
        renderBoard();
        updateTurnUI();
    });
}


