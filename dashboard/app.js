/* Token Launch Radar — renders window.RADAR (data.js) as a sortable, filterable board. */
(function () {
  var D = window.RADAR;
  if (!D) { document.body.innerHTML = '<p style="padding:32px">No radar data loaded.</p>'; return; }
  var rows = D.rows, live = D.live;

  function money(n) {
    if (n === null || n === undefined) return '—';
    var a = Math.abs(n);
    if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(v) {
    if (v === null || v === undefined) return '<span class="flat">—</span>';
    var c = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    return '<span class="' + c + '">' + (v > 0 ? '+' : '') + v.toFixed(1) + '%</span>';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function $(id) { return document.getElementById(id); }

  var watchSet = {};
  D.rows.forEach(function (r) { watchSet[r.slug] = false; });
  (D.watchlist || []).forEach(function (s) { watchSet[s] = true; });
  // The watchlist slugs ride in the data as a set the program writes; fall back to rank order.
  var isWatch = function (r) { return !!watchSet[r.slug]; };

  /* Header meta + stats */
  $('meta').innerHTML = 'Snapshot <b>' + esc(D.as_of) + '</b><br>Model <b>' + esc(D.model_version) + '</b> · comps-calibrated<br>Watchlist floor <b>' + money(D.floor_usd) + '</b>';
  $('asof').textContent = D.as_of;
  $('src').textContent = D.source;
  var top = rows[0];
  $('stats').innerHTML =
    '<div class="stat"><b>' + D.board_size + '</b><span>protocols ranked</span></div>' +
    '<div class="stat"><b>' + D.watchlist_size + '</b><span>on the watchlist (floor ' + money(D.floor_usd) + ')</span></div>' +
    '<div class="stat"><b>' + D.early_size + '</b><span>early finds below the floor</span></div>' +
    '<div class="stat"><b>' + money(top ? top.implied_value_usd : 0) + '</b><span>top implied value — ' + esc(top ? top.name : '') + '</span></div>';

  /* Filter controls */
  var cats = [], chains = [];
  rows.forEach(function (r) {
    if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
    (r.chains || []).forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
  });
  cats.sort(); chains.sort();
  cats.forEach(function (c) { $('cat').appendChild(new Option(c, c)); });
  chains.forEach(function (c) { $('chain').appendChild(new Option(c, c)); });

  var state = { q: '', cat: '', chain: '', watch: false, sort: 'rank', dir: 1, shown: 50 };
  var params = new URLSearchParams(location.search);
  if (params.get('q')) { state.q = params.get('q'); $('q').value = state.q; }
  if (params.get('category')) { state.cat = params.get('category'); $('cat').value = state.cat; }
  if (params.get('chain')) { state.chain = params.get('chain'); $('chain').value = state.chain; }
  if (params.get('watchlist') === '1') { state.watch = true; $('watch').checked = true; }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var list = rows.filter(function (r) {
      if (state.watch && !isWatch(r)) return false;
      if (state.cat && r.category !== state.cat) return false;
      if (state.chain && (r.chains || []).indexOf(state.chain) < 0) return false;
      if (q && (r.name + ' ' + r.slug + ' ' + (r.category || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var k = state.sort, d = state.dir;
    list.sort(function (a, b) {
      var x = a[k], y = b[k];
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === 'string') return x.localeCompare(y) * d;
      return (x - y) * d;
    });
    return list;
  }

  function render() {
    var list = filtered();
    var show = list.slice(0, state.shown);
    $('rows').innerHTML = show.map(function (r) {
      return '<tr data-slug="' + esc(r.slug) + '">' +
        '<td class="num">' + r.rank + '</td>' +
        '<td class="name"><b>' + esc(r.name) + '</b><span>' + esc(r.slug) + (isWatch(r) ? '<span class="badge">WATCHLIST</span>' : '') + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc((r.chains || []).slice(0, 3).join(', ') || '—') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num"><b>' + money(r.implied_value_usd) + '</b></td></tr>';
    }).join('');
    $('count').textContent = list.length + ' of ' + rows.length + ' ranked protocols shown';
    $('more').style.display = list.length > state.shown ? '' : 'none';
    Array.prototype.forEach.call(document.querySelectorAll('#rows tr'), function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-slug')); });
    });
  }

  function openDetail(slug) {
    var r = null;
    rows.forEach(function (x) { if (x.slug === slug) r = x; });
    if (!r) return;
    Array.prototype.forEach.call(document.querySelectorAll('#rows tr'), function (tr) {
      tr.classList.toggle('sel', tr.getAttribute('data-slug') === slug);
    });
    var base = r.tvl_usd * r.multiple;
    var age = r.age_days === null ? 'unknown' : r.age_days + ' days';
    $('detail').hidden = false;
    $('detail').innerHTML = '<div class="card"><p class="back"><a href="index.html">← Back to the board</a></p><h2>#' + r.rank + ' ' + esc(r.name) + (isWatch(r) ? '<span class="badge">WATCHLIST</span>' : '') + '</h2>' +
      '<p class="sub2">' + esc(r.slug) + ' · ' + esc(r.category || 'Uncategorised') + ' · ' + esc((r.chains || []).join(', ') || 'no chain listed') + ' · tracked since ' + esc(r.listed_at || 'unknown') + ' (' + age + ')</p>' +
      '<div class="kv">' +
      '<div><b>' + money(r.implied_value_usd) + '</b><span>implied value</span></div>' +
      '<div><b>' + money(r.tvl_usd) + '</b><span>TVL</span></div>' +
      '<div><b>' + pct(r.change_7d) + '</b><span>TVL change, 7 days</span></div>' +
      '<div><b>' + r.multiple.toFixed(2) + '×</b><span>category multiple</span></div>' +
      '</div>' +
      '<p class="math">Implied value = TVL ' + money(r.tvl_usd) + ' × multiple ' + r.multiple.toFixed(2) + ' = ' + money(base) +
      ' × growth ' + r.growth_multiplier.toFixed(2) + ' × maturity ' + r.maturity_multiplier.toFixed(2) +
      ' × breadth ' + r.breadth_multiplier.toFixed(2) + ' = <b>' + money(r.implied_value_usd) + '</b>. ' +
      'The protocol records no token, so this is a launch value, not a market price.</p>' +
      '<h3>Farm plan — concrete steps, with cost and time</h3><ol>' +
      r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ol></div>';
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* Comps table */
  $('comps-rows').innerHTML = (D.comps || []).map(function (c) {
    return '<tr><td>' + esc(c.category) + '</td><td class="num">' + c.listed + '</td><td class="num">' +
      (c.median_ratio === null ? '—' : c.median_ratio.toFixed(2) + '×') + '</td><td class="num"><b>' + c.multiple.toFixed(2) + '×</b></td></tr>';
  }).join('');

  /* Live-token table */
  $('live-rows').innerHTML = live.map(function (p) {
    return '<tr><td class="name"><b>' + esc(p.name) + '</b><span>' + esc(p.slug) + '</span></td>' +
      '<td>' + esc(p.category || '—') + '</td><td class="num">' + money(p.tvl_usd) + '</td>' +
      '<td class="num"><b>' + money(p.mcap_usd) + '</b></td><td class="num">' + pct(p.change_7d) + '</td></tr>';
  }).join('');

  /* Events */
  $('q').addEventListener('input', function () { state.q = this.value; state.shown = 50; render(); });
  $('cat').addEventListener('change', function () { state.cat = this.value; state.shown = 50; render(); });
  $('chain').addEventListener('change', function () { state.chain = this.value; state.shown = 50; render(); });
  $('watch').addEventListener('change', function () { state.watch = this.checked; state.shown = 50; render(); });
  $('reset').addEventListener('click', function () {
    state = { q: '', cat: '', chain: '', watch: false, sort: 'rank', dir: 1, shown: 50 };
    $('q').value = ''; $('cat').value = ''; $('chain').value = ''; $('watch').checked = false;
    render();
  });
  $('more').addEventListener('click', function () { state.shown += 50; render(); });
  Array.prototype.forEach.call(document.querySelectorAll('#board th'), function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-sort');
      if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = k === 'name' || k === 'category' || k === 'chains' ? 1 : -1; }
      if (k === 'rank') state.dir = 1;
      render();
    });
  });

  render();
  if (params.get('view') === 'detail' && params.get('slug')) {
    document.body.classList.add('detail-mode');
    openDetail(params.get('slug'));
  }
})();
