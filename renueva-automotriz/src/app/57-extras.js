/* ---------------- fichas para el vidrio de todo el stock en un solo PDF ----------------
   Una hoja por ítem disponible, lista para imprimir. */
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
try { localStorage.removeItem('gestix_indic'); } catch (e) { }
