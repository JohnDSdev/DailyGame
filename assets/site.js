(() => {
  const entries = [...(window.DAILY_ENTRIES || [])].sort((a, b) => b.date.localeCompare(a.date));
  const start = window.DAILY_GAME_START || (entries.at(-1)?.date ?? new Date().toISOString().slice(0, 10));

  function dayNumber() {
    const [sy, sm, sd] = start.split("-").map(Number);
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const startUTC = Date.UTC(sy, sm - 1, sd);
    return Math.max(1, Math.floor((todayUTC - startUTC) / 86400000) + 1);
  }

  function prettyDate(date) {
    const [y, m, d] = date.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" })
      .format(new Date(y, m - 1, d));
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.querySelector("#dayCount").textContent = `Day ${dayNumber().toLocaleString()}`;
  document.querySelector("#gameCount").textContent = `${entries.length} game${entries.length === 1 ? "" : "s"}`;

  if (!entries.length) {
    document.querySelector("#latestCard").innerHTML = '<div class="latest-card"><div class="latest-info"><h3>No games yet</h3><p>The arcade is suspiciously quiet.</p></div></div>';
    return;
  }

  const latest = entries[0];
  document.querySelector("#latestDate").textContent = prettyDate(latest.date);
  document.querySelector("#latestArticle").href = latest.article;
  document.querySelector("#latestArticle").innerHTML = `${escapeHTML(latest.articleTitle)} <span>→</span>`;

  document.querySelector("#latestCard").innerHTML = `
    <article class="latest-card">
      <div class="latest-art" style="--game-bg:${escapeHTML(latest.gradient)}">
        <span class="art-symbol">${escapeHTML(latest.symbol)}</span>
      </div>
      <div class="latest-info">
        <span class="game-type">${escapeHTML(latest.type)}</span>
        <h3>${escapeHTML(latest.title)}</h3>
        <p>${escapeHTML(latest.description)}</p>
        <div class="button-row">
          <a class="button primary" href="${escapeHTML(latest.game)}">Play game <span>→</span></a>
          <a class="button ghost" href="${escapeHTML(latest.article)}">Read article</a>
        </div>
      </div>
    </article>`;

  document.querySelector("#gameGrid").innerHTML = entries.map((entry, index) => `
    <article class="game-card">
      <a class="card-art" href="${escapeHTML(entry.game)}" style="--game-bg:${escapeHTML(entry.gradient)}" aria-label="Play ${escapeHTML(entry.title)}">
        <span>${escapeHTML(entry.symbol)}</span>
      </a>
      <div class="card-body">
        <div class="card-meta"><span>Day ${entries.length - index}</span><span>${escapeHTML(entry.type)}</span></div>
        <h3>${escapeHTML(entry.title)}</h3>
        <p>${escapeHTML(entry.description)}</p>
        <div class="card-links">
          <a href="${escapeHTML(entry.game)}">Play →</a>
          <a href="${escapeHTML(entry.article)}">Article</a>
        </div>
      </div>
    </article>`).join("");
})();
