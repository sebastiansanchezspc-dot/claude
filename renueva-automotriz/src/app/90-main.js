/* =====================================================================
   ARRANQUE
   ===================================================================== */
(async function boot() {
  $$('.screen').forEach(sc => sc.addEventListener('scroll', () => { const h = $('.hd', sc); if (h) h.classList.toggle('compact', sc.scrollTop > (h.classList.contains('compact') ? 24 : 52)); }, { passive: true }));
  $('#app').hidden = true;
  if (!window.RV || RV.mode === 'demo') {
    loadData(demoData()); USUARIOS.push(...DEMO_USERS.map(u => ({ ...u })));
    ORG.nombre = 'Automotora Los Andes'; PREFS.logo = DEMO_LOGO;
    renderLobby(); $('#lobby').classList.remove('out');
    return;
  }
  renderGate('cargando');
  try {
    const st = await RV.init();
    if (st.gate) { gate.ctx = st.ctx || null; gate.user = st.user || null; renderGate(st.gate); if (st.error) { gate.err = st.error; renderGate(); } return; }
    gate.view = 'app'; startCloud(st);
  } catch (e) { console.error(e); gate.err = traducir(e.message); renderGate('error'); gate.err = traducir(e.message); renderGate(); }
})();
