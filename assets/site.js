(() => {
  const entries = [...(window.DAILY_ENTRIES || [])].sort((a,b) => b.date.localeCompare(a.date));
  const start = window.DAILY_GAME_START || entries.at(-1)?.date || new Date().toISOString().slice(0,10);

  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const parseDate = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); };
  const todayNumber = () => {
    const now = new Date();
    const [sy,sm,sd] = start.split("-").map(Number);
    return Math.max(1, Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()) - Date.UTC(sy,sm-1,sd))/86400000)+1);
  };
  const longDate = (s) => new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(parseDate(s));

  $("#dayCount").textContent = `DAY ${String(todayNumber()).padStart(3,"0")}`;

  if (!entries.length) {
    $("#today-title").textContent = "No game yet";
    $("#latestDescription").textContent = "The archive is empty.";
    return;
  }

  const latest = entries[0];
  $("#latestDate").textContent = longDate(latest.date).toUpperCase();
  $("#latestType").textContent = latest.type;
  $("#today-title").textContent = latest.title;
  $("#latestDescription").textContent = latest.description;
  $("#latestGame").href = latest.game;
  $("#latestPoster").href = latest.game;
  $("#latestPoster").setAttribute("aria-label", `Play ${latest.title}`);
  $("#latestPreview").src = latest.preview;
  $("#latestPreview").alt = `${latest.title} preview`;
  $("#latestArticle").href = latest.article;
  $("#latestArticleTitle").textContent = latest.articleTitle;
  $("#latestArticleDescription").textContent = latest.articleDescription || "";

  $("#archiveRows").innerHTML = entries.map(entry => `
    <article class="archive-row" style="--row-accent:${esc(entry.accent || "#ff4b24")}">
      <a class="archive-game" href="${esc(entry.game)}"><img class="archive-thumb" src="${esc(entry.preview)}" alt="" loading="lazy"><strong>${esc(entry.title)}</strong></a>
      <span class="archive-type">${esc(entry.type)}</span>
      <a class="archive-article" href="${esc(entry.article)}">${esc(entry.articleTitle)}</a>
      <a class="archive-go" href="${esc(entry.game)}" aria-label="Play ${esc(entry.title)}">↗</a>
    </article>`).join("");
})();
