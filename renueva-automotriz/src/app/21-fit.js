/* ---------------- cifras que siempre caben ----------------
   Un monto largo ($122.300.000) no debe montarse con el dato de al lado ni salirse de su tarjeta.
   Cada vez que cambia la pantalla, las cifras que no caben en su celda se achican lo justo. */
const FIT_SEL = '.odo, .stat3 .v, .num, .fit';
function ajustarCifras(root = document) {
  const els = [...root.querySelectorAll(FIT_SEL)].filter(e => e.offsetParent !== null && !(e.classList.contains('num') && e.querySelector('.odo')));
  els.forEach(e => { if (e.dataset.fit) { e.style.fontSize = ''; delete e.dataset.fit; } });   // parte del tamaño original (por si ahora sí cabe)
  // primero se mide todo y después se escribe, para no forzar un recálculo por cada cifra
  const med = els.map(e => {
    let caja = e.parentElement; while (caja && getComputedStyle(caja).display.startsWith('inline')) caja = caja.parentElement;
    if (!caja) return null; const cs = getComputedStyle(caja), libre = caja.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const pide = e.classList.contains('odo') ? e.getBoundingClientRect().width : e.scrollWidth;
    return libre > 20 && pide > libre + 1 ? [e, Math.max(.5, libre / pide) * parseFloat(getComputedStyle(e).fontSize)] : null;
  });
  med.forEach(m => { if (m) { m[0].style.fontSize = Math.floor(m[1]) + 'px'; m[0].dataset.fit = '1'; } });
}
(() => {
  let pend = false; const ya = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; ajustarCifras(); }); };
  const ini = () => { const sh = document.getElementById('shell') || document.body; new MutationObserver(ya).observe(sh, { childList: true, subtree: true }); addEventListener('resize', ya); if (document.fonts && document.fonts.ready) document.fonts.ready.then(ya); ya(); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', ini) : ini();
})();
