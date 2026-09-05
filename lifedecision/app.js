(function () {
  'use strict';
  var PLACES = window.PLACES || [];
  var CRIT = [
    { key:'dog',       label:'Monet',      color:'var(--s-dog)',  desc:'Can he legally come and have a decent life there.' },
    { key:'visa',      label:'Visa comfort', color:'var(--s-visa)', desc:'How much of our life is hostage to a stamp: employer dependence, renewals, a real path to permanent residence.' },
    { key:'cost',      label:'Monthly cost', color:'var(--s-cost)', desc:'What a couple plus a dog spends each month. Cheaper scores higher.' },
    { key:'diversity', label:'Diversity',   color:'var(--s-div)',  desc:'Whether people who look and sound like us are ordinary rather than a novelty.' },
    { key:'english',   label:'English',     color:'var(--s-eng)',  desc:'Whether we can work and live without learning a new language first.' }
  ];
  var COST_ORDER = { 'low':1, 'mid':2, 'high':3, 'very high':4 };
  var DOG_SCORE  = { 'allowed':1, 'restricted':0.55, 'murky':0.4, 'banned':0 };
  var STORE = 'lifedecision.v1';

  var state = { w:{}, sort:'score', dir:-1, q:'', yours:false, deep:false, hideDog:false, open:{} };
  CRIT.forEach(function (c) { state.w[c.key] = (window.WEIGHT_DEFAULTS || {})[c.key] || 3; });

  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && saved.w) { CRIT.forEach(function(c){ if (typeof saved.w[c.key] === 'number') state.w[c.key] = saved.w[c.key]; }); }
  } catch (e) { /* private mode: keep defaults */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ w: state.w })); } catch (e) {} }

  function parts(p) {
    return {
      dog: DOG_SCORE[p.dog_status] != null ? DOG_SCORE[p.dog_status] : 0,
      visa: (p.visa_comfort - 1) / 4,
      cost: 1 - ((COST_ORDER[p.cost_band] || 2) - 1) / 3,
      diversity: (p.diversity - 1) / 4,
      english: (p.english - 1) / 4
    };
  }
  function scoreOf(p) {
    var pr = parts(p), den = 0, tot = 0, contrib = {};
    CRIT.forEach(function (c) {
      var w = state.w[c.key], v = pr[c.key === 'diversity' ? 'diversity' : c.key];
      den += w; tot += w * v; contrib[c.key] = w * v;
    });
    return { score: den ? tot / den : 0, contrib: contrib, den: den, parts: pr };
  }

  var COLS = [
    { key:'rank',    label:'#',        sortable:false },
    { key:'city',    label:'Place',    sortable:true },
    { key:'dog',     label:'Monet',    sortable:true },
    { key:'visa',    label:'Visa',     sortable:true },
    { key:'cost',    label:'Cost',     sortable:true },
    { key:'div',     label:'Diversity',sortable:true },
    { key:'eng',     label:'English',  sortable:true },
    { key:'weather', label:'Weather',  sortable:true },
    { key:'score',   label:'Score',    sortable:true },
    { key:'why',     label:'Why it sits here', sortable:false },
    { key:'more',    label:'',         sortable:false }
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

  function buildWeights() {
    var host = document.getElementById('weights');
    host.innerHTML = CRIT.map(function (c) {
      return '<div class="wrow">' +
        '<label for="w-' + c.key + '"><span><span class="swatch" style="background:' + c.color + '"></span>' +
        esc(c.label) + '</span><span class="val" id="v-' + c.key + '">' + state.w[c.key] + '</span></label>' +
        '<input type="range" min="0" max="5" step="1" id="w-' + c.key + '" value="' + state.w[c.key] + '">' +
        '<div class="desc">' + esc(c.desc) + '</div></div>';
    }).join('');
    CRIT.forEach(function (c) {
      document.getElementById('w-' + c.key).addEventListener('input', function (e) {
        state.w[c.key] = +e.target.value;
        document.getElementById('v-' + c.key).textContent = e.target.value;
        save(); render();
      });
    });
  }

  function buildHead() {
    document.getElementById('head').innerHTML = COLS.map(function (c) {
      if (!c.sortable) return '<th scope="col">' + esc(c.label) + '</th>';
      var arrow = state.sort === c.key ? '<span class="arrow">' + (state.dir < 0 ? '▼' : '▲') + '</span>' : '';
      return '<th scope="col"><button type="button" data-sort="' + c.key + '">' + esc(c.label) + arrow + '</button></th>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#head button'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (state.sort === k) { state.dir *= -1; } else { state.sort = k; state.dir = (k === 'city') ? 1 : -1; }
        render();
      });
    });
  }

  function sortVal(p, k) {
    var s = scoreOf(p);
    switch (k) {
      case 'city': return p.city.toLowerCase();
      case 'dog': return DOG_SCORE[p.dog_status] != null ? DOG_SCORE[p.dog_status] : 0;
      case 'visa': return p.visa_comfort;
      case 'cost': return -(COST_ORDER[p.cost_band] || 2);
      case 'div': return p.diversity;
      case 'eng': return p.english;
      case 'weather': return (p.weather_band || '').toLowerCase();
      default: return s.score;
    }
  }

  function critName(c) { return c.key === 'dog' ? 'Monet' : c.label.toLowerCase(); }

  function whyText(p, s) {
    var ranked = CRIT.map(function (c) { return { c:c, v:s.parts[c.key], w:state.w[c.key] }; })
                     .filter(function (x) { return x.w > 0; });
    if (!ranked.length) return 'All weights are zero, so nothing separates these places.';
    ranked.sort(function (a, b) { return b.v - a.v; });
    var best = ranked[0], worst = ranked[ranked.length - 1];
    var out = [];
    if (p.dog_status === 'banned') {
      out.push('Monet is banned, which zeroes the criterion you weighted ' + state.w.dog + '.');
    } else if (best.v > 0.6) {
      out.push('Strongest on ' + critName(best.c) + '.');
    }
    if (worst.v < 0.4 && worst.c.key !== 'dog') {
      out.push('Weakest on ' + critName(worst.c) + '.');
    }
    out.push(p.note || '');
    return out.filter(Boolean).join(' ');
  }

  function detailHTML(p) {
    var b = [];
    b.push('<div class="dblock"><h4>Monet</h4>');
    b.push('<p>' + esc(p.dog_detail || 'Not researched in depth.') + '</p>');
    if (p.dog_mix_rule) b.push('<p><b>How mixes are judged:</b> ' + esc(p.dog_mix_rule) + '</p>');
    if (p.dog_import) b.push('<p><b>Getting him there:</b> ' + esc(p.dog_import) + '</p>');
    if (p.dog_quarantine != null) b.push('<p class="kv">Quarantine: <b>' + (p.dog_quarantine ? p.dog_quarantine + ' days' : 'none') + '</b></p>');
    if (p.dog_titre != null) b.push('<p class="kv">Rabies titre test: <b>' + (p.dog_titre ? 'required' : 'not required') + '</b></p>');
    if (p.dog_cost_low != null) b.push('<p class="kv">Import cost: <b>' + esc(money(p.dog_cost_low, p.dog_cost_high)) + '</b></p>');
    if (p.dog_friendly != null) b.push('<p class="kv">Dog-friendliness: <b>' + p.dog_friendly + '/5</b></p>');
    if (p.dog_life) b.push('<p>' + esc(p.dog_life) + '</p>');
    b.push('</div>');

    b.push('<div class="dblock"><h4>Papers</h4>');
    b.push('<p class="kv">Route: <b>' + esc(p.visa_route || 'unknown') + '</b></p>');
    if (p.visa_why) b.push('<p>' + esc(p.visa_why) + '</p>');
    if (p.visa_fees_low != null) b.push('<p class="kv">Government fees, couple: <b>' + esc(money(p.visa_fees_low, p.visa_fees_high)) + '</b></p>');
    if (p.visa_lawyer != null) b.push('<p class="kv">Typical lawyer fee: <b>$' + Number(p.visa_lawyer).toLocaleString() + '</b></p>');
    if (p.years_pr != null) b.push('<p class="kv">Years to permanent residence: <b>' + p.years_pr + '</b></p>');
    if (p.years_cit != null) b.push('<p class="kv">Years to citizenship: <b>' + p.years_cit + '</b></p>');
    if (p.settle_window) b.push('<p><b>Inside 2027–2031?</b> ' + esc(p.settle_window) + '</p>');
    if (p.us_exp) b.push('<p><b>Does your US time count:</b> ' + esc(p.us_exp) + '</p>');
    if (p.volatility) b.push('<p><b>How stable the policy is:</b> ' + esc(p.volatility) + '</p>');
    if (p.partner_work != null) {
      var pw = p.partner_work === true ? 'yes' : (p.partner_work === false ? 'no' : String(p.partner_work));
      b.push('<p class="kv">Partner can work on arrival: <b>' + esc(pw) + '</b>' +
             (p.partner_note ? ' — ' + esc(p.partner_note) : '') + '</p>');
    }
    b.push('</div>');

    b.push('<div class="dblock"><h4>The place</h4>');
    b.push('<p class="kv">Region: <b>' + esc(p.region || '—') + '</b></p>');
    b.push('<p class="kv">Cost band: <b>' + esc(cap(p.cost_band)) + '</b> <span class="unver">(coarse — detailed budget still being researched)</span></p>');
    b.push('<p class="kv">Weather: <b>' + esc(cap(p.weather_band)) + '</b> <span class="unver">(coarse)</span></p>');
    b.push('<p class="kv">Diversity: <b>' + p.diversity + '/5</b> · English at work: <b>' + p.english + '/5</b></p>');
    b.push('<p class="kv">Research depth: <b>' + (p.deep ? 'in depth' : 'screened only') + '</b> · confidence ' + esc(p.dog_conf || 'unknown') + '</p>');
    if (p.sources && p.sources.length) {
      b.push('<p>Sources: ' + p.sources.map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + '</a>';
      }).join(' · ') + '</p>');
    }
    b.push('</div>');
    return '<div class="dgrid">' + b.join('') + '</div>';
  }

  function render() {
    var rows = PLACES.filter(function (p) {
      if (state.yours && !p.yours) return false;
      if (state.deep && !p.deep) return false;
      if (state.hideDog && p.dog_status === 'banned') return false;
      if (state.q) {
        var hay = (p.city + ' ' + p.country + ' ' + (p.region || '')).toLowerCase();
        if (hay.indexOf(state.q) === -1) return false;
      }
      return true;
    });
    rows.forEach(function (p) { p._s = scoreOf(p); });
    rows.sort(function (a, b) {
      var va = sortVal(a, state.sort), vb = sortVal(b, state.sort);
      if (va < vb) return -1 * state.dir;
      if (va > vb) return 1 * state.dir;
      return a.city.localeCompare(b.city);
    });

    var maxScore = 0;
    rows.forEach(function (p) { if (p._s.score > maxScore) maxScore = p._s.score; });

    var html = rows.map(function (p, i) {
      var s = p._s;
      var segs = CRIT.map(function (c) {
        var frac = s.den ? (s.contrib[c.key] / s.den) : 0;
        if (frac <= 0.001) return '';
        return '<span style="width:' + (frac * 100 / (maxScore || 1)) + '%;background:' + c.color + '" ' +
               'title="' + esc(c.label) + '"></span>';
      }).join('');
      var open = !!state.open[p.city];
      var tr =
        '<tr class="' + (p.dog_status === 'banned' ? 'out' : '') + '">' +
        '<td class="rank">' + (i + 1) + '</td>' +
        '<td class="city"><span class="name">' + esc(p.city) + '</span>' +
          (p.yours ? '<span class="chip yours">yours</span>' : '') +
          (!p.deep ? '<span class="chip">screened</span>' : '') +
          '<span class="cn">' + esc(p.country) + '</span></td>' +
        '<td><span class="status st-' + esc(p.dog_status) + '">' +
          '<span class="dot"></span>' + esc(cap(p.dog_status)) + '</span></td>' +
        '<td class="num"><b>' + p.visa_comfort + '</b>/5</td>' +
        '<td class="num">' + esc(cap(p.cost_band)) + '</td>' +
        '<td class="num"><b>' + p.diversity + '</b>/5</td>' +
        '<td class="num"><b>' + p.english + '</b>/5</td>' +
        '<td>' + esc(cap(p.weather_band)) + '</td>' +
        '<td class="scorecell"><div class="bar">' + segs + '</div>' +
          '<span class="scoreval">' + s.score.toFixed(2) + '</span></td>' +
        '<td class="why">' + esc(whyText(p, s)) + '</td>' +
        '<td><button class="expandbtn" type="button" data-city="' + esc(p.city) + '" aria-expanded="' + open + '">' +
          (open ? 'Less' : 'More') + '</button></td>' +
        '</tr>';
      if (open) tr += '<tr class="detail"><td colspan="' + COLS.length + '">' + detailHTML(p) + '</td></tr>';
      return tr;
    }).join('');

    document.getElementById('body').innerHTML = html;
    document.getElementById('count').textContent =
      rows.length + ' of ' + PLACES.length + ' places' +
      (state.hideDog ? '' : ' · ' + rows.filter(function (p) { return p.dog_status === 'banned'; }).length + ' banned for Monet');

    Array.prototype.forEach.call(document.querySelectorAll('.expandbtn'), function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-city');
        state.open[c] = !state.open[c];
        render();
      });
    });
    buildHead();
  }

  function toggle(id, key) {
    var el = document.getElementById(id);
    el.addEventListener('click', function () {
      state[key] = !state[key];
      el.setAttribute('aria-pressed', String(state[key]));
      render();
    });
  }

  buildWeights();
  buildHead();
  toggle('f-yours', 'yours');
  toggle('f-deep', 'deep');
  toggle('f-dog', 'hideDog');
  document.getElementById('search').addEventListener('input', function (e) {
    state.q = e.target.value.trim().toLowerCase(); render();
  });
  var tb = document.getElementById('theme');
  tb.addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    tb.textContent = dark ? 'Dark' : 'Light';
  });
  render();
})();
