// src/utils/indicadores016.js
// Definición ÚNICA de los 16 indicadores del reporte 016A (numeración del seminario de la
// Superintendencia). La usan tanto las tarjetas de pantalla como el PDF exportado, de modo
// que ambos siempre muestran lo mismo.

const nf = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

const num = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

export const fmtCOP = (v) => (num(v) === null ? "—" : `$${nf.format(Math.round(Number(v)))}`);

// Texto corto para el centro del donut. Siempre en MILLONES ("M") para no confundir con
// "billones" (en español 1B = 10^12).
export const fmtCorto = (v) => {
  const n = num(v);
  if (n === null) return "N/A";
  if (Math.abs(n) >= 1e9) return `$${nf.format(Math.round(n / 1e6))}M`;
  return `$${(n / 1e6).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
};

export const fmtPct = (v) =>
  num(v) === null ? "N/A" : `${Number(v).toLocaleString("es-CO", { maximumFractionDigits: 4 })}%`;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// El indicador FOSYGA se llama ahora "Salud": se corrige también en textos ya guardados.
export const renameSalud = (texto) => (texto ? String(texto).replace(/FOSYGA/gi, "Salud") : texto);

export function getIndicadores016(r) {
  const pctItem = (n, key, label, cardSub, monto, pct, cuentas, base, criterio, ok = null) => ({
    n, key, label, tipo: "pct", monto: num(monto), pct: num(pct), cuentas, base, criterio, ok,
    cardValue: num(pct), cardSub,
  });
  const montoItem = (n, key, label, monto, cuentas, base) => {
    const m = num(monto);
    return {
      n, key, label, tipo: "monto", monto: m, pct: null, cuentas, base, criterio: "Solo valor de la cuenta", ok: null,
      cardValue: m === null ? "N/A" : fmtCorto(m),
      cardSub: m === null ? `Cuenta ${cuentas}` : `Cuenta ${cuentas}: ${fmtCOP(m)}`,
    };
  };

  return [
    pctItem(1, "admin", "Gastos de Administración", "Límite: <= 8%", r.gastos_administracion,
      r.porcentaje_administracion, "Cuenta 51 · Centro de costo Administración (01)", "Ley 789/02, Art. 18",
      "Máximo 8%", r.limite_administracion_valido),
    pctItem(2, "fosfec_red", "Reducción Admón. FOSFEC", "Límite: 2% reducción", r.fosfec_reduccion,
      r.pct_fosfec_reduccion, "522005 + 552005", "Ley 789/02 Art. 6, mod. Art. 6 Ley 1636/13", "Reducción del gasto: 2%"),
    pctItem(3, "foninez", "FONIÑEZ", "50% de la apropiación", r.foninez, r.pct_foninez,
      "520510 + 550510", "Art. 64 Ley 633/00", "50% de la apropiación"),
    pctItem(4, "fosfec", "FOSFEC", "1-3% según CP/CN", r.fosfec, r.pct_fosfec,
      "520520 + 550515", "Ley 789/02 Art. 6, mod. Art. 6 Ley 1636/13", "1%, 2% o 3% según cociente"),
    pctItem(5, "fovis", "FOVIS", "5-27% según CP/CN", r.fovis, r.pct_fovis,
      "520505 + 550505", "Art. 63 Ley 633/00", "5%, 12%, 18% o 27% según cociente"),
    pctItem(6, "salud", "Salud", "5% - 10% según resolución", r.salud ?? r.fosyga, r.pct_salud ?? r.pct_fosyga,
      "521005 + 551005", "Art. 217 Ley 100/93", "5% o 10% según cociente"),
    pctItem(7, "promocion", "Promoción y Prevención en Salud", "Ley 1438 de 2011 (6.25%)", r.promocion_salud,
      r.pct_promocion_salud, "522010 + 552010", "Art. 46 Ley 1438/11, mod. Art. 6 Ley 1636/13", "6,25%"),
    pctItem(8, "supersub", "Contribución Supersubsidio", "Cuentas 523005 + 553005 (<= 1%)", r.supersub, r.pct_supersub,
      "523005 + 553005", "Art. 19 Ley 25/81", "Máximo 1%"),
    pctItem(9, "reserva", "Reserva Legal", "Límite: <= 3%", r.reserva, r.pct_reserva,
      "523501 + 553501", "Art. 43 Ley 21/82", "Hasta 3%"),
    montoItem(10, "cuota", "Cuota Monetaria", r.pago_cuota_monetaria, "610505",
      "Art. 43 Ley 21/82; Art. 3 Decreto 1769/03"),
    montoItem(11, "personas", "Personas a cargo > 18 años FOSFEC", r.personas_cargo, "610509",
      "Ley 789/02 Art. 6, mod. Art. 6 Ley 1636/13"),
    montoItem(12, "transferencias", "Subsidio por Transferencias (excedentes 55%)", r.transferencias, "610510",
      "Ley 789/02; Art. 5 Decreto 1769/03"),
    pctItem(13, "educacion", "Educación", "Límite: >= 10% del saldo", r.educacion, r.pct_educacion,
      "521505 + 551505", "Ley 115/94 Art. 190; Decreto 1902/94 Art. 5", "Mínimo 10% del saldo de obras"),
    pctItem(14, "especie", "Subsidio en Especie", r.especie ? `Suma CC: ${fmtCOP(r.especie)}` : "Suma de todos los Centros de Costo",
      r.especie, r.pct_especie, "610610 · suma de todos los centros de costo", "Art. 43 Ley 21/82", "Informativo"),
    pctItem(15, "servicios", "Subsidio en Servicios", "Ley 21/82", r.servicios, r.pct_servicios,
      "615505 + 615510 + 615515", "Art. 43 Ley 21/82", "Informativo"),
    pctItem(16, "inversion", "Proyectos de Inversión", "Ley 21/82", r.inversion, r.pct_inversion,
      "614001 + 614305 + 614315 + 614601 + 614801 + 616001", "Art. 43 Ley 21/82", "Informativo"),
  ];
}

// ─────────────────────────── PDF ───────────────────────────

const COLORS = { ok: "#16a34a", fail: "#dc2626", info: "#3b82f6", warn: "#f59e0b" };

const claseDe = (ind) => {
  const sinDato = ind.tipo === "pct" ? ind.pct === null : ind.monto === null;
  if (sinDato) return "warn";
  if (ind.ok === true) return "ok";
  if (ind.ok === false) return "fail";
  return "info";
};
const textoEstado = { ok: "Cumple", fail: "No cumple", info: "Extraído", warn: "No verificado" };
const chip = (cls) => `<span class="chip ${cls}">${textoEstado[cls]}</span>`;

function donut(pct, centro, color) {
  const size = 76, stroke = 9, rad = (size - stroke) / 2, c = 2 * Math.PI * rad;
  const p = Math.max(0, Math.min(Number(pct) || 0, 100));
  const off = c - (p / 100) * c;
  const fs = centro.length > 7 ? 10 : centro.length > 5 ? 12 : 14;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="800" fill="#0f172a">${esc(centro)}</text>
  </svg>`;
}

export const PDF016_CSS = `
    @page{size:A4;margin:12mm;}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .cover{padding:36px 40px 32px;border-radius:14px;}
    .body{padding:22px 4px;}
    .section{margin-bottom:26px;}
    .section-title{break-after:avoid;page-break-after:avoid;}
    .dgrid{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
    .dcard{display:flex;align-items:center;gap:10px;border:1px solid;border-radius:14px;padding:14px 14px;break-inside:avoid;page-break-inside:avoid;}
    .dcard.ok{background:#f0fdf4;border-color:#bbf7d0;}
    .dcard.fail{background:#fff1f2;border-color:#fecdd3;}
    .dcard.info{background:#eff6ff;border-color:#bfdbfe;}
    .dcard.warn{background:#fffbeb;border-color:#fde68a;}
    .dinfo{flex:1;min-width:0;}
    .dlabel{font-size:11.5px;font-weight:700;color:#0f172a;line-height:1.25;}
    .dsub{font-size:10px;color:#64748b;margin:3px 0 7px;line-height:1.3;}
    .ddonut{flex-shrink:0;}
    .chip{display:inline-block;border-radius:999px;padding:2px 9px;font-size:9.5px;font-weight:700;border:1px solid;white-space:nowrap;}
    .chip.ok{background:#dcfce7;color:#15803d;border-color:#bbf7d0;}
    .chip.fail{background:#ffe4e6;color:#be123c;border-color:#fecdd3;}
    .chip.info{background:#dbeafe;color:#1d4ed8;border-color:#bfdbfe;}
    .chip.warn{background:#fef3c7;color:#b45309;border-color:#fde68a;}
    .tbl-title{font-family:'Space Grotesk',sans-serif;font-size:12.5px;font-weight:700;color:#0f172a;margin:20px 0 4px;break-after:avoid;page-break-after:avoid;}
    .tbl-note{font-size:10px;color:#64748b;margin-bottom:8px;}
    table.t{width:100%;border-collapse:collapse;font-size:10.5px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;}
    table.t thead{background:#0f172a;}
    table.t th{color:#fff;padding:8px 9px;font-size:8.5px;letter-spacing:.08em;text-align:left;border-bottom:none;}
    table.t td{padding:8px 9px;border-bottom:1px solid #eef2f7;vertical-align:top;color:#334155;}
    table.t tr{break-inside:avoid;page-break-inside:avoid;}
    table.t tbody tr:nth-child(even) td{background:#f8fafc;}
    table.t td.n{width:26px;font-weight:700;color:#7c3aed;}
    table.t td.r{text-align:right;white-space:nowrap;font-weight:600;font-variant-numeric:tabular-nums;}
    table.t td.c{white-space:nowrap;text-align:center;}
    table.t th.r{text-align:right;} table.t th.c{text-align:center;}
    .nm{font-weight:700;color:#0f172a;}
    .sm{display:block;font-size:9px;color:#64748b;font-weight:500;margin-top:2px;}
    .legend{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;font-size:10px;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-top:16px;break-inside:avoid;}
`;

export function buildReport016(r) {
  const items = getIndicadores016(r);

  const cards = items.map((ind) => {
    const cls = claseDe(ind);
    const centro = ind.tipo === "pct" ? fmtPct(ind.pct) : fmtCorto(ind.monto);
    const pctRelleno = ind.tipo === "pct" ? ind.pct : cls === "warn" ? 0 : 100;
    const sub = ind.tipo === "monto" && ind.monto !== null ? `Cuenta ${ind.cuentas}` : ind.cardSub;
    return `<div class="dcard ${cls}">
      <div class="dinfo">
        <div class="dlabel">${ind.n}. ${esc(ind.label)}</div>
        <div class="dsub">${esc(sub)}</div>
        <div>${chip(cls)}</div>
      </div>
      <div class="ddonut">${donut(pctRelleno, centro, COLORS[cls])}</div>
    </div>`;
  }).join("");
  const metricsHtml = `<div class="dgrid">${cards}</div>`;

  const pcts = items.filter((i) => i.tipo === "pct");
  const montos = items.filter((i) => i.tipo === "monto");

  const filaPct = (i) => {
    const cls = claseDe(i);
    return `<tr>
      <td class="n">${i.n}</td>
      <td><span class="nm">${esc(i.label)}</span><span class="sm">${esc(i.base)}</span></td>
      <td>${esc(i.cuentas)}</td>
      <td class="r">${fmtCOP(i.monto)}</td>
      <td class="r">${fmtPct(i.pct)}</td>
      <td>${esc(i.criterio)}</td>
      <td class="c">${chip(cls)}</td>
    </tr>`;
  };
  const filaMonto = (i) => `<tr>
      <td class="n">${i.n}</td>
      <td><span class="nm">${esc(i.label)}</span></td>
      <td>${esc(i.cuentas)}</td>
      <td class="r">${fmtCOP(i.monto)}</td>
      <td>${esc(i.base)}</td>
    </tr>`;

  const aportes = num(r.total_aportes_recaudados);
  const okAdmin = r.limite_administracion_valido;
  const okCuota = r.minimo_cuota_monetaria_valido;
  const clsDe = (ok) => (ok === true ? "ok" : ok === false ? "fail" : "warn");

  const tableHtml = `
    <div class="tbl-title">A. Indicadores porcentuales</div>
    <div class="tbl-note">Cada porcentaje se calcula como (suma de las cuentas) ÷ (Recaudo del 4% cuenta 410505 + Empresas no afiliadas por prescripción cuenta 410605).</div>
    <table class="t">
      <thead><tr><th>N°</th><th>Indicador / Base legal</th><th>Cuentas</th><th class="r">Valor ($)</th><th class="r">% del recaudo</th><th>Criterio</th><th class="c">Estado</th></tr></thead>
      <tbody>${pcts.map(filaPct).join("")}</tbody>
    </table>

    <div class="tbl-title">B. Indicadores de solo valor</div>
    <div class="tbl-note">Para estos indicadores solo se muestra el valor de la cuenta; no se calcula porcentaje.</div>
    <table class="t">
      <thead><tr><th>N°</th><th>Indicador</th><th>Cuenta</th><th class="r">Valor ($)</th><th>Base legal</th></tr></thead>
      <tbody>${montos.map(filaMonto).join("")}</tbody>
    </table>

    <div class="tbl-title">C. Base de cálculo y verificación del veredicto</div>
    <div class="tbl-note">El veredicto general (Cumple / No cumple) depende de los dos criterios con tope legal fijo.</div>
    <table class="t">
      <thead><tr><th>Concepto</th><th>Cuentas / Fuente</th><th class="r">Valor</th><th>Criterio</th><th class="c">Estado</th></tr></thead>
      <tbody>
        <tr><td><span class="nm">Recaudo base (denominador)</span></td><td>410505 + 410605</td><td class="r">${fmtCOP(aportes)}</td><td>Base de todos los porcentajes</td><td class="c">—</td></tr>
        <tr><td><span class="nm">Gastos de administración</span></td><td>Cuenta 51 · Centro de costo 01</td><td class="r">${fmtPct(r.porcentaje_administracion)}</td><td>Máximo 8% (Ley 789/02, Art. 18)</td><td class="c">${chip(clsDe(okAdmin))}</td></tr>
        <tr><td><span class="nm">Cuota monetaria (verificación estimada)</span></td><td>610505 sobre el subtotal estimado</td><td class="r">${fmtPct(r.porcentaje_cuota_monetaria)}</td><td>Mínimo 55% (Art. 43 Ley 21/82)</td><td class="c">${chip(clsDe(okCuota))}</td></tr>
      </tbody>
    </table>

    <div class="legend">
      <span>${chip("ok")} ${chip("fail")}</span><span>El indicador tiene un tope legal fijo y se evaluó automáticamente.</span>
      <span>${chip("info")}</span><span>Valor extraído del reporte. Su porcentaje depende del cociente que fija la Superintendencia o no tiene tope fijo, por eso se muestra para revisión.</span>
      <span>${chip("warn")}</span><span>El reporte no trae las cuentas necesarias para calcular el indicador.</span>
    </div>`;

  return { metricsHtml, tableHtml };
}
