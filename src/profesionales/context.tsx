import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { profesionales } from './index';
import { Profesional, RegistroInput, ResultadoAuth, ResultadoIngreso, ResultadoRegistro } from './types';

interface ProfesionalCtx {
  profesional: Profesional | null;
  cargando: boolean;
  registrar(input: RegistroInput): Promise<ResultadoRegistro>;
  /** En demo entra al instante; con Shopify redirige a la página que manda el código por email. */
  ingresar(email: string): Promise<ResultadoIngreso>;
  /** Vuelta del login de Shopify (/CPS/acceso?code=…). */
  completarIngreso(params: URLSearchParams): Promise<ResultadoAuth>;
  salir(): Promise<void>;
  /** Reemplaza el profesional en memoria después de una acción (inscripción, perfil…). */
  actualizar(p: Profesional): void;
}

const Ctx = createContext<ProfesionalCtx | null>(null);

export function ProfesionalProvider({ children }: { children: ReactNode }) {
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    profesionales.sesionActual().then(setProfesional).catch(() => setProfesional(null)).finally(() => setCargando(false));
  }, []);

  const conProfesional = useCallback(<R extends { ok: boolean }>(r: R) => {
    if (r.ok && 'profesional' in r && r.profesional) setProfesional(r.profesional as Profesional);
    return r;
  }, []);

  const value: ProfesionalCtx = {
    profesional,
    cargando,
    registrar: async input => conProfesional(await profesionales.registrar(input)),
    ingresar: async email => conProfesional(await profesionales.ingresar(email)),
    completarIngreso: async params => conProfesional(
      profesionales.completarIngreso
        ? await profesionales.completarIngreso(params)
        : { ok: false, error: 'Ingreso no disponible.' } as ResultadoAuth,
    ),
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
