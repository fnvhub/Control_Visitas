const $ = s => document.querySelector(s);
const KEY = "control_visitas_mvp";
const emptyDB = () => ({clients: [], visits: [], plan: {}});
let db;
try {
  db = JSON.parse(localStorage.getItem(KEY) || "null") || emptyDB();
} catch {
  db = emptyDB();
}
db.clients ||= []; db.visits ||= []; db.plan ||= {};
let current = null;

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const clean = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const weekDates = () => {
  const d = new Date(); d.setHours(12,0,0,0);
  d.setDate(d.getDate() - ((d.getDay()+6)%7));
  return Array.from({length:5}, (_,i) => {
    const x = new Date(d); x.setDate(d.getDate()+i);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  });
};
const weekdayNames = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
const dayCap = i => i === 4 ? 3 : 5; // 23 visitas máximas: 5+5+5+5+3
const getClient = id => db.clients.find(c => c.id === id);
const planCount = () => weekDates().reduce((n, d) => n + (Array.isArray(db.plan[d]) ? db.plan[d].length : 0), 0);

function normalizeClient(x) {
  return {
    id: x.id || uid(),
    name: x.name || x.nombre || x.cliente || [x.apellidos,x.nombre].filter(Boolean).join(" "),
    locality: x.locality || x.localidad || x.POB1 || "",
    zone: x.currentZone || x.ubicacionActual || x.zone || x.zona || x.zonaVisita || "",
    currentZone: x.currentZone || x.ubicacionActual || x.zone || x.zona || x.zonaVisita || "",
    type: x.type || x.tipo || x.tipoVisita || "Farmacia",
    category: x.category || x.categoria || x.Visita || "B",
    frequency: Number(x.frequency || x.diasVisita || x.Dias) || 0,
    lastVisit: x.lastVisit || x.ultimaVisita || x["Última visita"] || "",
    address: x.address || x.direccion || x.DIR1 || "",
    nextVisit: x.nextVisit || x.proximaVisita || "",
    commercialPriority: x.commercialPriority || x.prioridadComercial || "",
    notes: x.notes || x.notas || ""
  };
}
function save() { localStorage.setItem(KEY, JSON.stringify(db)); render(); }
function lastVisit(c) {
  const recorded = db.visits.filter(v => v.idc === c.id).map(v => v.date).sort().at(-1);
  return recorded || c.lastVisit || "";
}
function daysSince(date) {
  if (!date) return 9999;
  const a = new Date(`${date}T12:00:00`), b = new Date(`${today()}T12:00:00`);
  return Math.floor((b-a)/86400000);
}
function overdueDays(c) { return c.frequency ? daysSince(lastVisit(c)) - c.frequency : 0; }
function score(c) {
  const category = ({A:100,B:60,C:30}[String(c.category).toUpperCase()] || 30);
  const urgency = c.nextVisit && c.nextVisit <= today() ? 120 : 0;
  const overdue = c.frequency ? Math.max(-20, Math.min(100, overdueDays(c))) : 0;
  const priority = clean(c.commercialPriority);
  const commercial = ["alta","high","1"].includes(priority) ? 80 : priority ? 20 : 0;
  return category + overdue + urgency + commercial;
}
function currentWeekPlan() {
  const dates = weekDates();
  dates.forEach(d => { if (!Array.isArray(db.plan[d])) db.plan[d] = []; });
  return dates;
}
function tab(id) {
  ["cartera","semana","datos"].forEach(x => $("#"+x).hidden = x !== id);
}
function render() {
  const dates = currentWeekPlan();
  const oldZone = $("#zone").value;
  const zones = [...new Set(db.clients.map(c => c.currentZone || c.zone).filter(Boolean))].sort();
  $("#zone").innerHTML = '<option value="">Todas las zonas</option>' + zones.map(z => `<option value="${esc(z)}">${esc(z)}</option>`).join("");
  $("#zone").value = zones.includes(oldZone) ? oldZone : "";
  const z = $("#zone").value, type = $("#type").value, q = clean($("#search").value);
  const overdue = db.clients.filter(c => c.frequency && overdueDays(c)>0).length;
  $("#stats").innerHTML = `<span><b>${db.clients.length}</b><br><small>Registros</small></span><span><b>${overdue}</b><br><small>Atrasados</small></span><span><b>${planCount()}/23</b><br><small>Plan semanal</small></span>`;
  const rows = db.clients.filter(c => (!z || (c.currentZone||c.zone)===z) && (!type || c.type===type) && (!q || clean(c.name+" "+c.locality+" "+(c.currentZone||c.zone)).includes(q))).sort((a,b)=>score(b)-score(a));
  $("#clients").innerHTML = rows.map(c => {
    const late = overdueDays(c);
    return `<article class="client"><div><b>${esc(c.name)}</b><div class="meta">${esc(c.locality)} · ${esc(c.currentZone||c.zone)}</div><div class="meta">${esc(c.type)} · Cat. ${esc(c.category)} · ${c.frequency ? (late>0?`<span class="late">Atraso ${late} días</span>`:"En plazo"):"Sin frecuencia"}${c.nextVisit?` · Próxima: ${esc(c.nextVisit)}`:""}</div></div><div><button onclick="plan('${c.id}')">Plan</button> <button onclick="visit('${c.id}')">Visita</button></div></article>`;
  }).join("") || "No hay clientes.";
  $("#week").innerHTML = dates.map((d,i) => {
    const items = db.plan[d] || [];
    return `<div class="weekday"><b>${weekdayNames[i]} · ${d} (${items.length}/${dayCap(i)})</b>${items.map(id => getClient(id)).filter(Boolean).map(c => `<div class="dayitem">${esc(c.name)} <small>${esc(c.currentZone||c.zone)}</small><button onclick="removePlan('${d}','${c.id}')">Quitar</button></div>`).join("")}</div>`;
  }).join("") + `<p><b>Total: ${planCount()} / 23 visitas.</b> La propuesta agrupa por zona registrada; no calcula recorridos por carretera. Las citas que ya estén en el plan se mantienen.</p>`;
}
function addToPlan(id, date) {
  const dates = currentWeekPlan(), i = dates.indexOf(date);
  if (i < 0 || !getClient(id)) return false;
  db.plan[date] ||= [];
  if (dates.some(d => (db.plan[d] || []).includes(id))) return true;
  if (db.plan[date].length >= dayCap(i)) return false;
  if (planCount() >= 23) return false;
  db.plan[date].push(id); return true;
}
function plan(id) {
  const dates = currentWeekPlan();
  const date = dates.find((d,i) => (db.plan[d]||[]).length < dayCap(i));
  if (!date) { alert("El plan semanal ya está completo (23 visitas)."); return; }
  if (!addToPlan(id,date)) { alert("No se ha podido añadir: revisa el límite diario o semanal."); return; }
  save(); tab("semana");
}
function removePlan(date,id) {
  db.plan[date] = (db.plan[date]||[]).filter(x=>x!==id); save();
}
function propose() {
  const dates = currentWeekPlan();
  // No se borran ni desplazan las citas que el usuario ya colocó.
  const already = new Set(dates.flatMap(d=>db.plan[d]||[]));
  let candidates = db.clients.filter(c => !already.has(c.id));
  candidates.sort((a,b) => score(b)-score(a));
  for (let i=0;i<dates.length;i++) {
    const d = dates[i], capacity = dayCap(i) - (db.plan[d]||[]).length;
    if (capacity <= 0) continue;
    // Elegir la zona más representada entre los candidatos de mayor prioridad.
    for (let n=0;n<capacity && candidates.length;n++) {
      let pickIndex = 0;
      if (n > 0) {
        const anchor = getClient(db.plan[d][0]);
        const anchorZone = anchor && (anchor.currentZone||anchor.zone);
        const same = candidates.findIndex(c => (c.currentZone||c.zone) && (c.currentZone||c.zone)===anchorZone);
        if (same > 0) pickIndex = same;
      }
      const [chosen] = candidates.splice(pickIndex,1);
      db.plan[d].push(chosen.id);
    }
  }
  save(); tab("semana");
}
function visit(id) {
  current = id; const c = getClient(id);
  $("#visitname").textContent = c?.name || "";
  $("#visitdate").value = today(); $("#note").value = ""; $("#next").value = "";
  $("#visit").showModal();
}
$("#visitform").onsubmit = e => {
  if (e.submitter?.id !== "savevisit") return;
  e.preventDefault();
  db.visits.push({idc:current,date:$("#visitdate").value,note:$("#note").value});
  const next = $("#next").value;
  const c = getClient(current); if (c && next) c.nextVisit = next;
  Object.keys(db.plan).forEach(d => { db.plan[d] = db.plan[d].filter(x=>x!==current); });
  $("#visit").close(); save();
};
document.querySelectorAll("nav button").forEach(b => b.onclick=()=>tab(b.dataset.tab));
$("#zone").onchange=render; $("#type").onchange=render; $("#search").oninput=render;
$("#propose").onclick=propose;

$("#file").onchange = async e => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    const value = JSON.parse(await file.text());
    const arr = Array.isArray(value) ? value : value.clients || value.clientes || value.data || [];
    if (!Array.isArray(arr)) throw new Error("El JSON no contiene una lista de clientes.");
    let added=0, updated=0;
    arr.forEach(raw => {
      const incoming = normalizeClient(raw);
      if (!incoming.name) return;
      const existing = db.clients.find(c => clean(c.name)===clean(incoming.name) && (!c.locality || !incoming.locality || clean(c.locality)===clean(incoming.locality)));
      if (!existing) { db.clients.push(incoming); added++; return; }
      // El maestro actualiza datos de origen, pero conserva campos y decisiones manuales.
      const keep = {
        id: existing.id,
        currentZone: existing.currentZone || existing.zone,
        nextVisit: existing.nextVisit,
        commercialPriority: existing.commercialPriority,
        notes: existing.notes,
        frequency: existing.frequency,
        category: existing.category,
        type: existing.type,
        locality: existing.locality,
        address: existing.address
      };
      Object.assign(existing, incoming, keep);
      updated++;
    });
    $("#message").textContent = `Importación completada: ${added} nuevos, ${updated} actualizados. Se han conservado las visitas y los campos manuales.`;
    save();
  } catch(err) {
    $("#message").textContent = "Error al importar el JSON: " + err.message;
  }
  e.target.value="";
};
function download(name,data) {
  const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  const a=document.createElement("a"); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("#export").onclick=()=>download("clientes-control-visitas.json",JSON.stringify(db.clients,null,2));
$("#backup").onclick=()=>download("copia-completa-control-visitas.json",JSON.stringify(db,null,2));
$("#add").onsubmit=e=>{
  e.preventDefault();
  const c=normalizeClient(Object.fromEntries(new FormData(e.target)));
  c.currentZone=c.zone;
  db.clients.push(c); e.target.reset(); save(); tab("cartera");
};
window.plan=plan; window.visit=visit; window.removePlan=removePlan;
if ("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();
