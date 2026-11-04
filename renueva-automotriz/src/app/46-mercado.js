/* =====================================================================
   ESTUDIO DE MERCADO: abre la búsqueda armada en los sitios de Chile,
   el vendedor anota avisos parecidos y la app calcula dónde está el precio.
   (Los portales no permiten consultas automáticas: así es gratis y legal.)
   ===================================================================== */
const mkSlug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function mkSitios(it) {
  const s = it.specs || {}, ok = v => v != null && v !== '—' && v !== '' && v !== '-';
  if (it.w === 'auto') {
    const marca = ok(s.marca) ? s.marca : '', modelo = ok(s.modelo) ? s.modelo : '', anio = ok(s.anio) ? s.anio : '';
    const q = [marca, modelo, anio].filter(Boolean).join(' ') || it.nombre, qe = encodeURIComponent(q);
    return [['Chileautos', marca && modelo ? `https://www.chileautos.cl/vehiculos/${mkSlug(marca)}/${mkSlug(modelo)}/` : `https://www.google.com/search?q=${qe}+site%3Achileautos.cl`],
      ['MercadoLibre', `https://listado.mercadolibre.cl/${mkSlug(q)}`], ['Yapo', `https://www.yapo.cl/autos?q=${qe}`],
      ['Kavak', marca && modelo ? `https://www.kavak.com/cl/seminuevos/${mkSlug(marca)}/${mkSlug(modelo)}` : `https://www.kavak.com/cl/seminuevos`],
      ['Marketplace', `https://www.facebook.com/marketplace/search/?query=${qe}`], ['Google', `https://www.google.com/search?q=${qe}+precio+chile`]];
  }
  if (it.w === 'prop') {
    const op = it.op === 'Arriendo' ? 'arriendo' : 'venta', tipo = ok(s.tipo) ? s.tipo : 'Departamento', comuna = ok(s.comuna) ? s.comuna : '';
    const q = `${tipo} ${op} ${comuna} ${ok(s.dorm) ? s.dorm + ' dormitorios' : ''}`.trim(), qe = encodeURIComponent(q);
    return [['Portal Inmobiliario', `https://www.portalinmobiliario.com/${op}/${mkSlug(tipo)}/${comuna ? mkSlug(comuna) + '-metropolitana' : ''}`],
      ['TocToc', `https://www.google.com/search?q=${qe}+site%3Atoctoc.com`], ['Yapo', `https://www.yapo.cl/inmuebles?q=${qe}`],
      ['MercadoLibre', `https://listado.mercadolibre.cl/inmuebles/${mkSlug(q)}`], ['Google', `https://www.google.com/search?q=${qe}+precio`]];
  }
  const qe = encodeURIComponent(it.nombre);
  return [['MercadoLibre', `https://listado.mercadolibre.cl/${mkSlug(it.nombre)}`], ['Google', `https://www.google.com/search?q=${qe}+precio+chile`]];
}
const mkMed = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : Math.round((s[n / 2 - 1] + s[n / 2]) / 2)) : 0; };
// resultado: en propiedades se compara el precio por m² y se lleva a los m² propios
function mkCalc(it) {
  const cs = (it.comps || []).filter(c => c.p > 0); if (!cs.length) return null;
  const m2 = it.w === 'prop' ? +(it.specs && it.specs.m2c) || 0 : 0, porM2 = m2 > 0 && cs.filter(c => c.m2 > 0).length >= 2;
  const base = porM2 ? cs.filter(c => c.m2 > 0).map(c => c.p / c.m2) : cs.map(c => c.p);
  const k = porM2 ? m2 : 1, r1 = v => Math.round(v / 1000) * 1000, med = r1(mkMed(base) * k), prom = r1(base.reduce((a, b) => a + b, 0) / base.length * k);
  return { n: cs.length, med, prom, min: r1(Math.min(...base) * k), max: r1(Math.max(...base) * k), porM2, m2Med: porM2 ? Math.round(mkMed(base)) : 0, dif: it.precio && med ? it.precio / med - 1 : 0 };
}
function mkHtml(it) {
  const w = WORLDS[it.w], r = mkCalc(it), s = it.specs || {}, auto = it.w === 'auto', prop = it.w === 'prop';
  const fuentes = mkSitios(it).map(x => x[0]).concat('Otro');
  const pctTxt = p => (p >= 0 ? '+' : '−') + Math.abs(p * 100).toFixed(1).replace('.', ',') + '%';
  const bar = r ? (() => { const lo = Math.min(r.min, it.precio || r.min), hi = Math.max(r.max, it.precio || r.max), pos = v => hi > lo ? ((v - lo) / (hi - lo) * 100).toFixed(1) : 50;
    return `<div class="mkbar"><span class="rng" style="left:${pos(r.min)}%;right:${100 - pos(r.max)}%"></span><span class="med" style="left:${pos(r.med)}%"></span>${it.precio ? `<span class="tu" style="left:${pos(it.precio)}%"><b>Tú</b></span>` : ''}</div>
      <div style="display:flex;justify-content:space-between;font:500 11px var(--mono);color:var(--fg3);margin-top:8px"><span>${fmtM(lo)}</span><span>${fmtM(hi)}</span></div>`; })() : '';
  const verdict = r && it.precio ? (Math.abs(r.dif) <= 0.03 ? ['good', 'Tu precio está en línea con el mercado.'] : r.dif > 0 ? ['warn', `Tu precio está ${pctTxt(r.dif)} sobre la mediana. ${r.dif > 0.08 ? 'Puede costar venderlo: considera ajustar o destacar su equipamiento.' : 'Está algo alto; si lleva tiempo publicado, conviene revisarlo.'}`] : ['good', `Tu precio está ${pctTxt(r.dif)} bajo la mediana: es competitivo${r.dif < -0.08 ? '; quizás tienes margen para subirlo' : ''}.`]) : null;
  return `<div class="px" style="padding-top:8px;display:flex;flex-direction:column;gap:14px">
    <div class="card"><span class="kicker">1 · Busca ${prop ? 'propiedades' : 'avisos'} parecidos</span>
      <p style="font-size:13px;color:var(--fg2);margin-top:10px;line-height:1.45">Abrimos la búsqueda de <b style="color:var(--fg)">${clean(prop ? [s.tipo, s.comuna].filter(x => x && x !== '—').join(' en ') || it.nombre : it.nombre)}</b>. ${auto ? 'Fíjate en autos con año y kilometraje parecidos.' : prop ? 'Compara con propiedades de tamaño y ubicación parecidos.' : ''}</p>
      <div class="mksites">${mkSitios(it).map(([n, u]) => `<a class="mksite" href="${u}" target="_blank" rel="noopener">${icon('search', 15)}${n}</a>`).join('')}</div></div>
    <div class="card"><span class="kicker">2 · Anota lo que encontraste</span>
      ${(it.comps || []).length ? `<div class="mklist">${it.comps.map((c, i) => `<div class="mkrow"><span class="grow"><b>${fmt(c.p)}</b><small>${clean(c.f)}${c.a ? ' · ' + c.a : ''}${c.km ? ' · ' + Number(c.km).toLocaleString('es-CL') + ' km' : ''}${c.m2 ? ' · ' + c.m2 + ' m²' : ''}</small></span>${c.u ? `<a class="ibtn" href="${clean(c.u)}" target="_blank" rel="noopener" aria-label="Ver aviso">${icon('arrowR', 15)}</a>` : ''}<button class="ibtn" data-act="mkRm" data-id="${it.id}" data-i="${i}" aria-label="Quitar">${icon('close', 15)}</button></div>`).join('')}</div>` : '<p style="font-size:13px;color:var(--fg3);margin-top:10px">Con 3 a 5 avisos parecidos el resultado ya es confiable.</p>'}
      <div class="grid2" style="margin-top:12px"><label class="field"><span>Sitio</span><select id="mk-f">${fuentes.map(f => `<option>${f}</option>`).join('')}</select></label><label class="field"><span>${prop && it.op === 'Arriendo' ? 'Arriendo' : 'Precio'}</span><input id="mk-p" data-money inputmode="numeric" placeholder="$0"></label></div>
      <div class="grid2" style="margin-top:8px">${auto ? `<label class="field"><span>Año</span><input id="mk-a" inputmode="numeric" maxlength="4" placeholder="${clean(s.anio || '')}"></label><label class="field"><span>Kilometraje</span><input id="mk-k" inputmode="numeric" placeholder="0"></label>` : prop ? `<label class="field"><span>m² construidos</span><input id="mk-m" inputmode="numeric" placeholder="${clean(s.m2c || '')}"></label><label class="field"><span>Enlace (opcional)</span><input id="mk-u" inputmode="url" placeholder="https://"></label>` : ''}</div>
      ${auto ? `<label class="field" style="margin-top:8px"><span>Enlace del aviso (opcional)</span><input id="mk-u" inputmode="url" placeholder="https://"></label>` : ''}
      <button class="btn ghost small" data-act="mkAdd" data-id="${it.id}" style="width:100%;margin-top:12px">${icon('plus', 15)}Agregar aviso</button></div>
    ${r ? `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kicker">3 · Resultado</span><span class="chip">${r.n} aviso${r.n > 1 ? 's' : ''}</span></div>
      <div class="grid2" style="margin-top:14px"><div><p class="mono" style="font-size:10px;color:var(--fg3)">MEDIANA${r.porM2 ? ' (POR M²)' : ''}</p><p class="num" style="font-size:22px;margin-top:5px">${fmt(r.med)}</p>${r.porM2 ? `<p style="font-size:11.5px;color:var(--fg3);margin-top:3px">${fmt(r.m2Med)} por m² × ${s.m2c} m²</p>` : ''}</div><div style="text-align:right"><p class="mono" style="font-size:10px;color:var(--fg3)">TU PRECIO</p><p class="num" style="font-size:22px;margin-top:5px;color:var(--fg2)">${it.precio ? fmt(it.precio) : '—'}</p></div></div>
      <div style="margin-top:16px">${bar}</div>
      ${drow('Promedio', fmt(r.prom))}${drow('Rango', fmtM(r.min) + ' – ' + fmtM(r.max))}
      ${verdict ? `<div class="tip ${verdict[0]}" style="margin-top:12px">${icon(verdict[0] === 'good' ? 'check' : 'warn')}<span>${verdict[1]}</span></div>` : ''}
      ${isAdmin() ? `<button class="btn primary" data-act="mkUsar" data-id="${it.id}" data-v="${r.med}" style="width:100%;margin-top:12px">${icon('check')}Usar ${fmtM(r.med)} como mercado</button>` : ''}</div>` : ''}
  </div>`;
}
function openMercado(id) { const it = getItem(id); if (!it) return; const el = pushScreen('Estudio de mercado', mkHtml(it)); el.dataset.mk = id; }
function refreshMercado(id) { const el = $$('.push').reverse().find(x => x.dataset.mk === id); if (!el) return; const pb = $('.pbody', el), sc = pb.scrollTop; pb.innerHTML = mkHtml(getItem(id)); pb.scrollTop = sc; }
ACT.mercado = d => openMercado(d.id);
ACT.mkAdd = d => {
  const it = getItem(d.id), p = money($('#mk-p').value); if (!p) { toast('Escribe el precio del aviso', 'warn'); return; }
  const g = id => ($('#' + id) || { value: '' }).value.trim(), u = g('mk-u');
  const c = { f: g('mk-f').slice(0, 30), p, a: +g('mk-a').replace(/\D/g, '') || null, km: +g('mk-k').replace(/\D/g, '') || null, m2: +g('mk-m').replace(/\D/g, '') || null, u: /^https?:\/\//.test(u) ? u.slice(0, 300) : '', t: TODAY, por: ME.nombre };
  it.comps = [...(it.comps || []), c].slice(-12); refreshMercado(it.id); toast('Aviso agregado', 'check');
};
ACT.mkRm = d => { const it = getItem(d.id); it.comps.splice(+d.i, 1); refreshMercado(it.id); };
ACT.mkUsar = d => { const it = getItem(d.id); it.mercado = +d.v; toast(`Precio de mercado: ${fmt(it.mercado)}`); refreshMercado(it.id); renderAll(); };
['mkAdd', 'mkRm'].forEach(a => WRITE_ACTS.add(a)); ADMIN_ACTS.add('mkUsar');
