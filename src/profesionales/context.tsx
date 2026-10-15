import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { profesionales } from './mock';
import { Profesional, RegistroInput, ResultadoAuth } from './types';

interface ProfesionalCtx {
  profesional: Profesional | null;
  cargando: boolean;
  registrar(input: RegistroInput): Promise<ResultadoAuth>;
  ingresar(email: string, password: string): Promise<ResultadoAuth>;
  salir(): Promise<void>;
  /** Reemplaza el profesional en memoria después de una acción (inscripción, perfil…). */
  actualizar(p: Profesional): void;
}

const Ctx = createContext<ProfesionalCtx | null>(null);

export function ProfesionalProvider({ children }: { children: ReactNode }) {
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    profesionales.sesionActual().then(setProfesional).finally(() => setCargando(false));
  }, []);

  const conResultado = useCallback(async (p: Promise<ResultadoAuth>) => {
    const r = await p;
    if (r.ok) setProfesional(r.profesional);
    return r;
  }, []);

  const value: ProfesionalCtx = {
    profesional,
    cargando,
    registrar: input => conResultado(profesionales.registrar(input)),
    ingresar: (email, password) => conResultado(profesionales.ingresar(email, password)),
    salir: async () => { await profesionales.salir(); setProfesional(null); },
    actualizar: setProfesional,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfesional() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfesional debe usarse dentro de <ProfesionalProvider>');
  return ctx;
}
