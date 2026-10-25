"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import {
  Activity, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, BarChart3, Bell,
  Check, ChevronDown, CircleHelp, Crosshair, FileSpreadsheet, Filter,
  LayoutDashboard, Menu, Search, ShieldAlert, SlidersHorizontal, Sparkles,
  Upload, Users, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { performanceTrend, players as samplePlayers, type Player } from "@/data/players";

type Module = "overview" | "players" | "upload" | "recommendations" | "reports" | "compare";
const nav: { id: Module; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard, group: "SCOUTING" },
  { id: "players", label: "Jugadores", icon: Users, group: "SCOUTING" },
  { id: "recommendations", label: "Recomendaciones", icon: Sparkles, group: "SCOUTING" },
  { id: "compare", label: "Comparar jugadores", icon: ArrowLeftRight, group: "ANÁLISIS" },
  { id: "reports", label: "Reportes", icon: BarChart3, group: "ANÁLISIS" },
  { id: "upload", label: "Cargar estadísticas", icon: FileSpreadsheet, group: "HERRAMIENTAS" },
];
const rotation = [
  { time: "0:00–6:00", note: "Inicio: ritmo alto", players: ["M. Ríos", "S. Cruz", "D. Navarro", "E. Torres", "A. Vega"] },
  { time: "6:00–10:00", note: "Segunda unidad", players: ["N. Méndez", "B. Salas", "G. Castillo", "D. Navarro", "A. Vega"] },
  { time: "10:00–12:00", note: "Cerrar el cuarto", players: ["M. Ríos", "S. Cruz", "G. Castillo", "E. Torres", "A. Vega"] },
];
const tooltipStyle = { background: "#171c1b", border: "1px solid #343b38", borderRadius: 8, color: "#f3f4ed" };

export default function Home() {
  const [module, setModule] = useState<Module>("overview");
  const [players, setPlayers] = useState(samplePlayers);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("Todas las posiciones");
  const [compareA, setCompareA] = useState(samplePlayers[0].id);
  const [compareB, setCompareB] = useState(samplePlayers[1].id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => players.filter((p) => (`${p.name} ${p.team}`.toLowerCase().includes(query.toLowerCase())) && (position === "Todas las posiciones" || p.position === position)), [players, query, position]);
  const prospects = [...players].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const a = players.find((p) => p.id === compareA) ?? players[0];
  const b = players.find((p) => p.id === compareB) ?? players[1] ?? players[0];
  const selectModule = (next: Module) => { setModule(next); setMobileNav(false); };

  async function importFile(file?: File) {
    if (!file) return;
    setMessage(""); setError(false);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("El archivo supera el límite de 10 MB.");
      if (file.name.toLowerCase().endsWith(".xls")) throw new Error("El formato .xls antiguo no es compatible. Guarda el archivo como .xlsx o CSV.");
      let rows: Record<string, unknown>[];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const Papa = await import("papaparse");
        rows = await new Promise((resolve, reject) => {
          Papa.default.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: reject,
          });
        });
      } else {
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheet = workbook.worksheets[0];
        if (!sheet) throw new Error("El archivo no contiene hojas de cálculo.");
        const headers: string[] = [];
        sheet.getRow(1).eachCell((cell, column) => { headers[column - 1] = String(cell.value ?? ""); });
        rows = [];
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return;
          const record: Record<string, unknown> = {};
          headers.forEach((header, index) => { if (header) record[header] = row.getCell(index + 1).text; });
          rows.push(record);
        });
      }
      if (!rows.length) throw new Error("El archivo no contiene filas con datos.");
      const keyOf = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      const value = (row: Record<string, unknown>, names: string[]) => { const key = Object.keys(row).find((name) => names.includes(keyOf(name))); return key ? row[key] : ""; };
      const imported: Player[] = rows.map((row, index) => {
        const number = (names: string[], fallback: number) => Number(value(row, names)) || fallback;
        const points = number(["puntos", "points"], 0), rebounds = number(["rebotes", "rebounds"], 0), assists = number(["asistencias", "assists"], 0);
        const score = Math.min(10, Math.max(1, points * .12 + rebounds * .1 + assists * .16 + 5));
        return {
          id: `upload-${Date.now()}-${index}`, name: String(value(row, ["nombre", "name", "jugador"]) || `Prospecto ${index + 1}`),
          age: number(["edad", "age"], 20), position: String(value(row, ["posicion", "position"]) || "Alero") as Player["position"],
          team: String(value(row, ["equipo", "team"]) || "Equipo sin especificar"), points, rebounds, assists,
          efficiency: 75, speed: 75, stamina: 75, injuryHistory: String(value(row, ["lesiones", "injuries"]) || "Sin información reportada"),
          height: number(["estatura", "height"], 190), rating: Number(score.toFixed(1)), rationale: "Evaluación preliminar basada en las estadísticas importadas.",
        };
      });
      setPlayers((current) => [...imported, ...current]);
      setMessage(`${imported.length} jugador${imported.length === 1 ? "" : "es"} agregado${imported.length === 1 ? "" : "s"} desde ${file.name}.`);
    } catch (cause) {
      setError(true); setMessage(cause instanceof Error ? cause.message : "No se pudo leer el archivo. Revisa el formato e inténtalo de nuevo.");
    } finally { if (inputRef.current) inputRef.current.value = ""; }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <a className="brand" href="#inicio" onClick={() => selectModule("overview")}><span className="brand-mark"><Crosshair size={22} /></span><span className="brand-name">IA<span>-</span>SCOUT<small>INTELLIGENCE / BASKETBALL</small></span></a>
      <div className="season-card"><span className="season-dot" /> TEMPORADA 2025–26 <ChevronDown size={14} /></div>
      <nav className="main-nav" aria-label="Navegación principal">{["SCOUTING", "ANÁLISIS", "HERRAMIENTAS"].map((group) => <div className="nav-group" key={group}><span className="nav-heading">{group}</span>{nav.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${module === id ? "nav-link-active" : ""}`} onClick={() => selectModule(id)}><Icon size={17} /><span>{label}</span>{id === "recommendations" && <span className="nav-count">4</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="scout-status"><span className="status-light" /><div><strong>Scout AI activo</strong><small>Última sincronización · hace 8 min</small></div></div><div className="profile-row"><div className="profile-avatar">CT</div><div><strong>Cuerpo técnico</strong><small>Cuenta de equipo</small></div><ChevronDown size={15} /></div></div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Cerrar navegación" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="breadcrumb"><span>IA-SCOUT</span><span className="crumb-slash">/</span><strong>{nav.find((item) => item.id === module)?.label.toUpperCase()}</strong></div><div className="topbar-actions"><label className="global-search"><Search size={16} /><input aria-label="Buscar jugador" placeholder="Buscar jugador..." value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value) setModule("players"); }} /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Notificaciones"><Bell size={18} /><i /></button><div className="top-date">JUE, 15 OCT 2026</div></div></header>
      <div className="content-wrap">
        {module === "overview" && <Overview players={players} prospects={prospects} go={selectModule} />}
        {module === "players" && <PlayersView players={filtered} query={query} setQuery={setQuery} position={position} setPosition={setPosition} />}
        {module === "upload" && <UploadView message={message} error={error} inputRef={inputRef} onFile={importFile} />}
        {module === "recommendations" && <Recommendations prospects={prospects} />}
        {module === "reports" && <Reports players={players} />}
        {module === "compare" && <Compare players={players} a={a} b={b} setA={setCompareA} setB={setCompareB} />}
        <footer className="disclaimer"><ShieldAlert size={15} /><span>IA-Scout es una herramienta de apoyo al análisis. La decisión final corresponde al cuerpo técnico.</span><button title="Los indicadores son orientativos y no sustituyen la evaluación profesional." aria-label="Más información"><CircleHelp size={15} /></button></footer>
      </div>
    </main>
  </div>;
}

function Heading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><span />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function Stat({ label, value, suffix = "", trend, icon: Icon }: { label: string; value: string; suffix?: string; trend: string; icon: typeof Activity }) {
  return <article className="stat-card"><div className="stat-icon"><Icon size={17} /></div><span className="stat-label">{label}</span><div className="stat-value">{value}<small>{suffix}</small></div><span className="stat-trend">↗ {trend}</span></article>;
}
function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <div className={`player-avatar avatar-${initials.charCodeAt(0) % 5} ${large ? "avatar-large" : ""}`}>{initials}</div>;
}
function Rating({ value }: { value: number }) { return <span className="rating"><span>{value.toFixed(1)}</span><small>/10</small></span>; }

function Overview({ players, prospects, go }: { players: Player[]; prospects: Player[]; go: (module: Module) => void }) {
  return <><Heading eyebrow="TABLERO DE SCOUTING" title="El juego, con otra perspectiva." description="Inteligencia deportiva para descubrir talento y tomar mejores decisiones en cancha." action={<button className="button button-primary" onClick={() => go("upload")}><Upload size={16} /> Importar estadísticas</button>} />
    <section className="stat-grid"><Stat label="Jugadores monitoreados" value={String(players.length).padStart(2, "0")} trend="12% vs. temporada anterior" icon={Users} /><Stat label="Puntos por partido" value="16.8" suffix=" PPG" trend="4.2% últimos 5 juegos" icon={Crosshair} /><Stat label="Eficiencia promedio" value="86.4" suffix="%" trend="2.8% sobre la media de liga" icon={Activity} /><Stat label="Prospectos destacados" value="04" trend="3 posiciones por cubrir" icon={Sparkles} /></section>
    <section className="overview-grid"><article className="panel performance-panel"><div className="panel-heading"><div><span className="section-kicker">TENDENCIA DEL EQUIPO</span><h2>Producción por partido</h2></div><span className="select-like">Últimos 6 juegos <ChevronDown size={14} /></span></div><Legend /><div className="overview-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={performanceTrend} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#29302d" vertical={false} /><XAxis dataKey="game" axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 11 }} dy={9} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="points" name="Puntos" stroke="#c5f36b" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="rebounds" name="Rebotes" stroke="#ff796c" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="assists" name="Asistencias" stroke="#74c6c4" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div><div className="chart-foot"><span>Promedio anotador del plantel</span><strong>16.8 <small>PPG</small></strong></div></article>
      <article className="panel prospects-panel"><div className="panel-heading"><div><span className="section-kicker">MOTOR DE RECOMENDACIÓN</span><h2>En el radar</h2></div><button className="text-button" onClick={() => go("recommendations")}>Ver todos <ArrowUpRight size={15} /></button></div><div className="prospect-list">{prospects.slice(0, 3).map((p, i) => <button className="prospect-row" key={p.id} onClick={() => go("recommendations")}><span className="prospect-rank">0{i + 1}</span><Avatar name={p.name} /><span className="prospect-info"><strong>{p.name}</strong><small>{p.position} · {p.team}</small></span><Rating value={p.rating} /></button>)}</div><div className="ai-note"><Sparkles size={15} /><span>Perfiles alineados con las necesidades del equipo.</span></div></article></section>
    <section className="panel roster-panel"><div className="panel-heading"><div><span className="section-kicker">SEGUIMIENTO RECIENTE</span><h2>Jugadores destacados</h2></div><button className="text-button" onClick={() => go("players")}>Ver plantel completo <ArrowUpRight size={15} /></button></div><RosterTable players={players.slice(0, 4)} /></section>
  </>;
}
function Legend() { return <div className="chart-legend"><span><i className="legend-lime" />Puntos</span><span><i className="legend-coral" />Rebotes</span><span><i className="legend-blue" />Asistencias</span></div>; }
function RosterTable({ players, reports = false }: { players: Player[]; reports?: boolean }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>JUGADOR</th><th>POSICIÓN</th>{!reports && <th>EQUIPO</th>}<th>PTS / J</th><th>REB / J</th><th>AST / J</th><th>EFICIENCIA</th>{reports && <th>ESTADO</th>}</tr></thead><tbody>{players.map((p) => <tr key={p.id}><td><span className="table-player"><Avatar name={p.name} /><strong>{p.name}</strong></span></td><td>{p.position}</td>{!reports && <td className="muted-cell">{p.team}</td>}<td>{p.points.toFixed(1)}</td><td>{p.rebounds.toFixed(1)}</td><td>{p.assists.toFixed(1)}</td><td><span className="efficiency"><i style={{ width: `${p.efficiency}%` }} />{p.efficiency}%</span></td>{reports && <td><span className="healthy-status"><i /> Disponible</span></td>}</tr>)}</tbody></table></div>;
}
function PlayersView({ players, query, setQuery, position, setPosition }: { players: Player[]; query: string; setQuery: (value: string) => void; position: string; setPosition: (value: string) => void }) {
  return <><Heading eyebrow="BASE DE TALENTO" title="Jugadores" description="Perfiles, rendimiento y disponibilidad en un solo lugar." action={<span className="results-count">{players.length} perfiles</span>} /><div className="filter-bar"><label className="filter-search"><Search size={16} /><input placeholder="Buscar nombre o equipo" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="position-filter"><Filter size={15} /><select value={position} onChange={(e) => setPosition(e.target.value)}><option>Todas las posiciones</option>{["Base", "Escolta", "Alero", "Ala-pívot", "Pívot"].map((pos) => <option key={pos}>{pos}</option>)}</select><ChevronDown size={14} /></label><span className="filter-total"><SlidersHorizontal size={15} /> {players.length} resultados</span></div><div className="player-grid">{players.map((p) => <article className="player-card" key={p.id}><div className="player-card-top"><Avatar name={p.name} large /><span className="position-tag">{p.position}</span><button className="card-more" aria-label={`Opciones de ${p.name}`}>•••</button></div><div className="player-card-name"><h2>{p.name}</h2><span>{p.age} años <i /> {p.team}</span></div><div className="player-stats">{[[p.points.toFixed(1), "PTS / J"], [p.rebounds.toFixed(1), "REB / J"], [p.assists.toFixed(1), "AST / J"]].map(([v, label]) => <div key={label}><strong>{v}</strong><span>{label}</span></div>)}</div><div className="physical-row"><span>RENDIMIENTO FÍSICO</span><strong>{p.efficiency}%</strong><div className="progress-track"><i style={{ width: `${p.efficiency}%` }} /></div></div><div className="injury-row"><span className="injury-icon"><Activity size={14} /></span><span><small>HISTORIAL DE LESIONES</small><strong>{p.injuryHistory}</strong></span></div></article>)}{players.length === 0 && <div className="empty-state"><Search size={24} /><strong>No encontramos jugadores</strong><span>Prueba con otro nombre o posición.</span></div>}</div></>;
}
function UploadView({ message, error, inputRef, onFile }: { message: string; error: boolean; inputRef: RefObject<HTMLInputElement | null>; onFile: (file?: File) => void }) {
  const downloadTemplate = () => { const csv = "nombre,edad,posicion,equipo,puntos,rebotes,asistencias,lesiones\nAlex Rivera,20,Base,Equipo Demo,14.2,3.1,6.8,Sin antecedentes\n"; const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "plantilla-ia-scout.csv"; link.click(); URL.revokeObjectURL(link.href); };
  return <><Heading eyebrow="INGESTA DE DATOS" title="Carga de estadísticas" description="Actualiza el scouting del equipo con tus archivos de seguimiento." /><section className="upload-layout"><article className="panel upload-panel"><div className="upload-icon"><FileSpreadsheet size={24} /></div><h2>Importa un archivo</h2><p>Sube estadísticas de jugadores en formato CSV o Excel. Los datos se agregarán al plantel de esta sesión.</p><button className="button button-primary" onClick={() => inputRef.current?.click()}><Upload size={16} /> Seleccionar archivo</button><input ref={inputRef} className="visually-hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0])} /><span className="file-types">CSV · XLSX · XLS <i /> Hasta 10 MB</span>{message && <div className={`import-feedback ${error ? "feedback-error" : ""}`} role="status">{error ? <X size={17} /> : <Check size={17} />}{message}</div>}</article><article className="panel schema-panel"><span className="section-kicker">FORMATO DE COLUMNAS</span><h2>Prepara tus datos</h2><p>La primera fila debe contener encabezados. Se reconocen estas columnas:</p><div className="schema-list">{[["nombre", "Nombre del jugador"], ["edad", "Edad en años"], ["posición", "Base, escolta, alero, ala-pívot o pívot"], ["equipo", "Equipo actual"], ["puntos · rebotes · asistencias", "Promedio por partido"], ["lesiones", "Historial (opcional)"]].map(([key, description]) => <div className="schema-row" key={key}><code>{key}</code><span>{description}</span></div>)}</div><button className="download-template" onClick={downloadTemplate}><ArrowDownToLine size={15} /> Descargar plantilla CSV</button></article></section><aside className="privacy-note"><ShieldAlert size={16} /><p><strong>Control de datos</strong> · Los archivos se procesan en tu navegador. Esta demo no envía información a un servidor.</p></aside></>;
}
function Recommendations({ prospects }: { prospects: Player[] }) {
  return <><Heading eyebrow="ANÁLISIS DE TALENTO" title="Recomendaciones" description="Perfiles con mejor ajuste según producción, posición y necesidades de rotación." action={<span className="ai-pill"><Sparkles size={14} /> MODELO ACTIVO</span>} /><div className="recommendation-layout"><section className="panel recommendation-panel"><div className="panel-heading"><div><span className="section-kicker">PROSPECTOS SUGERIDOS</span><h2>Mejor ajuste para el equipo</h2></div><span className="updated-label">Actualizado hoy</span></div><div className="recommendation-list">{prospects.map((p, index) => <article className="recommendation-card" key={p.id}><span className="recommendation-index">{String(index + 1).padStart(2, "0")}</span><Avatar name={p.name} large /><div className="recommendation-copy"><div className="recommendation-name"><h3>{p.name}</h3><span className="position-tag">{p.position}</span></div><p>{p.rationale}</p><div className="recommendation-meta">{p.team}<i />{p.age} años<i />{p.points.toFixed(1)} PTS/J</div></div><div className="recommendation-score"><Rating value={p.rating} /><small>AJUSTE IA</small></div></article>)}</div><p className="model-footnote"><CircleHelp size={14} /> Puntuaciones orientativas; no garantizan rendimiento futuro.</p></section><aside className="panel needs-panel"><span className="section-kicker">NECESIDADES DETECTADAS</span><h2>Perfil de búsqueda</h2><p>Prioridades sugeridas para el siguiente ciclo:</p>{[["01", "Creación de juego", "Asistencias por partido", "ALTA"], ["02", "Tiro exterior", "Eficiencia en perímetro", "MEDIA"], ["03", "Profundidad interior", "Rebote y protección de aro", "MEDIA"]].map(([n, title, detail, level]) => <div className="need-row" key={n}><span className="need-number">{n}</span><div><strong>{title}</strong><small>{detail}</small></div><span className={`need-level ${level === "MEDIA" ? "need-medium" : ""}`}>{level}</span></div>)}<div className="scout-callout"><Sparkles size={17} /><span>Valida disponibilidad, contexto y fit cultural con el cuerpo técnico.</span></div></aside></div><section className="panel rotation-panel"><div className="panel-heading"><div><span className="section-kicker">PRÓXIMO PARTIDO · PROPUESTA</span><h2>Sugerencia de rotación</h2></div><span className="opponent-tag">VS. TIGRES UANL · SÁB 18 OCT</span></div><div className="rotation-timeline">{rotation.map((segment) => <article className="rotation-segment" key={segment.time}><div className="rotation-time">{segment.time}</div><div className="rotation-dot" /><div className="rotation-detail"><strong>{segment.note}</strong><div className="rotation-players">{segment.players.map((p) => <span key={p}>{p}</span>)}</div></div></article>)}</div><p className="rotation-note"><ShieldAlert size={14} /> Propuesta orientativa. Validar con el staff médico y técnico.</p></section></>;
}
function Reports({ players }: { players: Player[] }) {
  const leaders = [...players].sort((a, b) => b.points - a.points).slice(0, 6);
  return <><Heading eyebrow="RENDIMIENTO Y TENDENCIAS" title="Reportes" description="Indicadores individuales y evolución del rendimiento del plantel." action={<button className="button button-secondary" onClick={() => window.print()}><ArrowDownToLine size={16} /> Exportar reporte</button>} /><section className="report-summary"><Stat label="Puntos por partido" value="16.8" suffix=" PPG" trend="+4.2% últimos 5 juegos" icon={Crosshair} /><Stat label="Rebotes por partido" value="6.3" suffix=" RPG" trend="+1.1% últimos 5 juegos" icon={Activity} /><Stat label="Asistencias por partido" value="4.1" suffix=" APG" trend="+3.6% últimos 5 juegos" icon={Users} /></section><section className="report-grid"><article className="panel report-chart-panel"><div className="panel-heading"><div><span className="section-kicker">EVOLUCIÓN COLECTIVA</span><h2>Producción en últimos 6 partidos</h2></div></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={performanceTrend} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}><CartesianGrid stroke="#29302d" vertical={false} /><XAxis dataKey="game" axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="points" name="Puntos" stroke="#c5f36b" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="rebounds" name="Rebotes" stroke="#ff796c" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="assists" name="Asistencias" stroke="#74c6c4" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div><Legend /></article><article className="panel leaders-panel"><div className="panel-heading"><div><span className="section-kicker">LÍDERES DE ANOTACIÓN</span><h2>Puntos por partido</h2></div></div><div className="leaders-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={leaders} layout="vertical" margin={{ top: 0, right: 20, left: 5, bottom: 0 }}><CartesianGrid stroke="#29302d" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 10 }} /><YAxis type="category" dataKey="name" width={92} axisLine={false} tickLine={false} tick={{ fill: "#b9c0ba", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="points" name="Puntos" radius={[0, 4, 4, 0]} barSize={14}>{leaders.map((p, i) => <Cell key={p.id} fill={i === 0 ? "#c5f36b" : "#55704b"} />)}</Bar></BarChart></ResponsiveContainer></div></article></section><section className="panel individual-report"><div className="panel-heading"><div><span className="section-kicker">DETALLE INDIVIDUAL</span><h2>Rendimiento por jugador</h2></div><span className="report-period">ORDENADO POR EFICIENCIA</span></div><RosterTable players={players} reports /></section></>;
}
function Compare({ players, a, b, setA, setB }: { players: Player[]; a: Player; b: Player; setA: (id: string) => void; setB: (id: string) => void }) {
  const metrics = [{ key: "points", label: "Puntos", suffix: " PTS" }, { key: "rebounds", label: "Rebotes", suffix: " REB" }, { key: "assists", label: "Asistencias", suffix: " AST" }, { key: "efficiency", label: "Eficiencia", suffix: "%" }, { key: "speed", label: "Velocidad", suffix: "/100" }, { key: "stamina", label: "Resistencia", suffix: "/100" }] as const;
  const chartData = metrics.slice(0, 3).map((m) => ({ metric: m.label, [a.name]: a[m.key], [b.name]: b[m.key] }));
  return <><Heading eyebrow="ANÁLISIS DIRECTO" title="Comparar jugadores" description="Contrasta perfiles y estadísticas para entender sus fortalezas relativas." /><div className="compare-selectors">{[["JUGADOR A", a, setA], ["JUGADOR B", b, setB]].map(([label, selected, setter]) => <label key={String(label)}><span>{String(label)}</span><select value={(selected as Player).id} onChange={(e) => (setter as (id: string) => void)(e.target.value)}>{players.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.position}</option>)}</select><ChevronDown size={15} /></label>).reduce<ReactNode[]>((result, item, index) => { if (index === 1) result.push(<span className="versus" key="vs">VS</span>); result.push(item); return result; }, [])}</div><section className="compare-grid"><CompareCard player={a} side="A" /><article className="panel compare-chart-panel"><div className="panel-heading"><div><span className="section-kicker">COMPARATIVA ESTADÍSTICA</span><h2>Producción por partido</h2></div></div><div className="compare-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 18, right: 6, left: -20, bottom: 4 }}><CartesianGrid stroke="#29302d" vertical={false} /><XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#7f8983", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey={a.name} name={a.name} fill="#c5f36b" radius={[3, 3, 0, 0]} barSize={18} /><Bar dataKey={b.name} name={b.name} fill="#ff796c" radius={[3, 3, 0, 0]} barSize={18} /></BarChart></ResponsiveContainer></div><div className="compare-legend"><span><i className="legend-lime" />{a.name}</span><span><i className="legend-coral" />{b.name}</span></div></article><CompareCard player={b} side="B" /></section><section className="panel compare-table-panel"><div className="panel-heading"><div><span className="section-kicker">DESGLOSE DE PERFIL</span><h2>Indicadores clave</h2></div></div><div className="compare-table">{metrics.map((m) => <div className="compare-metric-row" key={m.key}><strong className={a[m.key] >= b[m.key] ? "metric-winner" : ""}>{a[m.key]}{m.suffix}</strong><span>{m.label}</span><strong className={b[m.key] > a[m.key] ? "metric-winner" : ""}>{b[m.key]}{m.suffix}</strong></div>)}<div className="compare-metric-row"><strong>{a.injuryHistory}</strong><span>Historial de lesiones</span><strong>{b.injuryHistory}</strong></div></div></section><p className="compare-disclaimer"><ShieldAlert size={14} /> Considera minutos jugados, rol y nivel de competencia.</p></>;
}
function CompareCard({ player, side }: { player: Player; side: "A" | "B" }) {
  return <article className={`panel compare-player-card compare-side-${side.toLowerCase()}`}><span className="compare-side-label">JUGADOR {side}</span><Avatar name={player.name} large /><h2>{player.name}</h2><p>{player.position} · {player.age} años</p><span className="compare-team">{player.team}</span><div className="compare-rating"><Rating value={player.rating} /><small>RATING DE SCOUTING</small></div><div className="compare-mini-stats">{[[player.points.toFixed(1), "PTS"], [player.rebounds.toFixed(1), "REB"], [player.assists.toFixed(1), "AST"]].map(([v, label]) => <span key={label}><strong>{v}</strong><small>{label}</small></span>)}</div></article>;
}
