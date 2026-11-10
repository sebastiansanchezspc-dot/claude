/* =====================================================================
   CIERRE DEL MES: resultado (utilidad), flujo de caja (lo que entró y lo
   que salió, incluidas las compras de stock) y capital invertido en stock.
   Se puede enviar en PDF (al dueño, socio o contador).
   La utilidad cuenta el costo de cada auto cuando se vende; la caja cuenta
   la plata cuando sale (al comprar). Por eso se muestran por separado.
   ===================================================================== */
function cierreDatos(w, mk) {
  const st = monthStats(w, mk), vs = ventasOf(w, mk), gs = gastosMes(w, mk);
  let cobrado = 0, porCobrar = 0, pp = 0;
  vs.forEach(v => v.pagos.forEach(p => { if (p.pp) pp += p.a; else if (p.s === 'cobrado') cobrado += p.a; else porCobrar += p.a; }));
  // compras del mes: lo que ingresó al stock (lo recibido en parte de pago no sale de caja: se pagó con el auto del cliente)
  const compras = w === 'tienda' ? [] : itemsOf(w).filter(it => (it.ingreso || '').startsWith(mk) && w === 'auto');
  const comprasCaja = compras.filter(it => !it.partePago), sumCompras = sum(comprasCaja, it => (+it.costo || 0) + (+it.recon || 0));
  const gastos = sum(gs, g => g.monto), comisiones = sum(vs, comision);
  const salidas = sumCompras + gastos + comisiones, saldo = cobrado - salidas;
  // capital en stock: lo que hoy está sin vender
  const stock = activos(w).filter(it => it.aprob !== 'pendiente' || w === 'auto');
  const invertido = w === 'auto' ? sum(stock, it => (+it.costo || 0) + (+it.recon || 0)) : w === 'tienda' ? sum(stock, it => (+it.costoU || 0) * (+it.stock || 0)) : 0;
  const conPrecio = stock.filter(it => it.precio > 0), esperada = w === 'auto' ? sum(conPrecio, it => it.precio - (+it.costo || 0) - (+it.recon || 0)) : w === 'tienda' ? sum(stock, it => ((+it.precio || 0) - (+it.costoU || 0)) * (+it.stock || 0)) : 0;
  const dias = stock.length && w !== 'tienda' ? Math.round(sum(stock, it => diasStock(it)) / stock.length) : 0, viejos = w === 'tienda' ? 0 : stock.filter(it => diasStock(it) > 90).length;
  return { st, vs, gs, cobrado, porCobrar, pp, compras, comprasCaja, sumCompras, gastos, comisiones, salidas, saldo, stock, invertido, esperada, dias, viejos, conPrecio };
}
function openCierre() {
  const w = W(), mk = MK(), c = cierreDatos(w.key, mk), auto = w.key === 'auto', m = v => `${v < 0 ? '−' : ''}${fmtM(Math.abs(v))}`;
  // cifras abreviadas para las tres tarjetas de arriba ($10,0 MM / $850 mil)
  const ab = v => { const a = Math.abs(v), t = a >= 1e6 ? '$' + (a / 1e6).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MM' : a >= 1e3 ? '$' + Math.round(a / 1e3) + ' mil' : fmtM(a); return (v < 0 ? '−' : '') + t; };
  const lin = (t, v, col, sub) => `<div class="ci-l"><span>${t}${sub ? `<small>${sub}</small>` : ''}</span><b style="${col ? `color:${col}` : ''}">${v}</b></div>`;
  const html = `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="card ci-hero"><span class="kicker">Cierre de ${mesDe(mk).toLowerCase()} · ${w.name}</span>
      <div class="ci-tres"><div><span>Utilidad</span><b style="color:${c.st.neta < 0 ? 'var(--bad)' : 'var(--good)'}">${ab(c.st.neta)}</b></div><div><span>Caja del mes</span><b style="color:${c.saldo < 0 ? 'var(--bad)' : 'var(--good)'}">${ab(c.saldo)}</b></div><div><span>${auto ? 'En stock' : w.key === 'tienda' ? 'En bodega' : 'Cartera'}</span><b>${w.key === 'prop' ? c.stock.length : ab(c.invertido)}</b></div></div></div>
    <div class="card"><span class="kicker">1 · Resultado (utilidad)</span>
      ${lin(`Ventas del mes`, `${c.vs.length}`, '')}${lin(auto ? 'Utilidad de las ventas' : 'Margen de las ventas', '+' + fmtM(c.st.bruta), 'var(--good)', auto ? 'precio − costo − comisión + financiera' : '')}${lin('Gastos del mes', '−' + fmtM(c.st.gastos), 'var(--bad)')}
      <div class="ci-tot">${lin('Utilidad neta', m(c.st.neta), c.st.neta < 0 ? 'var(--bad)' : 'var(--good)')}</div>
      <button class="btn ghost small" data-act="resultado" style="width:100%;margin-top:10px">${icon('list', 15)}Ver venta por venta</button></div>
    <div class="card"><span class="kicker">2 · Flujo de caja (plata que entró y salió)</span>
      ${lin('Cobrado de ventas', '+' + fmtM(c.cobrado), 'var(--good)')}
      ${auto ? lin(`Compras de stock · ${c.comprasCaja.length}`, '−' + fmtM(c.sumCompras), 'var(--bad)', 'costo de compra y reacondicionamiento') : ''}
      ${lin('Gastos', '−' + fmtM(c.gastos), 'var(--bad)')}${lin('Comisiones de vendedores', '−' + fmtM(c.comisiones), 'var(--bad)')}
      <div class="ci-tot">${lin('Saldo de caja del mes', m(c.saldo), c.saldo < 0 ? 'var(--bad)' : 'var(--good)')}</div>
      ${c.porCobrar ? `<p class="ci-n">${icon('clock', 13)}Además hay ${fmtM(c.porCobrar)} por cobrar de ventas de este mes (créditos y pagos pendientes).</p>` : ''}
      ${c.pp ? `<p class="ci-n">${icon('car', 13)}${fmtM(c.pp)} se recibieron en autos en parte de pago: no es efectivo, quedó en tu stock.</p>` : ''}</div>
    ${w.key === 'prop' ? '' : `<div class="card"><span class="kicker">3 · Capital en ${auto ? 'stock' : 'bodega'} (hoy)</span>
      ${lin(auto ? `Autos sin vender · ${c.stock.length}` : `Productos con stock · ${c.stock.length}`, fmtM(c.invertido), '', auto ? 'lo que pagaste por ellos' : 'a costo')}
      ${lin(auto ? `Utilidad esperada (${c.conPrecio.length} con precio)` : 'Margen esperado', '+' + fmtM(c.esperada), 'var(--good)', 'si se venden al precio publicado')}
      ${auto ? lin('Días promedio en stock', `${c.dias} días`, c.dias > 60 ? 'var(--warn)' : '') : ''}
      ${c.viejos ? `<p class="ci-n" style="color:var(--warn)">${icon('warn', 13)}${c.viejos} ${c.viejos === 1 ? 'auto lleva' : 'autos llevan'} más de 90 días: conviene revisar su precio.</p>` : ''}</div>`}
    <p style="font-size:12px;color:var(--fg3);line-height:1.5">La <b>utilidad</b> descuenta el costo de cada ${w.itemOne.toLowerCase()} cuando se vende; la <b>caja</b> lo descuenta cuando sale la plata (al comprar). Por eso un mes con muchas compras puede tener buena utilidad y caja negativa, y al mes siguiente al revés.</p>
  </div>`;
  pushScreen('Cierre del mes', html, { cta: `<button class="btn primary" data-act="cierrePdf">${icon('share')}Enviar cierre en PDF</button>` });
}
ACT.cierre = () => { if (isVend()) return; openCierre(); };

ACT.cierrePdf = async () => {
  const w = W(), mk = MK(), c = cierreDatos(w.key, mk), auto = w.key === 'auto';
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }), Wd = 210, mg = 18, ink = [21, 23, 26], soft = [110, 106, 98], line = [225, 221, 213], verde = [31, 120, 80], rojo = [179, 38, 30];
    const T = (t, x, y, o) => doc.text(String(t), x, y, o), F = (st, sz) => { doc.setFont('helvetica', st); doc.setFontSize(sz); }, C = col => doc.setTextColor(...col);
    const m = v => `${v < 0 ? '-' : ''}${fmt(Math.abs(v))}`;
    doc.setFillColor(...ink); doc.rect(0, 0, Wd, 32, 'F'); doc.setFillColor(...pdfAcc(w.key)); doc.rect(0, 32, Wd, 1.4, 'F');
    const lg = PREFS.logo ? await acPng(fotoSrc(PREFS.logo)) : null;
    if (lg) { doc.setFillColor(255, 255, 255); doc.roundedRect(mg, 7, 18, 18, 3, 3, 'F'); const k = Math.min(16 / lg.w, 16 / lg.h); doc.addImage(lg.d, 'PNG', mg + 1 + (16 - lg.w * k) / 2, 8 + (16 - lg.h * k) / 2, lg.w * k, lg.h * k, 'logo', 'FAST'); }
    C([255, 255, 255]); F('bold', 14); T(orgNombre(), mg + (lg ? 23 : 0), 16); F('normal', 8); C([190, 190, 190]); T(`CIERRE DE ${mesDe(mk).toUpperCase()} ${mk.slice(0, 4)} · ${w.name.toUpperCase()}`, mg + (lg ? 23 : 0), 23);
    C([255, 255, 255]); F('normal', 8); T('Generado el ' + fechaCL(TODAY), Wd - mg, 16, { align: 'right' });
    let y = 46;
    // tres cifras
    const tres = [['UTILIDAD', m(c.st.neta), c.st.neta < 0 ? rojo : verde], ['CAJA DEL MES', m(c.saldo), c.saldo < 0 ? rojo : verde], [w.key === 'prop' ? 'CARTERA' : 'CAPITAL EN STOCK', w.key === 'prop' ? String(c.stock.length) : fmt(c.invertido), ink]];
    tres.forEach(([t, v, col], i) => { const x = mg + i * 60; doc.setDrawColor(...line); doc.roundedRect(x, y - 8, 56, 22, 3, 3, 'S'); F('normal', 7); C(soft); T(t, x + 4, y - 2); F('bold', 13); C(col); T(v, x + 4, y + 8); });
    y += 26;
    const sec = t => { y += 4; F('bold', 11); C(ink); T(t, mg, y); y += 3; doc.setDrawColor(...line); doc.line(mg, y, Wd - mg, y); y += 6; };
    const fila = (t, v, col, sub, neg) => { if (y > 270) { doc.addPage(); y = 20; } F('normal', 9.5); C(ink); T(t, mg, y); if (sub) { F('normal', 7.5); C(soft); T(sub, mg, y + 4); } F('bold', 9.5); C(col || ink); T(v, Wd - mg, y, { align: 'right' }); y += sub ? 9 : 7; };
    const total = (t, v, col) => { doc.setDrawColor(...ink); doc.line(mg, y - 3, Wd - mg, y - 3); F('bold', 10.5); C(ink); T(t, mg, y + 2); C(col); T(v, Wd - mg, y + 2, { align: 'right' }); y += 10; };
    sec('1. Resultado (utilidad)');
    fila(`Ventas del mes: ${c.vs.length}`, '', ink);
    c.vs.forEach(v => { const it = getItem(v.itemId); fila(`   ${it ? shortName(it.nombre) : v.cliente || 'Venta'} · ${fechaCL(v.fecha)}`, '+' + fmt(utilidad(v)), verde, auto ? `   precio ${fmt(v.ingreso)} · costo ${fmt(v.costo || 0)} · comisión ${fmt(comision(v))}${comFin(v) ? ' · financiera +' + fmt(comFin(v)) : ''}` : ''); });
    fila(auto ? 'Utilidad de las ventas' : 'Margen de las ventas', '+' + fmt(c.st.bruta), verde);
    fila('Gastos del mes', '-' + fmt(c.st.gastos), rojo);
    c.gs.forEach(g => fila(`   ${g.concepto}${g.fijo ? ' (fijo)' : ''}`, '-' + fmt(g.monto), soft));
    total('Utilidad neta', m(c.st.neta), c.st.neta < 0 ? rojo : verde);
    sec('2. Flujo de caja');
    fila('Cobrado de ventas', '+' + fmt(c.cobrado), verde);
    if (auto) { fila(`Compras de stock: ${c.comprasCaja.length}`, '-' + fmt(c.sumCompras), rojo, 'costo de compra y reacondicionamiento'); c.comprasCaja.forEach(it => fila(`   ${shortName(it.nombre)} · ingresó ${fechaCL(it.ingreso)}`, '-' + fmt((+it.costo || 0) + (+it.recon || 0)), soft)); }
    fila('Gastos', '-' + fmt(c.gastos), rojo); fila('Comisiones de vendedores', '-' + fmt(c.comisiones), rojo);
    total('Saldo de caja del mes', m(c.saldo), c.saldo < 0 ? rojo : verde);
    if (c.porCobrar) fila('Por cobrar de ventas del mes', fmt(c.porCobrar), soft);
    if (c.pp) fila('Recibido en autos en parte de pago (no es efectivo)', fmt(c.pp), soft);
    if (w.key !== 'prop') {
      sec(`3. Capital en ${auto ? 'stock' : 'bodega'} (al ${fechaCL(TODAY)})`);
      fila(auto ? `Autos sin vender: ${c.stock.length}` : `Productos con stock: ${c.stock.length}`, fmt(c.invertido), ink, auto ? 'lo pagado por ellos' : 'a costo');
      fila(auto ? 'Utilidad esperada al precio publicado' : 'Margen esperado', '+' + fmt(c.esperada), verde);
      if (auto) fila('Días promedio en stock', `${c.dias} días`, ink);
    }
    y += 4; F('normal', 7.5); C(soft);
    doc.splitTextToSize('La utilidad descuenta el costo de cada unidad cuando se vende; la caja lo descuenta cuando sale la plata (al comprar). Documento de gestión interna, no reemplaza la contabilidad.', Wd - mg * 2).forEach(l => { T(l, mg, y); y += 4; });
    const n = doc.getNumberOfPages(); for (let p = 1; p <= n; p++) { doc.setPage(p); F('normal', 7); C(soft); T(`${orgNombre()} · Cierre de ${mesDe(mk).toLowerCase()} · Gestix`, mg, 290); T(`Página ${p} de ${n}`, Wd - mg, 290, { align: 'right' }); }
    const f = new File([doc.output('blob')], `cierre-${mkSlug(orgNombre())}-${mk}-${w.key}.pdf`, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: `Cierre de ${mesDe(mk).toLowerCase()}` }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    pubDescargar(f); toast('Cierre descargado en PDF', 'download');
  } catch (e) { console.error(e); toast('No se pudo crear el PDF', 'warn'); }
};
