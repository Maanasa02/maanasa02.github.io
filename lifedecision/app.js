(function () {
  'use strict';
  var PLACES = window.PLACES || [];
  var CRIT = [
    { key:'dog',       label:'Monet',     color:'var(--s-dog)'  },
    { key:'visa',      label:'Visa',      color:'var(--s-visa)' },
    { key:'cost',      label:'Cost',      color:'var(--s-cost)' },
    { key:'diversity', label:'Diversity', color:'var(--s-div)'  },
    { key:'english',   label:'English',   color:'var(--s-eng)'  }
  ];
  var LEVELS = [ {v:1,l:'Low'}, {v:2,l:'Med'}, {v:3,l:'High'} ];
  var COST_ORDER = { 'low':1, 'mid':2, 'high':3, 'very high':4 };
  var DOG_SCORE  = { 'allowed':1, 'restricted':0.55, 'murky':0.4, 'banned':0 };
  var STORE = 'lifedecision.v2';

  var state = { w:{}, sort:'score', dir:-1, q:'', yours:false, deep:false, dogOK:false, open:{} };
  CRIT.forEach(function (c) { state.w[c.key] = (c.key === 'dog' || c.key === 'visa') ? 3 : 2; });
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && saved.w) CRIT.forEach(function (c) {
      if (LEVELS.some(function (l) { return l.v === saved.w[c.key]; })) state.w[c.key] = saved.w[c.key];
    });
  } catch (e) {}
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ w: state.w })); } catch (e) {} }

  function partsOf(p) {
    return {
      dog: DOG_SCORE[p.dog_status] != null ? DOG_SCORE[p.dog_status] : 0,
      visa: (p.visa_comfort - 1) / 4,
      cost: 1 - ((COST_ORDER[p.cost_band] || 2) - 1) / 3,
      diversity: (p.diversity - 1) / 4,
      english: (p.english - 1) / 4
    };
  }
  function scoreOf(p) {
    var pr = partsOf(p), den = 0, tot = 0, contrib = {};
    CRIT.forEach(function (c) {
      var w = state.w[c.key];
      den += w; tot += w * pr[c.key]; contrib[c.key] = w * pr[c.key];
    });
    return { score: den ? tot / den : 0, contrib: contrib, den: den, parts: pr };
  }

  var COLS = [
    { key:'rank',    label:'',          sortable:false },
    { key:'city',    label:'Place',     sortable:true },
    { key:'dog',     label:'Monet',     sortable:true },
    { key:'visa',    label:'Visa',      sortable:true },
    { key:'cost',    label:'Cost',      sortable:true },
    { key:'div',     label:'Diversity', sortable:true },
    { key:'eng',     label:'English',   sortable:true },
    { key:'weather', label:'Weather',   sortable:true },
    { key:'score',   label:'Fit',       sortable:true },
    { key:'more',    label:'',          sortable:false }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m];
    });
  }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function money(a, b) {
    if (a == null && b == null) return null;
    if (a != null && b != null) return '$' + Number(a).toLocaleString() + '–' + Number(b).toLocaleString();
    return '$' + Number(a != null ? a : b).toLocaleString();
  }
  function meter(val, max, color, label) {
    var out = '<span class="meter" style="--mc:' + color + '" role="img" aria-label="' +
              esc(label) + ' ' + val + ' out of ' + max + '">';
    for (var i = 1; i <= max; i++) out += '<i class="' + (i <= val ? 'on' : '') + '"></i>';
    return out + '</span>';
  }
  function costMark(band) {
    var n = COST_ORDER[band] || 2, out = '<span class="cost" role="img" aria-label="Cost ' + esc(band) + '">';
    for (var i = 1; i <= 4; i++) out += i <= n ? '<b>$</b>' : '$';
    return out + '</span>';
  }
  function shortWeather(w) {
    w = String(w || '');
    return w.length > 26 ? w.slice(0, 24).replace(/[,;]\s*$/, '') + '…' : w;
  }

  function buildControls() {
    var host = document.getElementById('controls');
    host.innerHTML = CRIT.map(function (c) {
      return '<div class="crit"><div class="cname"><span class="sw" style="background:' + c.color + '"></span>' +
        esc(c.label) + '</div><div class="seg" role="group" aria-label="Importance of ' + esc(c.label) + '">' +
        LEVELS.map(function (l) {
          return '<button type="button" data-c="' + c.key + '" data-v="' + l.v + '" style="--lvl:' + c.color + '"' +
                 ' aria-pressed="' + (state.w[c.key] === l.v) + '">' + l.l + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    Array.prototype.forEach.call(host.querySelectorAll('.seg button'), function (b) {
      b.addEventListener('click', function () {
        state.w[b.getAttribute('data-c')] = +b.getAttribute('data-v');
        save();
        Array.prototype.forEach.call(host.querySelectorAll('.seg button'), function (o) {
          o.setAttribute('aria-pressed', String(state.w[o.getAttribute('data-c')] === +o.getAttribute('data-v')));
        });
        render();
      });
    });
  }

  function buildHead() {
    document.getElementById('head').innerHTML = COLS.map(function (c) {
      if (!c.sortable) return '<th scope="col"><span class="plain">' + esc(c.label) + '</span></th>';
      var on = state.sort === c.key;
      var arrow = on ? '<span class="arrow">' + (state.dir < 0 ? '↓' : '↑') + '</span>' : '';
      return '<th scope="col" class="' + (on ? 'on' : '') + '"><button type="button" data-sort="' + c.key + '">' +
             esc(c.label) + arrow + '</button></th>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#head button'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (state.sort === k) state.dir *= -1;
        else { state.sort = k; state.dir = (k === 'city' || k === 'weather') ? 1 : -1; }
        render();
      });
    });
  }

  function sortVal(p, k) {
    switch (k) {
      case 'city': return p.city.toLowerCase();
      case 'dog': return DOG_SCORE[p.dog_status] != null ? DOG_SCORE[p.dog_status] : 0;
      case 'visa': return p.visa_comfort;
      case 'cost': return -(COST_ORDER[p.cost_band] || 2);
      case 'div': return p.diversity;
      case 'eng': return p.english;
      case 'weather': return (p.weather_band || '').toLowerCase();
      default: return p._s.score;
    }
  }

  function popupHTML(p) {
    var s = p._s || scoreOf(p);
    return '<div class="pop">' +
      '<button class="popclose" data-close type="button" aria-label="Close">×</button>' +
      '<div class="pophead"><span class="popcity">' + esc(p.city) + '</span>' +
        (p.yours ? '<span class="chip yours">yours</span>' : '') +
        (!p.deep ? '<span class="chip">screened</span>' : '') +
        '<span class="popcn">' + esc(p.country) + '</span></div>' +
      '<div class="popstat"><span class="status st-' + esc(p.dog_status) + '"><span class="dot"></span>' +
        esc(cap(p.dog_status)) + '</span><span class="popfit">Fit ' + Math.round(s.score * 100) + '</span></div>' +
      '<div class="popgrid">' +
        '<span>Visa</span><span>' + meter(p.visa_comfort, 5, 'var(--s-visa)', 'Visa comfort') + '</span>' +
        '<span>Cost</span><span>' + costMark(p.cost_band) + '</span>' +
        '<span>Diversity</span><span>' + meter(p.diversity, 5, 'var(--s-div)', 'Diversity') + '</span>' +
        '<span>English</span><span>' + meter(p.english, 5, 'var(--s-eng)', 'English') + '</span>' +
        '<span>Weather</span><span class="popw">' + esc(cap(p.weather_band)) + '</span>' +
      '</div>' +
      detailHTML(p) +
    '</div>';
  }

  function detailHTML(p) {
    var b = [];
    b.push('<div class="dblock"><h4>Monet</h4>');
    b.push('<p>' + esc(p.dog_detail || 'Not researched in depth.') + '</p>');
    if (p.dog_mix_rule) b.push('<p><b>Mixes:</b> ' + esc(p.dog_mix_rule) + '</p>');
    if (p.dog_import) b.push('<p><b>Getting him there:</b> ' + esc(p.dog_import) + '</p>');
    if (p.dog_quarantine != null) b.push('<p class="kv">Quarantine: <b>' + (p.dog_quarantine ? p.dog_quarantine + ' days' : 'none') + '</b></p>');
    if (p.dog_titre != null) b.push('<p class="kv">Titre test: <b>' + (p.dog_titre ? 'required' : 'not required') + '</b></p>');
    if (p.dog_cost_low != null) b.push('<p class="kv">Import: <b>' + esc(money(p.dog_cost_low, p.dog_cost_high)) + '</b></p>');
    if (p.dog_life) b.push('<p>' + esc(p.dog_life) + '</p>');
    b.push('</div>');

    b.push('<div class="dblock"><h4>Papers</h4>');
    b.push('<p class="kv"><b>' + esc(p.visa_route || 'unknown') + '</b></p>');
    if (p.visa_why) b.push('<p>' + esc(p.visa_why) + '</p>');
    if (p.visa_fees_low != null) b.push('<p class="kv">Fees, couple: <b>' + esc(money(p.visa_fees_low, p.visa_fees_high)) + '</b></p>');
    if (p.visa_lawyer != null) b.push('<p class="kv">Lawyer: <b>$' + Number(p.visa_lawyer).toLocaleString() + '</b></p>');
    if (p.years_pr != null) b.push('<p class="kv">To permanent residence: <b>' + p.years_pr + ' yrs</b></p>');
    if (p.years_cit != null) b.push('<p class="kv">To citizenship: <b>' + p.years_cit + ' yrs</b></p>');
    if (p.settle_window) b.push('<p><b>Inside 2027–31?</b> ' + esc(p.settle_window) + '</p>');
    if (p.volatility) b.push('<p><b>Stability:</b> ' + esc(p.volatility) + '</p>');
    if (p.partner_work != null) {
      var pw = p.partner_work === true ? 'yes' : (p.partner_work === false ? 'no' : String(p.partner_work));
      b.push('<p class="kv">Partner can work: <b>' + esc(pw) + '</b></p>');
    }
    b.push('</div>');

    if (p.investor) {
      var iv = p.investor;
      b.push('<div class="dblock"><h4>Investor route</h4>');
      b.push('<p class="kv"><b>' + esc(iv.route_name || 'none') + '</b> · ' + esc(iv.status || '?') + '</p>');
      if (iv.min_investment_usd != null)
        b.push('<p class="kv">Minimum: <b>$' + Number(iv.min_investment_usd).toLocaleString() + '</b>' +
               (iv.investment_type ? ' in ' + esc(iv.investment_type) : '') + '</p>');
      if (iv.total_first_year_usd_low != null)
        b.push('<p class="kv">First year all-in: <b>' + esc(money(iv.total_first_year_usd_low, iv.total_first_year_usd_high)) + '</b></p>');
      if (iv.recoverable != null)
        b.push('<p class="kv">Capital recoverable: <b>' + (iv.recoverable ? 'yes' : 'no') + '</b></p>');
      if (iv.years_to_pr != null) b.push('<p class="kv">To permanent residence: <b>' + iv.years_to_pr + ' yrs</b></p>');
      if (iv.residency_requirement) b.push('<p class="kv">Presence needed: <b>' + esc(iv.residency_requirement) + '</b></p>');
      if (iv.realistic_for_them) b.push('<p class="kv">Within reach: <b>' + esc(iv.realistic_for_them) + '</b></p>');
      if (iv.note) b.push('<p>' + esc(iv.note) + '</p>');
      b.push('</div>');
    }
    b.push('<div class="dblock"><h4>The place</h4>');
    b.push('<p class="kv">' + esc(p.region || '—') + '</p>');
    b.push('<p class="kv">Cost: <b>' + esc(cap(p.cost_band)) + '</b> <span class="unver">(coarse)</span></p>');
    b.push('<p class="kv">Weather: <b>' + esc(cap(p.weather_band)) + '</b> <span class="unver">(coarse)</span></p>');
    b.push('<p class="kv">' + (p.deep ? 'Researched in depth' : 'Screened only') + ' · confidence ' + esc(p.dog_conf || '?') + '</p>');
    if (p.note) b.push('<p>' + esc(p.note) + '</p>');
    if (p.sources && p.sources.length) {
      b.push('<p>' + p.sources.map(function (s, i) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">Source ' + (i + 1) + '</a>';
      }).join(' · ') + '</p>');
    }
    b.push('</div>');
    return '<div class="dgrid">' + b.join('') + '</div>';
  }

  function render() {
    if (state.view === 'map') { renderMap(); markActive(); return; }
    var rows = PLACES.filter(function (p) {
      if (state.yours && !p.yours) return false;
      if (state.deep && !p.deep) return false;
      if (state.dogOK && p.dog_status === 'banned') return false;
      if (state.q && (p.city + ' ' + p.country + ' ' + (p.region || '')).toLowerCase().indexOf(state.q) === -1) return false;
      return true;
    });
    rows.forEach(function (p) { p._s = scoreOf(p); });
    rows.sort(function (a, b) {
      var va = sortVal(a, state.sort), vb = sortVal(b, state.sort);
      if (va < vb) return -state.dir;
      if (va > vb) return state.dir;
      return a.city.localeCompare(b.city);
    });
    var maxScore = rows.reduce(function (m, p) { return Math.max(m, p._s.score); }, 0) || 1;

    document.getElementById('body').innerHTML = rows.map(function (p, i) {
      var s = p._s, open = !!state.open[p.city];
      var segs = CRIT.map(function (c) {
        var frac = s.den ? s.contrib[c.key] / s.den : 0;
        if (frac <= 0.001) return '';
        return '<span style="width:' + (frac * 100 / maxScore) + '%;background:' + c.color + '" title="' + esc(c.label) + '"></span>';
      }).join('');
      var tr =
        '<tr class="row ' + (p.dog_status === 'banned' ? 'out ' : '') + (open ? 'open' : '') +
          '" data-city="' + esc(p.city) + '" tabindex="0" aria-expanded="' + open + '">' +
        '<td class="rank">' + (i + 1) + '</td>' +
        '<td class="city"><span class="name">' + esc(p.city) + '</span>' +
          (p.yours ? '<span class="chip yours">yours</span>' : '') +
          (!p.deep ? '<span class="chip">screened</span>' : '') +
          '<span class="cn">' + esc(p.country) + '</span></td>' +
        '<td><span class="status st-' + esc(p.dog_status) + '"><span class="dot"></span>' + esc(cap(p.dog_status)) + '</span></td>' +
        '<td>' + meter(p.visa_comfort, 5, 'var(--s-visa)', 'Visa comfort') + '</td>' +
        '<td>' + costMark(p.cost_band) + '</td>' +
        '<td>' + meter(p.diversity, 5, 'var(--s-div)', 'Diversity') + '</td>' +
        '<td>' + meter(p.english, 5, 'var(--s-eng)', 'English') + '</td>' +
        '<td class="weather" title="' + esc(cap(p.weather_band)) + '">' + esc(shortWeather(cap(p.weather_band))) + '</td>' +
        '<td class="scorecell"><span class="bar">' + segs + '</span>' +
          '<span class="scoreval">' + Math.round(s.score * 100) + '</span></td>' +
        '<td><span class="expandbtn" aria-hidden="true">' + (open ? '▾' : '▸') + '</span></td>' +
        '</tr>';
      if (open) tr += '<tr class="detail"><td colspan="' + COLS.length + '">' + detailHTML(p) + '</td></tr>';
      return tr;
    }).join('');

    var banned = rows.filter(function (p) { return p.dog_status === 'banned'; }).length;
    document.getElementById('count').textContent =
      rows.length + ' places' + (banned ? ' · ' + banned + ' closed to Monet' : '');

    Array.prototype.forEach.call(document.querySelectorAll('tr.row'), function (tr) {
      function toggle() {
        var c = tr.getAttribute('data-city');
        state.open[c] = !state.open[c];
        render();
      }
      tr.addEventListener('click', toggle);
      tr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
    buildHead();
  }

  function markActive() {
    var c = window.MapView.current();
    Array.prototype.forEach.call(document.querySelectorAll('#ranks button'), function (b) {
      b.classList.toggle('on', !!c && b.getAttribute('data-city') === c.city);
    });
  }

  function filterBtn(id, key) {
    var el = document.getElementById(id);
    el.addEventListener('click', function () {
      state[key] = !state[key];
      el.setAttribute('aria-pressed', String(state[key]));
      render();
    });
  }

  /* ---------------- views ---------------- */
  var visible = [];
  function currentRows() {
    var rows = PLACES.filter(function (p) {
      if (state.yours && !p.yours) return false;
      if (state.deep && !p.deep) return false;
      if (state.dogOK && p.dog_status === 'banned') return false;
      if (state.q && (p.city + ' ' + p.country + ' ' + (p.region || '')).toLowerCase().indexOf(state.q) === -1) return false;
      return true;
    });
    rows.forEach(function (p) { p._s = scoreOf(p); });
    rows.sort(function (a, b) { return b._s.score - a._s.score || a.city.localeCompare(b.city); });
    return rows;
  }
  function renderMap() {
    visible = currentRows();
    window.MapView.setDots(visible);
    document.getElementById('ranks').innerHTML = visible.map(function (p, i) {
      return '<li><button type="button" data-city="' + esc(p.city) + '">' +
        '<span class="rk">' + (i + 1) + '</span>' +
        '<span class="rc">' + esc(p.city) + '<em>' + esc(p.country) + '</em></span>' +
        '<span class="rd s-' + esc(p.dog_status) + '" title="' + esc(cap(p.dog_status)) + '"></span>' +
        '<span class="rf">' + Math.round(p._s.score * 100) + '</span></button></li>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#ranks button'), function (b) {
      b.addEventListener('click', function () {
        var p = visible.filter(function (q) { return q.city === b.getAttribute('data-city'); })[0];
        if (p) window.MapView.select(p);
      });
    });
    var banned = visible.filter(function (p) { return p.dog_status === 'banned'; }).length;
    document.getElementById('count').textContent =
      visible.length + ' places' + (banned ? ' · ' + banned + ' closed to Monet' : '');
  }
  function setView(v) {
    state.view = v;
    document.getElementById('panel-table').hidden = (v !== 'table');
    document.body.classList.toggle('mapmode', v === 'map');
    if (v === 'map') window.MapView.invalidate();
    render();
  }
  function panelToggle(btnId, bodyId) {
    var b = document.getElementById(btnId), body = document.getElementById(bodyId);
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });
  }

  buildControls();
  buildHead();
  filterBtn('f-yours', 'yours');
  filterBtn('f-deep', 'deep');
  filterBtn('f-dog', 'dogOK');
  document.getElementById('search').addEventListener('input', function (e) {
    state.q = e.target.value.trim().toLowerCase(); render();
  });
  state.view = 'map';
  var used = window.MapView.init({
    host: document.getElementById('maphost'),
    places: PLACES,
    render: popupHTML,
    onPick: function () { markActive(); }
  });
  document.getElementById('z-in').addEventListener('click', function () { window.MapView.zoomBy(1/1.6); });
  document.getElementById('z-out').addEventListener('click', function () { window.MapView.zoomBy(1.6); });
  document.getElementById('z-reset').addEventListener('click', function () { window.MapView.reset(); markActive(); });
  document.getElementById('v-map').addEventListener('click', function () { setView('map'); });
  document.getElementById('v-table').addEventListener('click', function () { setView('table'); });
  panelToggle('ctl-toggle', 'ctl-body');
  panelToggle('rank-toggle', 'rank-body');

  var tb = document.getElementById('theme');
  tb.addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
  });
  render();
})();
