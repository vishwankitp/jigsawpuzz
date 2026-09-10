const rows = document.querySelector('#leaderboardRows');
const secondsText = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const escapeHTML = value => { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; };

async function loadLeaderboard() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard_entries?select=name,time_seconds,points,created_at&order=time_seconds.asc,created_at.asc&limit=50`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` } });
    if (!response.ok) throw new Error('Unable to load scores');
    const scores = await response.json();
    rows.innerHTML = scores.length ? scores.map((score, index) => `<div class="leaderboard-row"><span class="rank">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHTML(score.name)}</strong><span class="time">${secondsText(score.time_seconds)}</span><span>${score.points}</span></div>`).join('') : '<p class="empty-row">No completed assemblies yet. Be the first to enter the archive.</p>';
  } catch { rows.innerHTML = '<p class="empty-row">The shared leaderboard is not set up yet. Please try again shortly.</p>'; }
}
loadLeaderboard();
