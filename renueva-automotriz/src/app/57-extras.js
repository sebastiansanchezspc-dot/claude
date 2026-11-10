/* ---------------- extras que ahorran trabajo ----------------
   1) Fichas para el vidrio de todo el stock en un solo PDF (una hoja por ítem, lista para imprimir).
   2) Indicadores del día en el Panel (UF, dólar y UTM), que se miran a diario para financiar y arrendar. */

/* ---------- 1) fichas para el vidrio, todas juntas ---------- */
ACT.fichasPdf = async () => {
  const w = W(), l = activos(w.key).filter(i => i.aprob !== 'pendiente' && (w.key === 'tienda' || i.estado !== 'taller')).slice(0, 60);
  if (!l.length) { toast('No hay ' + w.itemMany.toLowerCase() + ' disponibles para imprimir', 'warn'); return; }
  toast(`Preparando ${l.length} ${l.length === 1 ? 'ficha' : 'fichas'}…`, 'download');
  try {
    const { jsPDF } = await import('jspdf'); await pubFonts();
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }), pr = pubPrefs(), yo = miEquipo(w.key), c = document.createElement('canvas');
    // mismos datos de contacto y color que usa la pantalla de publicación
    const o = { fmt: 'vidrio', tpl: '', foto: 0, tag: '', color: pr.color || PREFS.accent[w.key] || w.accent, vend: pr.vend || (yo && yo.nombre) || ME.nombre || '', fono: pr.fono || (yo && yo.fono) || '' };
    for (let k = 0; k < l.length; k++) {
      await pubRender(c, l[k], { ...o, precio: !!l[k].precio });
      if (k) doc.addPage();
      doc.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      if (k % 4 === 3) await new Promise(r => setTimeout(r, 0));   // deja respirar la pantalla en celulares lentos
    }
    const f = new File([doc.output('blob')], `fichas-vidrio-${mkSlug(orgNombre())}-${w.key}.pdf`, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Fichas para el vidrio' }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    pubDescargar(f); toast(`${l.length} ${l.length === 1 ? 'ficha lista' : 'fichas listas'} en PDF`, 'download');
  } catch (e) { console.error(e); toast('No se pudo crear el PDF', 'warn'); }
};
// botón al final de la lista del stock
function fichasBtn(w) {
  if (w.key === 'tienda' || !canWrite() || !activos(w.key).length) return '';
  return `<button class="btn ghost small" data-act="fichasPdf" style="align-self:center">${icon('doc', 15)}Fichas para el vidrio de todo el stock (PDF)</button>`;
}

/* ---------- 2) indicadores del día ---------- */
// se piden una vez al día a mindicador.cl (fuente: Banco Central) y quedan guardados en el equipo
let INDIC = null;
try { const g = JSON.parse(localStorage.getItem('gestix_indic') || 'null'); if (g && g.uf) INDIC = g; } catch (e) { }
function indicHtml() {
  if (!INDIC || !INDIC.uf) return '<div id="indic" hidden></div>';
  const n = (v, d = 0) => '$' + Number(v).toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d });
  const l = [['UF', n(INDIC.uf, 2)], INDIC.dolar && ['Dólar', n(INDIC.dolar)], INDIC.utm && ['UTM', n(INDIC.utm)]].filter(Boolean);
  return `<div id="indic" class="indic" aria-label="Indicadores del día">${l.map(([k, v]) => `<span><small>${k}</small><b>${v}</b></span>`).join('')}<em>${INDIC.dia === TODAY ? 'hoy' : fechaCL(INDIC.dia).slice(0, 5)}</em></div>`;
}
async function indicCargar() {
  if (INDIC && INDIC.dia === TODAY) return;
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch('https://mindicador.cl/api', { signal: ctl.signal }); clearTimeout(t); if (!r.ok) return;
    const j = await r.json(), v = k => j[k] && typeof j[k].valor === 'number' ? j[k].valor : null; if (!v('uf')) return;
    INDIC = { dia: TODAY, uf: v('uf'), dolar: v('dolar'), utm: v('utm') };
    try { localStorage.setItem('gestix_indic', JSON.stringify(INDIC)); } catch (e) { }
    const el = document.getElementById('indic'); if (el) el.outerHTML = indicHtml();
  } catch (e) { /* sin conexión: se muestran los últimos guardados, o nada */ }
}
setTimeout(indicCargar, 1500);
