"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Voluntario {
    id: string | number;
    nombre: string;
}

export default function AdminPage() {
    const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('Voluntarios')
                .select('id, nombre')
                .eq('rol', 'voluntario');

            if (data && !error) {
                setVoluntarios(data);
            }
            setLoading(false);
        };

        checkAuthAndFetch();
    }, [router]);

    const handleSelectVoluntario = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const volId = e.target.value;
        if (volId) {
            console.log('ID del voluntario seleccionado:', volId);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-10 shadow-xl border border-gray-100">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
                    Panel de Administración
                </h1>

                <div className="max-w-md">
                    <label htmlFor="voluntario-select" className="block text-sm font-semibold text-gray-700 mb-3">
                        Ver como...
                    </label>
                    <div className="relative">
                        <select
                            id="voluntario-select"
                            onChange={handleSelectVoluntario}
                            defaultValue=""
                            className="block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-8 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="" disabled>Selecciona un voluntario</option>
                            {voluntarios.map((vol) => (
                                <option key={vol.id} value={vol.id}>
                                    {vol.nombre || 'Voluntario sin nombre'}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
