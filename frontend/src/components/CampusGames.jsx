import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import './CampusGames.css';

const TicTacToe = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState(null);

    const checkWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return squares.includes(null) ? null : 'Draw';
    };

    const handleClick = (i) => {
        if (board[i] || winner || !isXNext) return;
        const newBoard = [...board];
        newBoard[i] = 'X';
        setBoard(newBoard);
        setIsXNext(false);
        const win = checkWinner(newBoard);
        if (win) setWinner(win);
    };

    // Minimax Algorithm for Hard Bot
    const minimax = (board, depth, isMaximizing) => {
        const result = checkWinner(board);
        if (result === 'O') return 10 - depth;
        if (result === 'X') return depth - 10;
        if (result === 'Draw') return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'O';
                    let score = minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    let score = minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    };

    // Bot move
    useEffect(() => {
        if (!isXNext && !winner) {
            const timer = setTimeout(() => {
                let bestScore = -Infinity;
                let move;
                for (let i = 0; i < 9; i++) {
                    if (board[i] === null) {
                        const tempBoard = [...board];
                        tempBoard[i] = 'O';
                        let score = minimax(tempBoard, 0, false);
                        if (score > bestScore) {
                            bestScore = score;
                            move = i;
                        }
                    }
                }

                if (move !== undefined) {
                    const newBoard = [...board];
                    newBoard[move] = 'O';
                    setBoard(newBoard);
                    setIsXNext(true);
                    const win = checkWinner(newBoard);
                    if (win) setWinner(win);
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner, board]);

    const reset = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
    };

    return (
        <div className="game-container ttt">
            <div className="game-header">
                <h3>Tic Tac Toe</h3>
                <button onClick={reset} className="game-reset"><RotateCcw size={16} /></button>
            </div>
            <div className="ttt-board">
                {board.map((sq, i) => (
                    <div key={i} className={`ttt-sq ${sq}`} onClick={() => handleClick(i)}>
                        {sq}
                    </div>
                ))}
            </div>
            {winner && <div className="game-status">{winner === 'Draw' ? "It's a Draw!" : `${winner === 'X' ? 'You' : 'Bot'} Won!`}</div>}
        </div>
    );
};

const CardMatch = () => {
    const animalIcons = [
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png'
    ];
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [disabled, setDisabled] = useState(false);

    const initialize = () => {
        const deck = [...animalIcons, ...animalIcons].sort(() => Math.random() - 0.5);
        setCards(deck);
        setFlipped([]);
        setSolved([]);
    };

    useEffect(() => initialize(), []);

    const handleClick = (i) => {
        if (disabled || flipped.includes(i) || solved.includes(i)) return;
        const newFlipped = [...flipped, i];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setDisabled(true);
            if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
                setSolved([...solved, ...newFlipped]);
                setFlipped([]);
                setDisabled(false);
            } else {
                setTimeout(() => {
                    setFlipped([]);
                    setDisabled(false);
                }, 1000);
            }
        }
    };

    return (
        <div className="game-container match">
            <div className="game-header">
                <h3>Card Match</h3>
                <button onClick={initialize} className="game-reset"><RotateCcw size={16} /></button>
            </div>
            <div className="match-grid">
                {cards.map((card, i) => (
                    <div key={i} className={`match-card ${flipped.includes(i) || solved.includes(i) ? 'flipped' : ''}`} onClick={() => handleClick(i)}>
                        <div className="card-front">?</div>
                        <div className="card-back">
                            <img src={card} alt="animal" className="card-icon" />
                        </div>
                    </div>
                ))}
            </div>
            {solved.length === cards.length && cards.length > 0 && <div className="game-status">Perfect Match! 🎊</div>}
        </div>
    );
};

const SlidingPuzzle = () => {
    const [tiles, setTiles] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null]); // 4x4 grid
    const [isWon, setIsWon] = useState(false);
    const imageUrl = "https://picsum.photos/seed/campus/400/400";

    const shuffle = () => {
        let newTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null];
        for (let i = 0; i < 400; i++) {
            const emptyIdx = newTiles.indexOf(null);
            const neighbors = getNeighbors(emptyIdx);
            const moveIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
            [newTiles[emptyIdx], newTiles[moveIdx]] = [newTiles[moveIdx], newTiles[emptyIdx]];
        }
        setTiles(newTiles);
        setIsWon(false);
    };

    const getNeighbors = (idx) => {
        const neighbors = [];
        const r = Math.floor(idx / 4);
        const c = idx % 4;
        if (r > 0) neighbors.push(idx - 4);
        if (r < 3) neighbors.push(idx + 4);
        if (c > 0) neighbors.push(idx - 1);
        if (c < 3) neighbors.push(idx + 1);
        return neighbors;
    };

    const handleTileClick = (idx) => {
        const emptyIdx = tiles.indexOf(null);
        const neighbors = getNeighbors(emptyIdx);
        if (neighbors.includes(idx)) {
            const newTiles = [...tiles];
            [newTiles[emptyIdx], newTiles[idx]] = [newTiles[idx], newTiles[emptyIdx]];
            setTiles(newTiles);
            if (newTiles.every((t, i) => t === (i === 15 ? null : i))) {
                setIsWon(true);
            }
        }
    };

    useEffect(() => shuffle(), []);

    return (
        <div className="game-container puzzle">
            <div className="game-header">
                <h3>Campus Puzzle (4x4)</h3>
                <button onClick={shuffle} className="game-reset"><RotateCcw size={16} /></button>
            </div>
            <div className="puzzle-grid grid-4x4">
                {tiles.map((t, i) => {
                    const style = t !== null ? {
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: '400% 400%',
                        backgroundPosition: `${(t % 4) * 33.33}% ${Math.floor(t / 4) * 33.33}%`
                    } : {};

                    return (
                        <div
                            key={i}
                            className={`puzzle-tile ${t === null ? 'empty' : ''}`}
                            style={style}
                            onClick={() => handleTileClick(i)}
                        >
                            <span className="tile-num" style={{ opacity: 0 }}>{t + 1}</span>
                        </div>
                    );
                })}
            </div>
            {isWon && <div className="game-status">Master Level! 🏆</div>}
        </div>
    );
};

const CampusGames = () => {
    const [gameIdx, setGameIdx] = useState(0);
    const games = [<TicTacToe />, <CardMatch />, <SlidingPuzzle />];

    const nextGame = () => setGameIdx((gameIdx + 1) % games.length);
    const prevGame = () => setGameIdx((gameIdx - 1 + games.length) % games.length);

    return (
        <div className="campus-games">
            <div className="games-nav">
                <button onClick={prevGame} className="nav-btn"><ChevronLeft /></button>
                <span className="game-counter">{gameIdx + 1} / {games.length}</span>
                <button onClick={nextGame} className="nav-btn"><ChevronRight /></button>
            </div>
            <div className="game-viewport">
                {games[gameIdx]}
            </div>
            <p className="games-footer">Fun Break Corner </p>
        </div>
    );
};

export default CampusGames;
