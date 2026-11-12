(()=>{
"use strict";
const KEY="cv_secretaria_v1",OLD="control_visitas_mvp",SEED="./datos_iniciales.json";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const clean=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const nameKey=s=>clean(s).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(Boolean).sort().join(" ");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const datePlus=(date,n)=>{const d=new Date((date||today())+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const monday=d=>{let x=new Date(d+"T12:00:00");x.setDate(x.getDate()-((x.getDay()+6)%7));return x.toISOString().slice(0,10)};
const weekDays=start=>Array.from({length:5},(_,i)=>datePlus(start,i));
const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes"];
const empty=()=>({schema:1,contacts:[],logs:[],commitments:[],weeks:{},settings:{goal:23,fridayMax:3,wednesdayEnd:"13:30",theme:"system"},sources:{},legacy:{},createdAt:new Date().toISOString()});
function normalizeState(x){const base=empty();if(!x||typeof x!=="object")return base;return {...base,...x,contacts:Array.isArray(x.contacts)?x.contacts.filter(Boolean):[],logs:Array.isArray(x.logs)?x.logs.filter(Boolean):[],commitments:Array.isArray(x.commitments)?x.commitments.filter(Boolean):[],weeks:x.weeks&&typeof x.weeks==="object"&&!Array.isArray(x.weeks)?x.weeks:{},settings:{...base.settings,...(x.settings&&typeof x.settings==="object"?x.settings:{})},sources:x.sources&&typeof x.sources==="object"?x.sources:{},legacy:x.legacy&&typeof x.legacy==="object"?x.legacy:{}}}
let db=load();
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||"null");if(x&&x.schema===1)return normalizeState(x);}catch{}return empty()}
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function week(){return db.weeks[$("#weekStart").value]||null}
function weekObj(){let start=$("#weekStart").value;if(!db.weeks[start])db.weeks[start]={start,goal:db.settings.goal,corridor:"",selected:[],proposal:[]};return db.weeks[start]}
function contact(id){return db.contacts.find(c=>c.id===id)}
function latestLog(id){return db.logs.filter(x=>x.contactId===id).sort((a,b)=>b.at.localeCompare(a.at))[0]}
function status(c){return c.status||"Por contactar"}
function daysUntil(s){return s?Math.ceil((new Date(s+"T12:00:00")-new Date(today()+"T12:00:00"))/86400000):null}
function nav(view){document.querySelectorAll(".view").forEach(x=>x.hidden=x.id!==view);document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===view));localStorage.setItem("cv_last_view",view);window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.view)));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
function applyTheme(){const t=db.settings.theme||"system",dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light";$("#theme").value=t}
function normalizeBackupClient(x){return {id:"crm-"+String(x.id||uid()),name:x.nombreComercial||x.nombreCompleto||"Sin nombre",person:x.nombreCompleto||"",businessName:x.nombreComercial||"",locality:x.localidad||"",zone:x.zonaVisita||x.localidad||"",address:x.direccion||"",postalCode:x.cp||"",province:x.provincia||"",phone:x.telefono||"",mobile:x.movil||"",email:x.email||"",specialty:x.especialidad||"",category:["A","B","C"].includes(String(x.tipoVisita||"").toUpperCase())?String(x.tipoVisita).toUpperCase():"B",frequency:Number(x.diasVisita)||0,referenceLastVisit:x.ultimaVisita||"",referenceLastOrder:x.ultimoPedido||"",notes:x.notas||"",kind:"CRM",status:"Por contactar",priority:"Normal",source:"backup-3.0.9"}}
function asISODate(v){
if(!v)return "";
if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
const m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
return "";
}
function laterDate(a,b){a=asISODate(a);b=asISODate(b);return !a?b:!b?a:(a>b?a:b)}
function normalizeMaestro(x){return {id:"xls-"+uid(),name:[x.APELLIDOS,x.NOMBRE].filter(Boolean).join(", "),person:[x.NOMBRE,x.APELLIDOS].filter(Boolean).join(" "),locality:x.POB1||"",zone:"",address:x.DIR1||"",phone:x.TLF1||"",mobile:x.MOVIL||"",email:x.EMAIL||"",specialty:x.ESPECIALIDAD||"",category:["A","B","C"].includes(String(x.Tipo||"").toUpperCase())?String(x.Tipo).toUpperCase():"B",frequency:Number(x.Dias)||0,referenceLastVisit:asISODate(x.Visita),referenceNextVisit:asISODate(x.Proxi),notes:x.NOTAS||"",kind:"Revisar",status:"Por contactar",priority:"Normal",source:"maestro-excel",needsReview:true}}
function mergeMasterDates(existing,master){
existing.referenceLastVisit=laterDate(existing.referenceLastVisit,master.referenceLastVisit);
existing.referenceNextVisit=laterDate(existing.referenceNextVisit,master.referenceNextVisit);
existing.referenceLastVisitSource=existing.referenceLastVisit?"Maestro Excel · columna Visita":"";
existing.referenceNextVisitSource=existing.referenceNextVisit?"Maestro Excel · columna Proxi":"";
if(!existing.frequency&&master.frequency)existing.frequency=master.frequency;
if(!existing.address&&master.address)existing.address=master.address;
if(!existing.specialty&&master.specialty)existing.specialty=master.specialty;
existing.masterMatch=true;
}
function addOrUpdate(c){const key=clean(c.name)+"|"+clean(c.locality);let old=db.contacts.find(x=>clean(x.name)+"|"+clean(x.locality)===key);if(old){const preserve={id:old.id,status:old.status,priority:old.priority,followDate:old.followDate,unavailableUntil:old.unavailableUntil,notes:old.notes||c.notes,kind:old.kind==="Candidato"?"Candidato":old.kind};Object.assign(old,c,preserve);return "updated"}db.contacts.push(c);return "added"}
async function loadInitial(){
if(db.sources.initialLoaded){$("#importStatus").textContent="Los datos iniciales ya están incorporados. Para actualizar fuentes, usa una copia nueva de la aplicación o restaura una copia anterior.";return}
const button=$("#loadInitial");button.disabled=true;$("#importStatus").textContent="Validando backup, maestro y catálogo de zonas…";
try{
const r=await fetch(SEED,{cache:"no-store"});if(!r.ok)throw Error("No se pudo leer datos_iniciales.json ("+r.status+")");
const seed=await r.json();
const crm=Array.isArray(seed?.crmBackup?.clientes)?seed.crmBackup.clientes:[];
const maestro=Array.isArray(seed?.maestroMalaga)?seed.maestroMalaga:[];
const zones=Array.isArray(seed?.zoneCatalog)?seed.zoneCatalog:[];
const calendarLatest=Array.isArray(seed?.calendarLatestExactMatches)?seed.calendarLatestExactMatches:[];
if(!crm.length&&!maestro.length)throw Error("El archivo inicial no contiene listas de clientes ni filas del maestro.");
db=normalizeState(db);let added=0,updated=0,review=0,dates=0;
for(const raw of crm){if(!raw||typeof raw!=="object")continue;const k=addOrUpdate(normalizeBackupClient(raw));k==="added"?added++:updated++}
for(const raw of maestro){
if(!raw||typeof raw!=="object")continue;
const m=normalizeMaestro(raw),nk=nameKey(m.name);
let matches=db.contacts.filter(c=>nameKey(c.name)===nk||nameKey(c.person)===nameKey(m.person)||nameKey(c.businessName)===nk);
if(matches.length>1){const sameTown=matches.filter(c=>clean(c.locality)===clean(m.locality));if(sameTown.length)matches=sameTown}
if(matches.length===1){const c=matches[0],before=c.referenceLastVisit||"",beforeNext=c.referenceNextVisit||"";mergeMasterDates(c,m);if(c.referenceLastVisit!==before||c.referenceNextVisit!==beforeNext)dates++;updated++}
else{db.contacts.push(m);review++}
}
let calendarMatched=0;
for(const event of calendarLatest){
const raw=crm.find(x=>String(x.id||"")===String(event.clientId));
if(!raw)continue;
const target=db.contacts.find(c=>c.source==="backup-3.0.9"&&String(c.id)==="crm-"+String(raw.id));
if(target){target.calendarLastScheduledVisit=laterDate(target.calendarLastScheduledVisit,event.date);target.calendarLastScheduledSource="Agenda Google Calendar · cita programada (no confirma por sí sola que se realizara)";calendarMatched++}
}
db.settings.zoneCatalog=[...new Set([...(db.settings.zoneCatalog||[]),...zones])].sort((a,b)=>a.localeCompare(b,"es"));
db.legacy.crmBackup=seed.crmBackup;db.legacy.maestroMalaga=maestro;db.sources={...db.sources,initialLoaded:true,backupVersion:seed.sourceInfo?.appVersion||"",backupDate:seed.sourceInfo?.fechaBackup||"",excelRows:maestro.length,zoneCatalogSource:seed.sourceInfo?.zoneCatalogSource||""};save();
$("#importStatus").textContent=`Carga completada: ${added} clientes nuevos; ${updated} coincidencias; ${dates} fichas con fechas de visita/próxima visita actualizadas; ${calendarMatched} clientes con última cita registrada en la agenda; ${review} filas pendientes de conciliación. Zonas disponibles: ${zones.length}.`;
}catch(err){$("#importStatus").textContent="No se han importado los datos: "+(err?.message||String(err));throw err}
finally{button.disabled=false}
}
function dueScore(c){
let n=0;
if(c.referenceNextVisit){const d=daysUntil(c.referenceNextVisit);if(d!==null)n+=d<=0?100+Math.min(60,Math.abs(d)):Math.max(0,45-d)}
if(c.followDate){const d=daysUntil(c.followDate);if(d!==null)n+=d<=0?80:Math.max(0,30-d)}
if(c.priority==="Estratégica")n+=100;else if(c.priority==="Alta")n+=70;else if(c.priority==="Media")n+=35;else if(c.priority==="Baja")n-=10;
if(c.category==="A")n+=15;
const last=asISODate(c.referenceLastVisit||c.calendarLastScheduledVisit);if(last){const days=Math.max(0,-daysUntil(last));n+=Math.min(60,Math.round(days/5))}
return n
}
function eligible(c){return c.kind!=="Revisar"&&status(c)!=="Cita conseguida"&&c.recommendationState!=="nevera"&&(!c.unavailableUntil||c.unavailableUntil<=$("#weekStart").value)}
function setRecommendationState(id,state){
const c=contact(id);if(!c)return;
c.recommendationState=state;
c.recommendationUpdatedAt=new Date().toISOString();
if(state==="nevera"){const w=weekObj();w.proposal=(w.proposal||[]).filter(x=>x!==id);w.selected=(w.selected||[]).filter(x=>x!==id)}
if(state==="deferred"){const w=weekObj();w.proposal=(w.proposal||[]).filter(x=>x!==id)}
save();
}
function reactivateContact(id){const c=contact(id);if(!c)return;c.recommendationState="active";c.recommendationUpdatedAt=new Date().toISOString();save()}

function inferZone(c){
const z=String(c.zone||"").trim();if(z)return z;
const town=clean(c.locality);
const map=[["marbella","Marbella"],["san pedro","San Pedro"],["estepona","Estepona"],["fuengirola","Fuengirola"],["mijas","Fuengirola"],["benalmadena","Arroyo-Torremolinos"],["torremolinos","Arroyo-Torremolinos"],["malaga","Málaga"],["rincon","Rincón de la Victoria"],["velez","Vélez-Nerja"],["nerja","Vélez-Nerja"],["coin","Alhaurín-Coín-Guaro"],["alhaurin","Alhaurín-Coín-Guaro"],["guaro","Alhaurín-Coín-Guaro"],["pizarra","Alhaurín-Coín-Guaro"],["cadiz","Cádiz"],["san fernando","Cádiz"],["chiclana","Chiclana"],["conil","Conil"],["jerez","Jerez"],["algeciras","Campo de Gibraltar"],["la linea","Campo de Gibraltar"],["tarifa","Campo de Gibraltar"],["ronda","Ronda-Antequera"],["antequera","Ronda-Antequera"]];
const hit=map.find(([k])=>town.includes(k));return hit?hit[1]:"";
}
function chooseBestZone(pool){
const scores=new Map();for(const c of pool){const z=inferZone(c);if(!z)continue;const old=scores.get(z)||{score:0,count:0};old.score+=Math.max(1,dueScore(c));old.count++;scores.set(z,old)}
return [...scores.entries()].sort((a,b)=>(b[1].score+b[1].count*12)-(a[1].score+a[1].count*12))[0]?.[0]||"";
}
function makeProposal(){
const start=$("#weekStart").value,w=weekObj();w.goal=Number($("#weekGoal").value)||0;
db.contacts.forEach(c=>{if(c.recommendationState==="deferred")c.recommendationState="active"});
const pool=db.contacts.filter(eligible).filter(c=>!w.selected.includes(c.id));
const selectedZone=$("#corridor").value.trim()||chooseBestZone(pool);w.corridor=selectedZone;
const zoned=pool.filter(c=>inferZone(c)===selectedZone||clean(c.zone)===clean(selectedZone)||clean(c.locality)===clean(selectedZone));
const ranked=(zoned.length?zoned:pool).sort((a,b)=>dueScore(b)-dueScore(a));
w.proposal=ranked.slice(0,10).map(c=>c.id);save();nav("week");
}
function renderWeek(){const start=$("#weekStart").value,w=weekObj();$("#weekGoal").value=w.goal??db.settings.goal;$("#corridor").value=w.corridor||"";$("#goalDisplay").textContent=`${w.goal??db.settings.goal} visitas`;
const prop=(w.proposal||[]).map(contact).filter(Boolean),sel=(w.selected||[]).map(contact).filter(Boolean);
$("#candidates").innerHTML=prop.map(c=>`<div class="item"><div><b>${esc(c.name)}</b><small>${esc(c.locality)} · ${esc(c.zone)} · ${esc(c.priority)} ${c.kind==="Revisar"?"· Revisar maestro":""}</small><small>Última visita: ${esc(c.referenceLastVisit||"Sin fecha")} · Próxima: ${esc(c.referenceNextVisit||"Sin fecha")}</small><small>${esc(c.notes||"")}</small></div><div class="actions"><button data-select="${esc(c.id)}">Añadir</button><button class="secondary" data-defer="${esc(c.id)}">Aplazar para próxima vez</button><button class="danger" data-fridge="${esc(c.id)}">Nevera</button></div></div>`).join("")||'<p class="muted">Elige un corredor y pulsa “Proponer”. Si no hay candidatos en esa zona, amplía el corredor.</p>';
$("#selected").innerHTML=sel.map(c=>`<div class="item"><div><b>${esc(c.name)}</b><small>${esc(c.locality)} · ${esc(c.zone)}</small></div><button class="danger" data-unselect="${esc(c.id)}">Quitar</button></div>`).join("")||'<p class="muted">Todavía no has seleccionado visitas.</p>';
$("#weekAlerts").innerHTML=conflicts(start).map(x=>`<div class="alert">Conflicto: ${esc(x.title)} el ${esc(x.date)} (${esc(x.start||"día completo")}–${esc(x.end||"")}). Se mantiene el compromiso y no se modifica ninguna cita.</div>`).join("");
$$("#candidates [data-select]").forEach(b=>b.onclick=()=>{const w=weekObj();if(!w.selected.includes(b.dataset.select))w.selected.push(b.dataset.select);w.proposal=w.proposal.filter(x=>x!==b.dataset.select);save()});
$$("#candidates [data-defer]").forEach(b=>b.onclick=()=>setRecommendationState(b.dataset.defer,"deferred"));
$$("#candidates [data-fridge]").forEach(b=>b.onclick=()=>setRecommendationState(b.dataset.fridge,"nevera"));
$$("#selected [data-unselect]").forEach(b=>b.onclick=()=>{const w=weekObj();w.selected=w.selected.filter(x=>x!==b.dataset.unselect);save()});
}
function conflicts(start){const dates=weekDays(start),w=db.weeks[start];return db.commitments.filter(c=>dates.includes(c.date)&&c.flex!=="flexible"&&(c.flex==="allday"||(c.start&&c.end))).filter(c=>w&&w.selected.length).map(c=>({...c}))}
function renderFollow(){const q=clean($("#followSearch").value),f=$("#followFilter").value;const arr=db.contacts.filter(c=>c.kind!=="Revisar"&&(!f||status(c)===f)&&(!q||clean(c.name+" "+c.locality).includes(q))).sort((a,b)=>(a.followDate||"9999").localeCompare(b.followDate||"9999"));const statuses=["Por contactar","Contactado","Esperando respuesta","Seguimiento programado","Cita conseguida"];
$("#followBoard").innerHTML=statuses.map(s=>`<section class="lane"><h3>${s} <small>${arr.filter(c=>status(c)===s).length}</small></h3>${arr.filter(c=>status(c)===s).map(c=>`<div class="follow-card"><b>${esc(c.name)}</b><small>${esc(c.locality)} · ${esc(c.channel||"Sin canal")}</small><small>${c.followDate?"Volver a contactar: "+esc(c.followDate):""}</small><p>${esc(c.notes||"")}</p><div class="actions"><button data-log="${esc(c.id)}">Registrar contacto</button><button class="secondary" data-edit="${esc(c.id)}">Editar</button></div></div>`).join("")||'<p class="muted small">Sin contactos</p>'}</section>`).join("");
$$("#followBoard [data-log]").forEach(b=>b.onclick=()=>openLog(b.dataset.log));$$("#followBoard [data-edit]").forEach(b=>b.onclick=()=>openContact(b.dataset.edit))}
function renderClients(){const q=clean($("#clientSearch").value),kind=$("#clientKind").value,p=$("#clientPriority").value;const arr=db.contacts.filter(c=>(!kind||c.kind===kind)&&(!p||c.priority===p)&&(!q||clean(c.name+" "+c.locality+" "+c.zone+" "+c.address).includes(q))).sort((a,b)=>dueScore(b)-dueScore(a));$("#clientList").innerHTML=arr.slice(0,500).map(c=>`<div class="item"><div><b>${esc(c.name)}</b><small>${esc(c.kind)} · ${esc(c.locality)} · ${esc(c.zone)} · Categoría ${esc(c.category||"—")} · Prioridad ${esc(c.priority||"Normal")}</small><small>${esc(c.address||"")}</small>${c.recommendationState==="nevera"?'<small class="warning">En nevera · excluido de recomendaciones</small>':c.recommendationState==="deferred"?'<small class="muted">Aplazado para la próxima propuesta</small>':""}${c.needsReview?'<small class="warning">Origen Excel: requiere revisar clasificación antes de proponer.</small>':""}</div><div class="actions"><button class="secondary" data-edit="${esc(c.id)}">Editar</button><button data-log="${esc(c.id)}">Contacto</button>${c.recommendationState==="nevera"?`<button data-reactivate="${esc(c.id)}">Activar nuevamente</button>`:""}</div></div>`).join("")||'<p class="muted">No hay resultados.</p>';$$("#clientList [data-edit]").forEach(b=>b.onclick=()=>openContact(b.dataset.edit));$$("#clientList [data-log]").forEach(b=>b.onclick=()=>openLog(b.dataset.log));$$("#clientList [data-reactivate]").forEach(b=>b.onclick=()=>reactivateContact(b.dataset.reactivate))}
function renderCommitments(){const arr=db.commitments.slice().sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));$("#commitmentList").innerHTML=arr.map(c=>`<div class="item"><div><b>${esc(c.title)}</b><small>${esc(c.date)} · ${esc(c.start||"Todo el día")} ${c.end?"– "+esc(c.end):""} · ${esc(c.type)} · ${c.flex==="fixed"?"Fijo":c.flex==="flexible"?"Flexible":"Día completo"}</small><small>${esc(c.location||"")}</small></div><button class="danger" data-delcommit="${esc(c.id)}">Eliminar</button></div>`).join("")||'<p class="muted">No hay compromisos registrados.</p>';$$("#commitmentList [data-delcommit]").forEach(b=>b.onclick=()=>{db.commitments=db.commitments.filter(c=>c.id!==b.dataset.delcommit);save()})}
function renderHome(){const follow=db.contacts.filter(c=>c.followDate&&c.followDate<=datePlus(today(),7)&&status(c)!=="Cita conseguida").sort((a,b)=>a.followDate.localeCompare(b.followDate)).slice(0,6);$("#homeFollow").innerHTML=follow.map(c=>`<div class="item"><div><b>${esc(c.name)}</b><small>${esc(c.followDate)} · ${esc(status(c))}</small></div><button class="secondary" data-log="${esc(c.id)}">Actualizar</button></div>`).join("")||'<p class="muted">No hay seguimientos próximos.</p>';$$("#homeFollow [data-log]").forEach(b=>b.onclick=()=>openLog(b.dataset.log));
const start=$("#weekStart").value,w=db.weeks[start];$("#homeWeek").innerHTML=w&&w.selected.length?`<p><b>${w.selected.length} visitas seleccionadas</b> para la semana del ${esc(start)}.</p>`:'<p class="muted">Aún no has preparado esta semana.</p>';
const next=db.commitments.filter(c=>c.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);$("#homeCommitments").innerHTML=next.map(c=>`<div class="item"><div><b>${esc(c.title)}</b><small>${esc(c.date)} · ${esc(c.start||"Todo el día")} · ${esc(c.type)}</small></div></div>`).join("")||'<p class="muted">No hay compromisos futuros.</p>';
const due=db.contacts.filter(c=>c.followDate&&c.followDate<=today()&&status(c)!=="Cita conseguida").length;$("#stats").innerHTML=`<div class="stat"><b>${db.contacts.filter(c=>c.kind==="CRM").length}</b><small>Clientes CRM</small></div><div class="stat"><b>${db.contacts.filter(c=>c.kind==="Candidato").length}</b><small>Candidatos</small></div><div class="stat"><b>${due}</b><small>Seguimientos vencidos</small></div><div class="stat"><b>${db.commitments.filter(c=>c.date>=today()).length}</b><small>Compromisos futuros</small></div>`}
function renderZoneOptions(selected){
const el=$("#corridor");if(!el)return;const current=selected??el.value;const zones=[...(db.settings.zoneCatalog||[])];el.innerHTML='<option value="">La secretaria elige la mejor zona</option>'+zones.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join("");if(current&&zones.some(z=>clean(z)===clean(current)))el.value=zones.find(z=>clean(z)===clean(current));else el.value="";
}
function renderAll(){db=normalizeState(db);applyTheme();renderZoneOptions(week()?.corridor||"");renderHome();renderWeek();renderFollow();renderClients();renderCommitments();$("#goalDisplay").textContent=`${weekObj().goal??db.settings.goal} visitas`}
function openContact(id){const c=id?contact(id):null,form=$("#contactForm");form.reset();form.elements.id.value=c?.id||"";for(const k of ["name","locality","zone","address","kind","category","priority","status","followDate","unavailableUntil","channel","notes"])if(c&&form.elements[k])form.elements[k].value=c[k]??(k==="kind"?"Candidato":k==="category"?"B":k==="priority"?"Normal":k==="status"?"Por contactar":"");$("#contactTitle").textContent=c?"Editar contacto":"Nuevo contacto";$("#contactDialog").showModal()}
$("#contactForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),id=f.id||uid(),old=contact(id),c={...old,...f,id,followDate:f.followDate||"",unavailableUntil:f.unavailableUntil||""};delete c.id;const final={...c,id};if(old)Object.assign(old,final);else db.contacts.push(final);$("#contactDialog").close();save()};
function openLog(id){const f=$("#logForm");f.reset();f.elements.id.value=id;$("#contactLog").showModal()}
$("#logForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),c=contact(f.id);if(!c)return;const result=f.result;let nextStatus="Contactado",follow=f.followDate||"";if(result==="no-answer"){nextStatus="Seguimiento programado";follow=follow||datePlus(today(),2)}if(result==="call-later"){nextStatus="Seguimiento programado";follow=follow||datePlus(today(),1)}if(result==="next-week"){nextStatus="Seguimiento programado";follow=follow||datePlus(today(),7)}if(result==="not-available"){nextStatus="Seguimiento programado";follow=follow||datePlus(today(),14);c.unavailableUntil=follow}if(result==="waiting")nextStatus="Esperando respuesta";if(result==="confirmed"){if(!f.appointmentDate){alert("Indica fecha de la cita confirmada.");return}nextStatus="Cita conseguida";db.commitments.push({id:uid(),title:"Cita: "+c.name,date:f.appointmentDate,start:f.start,end:f.end,type:"Visita comercial",flex:"fixed",contactId:c.id,createdAt:new Date().toISOString()})}if(result==="walkin")nextStatus="Contactado";c.status=nextStatus;c.followDate=follow;c.channel=c.channel||"Llamada";db.logs.push({id:uid(),contactId:c.id,at:new Date().toISOString(),result,notes:f.notes||"",followDate:follow,appointmentDate:f.appointmentDate||""});$("#contactLog").close();save()};
function addCommit(){const f=$("#commitForm");f.reset();f.elements.date.value=$("#weekStart").value;$("#commitDialog").showModal()}
$("#commitForm").onsubmit=e=>{e.preventDefault();const c=Object.fromEntries(new FormData(e.target));if(c.start&&c.end&&c.end<=c.start){alert("La hora final debe ser posterior a la inicial.");return}db.commitments.push({...c,id:uid(),createdAt:new Date().toISOString()});$("#commitDialog").close();save()};
function exportJson(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function migrateOld(){try{const old=JSON.parse(localStorage.getItem(OLD)||"null");if(old&&Array.isArray(old.clients)){for(const x of old.clients){const c={id:x.id||uid(),name:x.name||"",locality:x.locality||"",zone:x.currentZone||x.zone||"",address:x.address||"",kind:"CRM",category:x.category||"B",priority:x.commercialPriority||"Normal",status:"Por contactar",notes:x.notes||"",referenceLastVisit:x.lastVisit||"",frequency:x.frequency||0};if(c.name)addOrUpdate(c)}db.legacy.previousMvp=old;db.sources.migratedFrom="control_visitas_mvp";save()}}catch{}}
$("#makeProposal").onclick=makeProposal;$("#weekStart").onchange=()=>{const w=weekObj();$("#weekGoal").value=w.goal??db.settings.goal;$("#corridor").value=w.corridor||"";renderWeek()};$("#weekGoal").onchange=()=>{weekObj().goal=Number($("#weekGoal").value)||0;save()};$("#corridor").onchange=()=>{weekObj().corridor=$("#corridor").value;save()};$("#addZone").onclick=()=>{const z=prompt("Nombre de la nueva zona/corredor:");if(!z||!z.trim())return;const a=db.settings.zoneCatalog||[];if(!a.some(x=>clean(x)===clean(z)))a.push(z.trim());db.settings.zoneCatalog=a.sort((x,y)=>x.localeCompare(y,"es"));save();renderZoneOptions(z.trim())};
$("#addContact").onclick=()=>openContact();$("#newProspect").onclick=()=>{openContact();$("#contactForm").elements.kind.value="Candidato"};$("#addCommitment").onclick=addCommit;
$("#clientSearch").oninput=renderClients;$("#clientKind").onchange=renderClients;$("#clientPriority").onchange=renderClients;$("#followSearch").oninput=renderFollow;$("#followFilter").onchange=renderFollow;
$("#saveSettings").onclick=()=>{db.settings.goal=Number($("#defaultGoal").value)||0;db.settings.fridayMax=Number($("#fridayMax").value)||0;db.settings.wednesdayEnd=$("#wednesdayEnd").value;db.settings.theme=$("#theme").value;save();alert("Ajustes guardados.")};
$("#themeBtn").onclick=()=>nav("settings");
$("#backupBtn").onclick=()=>exportJson("Control_Visitas_copia_completa.json",db);
$("#exportAll").onclick=()=>exportJson("Control_Visitas_copia_completa.json",db);
$("#exportCRM").onclick=()=>exportJson("Control_Visitas_cartera_seguimiento.json",{contacts:db.contacts,logs:db.logs,commitments:db.commitments,weeks:db.weeks,settings:db.settings});
$("#loadInitial").onclick=()=>loadInitial().catch(e=>$("#importStatus").textContent=e.message);
$("#importFile").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const x=JSON.parse(await file.text());if(x.schema===1){if(!confirm("¿Reemplazar los datos actuales con esta copia? Descarga antes una copia de seguridad."))return;db=x;save();$("#importStatus").textContent="Copia restaurada."}else if(Array.isArray(x.clientes)){db.legacy.externalBackup=x;let n=0;for(const raw of x.clientes){addOrUpdate(normalizeBackupClient(raw));n++}save();$("#importStatus").textContent=`Importados ${n} registros CRM. El backup original completo queda conservado en el historial de fuentes.`}else throw Error("Formato no reconocido")}catch(err){$("#importStatus").textContent="No se importó: "+err.message}e.target.value=""};
$("#defaultGoal").value=db.settings.goal;$("#fridayMax").value=db.settings.fridayMax;$("#wednesdayEnd").value=db.settings.wednesdayEnd;$("#weekStart").value=monday(today());$("#weekGoal").value=db.settings.goal;
if(!db.sources.migratedFrom)migrateOld();
applyTheme();if(matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(db.settings.theme==="system")applyTheme()});
renderAll();nav(localStorage.getItem("cv_last_view")||"home");
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
})();