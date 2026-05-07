"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VoluntarioData {
    id_voluntario: number;
    nombre: string;
    apellidos: string;
    telefono: string;
    correo: string;
}

interface AsignacionData {
    escuela: string;
    programa: string;
    grado: string | number;
    grupo: string;
    dia_semana: string | null;
    sesion_1: string | null;
    sesion_2: string | null;
    sesion_3: string | null;
    sesion_4: string | null;
    sesion_5: string | null;
    sesion_6: string | null;
    sesion_7: string | null;
}

// ─── Utility: Próxima Sesión ─────────────────────────────────────────────────

// Obtiene la primera sesión que sea mayor a la fecha actual
const getNextSession = (asig: AsignacionData): Date | null => {
    const sessions = [
        asig.sesion_1,
        asig.sesion_2,
        asig.sesion_3,
        asig.sesion_4,
        asig.sesion_5,
        asig.sesion_6,
        asig.sesion_7,
    ];

    const now = new Date();
    let nextSession: Date | null = null;

    for (const sessionStr of sessions) {
        if (!sessionStr) continue;
        
        const sessionDate = new Date(sessionStr);
        // Si la sesión es en el futuro y (aún no tenemos próxima o esta es más cercana)
        if (sessionDate > now && (!nextSession || sessionDate < nextSession)) {
            nextSession = sessionDate;
        }
    }

    return nextSession;
};

// Formatea la fecha de forma robusta e inteligente (ej: 'martes 21 de octubre, 10:30 a. m.')
const formatSessionDate = (date: Date): string => {
    const formatter = new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
    
    // Capitalizar la primera letra del día para que se vea mejor
    const formatted = formatter.format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// ─── Chistes Buena Onda ──────────────────────────────────────────────────────

const JOKES = [
    "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
    "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter.",
    "¿Qué le dice un espagueti a otro? ¡El cuerpo me pide salsa!",
    "¿Por qué lloraba el libro de matemáticas? ¡Porque tenía muchos problemas!",
    "¿Qué le dice un techo a otro? Techo de menos.",
    "¿Qué hace un perro con un taladro? Taladrando.",
    "¿Por qué las focas miran siempre hacia arriba? ¡Porque ahí están los focos!",
    "¿Qué le dice un pez a otro? Nada.",
    "¿Cuál es el colmo de un electricista? Que su mujer se llame Luz.",
    "¿Qué hace un vampiro conduciendo un tractor? Sembrando el pánico.",
    "¿Por qué los esqueletos no pelean entre ellos? Porque no tienen agallas."
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [voluntario, setVoluntario] = useState<VoluntarioData | null>(null);
    const [totalHoras, setTotalHoras] = useState(0);
    const [asignaciones, setAsignaciones] = useState<AsignacionData[]>([]);
    const [joke, setJoke] = useState("");
    
    // UI State para el Formulario (Mockup)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedGrupo, setSelectedGrupo] = useState<string>("");

    useEffect(() => {
        const fetchAll = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data: vol, error: volError } = await supabase
                .from("Voluntarios")
                .select("id_voluntario, nombre, apellidos, telefono, correo")
                .eq("correo", user.email)
                .single();

            if (volError || !vol) {
                console.error("Error obteniendo voluntario:", volError);
                setLoading(false);
                return;
            }

            setVoluntario(vol as VoluntarioData);
            const idVol = vol.id_voluntario;

            const { data: bitacora } = await supabase
                .from("Bitacora")
                .select("horas")
                .eq("id_voluntario", idVol);

            let sumaHoras = 0;
            if (bitacora && bitacora.length > 0) {
                sumaHoras = bitacora.reduce((acc: number, row: { horas: number }) => acc + (row.horas ?? 0), 0);
                setTotalHoras(sumaHoras);
            }

            const { data: asig } = await supabase
                .from("Asignaciones")
                .select("escuela, programa, grado, grupo, dia_semana, sesion_1, sesion_2, sesion_3, sesion_4, sesion_5, sesion_6, sesion_7")
                .eq("id_voluntario", idVol);

            if (asig && asig.length > 0) {
                setAsignaciones(asig as AsignacionData[]);
            }

            setLoading(false);
            setJoke(JOKES[Math.floor(Math.random() * JOKES.length)]);
        };

        fetchAll();
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-900" />
                </div>
            </div>
        );
    }

    // Calcula el porcentaje asumiendo una meta de 255 horas
    const goal = 255;
    const progressPercent = Math.min(Math.round((totalHoras / goal) * 100), 100);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* Top Navigation Bar Simulation */}
            <div className="w-full bg-white border-b border-slate-200 h-16 flex items-center px-6 lg:px-10 justify-between sticky top-0 z-10">
                <div className="flex items-center gap-8">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-white font-bold text-lg">
                            V
                        </div>
                        <span className="font-bold text-indigo-950 text-xl tracking-tight hidden sm:block">Voluntario Hub</span>
                    </div>

                    {/* Tabs */}
                    <nav className="hidden md:flex items-center gap-1 h-16">
                        <a href="#" className="h-full flex items-center px-4 border-b-2 border-indigo-900 text-indigo-950 font-semibold text-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Dashboard
                        </a>
                        <a href="#" className="h-full flex items-center px-4 text-slate-500 hover:text-indigo-900 font-medium text-sm transition-colors">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Bitácora
                        </a>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-600 font-bold text-xs uppercase cursor-pointer">
                        {voluntario?.nombre.substring(0,2)}
                    </div>
                </div>
            </div>

            {/* Main Layout Container */}
            <div className="flex flex-1 flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
                
                {/* ── LEFT SIDEBAR (Summary) ── */}
                <aside className="w-full lg:w-[320px] xl:w-[380px] bg-slate-50/80 lg:bg-slate-50 border-r border-slate-200 flex-shrink-0 p-6 lg:p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-indigo-950 tracking-tight">Resumen</h2>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            En este espacio podrás ver tus próximas sesiones y tu información respecto al programa de voluntarios.
                        </p>
                    </div>

                    {/* Gauge Chart Simulation */}
                    <div className="flex flex-col items-center justify-center mb-8 relative">
                        {/* We use SVG arcs to simulate the "Your Plastic Reduction" concentric lines */}
                        <svg className="w-48 h-28 transform" viewBox="0 0 100 50">
                            {/* Outer Track (Dark Blue) - represents goal */}
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeLinecap="round" strokeDasharray="125" strokeDashoffset={125 - (125 * progressPercent) / 100} className="transition-all duration-1000 ease-out" />
                        </svg>
                        
                        <div className="absolute bottom-2 flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-indigo-950 tracking-tighter">{totalHoras}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Horas Totales (2025)</span>
                        </div>
                    </div>

                    {/* Stats List (Matching Image) */}
                    <div className="flex flex-col gap-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-indigo-950">Asignaciones activas</span>
                            <span className="font-semibold text-indigo-950">{asignaciones.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-emerald-500">Progreso del programa</span>
                            <span className="font-semibold text-emerald-500">{progressPercent}%</span>
                        </div>
                    </div>

                    <hr className="border-t border-slate-200 my-8" />

                    {/* Chiste del día */}
                    <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/40 to-transparent rounded-bl-full pointer-events-none" />
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">✨</span>
                            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900">Para alegrar el día</h3>
                        </div>
                        <p className="text-sm text-indigo-950 font-medium italic leading-relaxed">
                            "{joke}"
                        </p>
                    </div>
                </aside>

                {/* ── MAIN CONTENT AREA ── */}
                <main className="flex-1 bg-white p-6 lg:p-10 xl:p-14 overflow-y-auto">
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Tus asignaciones</h2>
                            <p className="text-slate-500 text-sm mt-1">Revisa tus grupos y las próximas sesiones para este ciclo.</p>
                        </div>
                        <div className="flex gap-3">
                             <button className="px-4 py-2 bg-white border border-slate-200 text-indigo-950 font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-slate-50">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Editar perfil
                            </button>
                            <button className="px-4 py-2 bg-indigo-900 text-white font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-indigo-800 shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generar reporte
                            </button>
                        </div>
                    </div>

                    <hr className="border-t border-slate-100 mb-8" />

                    <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-xl font-bold text-indigo-950">Asignaciones</h3>
                        <span className="bg-slate-100 text-indigo-950 text-xs font-bold px-2 py-0.5 rounded flex items-center justify-center">
                            {asignaciones.length}
                        </span>
                    </div>

                    {/* Cards Grid mimicking "Strategies" rows */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {asignaciones.length > 0 ? (
                            asignaciones.map((asig, index) => {
                                const nextSession = getNextSession(asig);
                                const isActive = !!nextSession;

                                return (
                                    <div key={index} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-indigo-950 leading-tight">
                                                        {asig.escuela}
                                                    </h4>
                                                    {isActive && (
                                                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"></path></svg>
                                                           Activa
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-slate-400">Grupo {asig.grupo} • {asig.grado}° Grado</p>
                                            </div>
                                            
                                            <button className="text-slate-400 hover:text-indigo-900">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-auto">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    Próxima Sesión
                                                </p>
                                                <p className={`text-sm font-bold ${isActive ? 'text-indigo-950' : 'text-slate-400'} truncate`}>
                                                    {isActive ? formatSessionDate(nextSession) : 'Completadas'}
                                                </p>
                                                {isActive && (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedGrupo(`${asig.escuela} - Grupo ${asig.grupo}`);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="mt-2 text-[10px] px-2 py-1 bg-indigo-50 text-indigo-700 font-bold rounded hover:bg-indigo-100 transition-colors"
                                                    >
                                                        Completar Sesión
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                    Programa
                                                </p>
                                                <p className="text-sm font-bold text-indigo-950 truncate">
                                                    {asig.programa}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                <p className="font-bold text-slate-400">Aún no hay asignaciones activas.</p>
                            </div>
                        )}
                        
                        {/* New strategy button equivalent */}
                        <div className="bg-slate-50 border border-dashed border-slate-300 p-5 rounded-xl flex items-center justify-center min-h-[160px] cursor-pointer hover:bg-slate-100 transition-colors group">
                            <span className="text-sm font-bold text-indigo-900 flex items-center gap-2 group-hover:scale-105 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Registrar nueva sesión
                            </span>
                        </div>
                    </div>

                    {/* MOCKUP: Modal de Formulario de Sesión */}
                    {isFormOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-900 text-white">
                                    <div>
                                        <h3 className="text-xl font-bold">Reporte de Sesión</h3>
                                        <p className="text-indigo-200 text-sm mt-1">{selectedGrupo}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsFormOpen(false)}
                                        className="text-indigo-200 hover:text-white"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-5">
                                    <p className="text-sm text-slate-500 mb-4">
                                        Por favor, completa este breve formulario para validar tu asistencia y el desarrollo de la sesión.
                                    </p>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-indigo-950 mb-1">1. ¿Qué te pareció el comportamiento y atención del grupo?</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 outline-none">
                                            <option>Selecciona una opción</option>
                                            <option>Excelente, muy participativos.</option>
                                            <option>Bueno, aunque hubo algunas distracciones.</option>
                                            <option>Regular, costó mantener el orden.</option>
                                            <option>Difícil, el grupo estuvo muy inquieto.</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-indigo-950 mb-1">2. ¿Se logró cubrir el contenido planeado?</label>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="contenido" className="text-indigo-900 focus:ring-indigo-900" />
                                                <span className="text-sm text-slate-700">Sí, en su totalidad</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="contenido" className="text-indigo-900 focus:ring-indigo-900" />
                                                <span className="text-sm text-slate-700">No, faltó tiempo</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-indigo-950 mb-1">3. ¿Qué fue lo que más se te dificultó al dar la clase?</label>
                                        <textarea 
                                            placeholder="Ej. Mantener la atención, falta de material..."
                                            className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 outline-none h-24 resize-none"
                                        ></textarea>
                                    </div>
                                    
                                     <div>
                                        <label className="block text-sm font-bold text-indigo-950 mb-1">4. Comentarios adicionales o apoyo requerido</label>
                                        <textarea 
                                            placeholder="Opcional"
                                            className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 outline-none h-20 resize-none"
                                        ></textarea>
                                    </div>

                                </div>
                                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                     <button 
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-5 py-2.5 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            alert("¡Reporte enviado exitosamente! (Modo Mockup)");
                                            setIsFormOpen(false);
                                        }}
                                        className="px-5 py-2.5 bg-indigo-900 text-white font-bold text-sm rounded-lg hover:bg-indigo-800 shadow-sm"
                                    >
                                        Enviar Reporte
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
