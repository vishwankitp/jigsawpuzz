const image = 'assets/brave-new-world.png';
const screens = ['introScreen', 'gameScreen', 'resultScreen', 'leaderboardScreen'];
const board = document.querySelector('#puzzleBoard');
const tray = document.querySelector('#pieceTray');
let player, startedAt, timerId, selectedPiece = null, timedOut = false;

function showScreen(id) { screens.forEach(s => document.querySelector('#' + s).classList.toggle('active', s === id)); }
function secondsText(seconds) { const min = Math.floor(seconds / 60); return `${String(min).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`; }
function showToast(text) { const toast = document.querySelector('#toast'); toast.textContent = text; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); }

document.querySelector('#playerForm').addEventListener('submit', e => {
  e.preventDefault();
  player = { name: document.querySelector('#playerName').value.trim(), email: document.querySelector('#playerEmail').value.trim() };
  document.querySelector('#playerDisplay').textContent = player.name;
  startGame();
});
const nameInput = document.querySelector('#playerName');
const emailInput = document.querySelector('#playerEmail');
const startButton = document.querySelector('#startButton');
function updateStartButton() { startButton.disabled = !nameInput.value.trim() || !emailInput.validity.valid; }
nameInput.addEventListener('input', updateStartButton);
emailInput.addEventListener('input', updateStartButton);

function startGame() {
  clearInterval(timerId); timedOut = false; selectedPiece = null;
  board.innerHTML = ''; tray.innerHTML = ''; showScreen('gameScreen');
  const pieces = Array.from({length:16}, (_, i) => i).sort(() => Math.random() - .5);
  pieces.forEach(makePiece);
  startedAt = Date.now(); updateTimer(); timerId = setInterval(updateTimer, 250);
  updatePieceCount();
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const remaining = Math.max(0, 150 - elapsed);
  document.querySelector('#timer').textContent = secondsText(remaining);
  if (!remaining && !timedOut) { timedOut = true; clearInterval(timerId); document.querySelector('#gameStatus').textContent = 'Time is up — start a fresh assembly to try again.'; showToast('The two-minute-thirty-second window has closed.'); }
}

function makePiece(index) {
  const el = document.createElement('div');
  const row = Math.floor(index / 4), col = index % 4;
  el.className = 'piece'; el.dataset.index = index; el.dataset.rotation = [0,90,180,270][Math.floor(Math.random()*4)];
  el.style.backgroundPosition = `${col * 33.333}% ${row * 33.333}%`;
  el.style.transform = `rotate(${el.dataset.rotation}deg)`;
  el.setAttribute('aria-label', `Puzzle piece ${index + 1}`);
  el.addEventListener('pointerdown', beginDrag);
  tray.append(el);
}

function selectPiece(piece) { document.querySelectorAll('.piece.selected').forEach(p => p.classList.remove('selected')); selectedPiece = piece; piece.classList.add('selected'); }
function rotatePiece(piece) { const value = (Number(piece.dataset.rotation) + 90) % 360; piece.dataset.rotation = value; piece.style.transform = `rotate(${value}deg)`; }
function rotateSelected() { if (selectedPiece) rotatePiece(selectedPiece); }
document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r' && document.querySelector('#gameScreen').classList.contains('active')) { e.preventDefault(); rotateSelected(); }});

function beginDrag(e) {
  if (timedOut) return; const piece = e.currentTarget; selectPiece(piece); piece.setPointerCapture(e.pointerId); piece.classList.add('dragging');
  const wasOnBoard = piece.parentElement === board;
  const startRect = piece.getBoundingClientRect(); const startX = e.clientX, startY = e.clientY; const dx = e.clientX - startRect.left, dy = e.clientY - startRect.top; let didDrag = false;
  const move = ev => { if (!didDrag && Math.hypot(ev.clientX - startX, ev.clientY - startY) <= 6) return; didDrag = true; piece.style.position = 'fixed'; piece.style.left = `${ev.clientX - dx}px`; piece.style.top = `${ev.clientY - dy}px`; piece.style.width = `${startRect.width}px`; piece.style.height = `${startRect.height}px`; };
  const end = ev => {
    piece.removeEventListener('pointermove', move); piece.removeEventListener('pointerup', end); piece.removeEventListener('pointercancel', end); piece.classList.remove('dragging');
    if (!didDrag) { rotatePiece(piece); return; }
    const br = board.getBoundingClientRect(); const inside = ev.clientX >= br.left && ev.clientX <= br.right && ev.clientY >= br.top && ev.clientY <= br.bottom;
    piece.style.position = ''; piece.style.left = ''; piece.style.top = ''; piece.style.width = ''; piece.style.height = '';
    if (inside) placeOnBoard(piece, ev.clientX - br.left, ev.clientY - br.top, br); else if (!wasOnBoard) tray.append(piece); else placeOnBoard(piece, startRect.left - br.left, startRect.top - br.top, br);
    updatePieceCount();
  };
  piece.addEventListener('pointermove', move); piece.addEventListener('pointerup', end); piece.addEventListener('pointercancel', end);
}

function placeOnBoard(piece, x, y, br) {
  const sourceCell = piece.parentElement === board ? piece.dataset.cell : null;
  const cellW = br.width / 4, cellH = br.height / 4;
  const col = Math.max(0, Math.min(3, Math.floor(x / cellW))); const row = Math.max(0, Math.min(3, Math.floor(y / cellH)));
  const targetCell = `${row},${col}`;
  const occupied = [...board.querySelectorAll('.piece')].find(other => other !== piece && other.dataset.cell === targetCell);
  if (occupied && sourceCell) {
    const [oldRow, oldCol] = sourceCell.split(',').map(Number);
    occupied.dataset.cell = sourceCell;
    occupied.style.left = `${oldCol * 25}%`; occupied.style.top = `${oldRow * 25}%`;
    const occupiedIndex = Number(occupied.dataset.index);
    occupied.classList.toggle('correct', oldRow === Math.floor(occupiedIndex / 4) && oldCol === occupiedIndex % 4 && Number(occupied.dataset.rotation) === 0);
  } else if (occupied) {
    occupied.dataset.cell = '';
    occupied.style.left = ''; occupied.style.top = '';
    occupied.classList.remove('correct');
    tray.append(occupied);
  }
  board.append(piece);
  piece.dataset.cell = `${row},${col}`; piece.style.left = `${col * 25}%`; piece.style.top = `${row * 25}%`;
  const index = Number(piece.dataset.index); const correct = row === Math.floor(index/4) && col === index%4 && Number(piece.dataset.rotation) === 0;
  piece.classList.toggle('correct', correct);
}

function updatePieceCount() { const n = tray.querySelectorAll('.piece').length; document.querySelector('#pieceCount').textContent = `${n || 'All'} ${n === 1 ? 'piece' : 'pieces'} ${n ? 'remaining' : 'placed'}`; }
document.querySelector('#submitPuzzle').addEventListener('click', submitPuzzle);
async function submitPuzzle() {
  if (timedOut) return showToast('Time is up — please restart the puzzle.');
  const pieces = [...board.querySelectorAll('.piece')];
  const correct = pieces.length === 16 && pieces.every(p => Number(p.dataset.rotation) === 0 && p.dataset.cell === `${Math.floor(Number(p.dataset.index)/4)},${Number(p.dataset.index)%4}`);
  if (!correct) return showToast('Not quite. Check every position and orientation.');
  const elapsed = Math.min(150, Math.floor((Date.now()-startedAt)/1000)); clearInterval(timerId);
  try { await saveScore(elapsed); } catch { showToast('Your score could not be saved. Please check the database setup.'); }
  showResult(elapsed);
}

async function saveScore(seconds) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard_entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, Prefer: 'return=minimal' },
    body: JSON.stringify({ name: player.name, time_seconds: seconds, points: 20 })
  });
  if (!response.ok) throw new Error('Unable to save score');
}
function showResult(seconds) { document.querySelector('#resultName').textContent = player.name; document.querySelector('#resultTime').textContent = secondsText(seconds); showScreen('resultScreen'); makeConfetti(); }
function makeConfetti() { const wrap = document.querySelector('#confetti'); wrap.innerHTML = ''; for (let i=0;i<42;i++) { const c=document.createElement('i'); c.style.left=Math.random()*100+'%'; c.style.animationDelay=Math.random()*2+'s'; c.style.background=['#c9442d','#101518','#9db8c4','#e5b05f'][i%4]; c.style.transform=`rotate(${Math.random()*90}deg)`; wrap.append(c); } }
function renderLeaderboard() { const scores = JSON.parse(localStorage.getItem('brave-new-world-scores') || '[]'); const rows = document.querySelector('#leaderboardRows'); rows.innerHTML = scores.length ? scores.map((s,i) => `<div class="leaderboard-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><strong>${escapeHTML(s.name)}</strong><span class="time">${secondsText(s.seconds)}</span><span>${s.points}</span></div>`).join('') : '<p class="empty-row">No completed assemblies yet. Be the first to enter the archive.</p>'; }
function escapeHTML(value) { const el=document.createElement('div'); el.textContent=value; return el.innerHTML; }
document.querySelector('#viewLeaderboard').addEventListener('click', () => window.open('leaderboard.html', '_blank', 'noopener'));
document.querySelector('#backHome').addEventListener('click', () => showScreen('introScreen'));
document.querySelector('#playAgain').addEventListener('click', () => startGame());
document.querySelector('#restartButton').addEventListener('click', () => { if (confirm('Restart the puzzle? Your current time will be lost.')) startGame(); });
