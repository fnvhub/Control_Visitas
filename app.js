const APP_VERSION = "1.1.0";
const $ = s => document.querySelector(s);
const KEY = "control_visitas_mvp";
const emptyDB = () => ({clients: [], visits: [], plan: {}});
let db;
try { db = JSON.parse(localStorage.getItem(KEY) || "null") || emptyDB(); }
catch { db = emptyDB(); }
db.clients ||= []; db.visits ||= []; db.plan ||= {};
let current = null;

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const clean = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const weekDates = () => { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return Array.from({length:5},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;}); };
const weekdayNames=["Lunes","Martes","Miércoles","Jueves","Viernes"];
const dayCap=i=>i===4?3:5;
const getClient=id=>db.clients.find(c=>c.id===id);
const planCount=()=>weekDates().reduce((n,d)=>n+(Array.isArray(db.plan[d])?db.plan[d].length:0),0);

function normalizeClient(x) {
 return {id:x.id||uid(),name:x.name||x.nombre||x.cliente||[x.apellidos,x.nombre].filter(Boolean).join(" "),locality:x.locality||x.localidad||x.POB1||"",zone:x.currentZone||x.ubicacionActual||x.zone||x.zona||x.zonaVisita||"",currentZone:x.currentZone||x.ubicacionActual||x.zone||x.zona||x.zonaVisita||"",type:x.type||x.tipo||x.tipoVisita||"Farmacia",category:x.category||x.categoria||x.Visita||"B",frequency:Number(x.frequency||x.diasVisita||x.Dias)||0,lastVisit:x.lastVisit||x.ultimaVisita||x["Última visita"]||"",address:x.address||x.direccion||x.DIR1||"",nextVisit:x.nextVisit||x.proximaVisita||"",commercialPriority:x.commercialPriority||x.prioridadComercial||"",notes:x.notes||x.notas||""};
}
function save(){localStorage.setItem(KEY,JSON.stringify(db));render();}
function lastVisit(c){return db.visits.filter(v=>v.idc===c.id).map(v=>v.date).sort().at(-1)||c.lastVisit||"";}
function daysSince(date){if(!date)return null;const a=new Date(`${date}T12:00:00`),b=new Date(`${today()}T12:00:00`);return Math.floor((b-a)/86400000);}
function overdueDays(c){const last=lastVisit(c);if(!last||!c.frequency)return null;return daysSince(last)-c.frequency;}
function score(c){const cat=({A:100,B:60,C:30}[String(c.category).toUpperCase()]||30);const due=c.nextVisit&&c.nextVisit<=today()?120:0;const late=overdueDays(c);const overdue=late===null?0:Math.max(-20,Math.min(100,late));const p=clean(c.commercialPriority);const commercial=["alta","high","1"].includes(p)?80:p?20:0;return cat+due+overdue+commercial;}
function currentWeekPlan(){const ds=weekDates();ds.forEach(d=>{if(!Array.isArray(db.plan[d]))db.plan[d]=[];});return ds;}
function tab(id){
 const target=$("#"+id);
 if(target) target.scrollIntoView({behavior:"smooth",block:"start"});
 document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
}
function render(){
 const dates=currentWeekPlan(),oldZone=$("#zone").value,zones=[...new Set(db.clients.map(c=>c.currentZone||c.zone).filter(Boolean))].sort();
 $("#zone").innerHTML='<option value="">Todas las zonas</option>'+zones.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join("");$("#zone").value=zones.includes(oldZone)?oldZone:"";
 const z=$("#zone").value,type=$("#type").value,q=clean($("#search").value),overdue=db.clients.filter(c=>{const n=overdueDays(c);return n!==null&&n>0;}).length;
 $("#stats").innerHTML=`<span><b>${db.clients.length}</b><br><small>Registros</small></span><span><b>${overdue}</b><br><small>Atrasados</small></span><span><b>${planCount()}/23</b><br><small>Plan semanal</small></span>`;
 const rows=db.clients.filter(c=>(!z||(c.currentZone||c.zone)===z)&&(!type||c.type===type)&&(!q||clean(c.name+" "+c.locality+" "+(c.currentZone||c.zone)).includes(q))).sort((a,b)=>score(b)-score(a));
 $("#clients").innerHTML=rows.map(c=>{const late=overdueDays(c),status=!lastVisit(c)?"Sin visita registrada":!c.frequency?"Sin frecuencia":late>0?`<span class="late">Atraso ${late} días</span>`:"En plazo";return `<article class="client"><div class="client-main"><b>${esc(c.name)}</b><div class="tags"><span class="tag zone-tag">${esc(c.currentZone||c.zone||"Zona pendiente")}</span><span class="tag type-tag">${esc(c.type)}</span><span class="tag cat-${String(c.category).toLowerCase()}">Cat. ${esc(c.category)}</span></div><div class="meta">${esc(c.locality)} · ${status}${c.nextVisit?` · Próxima: ${esc(c.nextVisit)}`:""}</div></div><div class="client-actions"><button onclick="plan('${c.id}')">+ Plan</button><button class="button-soft" onclick="visit('${c.id}')">Visita</button></div></article>`;}).join("")||"No hay clientes.";
 $("#week").innerHTML=dates.map((d,i)=>{const items=db.plan[d]||[];return `<div class="weekday"><div class="weekday-head"><b>${weekdayNames[i]}</b><span class="day-count">${items.length}/${dayCap(i)}</span></div><div class="date-label">${d}</div>${items.map(id=>getClient(id)).filter(Boolean).map(c=>`<div class="dayitem"><div><b>${esc(c.name)}</b><small>${esc(c.currentZone||c.zone||"Zona pendiente")}</small></div><button class="remove-button" onclick="removePlan('${d}','${c.id}')">×</button></div>`).join("")||`<div class="empty-day">Sin visitas asignadas</div>`}</div>`; }).join("")+`<p class="week-note"><b>Total: ${planCount()} / 23 visitas.</b> Propuesta orientativa por prioridad y zona registrada; todavía no calcula tiempos ni rutas por carretera.</p>`;
}
function addToPlan(id,date){const ds=currentWeekPlan(),i=ds.indexOf(date);if(i<0||!getClient(id))return false;if(ds.some(d=>(db.plan[d]||[]).includes(id)))return true;db.plan[date]||=[];if(db.plan[date].length>=dayCap(i)||planCount()>=23)return false;db.plan[date].push(id);return true;}
function plan(id){const ds=currentWeekPlan(),date=ds.find((d,i)=>(db.plan[d]||[]).length<dayCap(i));if(!date){alert("El plan semanal ya está completo (23 visitas).");return;}if(!addToPlan(id,date)){alert("No se ha podido añadir la visita.");return;}save();tab("semana");}
function removePlan(date,id){db.plan[date]=(db.plan[date]||[]).filter(x=>x!==id);save();}
function propose(){
 const ds=currentWeekPlan(),already=new Set(ds.flatMap(d=>db.plan[d]||[]));let candidates=db.clients.filter(c=>!already.has(c.id)).sort((a,b)=>score(b)-score(a));
 for(let i=0;i<ds.length;i++){const d=ds[i],capacity=dayCap(i)-(db.plan[d]||[]).length;for(let n=0;n<capacity&&candidates.length;n++){let ix=0;if(n>0){const anchor=getClient(db.plan[d][0]),zone=anchor&&(anchor.currentZone||anchor.zone);const same=candidates.findIndex(c=>(c.currentZone||c.zone)&&((c.currentZone||c.zone)===zone));if(same>0)ix=same;}const [c]=candidates.splice(ix,1);db.plan[d].push(c.id);}}
 save();tab("semana");
}
function visit(id){current=id;const c=getClient(id);$("#visitname").textContent=c?.name||"";$("#visitdate").value=today();$("#note").value="";$("#next").value="";$("#visit").showModal();}
$("#visitform").onsubmit=e=>{if(e.submitter?.id!=="savevisit")return;e.preventDefault();db.visits.push({idc:current,date:$("#visitdate").value,note:$("#note").value});const nx=$("#next").value,c=getClient(current);if(c&&nx)c.nextVisit=nx;Object.keys(db.plan).forEach(d=>db.plan[d]=db.plan[d].filter(x=>x!==current));$("#visit").close();save();};
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>tab(b.dataset.tab));$("#zone").onchange=render;$("#type").onchange=render;$("#search").oninput=render;$("#propose").onclick=propose;
$("#file").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const v=JSON.parse(await file.text()),arr=Array.isArray(v)?v:v.clients||v.clientes||v.data||[];if(!Array.isArray(arr))throw new Error("El JSON no contiene una lista de clientes.");let a=0,u=0;arr.forEach(raw=>{const incoming=normalizeClient(raw);if(!incoming.name)return;const old=db.clients.find(c=>clean(c.name)===clean(incoming.name)&&(!c.locality||!incoming.locality||clean(c.locality)===clean(incoming.locality)));if(!old){db.clients.push(incoming);a++;return;}const keep={id:old.id,currentZone:old.currentZone||old.zone,nextVisit:old.nextVisit,commercialPriority:old.commercialPriority,notes:old.notes,frequency:old.frequency,category:old.category,type:old.type,locality:old.locality,address:old.address};Object.assign(old,incoming,keep);u++;});$("#message").textContent=`Importación completada: ${a} nuevos, ${u} actualizados. Se han conservado los datos manuales.`;save();}catch(err){$("#message").textContent="Error al importar: "+err.message;}e.target.value="";};
function download(name,data){const url=URL.createObjectURL(new Blob([data],{type:"application/json"})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("#export").onclick=()=>download("clientes-control-visitas.json",JSON.stringify(db.clients,null,2));$("#backup").onclick=()=>download("copia-completa-control-visitas.json",JSON.stringify(db,null,2));
$("#add").onsubmit=e=>{e.preventDefault();const c=normalizeClient(Object.fromEntries(new FormData(e.target)));c.currentZone=c.zone;db.clients.push(c);e.target.reset();save();tab("cartera");};
window.plan=plan;window.visit=visit;window.removePlan=removePlan;
const versionNode=$("#app-version");if(versionNode)versionNode.textContent=`v${APP_VERSION}`;
const savedTheme=localStorage.getItem("control_visitas_theme")||"dark";
document.documentElement.dataset.theme=savedTheme;
const themeButton=$("#theme-toggle");
function updateThemeButton(){if(themeButton)themeButton.textContent=document.documentElement.dataset.theme==="dark"?"☀ Modo día":"☾ Modo noche";}
updateThemeButton();
if(themeButton)themeButton.onclick=()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;localStorage.setItem("control_visitas_theme",next);updateThemeButton();};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();
document.querySelector('nav button[data-tab="cartera"]')?.classList.add("active");
