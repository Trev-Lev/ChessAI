/*

    Author: Trevor Levins
    Using Chess.js and Chessboard.js 

    TODO: Add gameover info

*/

var board, game = new Chess();
// Start values for alpha-beta pruning
var STARTALPHA = -10000;
var STARTBETA = 10000;

// do not pick up pieces if the game is over
// only pick up pieces for White - change?
var onDragStart = function(source, piece, position, orientation) {
  if (game.in_checkmate() === true || game.in_draw() === true ||
    piece.search(/^b/) !== -1) {
    return false;
  }
};

var makeRandomMove = function() {
  var possibleMoves = game.moves();

  // game over
  if (possibleMoves.length === 0) return;

  var randomIndex = Math.floor(Math.random() * possibleMoves.length);

  // Necessary to do on both the game in memory and the board on the page
  game.move(possibleMoves[randomIndex]);
  board.position(game.fen());

};

// Highlight possible moves function
var onMouseOverSquare = function(square, piece) {
    // Get the list of all possible moves of the square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;
    
    // Highlight initial square
    greySquare(square);

    // Highlights possible moves
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }  
};

var onDrop = function(source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    
    removeGreySquares();

    // illegal move
    if (move === null) return 'snapback';
    
    

    // MAGIC HAPPENS HERE
    // Begin the minimax in 250 ms after a legal move!
    $('#status').text('Thinking...');
    $('#lastMove').text('Last move: ' + game.history()[game.history().length-1]);
    window.setTimeout(makeBestMove, 250);
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

// #aed6f1 looks good - try #85c1e9 with it
var greySquare = function(square) {
    var squareE1 = $('#board .square-' + square);
    var background = '#aed6f1'; // Can change as desired - be careful: #a9a9a9
    if (squareE1.hasClass('black-3c85d') === true) {
        background = '#85c1e9'; // #696969
    }
    squareE1.css('background', background);
};

var onMouseoutSquare = function(square, piece) {
    removeGreySquares();
};

/* Inputs:
    depth = how deep the tree should go
    game = the chessboard in use (in case more than one on one page)
    isMaximizing player = boolean used to determine MAX or MIN in function
*/

var root = function (depth, game, isMaximizing) {
    var possibleMoves = game.moves();
    var best = -999999;
    var currentBestMove;
    
    for (var i = 0; i < possibleMoves.length; i++) {
        var newMove = possibleMoves[i];
        game.move(newMove);
        var val = minimax(depth-1, game, -10000, 10000, !isMaximizing);
        game.undo();    // no need to create more objects, right? 
        if (val >= best) {
            best = val;
            currentBestMove = newMove;
        }
    }
    return currentBestMove;
};

var minimax = function(depth, game, alpha, beta, maximizing) {
    positions++;
    if (depth === 0) return -evaluateBoard(game.board());
    
    // Get list of moves to work with 
    var newMoves = game.moves();
    
    if (maximizing) {
        var bestMoveScore = -999999;
        for (var i = 0; i < newMoves.length; i++) {
            game.move(newMoves[i]);
            bestMoveScore = Math.max(bestMoveScore, minimax(depth-1, game, alpha, beta, !maximizing));
            game.undo();
            alpha = Math.max(alpha, bestMoveScore);
            if (beta <= alpha) return bestMoveScore;    // Prune and save search space
        }
        return bestMoveScore;
    } else {    // if minimizing
        var bestMoveScore = 999999;
        for (var i = 0; i < newMoves.length; i++) {
            game.move(newMoves[i]);
            bestMoveScore = Math.min(bestMoveScore, minimax(depth-1, game, alpha, beta, !maximizing));
            game.undo();
            beta = Math.min(beta, bestMoveScore);
            if (beta <= alpha) return bestMoveScore;
        }
        return bestMoveScore;
    }
    
};

// For the below anonymous function to keep count on positions found
var positions = 0;

// Pass the game - the board is not necessary

var makeBestMove = function() {
    var bestMove = getBestMove(game);
    game.move(bestMove);
    board.position(game.fen());
    if(game.game_over()) {
        alert ('Game over!');
        printEndMessage();
    }
    $('#status').text('');
    $('#lastMove').text('Last move: ' + game.history()[game.history().length-1]);
};

var getBestMove = function (game) {
    
    // Reset the number of positions evaluated
    positions = 0;
    
    // Depth of the minimax tree. Increase to increase computing time and AI difficulty
    var depth = 3;
    
    // Timing and call of minimax
    var d1 = performance.now();
    var bestMove = root(depth, game, true);
    var d2 = performance.now();
    var timeElapsed = (d2-d1);
    
    // Make the time elapsed look better
    timeElapsed = timeElapsed.toFixed(2);
    
    // Show time elapsed, update positions found, return best move found
    $('#position-count').text(positions);
    $('#timespan').text(timeElapsed + " milliseconds");
    return bestMove;
};

/* 
    - EVAL ARRAYS BELOW - 
    All values used are from chessprogramming.com divided by 10
    https://chessprogramming.wikispaces.com/Simplified+evaluation+function
*/

// PAWN: AI will usually use the black one, but here is the white just in case
// I ever decide to implement a user's choice of color
var whitePawnEval = 
    [
      [0,   0,   0,   0,   0,   0,   0,   0],
      [5,   5,   5,   5,   5,   5,   5,   5],
      [1,   1,   2,   3,   3,   2,   1,   1],
      [0.5, 0.5, 1, 2.5, 2.5,   1, 0.5, 0.5],
      [0,   0,   0,   2,   2,   0,   0,   0],
      [0, -0.5, -1,   0,   0,  -1, -0.5, 0.5],
      [0.5, 1,   1,  -2,  -2,   1, 1, 0],
      [0,   0,   0,   0,   0,   0,   0,   0]
    ];
var blackPawnEval = reverseArr(whitePawnEval);

// KNIGHT: Same as above, except these values are the same for both colors
var knightEval =
    [
        [-5,  -4,  -3,  -3,  -3,  -3,  -4, -5],
        [-4,  -2,   0,   0,   0,   0,  -2, -4],
        [-3,   0,   1, 1.5, 1.5,   1,   0, -3],
        [-3, 0.5, 1.5,   2,   2, 1.5, 0.5, -3],
        [-3,   0, 1.5,   2,   2, 1.5,   0, -3],
        [-3, 0.5,   1, 1.5, 1.5,   1, 0.5, -3],
        [-4,  -2,   0, 0.5, 0.5,   0,  -2, -4],
        [-5,  -4,  -3,  -3,  -3,  -3,  -4, -5]
    ];

// BISHOP: Same as above, black is mirrored.
var whiteBishopEval = 
    [
        [-2, -1, -1, -1, -1, -1, -1, -2],
        [-1, 0, 0, 0, 0, 0, 0, -1],
        [-1, 0, 0.5, 1, 1, 0.5, 0, -1],
        [-1, 0.5, 0.5, 1, 1, 0.5, 0.5, -1],
        [-1, 0, 1, 1, 1, 1, 0, -1],
        [-1, 1, 1, 1, 1, 1, 1, -1],
        [-1, 0.5, 0, 0, 0, 0, 0.5, -1],
        [-2, -1, -1, -1, -1, -1, -1, -2]
    ];
var blackBishopEval = reverseArr(whiteBishopEval);

// ROOK: Same as above, black is mirrored.
var whiteRookEval = 
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0.5, 1, 1, 1, 1, 1, 1, 0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [0, 0, 0, 0.5, 0.5, 0, 0, 0]
    ];
var blackRookEval = reverseArr(whiteRookEval);

// QUEEN: Same for each side.
var queenEval = 
    [
        [-2, -1, -1, -0.5, -0.5, -1, -1, -2],
        [-1, 0, 0, 0, 0, 0, 0, -1],
        [-1, 0, 0.5, 0.5, 0.5, 0.5, 0, -1],
        [-0.5, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
        [0, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
        [-1, 0.5, 0.5, 0.5, 0.5, 0.5, 0, -1],
        [-1, 0, 0.5, 0, 0, 0, 0, -1],
        [-2, -1, -1, -0.5, -0.5, -1, -1, -2]
    ];

// KING: Same as above, black is mirrored. Two separate arrays.
var whiteKingEvalMidgame =
    [
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3,-4, -4, -5, -5, -4, -4, -3],
        [-2, -3, -3, -4, -4, -3, -3, -2],
        [-1, -2, -2, -2, -2, -2, -2, -1],
        [2, 2, 0, 0, 0, 0, 2, 2],
        [2, 3, 1, 0, 0, 1, 3, 2]
    ];
var blackKingEvalMidgame = reverseArr(whiteKingEvalMidgame);

// -> Endgame, what criteria constitutes the endgame? 
var whiteKingEvalEndgame = 
    [
        [-5, -4, -3, -2, -2, -3, -4, -5],
        [-3, -2, -1, 0, 0, -1, -2, -3],
        [-3, -1, 2, 3, 3, 2, -1, -3],
        [-3, -1, 3, 4, 4, 3, -1, -3],
        [-3, -1, 3, 4, 4, 3, -1, -3],
        [-3, -1, 2, 3, 3, 2, -1, -3],
        [-3, -3, 0, 0, 0, 0, -3, -3],
        [-5, -3, -3, -3, -3, -3, -3, -5]
    ];
var blackKingEvalEndgame = reverseArr(whiteKingEvalEndgame);

// For now, endgame = no queen on either side
var evaluateBoard = function (board) {
    // Currently only evaluates the state of the board as its only heuristic
    // Assumes the board is evaluated for >BLACK<!
    // TODO: add more to improve it lul
    
    //var isMidgame = noQueens(board);    // true if no queens
    //isMidgame = !isMidgame;             // true if queens 
    
    var boardScore = 0;
    
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            boardScore = boardScore + getSquareValue(board[i][j], i, j);
        }
    }
    return boardScore;
};

var getSquareValue = function (piece, x, y) {
    if (piece === null) return 0;
    var getVal = function(piece, isWhite, x, y) {
        if (piece.type === 'p') return 10 + (isWhite ? whitePawnEval[y][x] : blackPawnEval[y][x]);
        else if (piece.type === 'r') return 50 + (isWhite ? whiteRookEval[y][x] : blackRookEval[y][x]);
        else if (piece.type === 'b') return 30 + (isWhite ? whiteBishopEval[y][x] : blackBishopEval[y][x]);
        else if (piece.type === 'k') return 900 + (isWhite ? whiteKingEvalMidgame[y][x] : blackKingEvalMidgame[y][x]);
        else if (piece.type === 'n') return 30 + knightEval[y][x];
        else if (piece.type === 'q') return 90 + queenEval[y][x];
        throw "UNKNOWN PIECE TYPE: " + piece.type;
    };
    var val = getVal(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? val : -val;
}

/* - PERSONAL HELPER FUNCTIONS - */

// Returns a new and reversed instance of an array
function reverseArr(arr) {
    return arr.slice().reverse();
}

function printEndMessage() {
    
}

// Returns score of a piece during the midgame
/* not in use
function midgamePieceValue (piece, isWhite, row, col) {
    if (piece.type === 'p') return 10+(isWhite ? whitePawnEval[row][col] : blackPawnEval[row][col]);
    else if (piece.type === 'r') return 50+(isWhite ? whiteRookEval[row][col] : blackRookEval[row][col]);
    else if (piece.type === 'b') return 30+(isWhite ? whiteBishopEval[row][col] : blackBishopEval[row][col]);
    else if (piece.type === 'n') return 30+knightEval[row][col];
    else if (piece.type === 'q') return 90+queenEval[row][col];
    else if (piece.type === 'k') return 900+(isWhite ? whiteKingEvalMidgame : blackKingEvalMidgame);
    throw "UNKNOWN PIECE TYPE: " + piece.type;
}
*/

// Returns score of a piece during the endgame
/* not in use
function endgamePieceValue (piece, isWhite, row, col) {
    switch(piece.type) {
        case 'p':
            return 10 + (isWhite ? whitePawnEval[row][col] : blackPawnEval[row][col]);
        case 'r':
            return 50 + (isWhite ? whiteRookEval[row][col] : blackRookEval[row][col]);
        case 'n':
            return 30 + knightEval[row][col];
        case 'b':
            return 30 + (isWhite ? whiteBishopEval[row][col] : blackBishopEval[row][col]);
        case 'q':
            return 100 + queenEval[row][col];
        case 'k':
            return 9001 + (isWhite ? whiteKingEvalEndgame[row][col] : blackKingEvalEndgame[row][col]);
    }
}
*/
// Returns true if no queens are on the board, false otherwise
// Currently not working as game.board() does not exist?
/*
var noQueens = function(board) {
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            if (board[i][j].type === 'q') return false;   // return false if queen is present
        }
    }
    return true;
};
*/

// Configuration:
var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseOverSquare,
  onSnapEnd: onSnapEnd
};

board = ChessBoard('board', cfg);
