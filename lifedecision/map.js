/* Map view with two backends:
   1. Leaflet + CARTO basemap when the CDN is reachable (real slippy map)
   2. Inline SVG world outlines as an offline fallback                     */
(function () {
  'use strict';
  var W = 1000, H = 500;
  var api = window.MapView = {};
  var host, places = [], render, onPick, backend = null, current = null;

  function lonx(lon) { return (lon + 180) / 360 * W; }
  function laty(lat) { return (90 - lat) / 180 * H; }
  function key(p) { return p.city; }

  /* ---------------- Leaflet backend ---------------- */
  function Leafy() {
    var map, layer = {}, self = {};
    self.name = 'carto';
    self.init = function () {
      host.innerHTML = '<div id="lmap"></div>';
      map = L.map(host.querySelector('#lmap'), {
        worldCopyJump: true, zoomControl: false, minZoom: 2, maxZoom: 14,
        scrollWheelZoom: true
      }).setView([25, 10], 2);
      var dark = matchMedia('(prefers-color-scheme: dark)').matches &&
                 document.documentElement.getAttribute('data-theme') !== 'light' ||
                 document.documentElement.getAttribute('data-theme') === 'dark';
      L.tileLayer('https://{s}.basemaps.cartocdn.com/' + (dark ? 'dark_all' : 'light_all') +
                  '/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 20
      }).addTo(map);
    };
    self.setDots = function (list) {
      Object.keys(layer).forEach(function (k) { map.removeLayer(layer[k]); });
      layer = {};
      list.forEach(function (p) {
        if (p.lat == null || p.lng == null) return;
        var m = L.circleMarker([p.lat, p.lng], {
          radius: 5 + (p._s ? p._s.score : 0.5) * 6,
          className: 'lm s-' + p.dog_status,
          weight: 2, opacity: 1, fillOpacity: 0.75
        }).addTo(map);
        m.bindPopup(function () { return render(p); }, {
          maxWidth: 360, minWidth: 300, className: 'lpop', autoPan: true
        });
        m.bindTooltip(p.city, { direction: 'top', offset: [0, -6] });
        m.on('click', function () { current = p; if (onPick) onPick(p); });
        layer[key(p)] = m;
      });
    };
    self.select = function (p) {
      current = p;
      map.flyTo([p.lat, p.lng], 7, { duration: 1.1 });
      var m = layer[key(p)];
      if (m) setTimeout(function () { m.openPopup(); }, 950);
    };
    self.reset = function () { map.closePopup(); map.flyTo([25, 10], 2, { duration: 0.9 }); current = null; };
    self.zoomBy = function (f) { if (f < 1) map.zoomIn(1); else map.zoomOut(1); };
    self.invalidate = function () { setTimeout(function () { map.invalidateSize(); }, 60); };
    return self;
  }

  /* ---------------- SVG fallback backend ---------------- */
  function Svgy() {
    var svg, gWorld, gDots, popup, view = { x:0,y:0,w:W,h:H }, anim = null, drag = null, self = {};
    self.name = 'svg';

    function setView(v) {
      view = v;
      svg.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
      var k = W / v.w;
      gWorld.setAttribute('stroke-width', (0.5 / k).toFixed(3));
      Array.prototype.forEach.call(gDots.childNodes, function (c) {
        c.setAttribute('r', (+c.getAttribute('data-r') / k).toFixed(3));
        c.setAttribute('stroke-width', (1.1 / k).toFixed(3));
      });
      place();
    }
    function clamp(v) {
      v.w = Math.min(W, Math.max(W / 60, v.w));
      v.h = v.w * (H / W);
      v.x = Math.min(W - v.w, Math.max(0, v.x));
      v.y = Math.min(H - v.h, Math.max(0, v.y));
      return v;
    }
    function animateTo(t, ms) {
      if (anim) cancelAnimationFrame(anim);
      var f = { x:view.x, y:view.y, w:view.w, h:view.h }, t0 = performance.now();
      ms = ms || 620;
      (function step(now) {
        var q = Math.min(1, (now - t0) / ms);
        var e = q < 0.5 ? 4*q*q*q : 1 - Math.pow(-2*q + 2, 3) / 2;
        setView({ x:f.x+(t.x-f.x)*e, y:f.y+(t.y-f.y)*e, w:f.w+(t.w-f.w)*e, h:f.h+(t.h-f.h)*e });
        if (q < 1) anim = requestAnimationFrame(step); else { anim = null; place(); }
      })(performance.now());
    }
    function hide() { popup.hidden = true; popup.innerHTML = ''; }
    function place() {
      if (popup.hidden || !current) return;
      var pt = svg.createSVGPoint();
      pt.x = lonx(current.lng); pt.y = laty(current.lat);
      var m = svg.getScreenCTM(); if (!m) return;
      var s = pt.matrixTransform(m), hb = host.getBoundingClientRect();
      var x = s.x - hb.left, y = s.y - hb.top, pw = popup.offsetWidth, ph = popup.offsetHeight;
      var left = x + 18; if (left + pw > hb.width - 8) left = x - pw - 18;
      popup.style.left = Math.max(8, left) + 'px';
      popup.style.top = Math.max(8, Math.min(y - ph/2, hb.height - ph - 8)) + 'px';
    }
    function show(p) {
      current = p; popup.hidden = false; popup.innerHTML = render(p);
      var c = popup.querySelector('[data-close]');
      if (c) c.addEventListener('click', function (e) { e.stopPropagation(); hide(); mark(null); current = null; });
      place();
    }
    function mark(city) {
      Array.prototype.forEach.call(gDots.childNodes, function (c) {
        c.classList.toggle('sel', c.getAttribute('data-city') === city);
      });
    }
    self.init = function () {
      host.innerHTML = '<svg id="svgmap" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" ' +
        'role="img" aria-label="World map of candidate places">' +
        '<g id="world" fill="none" stroke-linejoin="round"></g><g id="dots"></g></svg>' +
        '<div class="popup" id="popup" hidden></div>' +
        '<p class="offline-note">Offline map · connect to the internet for the CARTO basemap</p>';
      svg = host.querySelector('#svgmap');
      gWorld = host.querySelector('#world');
      gDots = host.querySelector('#dots');
      popup = host.querySelector('#popup');
      gWorld.innerHTML = (window.WORLD || []).map(function (c) {
        return '<path d="' + c.d + '"><title>' + c.n + '</title></path>';
      }).join('');
      svg.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = svg.getBoundingClientRect();
        var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        var mx = view.x + fx * view.w, my = view.y + fy * view.h;
        var w = Math.min(W, Math.max(W/60, view.w * (e.deltaY > 0 ? 1.18 : 1/1.18)));
        setView(clamp({ x: mx - fx*w, y: my - fy*(w*(H/W)), w: w, h: w*(H/W) }));
      }, { passive: false });
      svg.addEventListener('pointerdown', function (e) {
        if (e.target.tagName === 'circle') return;
        drag = { x:e.clientX, y:e.clientY, vx:view.x, vy:view.y };
        svg.setPointerCapture(e.pointerId); svg.classList.add('grabbing');
      });
      svg.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var r = svg.getBoundingClientRect();
        setView(clamp({ x: drag.vx - (e.clientX-drag.x)/r.width*view.w,
                        y: drag.vy - (e.clientY-drag.y)/r.height*view.h, w: view.w, h: view.h }));
      });
      ['pointerup','pointercancel'].forEach(function (ev) {
        svg.addEventListener(ev, function (e) {
          if (!drag) return; drag = null; svg.classList.remove('grabbing');
          try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
        });
      });
      window.addEventListener('resize', place);
    };
    self.setDots = function (list) {
      gDots.innerHTML = list.map(function (p) {
        if (p.lat == null || p.lng == null) return '';
        var r = 2.6 + (p._s ? p._s.score : 0.5) * 3.4;
        var c = String(p.city).replace(/"/g, '');
        return '<circle class="dot s-' + p.dog_status + '" data-city="' + c + '" data-r="' + r.toFixed(2) +
               '" r="' + r.toFixed(2) + '" cx="' + lonx(p.lng).toFixed(2) + '" cy="' + laty(p.lat).toFixed(2) +
               '" tabindex="0" role="button" aria-label="' + c + '"><title>' + c + ' — ' + p.dog_status +
               '</title></circle>';
      }).join('');
      Array.prototype.forEach.call(gDots.childNodes, function (c) {
        function pick(e) {
          e.stopPropagation();
          var p = places.filter(function (q) { return String(q.city).replace(/"/g,'') === c.getAttribute('data-city'); })[0];
          if (p) api.select(p);
        }
        c.addEventListener('click', pick);
        c.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); }
        });
      });
      setView(view);
    };
    self.select = function (p) {
      mark(String(p.city).replace(/"/g,''));
      var w = 90, h = w * (H/W);
      animateTo(clamp({ x: lonx(p.lng) - w/2, y: laty(p.lat) - h/2, w: w, h: h }));
      show(p);
    };
    self.reset = function () { animateTo({ x:0, y:0, w:W, h:H }); hide(); mark(null); current = null; };
    self.zoomBy = function (f) {
      var cx = view.x + view.w/2, cy = view.y + view.h/2, w = view.w * f;
      animateTo(clamp({ x: cx - w/2, y: cy - (w*(H/W))/2, w: w, h: w*(H/W) }), 260);
    };
    self.invalidate = function () { place(); };
    return self;
  }

  api.init = function (o) {
    host = o.host; places = o.places; render = o.render; onPick = o.onPick;
    backend = (typeof window.L !== 'undefined' && window.L.map) ? Leafy() : Svgy();
    backend.init();
    return backend.name;
  };
  api.setDots = function (list) { places = list; backend.setDots(list); };
  api.select = function (p) { backend.select(p); if (onPick) onPick(p); };
  api.reset = function () { backend.reset(); };
  api.zoomBy = function (f) { if (backend.zoomBy) backend.zoomBy(f); };
  api.invalidate = function () { if (backend.invalidate) backend.invalidate(); };
  api.backend = function () { return backend && backend.name; };
  api.current = function () { return current; };
})();
