/* =====================================================================
   RESULTADO DEL MES: el detalle de la utilidad neta del Panel.
   Ventas (con su utilidad: precio − costo − comisión del vendedor
   + comisión de la financiera) menos los gastos del mes (los fijos
   cuentan todos los meses desde que se registraron).
   ===================================================================== */
function openResultado() {
  const w = W(), mk = MK(), st = monthStats(w.key, mk), vs = ventasOf(w.key, mk).slice().sort((a, b) => b.fecha.localeCompare(a.fecha)), gs = gastosMes(w.key, mk).slice().sort((a, b) => b.monto - a.monto);
  const fijos = gs.filter(g => g.fijo), varios = gs.filter(g => !g.fijo), auto = w.key === 'auto';
  const fila = (ic, t, s, monto, act, id, neg) => `<button class="row" ${act ? `data-act="${act}" data-id="${id}"` : ''}><span class="thumb">${icon(ic, 20)}</span><span class="rm"><p class="rt">${t}</p><p class="rs">${s}</p></span><span class="rr"><span class="p" style="color:${neg ? 'var(--bad)' : monto >= 0 ? 'var(--good)' : 'var(--bad)'}">${neg ? '−' : monto >= 0 ? '+' : '−'}${fmtM(Math.abs(monto))}</span></span></button>`;
  const ventaS = v => { const it = getItem(v.itemId); const partes = [fechaCorta(v.fecha), auto ? `precio ${fmtM(v.ingreso)}` : `ingreso ${fmtM(v.ingreso)}`]; if (auto && v.costo) partes.push(`costo ${fmtM(v.costo)}`); if (comision(v)) partes.push(`comisión ${fmtM(comision(v))}`); if (comFin(v)) partes.push(`financiera +${fmtM(comFin(v))}`); return { t: clean(it ? shortName(it.nombre) : v.cliente || 'Venta'), s: partes.join(' · ') }; };
  const html = `<div class="px" style="padding-top:6px;display:flex;flex-direction:column;gap:16px">
    <div class="card res-top"><span class="kicker">Utilidad neta · ${mesDe(mk)}</span><span class="num res-big" style="color:${st.neta < 0 ? 'var(--bad)' : 'var(--fg)'}">${st.neta < 0 ? '−' : ''}${fmtM(Math.abs(st.neta))}</span>
      <div class="res-eq"><div><span>${auto ? 'Utilidad de ventas' : 'Margen de ventas'}</span><b style="color:var(--good)">+${fmtM(st.bruta)}</b></div><i>−</i><div><span>Gastos del mes</span><b style="color:var(--bad)">${fmtM(st.gastos)}</b></div><i>=</i><div><span>Neta</span><b>${st.neta < 0 ? '−' : ''}${fmtM(Math.abs(st.neta))}</b></div></div>
      ${st.neta < 0 && !vs.length ? `<div class="tip" style="margin-top:12px">${icon('sparkle')}<span>Aún no hay ventas este mes, así que solo se descuentan los gastos${fijos.length ? ` (${fijos.length} fijos que se repiten cada mes)` : ''}. Al registrar ventas, la utilidad sube.</span></div>` : ''}</div>
    <div><div class="sec" style="margin:0 0 10px"><span class="kicker">Ventas · ${vs.length}</span><span class="num" style="font-size:14px;color:var(--good)">+${fmtM(st.bruta)}</span></div>
      <div class="card tight">${vs.length ? vs.map(v => { const x = ventaS(v); return fila(w.icon, x.t, x.s, utilidad(v), 'venta', v.id); }).join('') : `<div class="empty">${icon(w.icon, 28)}<p>Sin ventas en ${mesDe(mk).toLowerCase()}.</p></div>`}</div></div>
    <div><div class="sec" style="margin:0 0 10px"><span class="kicker">Gastos · ${gs.length}</span><span class="num" style="font-size:14px;color:var(--bad)">−${fmtM(st.gastos)}</span></div>
      <div class="card tight">${gs.length ? [...fijos, ...varios].map(g => fila(CAT_ICON[g.cat] || 'receipt', clean(g.concepto), `${g.cat || 'Gasto'} · ${g.fijo ? `fijo, cada mes desde ${fechaCorta(g.fecha)}` : fechaCorta(g.fecha)}`, g.monto, 'gasto', g.id, true)).join('') : `<div class="empty">${icon('receipt', 28)}<p>Sin gastos en ${mesDe(mk).toLowerCase()}.</p></div>`}</div>
      ${gs.length ? `<button class="btn ghost small" data-act="gastos" style="width:100%;margin-top:10px">${icon('receipt', 15)}Ver y editar gastos</button>` : ''}</div>
    <button class="btn primary" data-act="cierre">${icon('doc')}Cierre del mes completo (caja y stock)</button>
    <p style="font-size:12px;color:var(--fg3);line-height:1.5">${auto ? 'La utilidad de cada venta es el precio menos el costo de compra y reacondicionamiento, menos la comisión del vendedor, más la comisión que paga la financiera.' : 'El margen de cada venta descuenta el costo y la comisión del vendedor.'} Los gastos fijos se cuentan todos los meses desde que se registraron; si alguno ya no corre, desmárcalo como fijo o bórralo.</p>
  </div>`;
  pushScreen('Resultado del mes', html);
}
ACT.resultado = () => { if (isVend()) return; openResultado(); };
