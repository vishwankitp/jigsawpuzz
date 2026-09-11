const answer = 'REFUTE';
const MAX_GUESSES = 6;
const VALID_WORDS = new Set([answer]);
let dictionaryReady = false;
const wordListReady = fetch('assets/six-letter-words.txt')
  .then(response => response.ok ? response.text() : Promise.reject())
  .then(text => text.split(/\s+/).forEach(word => VALID_WORDS.add(word.toUpperCase())))
  .finally(() => { dictionaryReady = true; });
const grid = document.querySelector('#wordGrid'); const keyboard = document.querySelector('#keyboard');
let ccCode = '', row = 0, guess = '', complete = false, checking = false;
function addRow() {
    for (let i = 0; i < 6; i++) {
        const tile = document.createElement('div');
        tile.className = 'word-tile';
        grid.append(tile);
    }
}

for (let i = 0; i < MAX_GUESSES; i++) {
    addRow();
}
['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach((line, index) => { const lineEl = document.createElement('div'); lineEl.className = 'key-line'; if (index === 2) lineEl.innerHTML = '<button data-key="ENTER" class="word-key wide">Enter</button>'; [...line].forEach(letter => lineEl.innerHTML += `<button data-key="${letter}" class="word-key">${letter}</button>`); if (index === 2) lineEl.innerHTML += '<button data-key="BACK" class="word-key wide">⌫</button>'; keyboard.append(lineEl); });
document.querySelector('#ccForm').addEventListener('submit', event => { event.preventDefault(); ccCode = document.querySelector('#ccCode').value.trim().toUpperCase(); document.querySelector('#ccDisplay').textContent = ccCode; document.querySelector('#wordleEntry').hidden = true; document.querySelector('#wordleGame').hidden = false; });
keyboard.addEventListener('click', event => { if (event.target.dataset.key) handleKey(event.target.dataset.key); });
document.addEventListener('keydown', event => { if (!document.querySelector('#wordleGame').hidden) handleKey(event.key === 'Backspace' ? 'BACK' : event.key === 'Enter' ? 'ENTER' : event.key.toUpperCase()); });
function handleKey(key) { if (complete || checking || row >= MAX_GUESSES) return; if (/^[A-Z]$/.test(key) && guess.length < 6) { guess += key; renderRow(); } else if (key === 'BACK') { guess = guess.slice(0, -1); renderRow(); } else if (key === 'ENTER') submitGuess(); }
function renderRow() { [...grid.children].slice(row * 6, row * 6 + 6).forEach((tile, i) => tile.textContent = guess[i] || ''); }
async function submitGuess() { if (guess.length !== 6) return status('Enter six letters.'); if (!dictionaryReady) { status('Loading dictionary…'); try { await wordListReady; } catch { return status('Dictionary could not load. Please refresh.'); } } checking = true; if (!VALID_WORDS.has(guess)) { checking = false; return status('Use a real six-letter word.'); } const letters = [...answer]; [...grid.children].slice(row * 6, row * 6 + 6).forEach((tile, i) => { const letter = guess[i]; const state = letter === answer[i] ? 'exact' : letters.includes(letter) ? 'present' : 'absent'; tile.classList.add(state); const key = keyboard.querySelector(`[data-key="${letter}"]`); if (key && !key.classList.contains('exact')) key.className = `word-key ${state}`; }); checking = false; if (guess === answer) return finish(row + 1); if (row === MAX_GUESSES - 1) return finishWithoutRecording(); row++; guess = ''; document.querySelector('#attemptDisplay').textContent = row + 1; status('Keep going.'); }
function status(text) { document.querySelector('#wordStatus').textContent = text; }
function finishWithoutRecording() { complete = true; document.querySelector('#wordleGame').hidden = true; document.querySelector('#wordleResult').hidden = false; document.querySelector('#resultCode').textContent = ccCode; document.querySelector('#resultAttempts').textContent = '—'; document.querySelector('#resultHeading').innerHTML = 'No result<br /><em>recorded.</em>'; document.querySelector('#resultNote').textContent = 'The hidden word was not solved in six guesses.'; }
async function finish(attempts) { complete = true; document.querySelector('#wordleGame').hidden = true; document.querySelector('#wordleResult').hidden = false; document.querySelector('#resultCode').textContent = ccCode; document.querySelector('#resultAttempts').textContent = attempts; try { const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_wordle_score`, { method:'POST', headers:{ 'Content-Type':'application/json', apikey:SUPABASE_PUBLISHABLE_KEY, Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}` }, body:JSON.stringify({ p_cc_code:ccCode, p_attempts:attempts }) }); if (!response.ok) throw new Error(); const saved = await response.json(); document.querySelector('#resultHeading').innerHTML = saved ? 'First result<br /><em>recorded.</em>' : 'Thanks for<br /><em>playing again.</em>'; document.querySelector('#resultNote').textContent = saved ? 'Your first completed attempt has been permanently recorded.' : 'Your first completed result was already recorded and has not been changed.'; } catch { document.querySelector('#resultHeading').innerHTML = 'Result not<br /><em>saved.</em>'; document.querySelector('#resultNote').textContent = 'Please contact the event organiser.'; } }
