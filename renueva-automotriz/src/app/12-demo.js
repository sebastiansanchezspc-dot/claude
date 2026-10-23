/* =====================================================================
   DATOS DE EJEMPLO — para el modo demo y para empresas que eligen
   "empezar con ejemplos". Se arman con fecha base 23-10-2026 y luego se
   corren al día de hoy.
   ===================================================================== */
function demoData() {
  const D0 = '2026-10-23T14:30';
  const ago = m => { const d = new Date(D0 + ':00'); d.setMinutes(d.getMinutes() - m); return isoDT(d); };
  const LD = (id, w, n, f, i, o, e, min, ...r) => L(id, w, n, f, i, o, e, ago(min), ...r);
  /* ---------------- ítems ---------------- */
  const mkAuto = r => ({
    id: r[0], w: 'auto', nombre: r[1], sku: r[2], estado: r[14], costo: r[9], recon: r[10], precio: r[11], mercado: r[12], ingreso: r[13],
    specs: { marca: r[3], modelo: r[4], anio: r[5], km: r[6], color: r[7], tipo: r[8] },
    permiso: { pagadas: r[15], venc: r[16] }, rev: r[17], soap: r[18], pubs: r[19].split(''),
    fotos: [], notas: r[20] || '', prov: r[21] || { n: 'Particular', f: '+56 9 7000 1122' }, gestor: r[22] || 'Marcela Fuentes', reservaVenc: r[23] || null,
  });
  const AUTOS_RAW = [
    ['a1','Chevrolet Sail 2019','BKTS·41','Chevrolet','Sail',2019,38200,'Gris plata','Sedán',9800000,250000,12500000,12900000,'2026-08-02','vendido',2,'2027-03-31','2027-01-15','2027-03-31','cy','Único dueño, mantenciones en concesionario al día.'],
    ['a2','Toyota Hilux 2021','XZPL·77','Toyota','Hilux',2021,61000,'Blanco','Pickup',23500000,480000,27900000,26900000,'2026-06-18','disponible',1,'2026-11-02','2027-01-20','2026-11-05','cym','Uso de trabajo pesado. Neumáticos nuevos hace 3 meses.',{n:'Leasing Austral',f:'+56 2 2456 7890'},'Ignacio Torres'],
    ['a3','Suzuki Swift 2017','LKPR·90','Suzuki','Swift',2017,72400,'Rojo','Hatchback',5900000,180000,7200000,7000000,'2026-05-10','vendido',2,'2027-03-31','2027-02-10','2027-03-31','cy','Vendido a particular.'],
    ['a4','Hyundai Tucson 2020','HGBT·26','Hyundai','Tucson',2020,44100,'Negro','SUV',15200000,320000,18900000,19100000,'2026-09-28','disponible',2,'2027-03-31','2027-04-12','2027-03-31','cyfm','Full equipo, cámara de retroceso.'],
    ['a5','Kia Morning 2018','DSFV·58','Kia','Morning',2018,53000,'Amarillo','Hatchback',5400000,150000,6900000,6600000,'2026-08-20','disponible',2,'2027-03-31','2026-12-01','2027-03-31','cy','Ideal primer auto. Precio sobre mercado.',{n:'Particular',f:'+56 9 8811 2233'},'Marcela Fuentes'],
    ['a6','Nissan Qashqai 2019','RZCW·73','Nissan','Qashqai',2019,49800,'Azul','SUV',13100000,280000,16400000,16200000,'2026-10-02','reservado',2,'2027-03-31','2027-02-01','2027-03-31','cyfm','Reservado por cliente con crédito en trámite.',{n:'Automotora Sur',f:'+56 9 8123 4455'},'Marcela Fuentes','2026-10-26'],
    ['a7','Mazda CX-5 2022','TJGP·19','Mazda','CX-5',2022,28900,'Gris grafito','SUV',21000000,0,24900000,24500000,'2026-10-15','taller',0,'2026-10-28','2027-05-01','2026-12-31','','En preparación: pulido y cambio de pastillas.',{n:'Leasing Austral',f:'+56 2 2456 7890'},'Ignacio Torres'],
    ['a8','Peugeot 208 2020','CBLD·84','Peugeot','208',2020,58200,'Blanco','Hatchback',7900000,220000,9800000,9200000,'2026-07-25','disponible',2,'2027-03-31','2026-11-28','2027-03-31','cy','Precio sobre mercado, evaluar baja.'],
    ['a9','Ford Ranger 2018','FKYV·32','Ford','Ranger',2018,92500,'Rojo','Pickup',14400000,410000,17500000,17000000,'2026-09-05','disponible',2,'2027-03-31','2026-10-30','2027-03-31','cym','Revisión técnica por vencer.'],
    ['a10','Subaru XV 2019','PWSH·67','Subaru','XV',2019,61300,'Verde','SUV',12200000,300000,14900000,14600000,'2026-08-14','vendido',2,'2027-03-31','2027-03-02','2027-03-31','cyf'],
    ['a11','Toyota Yaris 2018','XRTD·45','Toyota','Yaris',2018,66000,'Plata','Hatchback',7300000,190000,8900000,8800000,'2026-07-30','vendido',2,'2027-03-31','2027-01-10','2027-03-31','cy'],
    ['a12','Volkswagen Gol 2017','ZSBK·12','Volkswagen','Gol',2017,81000,'Blanco','Hatchback',4400000,120000,5500000,5400000,'2026-08-18','vendido',2,'2027-03-31','2026-12-20','2027-03-31','y'],
  ];
  const mkProp = r => ({
    id: r[0], w: 'prop', nombre: r[1], sku: r[2], estado: r[3], precio: r[4], ingreso: r[21], visitas: r[6], visitas14: r[7], mandato: r[8], op: r[9],
    specs: { operacion: r[9], tipo: r[10], direccion: r[11], comuna: r[12], m2c: r[13], m2t: r[14], dorm: r[15], banos: r[16] },
    docs: { dominio: r[17], grav: r[18], contrib: r[19] }, pubs: r[20].split(''), fotos: [], notas: r[24] || '', dueno: r[22] || 'Propietario particular', gestor: r[23] || 'Camila Rojas',
    costo: 0, recon: 0, mercado: null,
  });
  const PROPS_RAW = [
    ['p1','Depto 3D · Providencia','004-112','disponible',135000000,null,22,6,'2026-11-15','Venta','Departamento','Av. Pedro de Valdivia 1532','Providencia',68,'-',2,2,'2026-12-10','2026-11-18',true,'cy','2026-04-01','Sra. Elena Ruiz'],
    ['p2','Casa Ñuñoa','118-430','arrendado',650000,null,14,0,'2027-09-30','Arriendo','Casa','San Eugenio 845','Ñuñoa',120,180,3,2,'2027-02-01','2027-01-10',true,'cy','2026-02-14','Sr. Andrés Pino'],
    ['p3','Casa La Reina','205-017','disponible',289000000,null,9,5,'2026-12-15','Venta','Casa','Av. Larraín 7210','La Reina',210,540,4,3,'2027-02-01','2027-01-05',true,'cym','2026-09-10','Familia Bravo'],
    ['p4','Oficina Las Condes','330-092','disponible',1200000,null,4,2,'2027-01-10','Arriendo','Oficina','Apoquindo 4500, of. 802','Las Condes',85,'-',0,2,'2027-03-01','2027-02-10',true,'cy','2026-10-05','Inversiones Alto'],
    ['p5','Depto Santiago Centro','071-308','disponible',62000000,null,3,0,'2026-11-30','Venta','Departamento','Av. Santa Isabel 840','Santiago',48,'-',1,1,'2026-11-20','2026-10-01',false,'y','2026-07-30','Sr. Héctor Lara'],
    ['p6','Parcela Pirque','441-210','reservado',98000000,null,11,2,'2026-12-20','Venta','Parcela','Camino El Principal 1200','Pirque',140,5000,3,2,'2027-01-15','2026-12-30',true,'cym','2026-06-01','Sra. Marta Gómez'],
    ['p7','Depto Ñuñoa 2D','096-211','vendido',94000000,null,18,0,'2026-12-01','Venta','Departamento','Irarrázaval 3400','Ñuñoa',62,'-',2,1,'2027-01-01','2027-01-01',true,'cy','2026-07-01'],
    ['p8','Local comercial Providencia','019-540','disponible',2400000,null,2,2,'2027-01-31','Arriendo','Local','Av. Providencia 2250','Providencia',60,'-',0,1,'2027-02-15','2027-01-20',true,'cym','2026-10-12','Comercial Vega'],
    ['p9','Depto Macul','152-088','vendido',78000000,null,12,0,'2026-09-01','Venta','Departamento','Av. Macul 5600','Macul',55,'-',2,1,'2027-01-01','2027-01-01',true,'cy','2026-06-15'],
    ['p10','Depto Santiago Sur','060-411','vendido',55000000,null,9,0,'2026-10-01','Venta','Departamento','Gran Avenida 4200','San Miguel',45,'-',2,1,'2027-01-01','2027-01-01',true,'cy','2026-08-20'],
  ];
  // retail: [id, nombre, sku, marca, categoria, variante, stock, minimo, costoU, precio, ultimaVenta, ventas30]
  const mkTienda = r => ({
    id: r[0], w: 'tienda', nombre: r[1], sku: r[2], estado: r[6] === 0 ? 'agotado' : 'disponible', costoU: r[8], precio: r[9], stock: r[6], stockInicial: r[12], minimo: r[7], ultimaVenta: r[10], ventas30: r[11],
    specs: { marca: r[3], categoria: r[4], variante: r[5] }, costo: r[8] * r[12], recon: 0, mercado: null, ingreso: r[13], fotos: [], notas: r[14] || '', prov: { n: r[15], f: '+56 2 2998 7766' }, gestor: '—', pubs: [],
  });
  const TIENDA_RAW = [
    ['t1','Zapatillas Nike Air Max','NK-AM-42','Nike','Calzado','Talla 42',18,10,52000,89900,'2026-10-23',24,30,'2026-09-01','Reposición mensual, alta rotación.','Distribuidora Deportiva'],
    ['t2','Jockey New Era','NE-JK-01','New Era','Accesorios','Única',0,8,9500,19900,'2026-10-14',16,24,'2026-07-22','Agotado, pedido de reposición enviado.','Distribuidora Deportiva'],
    ['t3','Polera Oversize Negra','PO-OV-NG','Basic','Ropa','Talla M',4,12,7000,29900,'2026-10-22',38,50,'2026-09-15','Bajo el mínimo: reponer esta semana.','Textiles Andes'],
    ['t4','Mochila Urbana 25L','MU-25-GR','Urban','Accesorios','Gris',35,6,21000,44900,'2026-08-30',4,40,'2026-06-10','Sin movimiento hace semanas. Evaluar liquidación.','Importadora Sur'],
    ['t5','Botella Térmica 750ml','BT-750-AC','Thermo','Hogar','Acero',22,10,6800,15900,'2026-10-23',27,40,'2026-09-20','','Importadora Sur'],
    ['t6','Gorro de Lana','GL-LN-AZ','Basic','Accesorios','Azul',60,10,5200,12900,'2026-07-12',2,80,'2026-05-04','Stock muerto: más de 100 días sin venta.','Textiles Andes'],
    ['t7','Audífonos Bluetooth','AB-BT-02','Sonic','Tecnología','Negro',9,8,19800,39900,'2026-10-21',14,30,'2026-09-28','','Tecno Mayorista'],
    ['t8','Cinturón de Cuero','CC-CU-CF','Cuero Sur','Accesorios','Café',2,6,10500,24900,'2026-10-19',9,20,'2026-08-12','Quiebre inminente.','Cuero Sur'],
  ];
  const STOCK = [...AUTOS_RAW.map(mkAuto), ...PROPS_RAW.map(mkProp), ...TIENDA_RAW.map(mkTienda)];

  /* ---------------- ventas / operaciones ---------------- */
  // pago: m=método, a=monto, s='cobrado'|'pendiente', v=vencimiento
  const VENTAS = [
    V('v1','auto','a1','2026-10-22','Javiera Molina','+56 9 8877 6655','Marcela Fuentes',12500000,12500000,10050000,'pct',2,[{m:'Transferencia',a:12500000,s:'cobrado'}],{tramite:'ok'}),
    V('v2','auto','a3','2026-10-15','Nicolás Bravo','+56 9 7766 5544','Ignacio Torres',7200000,7200000,6080000,'monto',150000,[{m:'Efectivo',a:2000000,s:'cobrado'},{m:'Transferencia',a:5200000,s:'cobrado'}],{tramite:'pendiente'}),
    V('v3','auto','a10','2026-10-08','Camila Díaz','+56 9 6655 4433','Marcela Fuentes',14900000,14900000,12500000,'pct',2,[{m:'Crédito automotriz',a:10000000,s:'pendiente',v:'2026-10-29',fin:'forum',cr:'aprobado'},{m:'Transferencia',a:4900000,s:'cobrado'}],{tramite:'ok'}),
    V('v4','auto','a11','2026-09-17','Hernán Pizarro','+56 9 5544 3322','Ignacio Torres',8900000,8900000,7490000,'monto',150000,[{m:'Cheque',a:1400000,s:'pendiente',v:'2026-10-27'},{m:'Crédito automotriz',a:3500000,s:'cobrado',fin:'sconsumer',cr:'cursado'},{m:'Efectivo',a:4000000,s:'cobrado'}],{tramite:'ok'}),
    V('v5','auto','a12','2026-09-05','Rosa Aravena','+56 9 4433 2211','Marcela Fuentes',5500000,5500000,4520000,'pct',2,[{m:'Crédito automotriz',a:4000000,s:'cobrado',fin:'autofin',cr:'cursado'},{m:'Transferencia',a:1500000,s:'cobrado'}],{tramite:'ok'}),
    V('o1','prop','p7','2026-10-12','Familia Ortega','+56 9 3322 1100','Camila Rojas',3760000,94000000,0,'pct',40,[{m:'Transferencia',a:3760000,s:'cobrado'}],{op:'Venta · escritura firmada'}),
    V('o2','prop','p2','2026-10-01','Sr. Andrés Pino','+56 9 2211 0099','Diego Vera',650000,650000,0,'pct',40,[{m:'Transferencia',a:650000,s:'cobrado'}],{op:'Arriendo · 1 mes de honorario'}),
    V('o3','prop','p10','2026-10-20','Daniela Soto','+56 9 1100 9988','Diego Vera',2200000,55000000,0,'pct',40,[{m:'Vale vista',a:1100000,s:'cobrado'},{m:'Transferencia',a:1100000,s:'pendiente',v:'2026-10-30'}],{op:'Venta · escritura firmada'}),
    V('o4','prop','p9','2026-09-14','Pedro Alarcón','+56 9 0099 8877','Camila Rojas',3120000,78000000,0,'pct',40,[{m:'Transferencia',a:3120000,s:'cobrado'}],{op:'Venta · escritura firmada'}),
  ];
  // tickets de tienda (generados de forma determinista)
  (function genTickets() {
    let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const tiendaItems = STOCK.filter(s => s.w === 'tienda');
    const pesos = [3, 1, 3, 1, 3, 1, 2, 2];
    const bag = []; tiendaItems.forEach((it, i) => { for (let k = 0; k < pesos[i]; k++) bag.push(it); });
    const metodos = ['Efectivo', 'Débito', 'Débito', 'Tarjeta de crédito', 'Transferencia'];
    const vends = ['Valentina Soto', 'Matías Pino'];
    let n = 0;
    for (let k = 75; k >= 0; k--) {
      const d = k === 0 ? 23 : 0, fecha = addDaysFrom('2026-10-23', -k);
      const cant = k === 0 ? 6 : 2 + Math.floor(rnd() * 3);
      for (let t = 0; t < cant; t++) {
        const it = bag[Math.floor(rnd() * bag.length)];
        const q = 1 + Math.floor(rnd() * 7);
        const hora = d === 23 ? [9, 10, 11, 12, 14, 16][t] : 9 + Math.floor(rnd() * 9);
        const ingreso = it.precio * q * (q >= 5 ? 0.92 : 1);
        const metodo = metodos[Math.floor(rnd() * metodos.length)];
        VENTAS.push(V('t' + (++n), 'tienda', it.id, fecha, 'Cliente mostrador', '', vends[Math.floor(rnd() * 2)], Math.round(ingreso), Math.round(ingreso), it.costoU * q, 'pct', 3, [{ m: metodo, a: Math.round(ingreso), s: 'cobrado' }], { q, hora }));
      }
    }
  })();

  /* ---------------- gastos / equipo / leads ---------------- */
  const GASTOS = [
    G('g1','auto','Arriendo patio de ventas','Arriendo',900000,'2026-08-05',true,'Pago a cuenta del propietario.'), G('g2','auto','Sueldos administrativos','Sueldo',1100000,'2026-08-01',true),
    G('g3','auto','Luz, agua e internet','Servicios',220000,'2026-08-08',true), G('g4','auto','Avisos Chileautos + Instagram Ads','Marketing',180000,'2026-10-12',false,'Promoción SUV.'), G('g5','auto','Lavado y pulido (proveedor)','Mantención',80000,'2026-10-15',false),
    G('g6','prop','Arriendo oficina','Arriendo',700000,'2026-08-05',true), G('g7','prop','Sueldos administrativos','Sueldo',900000,'2026-08-01',true),
    G('g8','prop','Portal Inmobiliario + Yapo','Marketing',320000,'2026-08-10',true), G('g9','prop','Fotografía profesional','Marketing',250000,'2026-10-14',false),
    G('g10','tienda','Arriendo local','Arriendo',1200000,'2026-08-05',true), G('g11','tienda','Sueldos','Sueldo',1600000,'2026-08-01',true),
    G('g12','tienda','Luz y agua','Servicios',180000,'2026-08-08',true), G('g13','tienda','Publicidad en redes','Marketing',150000,'2026-10-12',false), G('g14','tienda','Mantención vitrinas','Mantención',60000,'2026-10-15',false),
  ];
  const EQUIPO = [
    { id: 'e1', w: 'auto', nombre: 'Marcela Fuentes', fono: '+56 9 8123 4455', email: 'marcela@renueva.cl', comTipo: 'pct', comVal: 2, activo: true, meses: [2, 4, 3, 5, 4, 5] },
    { id: 'e2', w: 'auto', nombre: 'Ignacio Torres', fono: '+56 2 2456 7890', email: 'ignacio@renueva.cl', comTipo: 'monto', comVal: 150000, activo: true, meses: [1, 2, 2, 3, 2, 3] },
    { id: 'e3', w: 'auto', nombre: 'Pedro Salas', fono: '+56 9 1234 5678', email: 'pedro@renueva.cl', comTipo: 'pct', comVal: 1.5, activo: false, meses: [1, 1, 0, 0, 0, 0] },
    { id: 'e4', w: 'prop', nombre: 'Camila Rojas', fono: '+56 9 7788 9900', email: 'camila@renueva.cl', comTipo: 'pct', comVal: 40, activo: true, meses: [1, 2, 1, 2, 3, 2] },
    { id: 'e5', w: 'prop', nombre: 'Diego Vera', fono: '+56 9 6677 8899', email: 'diego@renueva.cl', comTipo: 'pct', comVal: 40, activo: true, meses: [1, 1, 2, 1, 2, 2] },
    { id: 'e6', w: 'tienda', nombre: 'Valentina Soto', fono: '+56 9 5566 7788', email: 'valentina@renueva.cl', comTipo: 'pct', comVal: 3, activo: true, meses: [48, 52, 61, 58, 66, 71] },
    { id: 'e7', w: 'tienda', nombre: 'Matías Pino', fono: '+56 9 4455 6677', email: 'matias@renueva.cl', comTipo: 'pct', comVal: 3, activo: true, meses: [40, 44, 39, 50, 55, 58] },
  ];
  const LEADS = [
    LD('l1','auto','Tomás Vera','+56 9 9100 2001','a2','Chileautos','nuevo',24,'Ignacio Torres','Pregunta por financiamiento.',{temp:'caliente',log:[{ts:'2026-10-23T14:06',tipo:'entrada',txt:'Consulta recibida por Chileautos'}]}),
    LD('l2','auto','Daniela Cortés','+56 9 9100 2002','a4','WhatsApp','nuevo',11,'Marcela Fuentes','Quiere ver fotos del interior.',{temp:'caliente',log:[{ts:'2026-10-23T14:19',tipo:'entrada',txt:'Escribió por WhatsApp'}]}),
    LD('l3','auto','Jorge Muñoz','+56 9 9100 2003','a9','Yapo','trato',2880,'Ignacio Torres','Pidió rebaja.',{temp:'caliente',log:[{ts:'2026-10-21T10:12',tipo:'entrada',txt:'Consulta por Yapo'},{ts:'2026-10-21T10:40',tipo:'llamada',txt:'Llamada de 6 min. Le interesa la Ranger.'},{ts:'2026-10-21T16:05',tipo:'visita',txt:'Vino a verla. Pidió rebaja.'},{ts:'2026-10-21T16:20',tipo:'nota',txt:'Le ofrecí $17.200.000. Quedó de responder.'}]}),
    LD('l4','auto','Francisca Núñez','+56 9 9100 2004','a6','Marketplace','reserva',1440,'Marcela Fuentes','Reserva con $500.000, crédito en trámite.',{temp:'caliente',log:[{ts:'2026-10-22T12:00',tipo:'etapa',txt:'Dejó reserva de $500.000'},{ts:'2026-10-22T12:10',tipo:'nota',txt:'Crédito en evaluación en Forum.'}]}),
    LD('l5','auto','Cristóbal Lagos','+56 9 9100 2005','a4','Mercado Libre','visita',180,'Marcela Fuentes','Test drive mañana 11:00.',{temp:'caliente',log:[{ts:'2026-10-23T11:30',tipo:'llamada',txt:'Confirmó test drive para mañana 11:00'}]}),
    LD('l6','auto','Paula Ibáñez','+56 9 9100 2006','a8','WhatsApp','contactado',5760,'Marcela Fuentes','4 días sin respuesta.',{temp:'frio',log:[{ts:'2026-10-19T09:00',tipo:'whatsapp',txt:'Le envié fotos y precio. Sin respuesta.'}]}),
    LD('l7','auto','Mario Soto','+56 9 9100 2007','a5','Yapo','nuevo',52,'Ignacio Torres','Consulta por permuta.',{log:[{ts:'2026-10-23T13:38',tipo:'entrada',txt:'Consulta recibida por Yapo'}]}),
    LD('l8','auto','Andrea Pino','+56 9 9100 2008','a2','Chileautos','visita',60,'Ignacio Torres','Visita hoy 17:00.',{temp:'caliente',log:[{ts:'2026-10-23T13:30',tipo:'llamada',txt:'Agendó visita para hoy 17:00'}]}),
    LD('l15','auto','Sergio Toro','+56 9 9100 2015','a8','Yapo','perdido',9000,'Marcela Fuentes','',{temp:'frio',motivo:'Precio muy alto',log:[{ts:'2026-10-17T11:00',tipo:'llamada',txt:'Le pareció caro frente a otros 208.'},{ts:'2026-10-17T11:10',tipo:'etapa',txt:'Marcado como perdido: Precio muy alto'}]}),
    LD('l16','auto','Elena Fuentes','+56 9 9100 2016','a4','WhatsApp','perdido',12000,'Ignacio Torres','',{temp:'tibio',motivo:'Sin crédito aprobado',log:[{ts:'2026-10-15T15:00',tipo:'etapa',txt:'Marcado como perdido: Sin crédito aprobado'}]}),
    LD('l17','auto','Javiera Molina','+56 9 8877 6655','a1','Chileautos','ganado',99999,'Marcela Fuentes','Compró la Sail.',{temp:'caliente',log:[{ts:'2026-10-22T13:00',tipo:'etapa',txt:'Venta cerrada'}]}),
    LD('l18','auto','Camila Díaz','+56 9 6655 4433','a10','Marketplace','ganado',99999,'Marcela Fuentes','Compró el Subaru con crédito Forum.',{temp:'caliente',log:[{ts:'2026-10-08T17:00',tipo:'etapa',txt:'Venta cerrada con crédito automotriz'}]}),
    LD('l9','prop','Marco Contreras','+56 9 9200 3001','p3','Portal Inmobiliario','nuevo',18,'Camila Rojas','Pide visita este fin de semana.',{temp:'caliente',log:[{ts:'2026-10-23T14:12',tipo:'entrada',txt:'Consulta por Portal Inmobiliario'}]}),
    LD('l10','prop','Valeria Sáez','+56 9 9200 3002','p1','Yapo','visita',90,'Diego Vera','Visita hoy 11:00.',{temp:'caliente',log:[{ts:'2026-10-23T13:00',tipo:'llamada',txt:'Confirmó visita'}]}),
    LD('l11','prop','Rodrigo Mena','+56 9 9200 3003','p4','Referido','contactado',1500,'Diego Vera','Compara con otra oficina.',{temp:'tibio',log:[{ts:'2026-10-22T13:30',tipo:'llamada',txt:'Compara con otra oficina.'}]}),
    LD('l12','prop','Inés Carrasco','+56 9 9200 3004','p6','Portal Inmobiliario','reserva',300,'Camila Rojas','Oferta aceptada, promesa 27-oct.',{temp:'caliente',log:[{ts:'2026-10-23T09:30',tipo:'etapa',txt:'Oferta aceptada por el propietario'}]}),
    LD('l13','prop','Luis Herrera','+56 9 9200 3005','p8','Instagram','nuevo',35,'Camila Rojas','Interesado en local para café.',{log:[{ts:'2026-10-23T13:55',tipo:'entrada',txt:'Escribió por Instagram'}]}),
    LD('l14','prop','Carolina Vidal','+56 9 9200 3006','p3','Referido','visita',120,'Camila Rojas','Visita hoy 16:30.',{temp:'caliente',log:[{ts:'2026-10-23T12:30',tipo:'llamada',txt:'Agendó visita 16:30'}]}),
    LD('l19','prop','Hugo Prado','+56 9 9200 3007','p5','Yapo','perdido',8000,'Diego Vera','',{temp:'frio',motivo:'Precio muy alto',log:[{ts:'2026-10-18T10:00',tipo:'etapa',txt:'Marcado como perdido: Precio muy alto'}]}),
  ];
  const REMS = [
    { id: 'r1', w: 'auto', titulo: 'Llamar a Cristóbal Lagos antes del test drive', cuando: '2026-10-23T18:00', canal: 'push', tpl: 'llamar', ref: { t: 'lead', id: 'l5' }, hecho: false },
    { id: 'r2', w: 'auto', titulo: 'Cobrar cheque de Hernán Pizarro', cuando: '2026-10-27T09:00', canal: 'push', tpl: 'cobrar', ref: { t: 'venta', id: 'v4' }, hecho: false },
    { id: 'r3', w: 'auto', titulo: 'Enviar fotos del interior a Daniela Cortés', cuando: '2026-10-23T11:00', canal: 'wa', tpl: 'wa', ref: { t: 'lead', id: 'l2' }, hecho: false },
    { id: 'r4', w: 'prop', titulo: 'Confirmar firma de la promesa · Parcela Pirque', cuando: '2026-10-26T10:00', canal: 'push', tpl: 'papeles', ref: { t: 'item', id: 'p6' }, hecho: false },
    { id: 'r5', w: 'prop', titulo: 'Visita Depto Providencia con Valeria Sáez', cuando: '2026-10-23T11:00', canal: 'push', tpl: 'visita', ref: { t: 'lead', id: 'l10' }, hecho: true },
    { id: 'r6', w: 'tienda', titulo: 'Llamar a Textiles Andes por reposición', cuando: '2026-10-23T16:00', canal: 'push', tpl: 'llamar', ref: null, hecho: false },
  ];
  // contactos: se arman con las consultas y los clientes, y puedes agregar más
  const CONTACTOS = [];
  (function buildContactos() {
    const seen = new Map(); let n = 0;
    const add = (w, nombre, fono, extra = {}) => { const key = w + (fono || nombre); if (seen.has(key)) return seen.get(key); const c = { id: 'c' + (++n), w, nombre, fono: fono || '', email: '', nota: '', ...extra }; seen.set(key, c); CONTACTOS.push(c); return c; };
    LEADS.forEach(l => add(l.w, l.nombre, l.fono)); VENTAS.filter(v => v.w !== 'tienda').forEach(v => add(v.w, v.cliente, v.fono));
    add('auto', 'Taller Mecánico Pérez', '+56 9 8000 1111', { nota: 'Proveedor de reacondicionamiento.', proveedor: true });
    add('auto', 'Gestoría Salinas', '+56 9 8000 2222', { nota: 'Trámites de traspaso.', proveedor: true });
  })();


  STOCK.filter(i => i.w === 'prop').forEach(i => { i.visBase = i.visitas - i.visitas14; i.vis = Array.from({ length: i.visitas14 }, (_, k) => addDaysFrom('2026-10-23', -1 - (k * 5) % 13)); delete i.visitas; delete i.visitas14; });
  STOCK.filter(i => i.w === 'tienda').forEach(i => delete i.ventas30);
  LEADS.forEach(l => { if (l.etapa === 'ganado' || l.etapa === 'perdido') l.ts = (l.log[l.log.length - 1] || {}).ts || l.ts; l.creado = (l.log[0] || {}).ts || l.ts; });
  // comisiones de ejemplo que pagan las financieras (cada automotora pone las suyas en Catálogos)
  const cat = { financieras: catDefaults().financieras.map(f => ({ ...f, com: { forum: 3, autofin: 2.5, sconsumer: 2, tanner: 2.5, amicar: 3, crediautos: 2, maf: 2 }[f.k] || 1.5 })) };
  VENTAS.forEach(v => v.pagos.forEach(p => { if (!p.fin) return; const f = cat.financieras.find(x => x.k === p.fin); p.fcp = f ? f.com : 0; p.fcm = Math.round(p.a * p.fcp / 100); p.fcs = v.id === 'v5' ? 'pagada' : 'pendiente'; if (p.fcs === 'pagada') p.fcf = '2026-10-02'; }));
  const data = { items: STOCK, ventas: VENTAS, gastos: GASTOS, equipo: EQUIPO, leads: LEADS, rems: REMS, contactos: CONTACTOS, cat };
  // correr todas las fechas para que "hoy" de la demo sea hoy
  const dMin = Math.round((Date.now() - new Date(D0 + ':00')) / 60000), dDays = Math.round((dateOf(TODAY) - dateOf('2026-10-23')) / MS);
  const shift = v => {
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) { const d = new Date(v + ':00'); d.setMinutes(d.getMinutes() + dMin); return isoDT(d); }
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return addDaysFrom(v, dDays);
      return v;
    }
    if (Array.isArray(v)) return v.map(shift);
    if (v && typeof v === 'object') { for (const k in v) v[k] = shift(v[k]); return v; }
    return v;
  };
  return shift(data);
}
const addDaysFrom = (iso, n) => { const d = dateOf(iso); d.setDate(d.getDate() + n); return isoD(d); };
const DEMO_USERS = [
  { id: 'u1', nombre: 'Sebastián S.', email: 'sebastian@renueva.cl', rol: 'admin', mundos: ['auto', 'prop', 'tienda'], activo: true },
  { id: 'u2', nombre: 'Marcela Fuentes', email: 'marcela@renueva.cl', rol: 'vendedor', mundos: ['auto'], activo: true },
  { id: 'u3', nombre: 'Camila Rojas', email: 'camila@renueva.cl', rol: 'vendedor', mundos: ['prop'], activo: true },
];
