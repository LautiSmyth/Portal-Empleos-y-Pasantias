Diagnóstico General

El panel depende de dos capas: llamadas directas al cliente de Supabase (con RLS) y un Admin API con Service Role (/api/*). Muchas funciones administrativas solo funcionan si el usuario está autenticado en Supabase como ADMIN o si el Admin API está correctamente configurado y protegido.
En desarrollo local, sin sesión de Supabase y sin Admin API activo, varias acciones fallan silenciosamente o muestran estados vacíos por RLS.
Hay un fallback incompleto para edición de perfil vía RPC que no existe, y la búsqueda por email degrada a consulta de profiles ignorando el email si el Admin API no está disponible.
Problemas por Funcionalidad

Creación de usuarios
Síntomas: El formulario depende de VITE_ADMIN_API_URL para POST /create-user. Sin Admin API o sin token, la creación falla con mensaje genérico.
Gravedad: importante.
Áreas a desarrollar: Validar disponibilidad del Admin API antes de habilitar el submit; mejorar feedback de errores (mostrar respuesta del backend); auditar en servidor.
Recomendaciones:
Asegurar VITE_ADMIN_API_URL y VITE_ADMIN_API_TOKEN en frontend, y SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_API_TOKEN en backend.
Registrar la acción en el backend para garantizar auditoría (server-side logging).
Reset de contraseña
Síntomas: Requiere Admin API (POST /reset-password). Sin Admin API o sin token, error; en producción devuelve action_link opcional.
Gravedad: importante.
Áreas a desarrollar: Confirmación visual más clara; manejo de errores detallado; auditoría en servidor.
Recomendaciones:
Validar configuración del Admin API y mostrar advertencias si no está disponible.
Registrar acción en backend; asegurar FRONTEND_ORIGIN en backend para generar enlaces correctos.
Búsqueda de perfiles (email/rol/universidad)
Síntomas:
Con email: solo funciona si está el Admin API (GET /search-users); si no, se ignora el filtro de email y se usa profiles con rol/universidad, lo que puede confundir.
Sin sesión ADMIN, RLS limita lecturas y resultados pueden estar vacíos.
Gravedad: menor.
Áreas a desarrollar: Deshabilitar campo email si no hay Admin API; indicar claramente que la búsqueda por email no está activa.
Recomendaciones:
Si VITE_ADMIN_API_URL no está presente y hay email, bloquear la búsqueda con un aviso explícito.
Agregar indicadores de estado (p.ej., “API admin no configurada, búsqueda por email desactivada”).
Edición de perfil
Síntomas: adminUpdateProfile intenta Admin API y, si no está configurada, llama RPC admin_update_profile que NO existe; el fallback final (update directo) nunca se ejecuta porque el error de RPC no lanza excepción.
Gravedad: importante.
Áreas a desarrollar: Definir la función SQL admin_update_profile o eliminar el fallback a RPC y obligar a usar Admin API.
Recomendaciones:
Implementar POST /update-profile exclusivamente (ya existe) como ruta principal; eliminar RPC inexistente o crear la función en SQL con security definer y chequeo de ADMIN similar a otras RPC.
Registrar en servidor la auditoría de cambios para garantizar que el log se escriba aunque el cliente no tenga permisos.
Autorización de cuentas (confirmar email)
Síntomas: Autorizar usa Admin API (POST /authorize-user). Sin Admin API o token, falla; la UI no muestra el estado email_verified porque no se lee de auth.users.
Gravedad: importante.
Áreas a desarrollar: Feedback visual post-acción (p.ej., icono de “email verificado”); posibilidad de autorizar por email desde formulario.
Recomendaciones:
Agregar un campo en “Gestión de usuarios” para autorizar por email además del botón por usuario.
Mostrar estado de verificación si está disponible (requiere Admin API para consultar auth.users).
Verificación/Suspensión de empresas
Síntomas: Toggling de suspended via RPC admin_toggle_company_suspended exige sesión Supabase con rol ADMIN por RLS; sin login, falla con “not authorized”.
Gravedad: importante.
Áreas a desarrollar: Asegurar sesión Supabase para ADMIN; o mover la operación al Admin API para evitar dependencia de RLS en cliente.
Recomendaciones:
En producción, autenticar al admin en Supabase; verificar que exista profiles con role='ADMIN'.
Alternativa: crear endpoint /toggle-company en Admin API que use Service Role y garantice la operación y el log.
Activación/Ocultación de puestos
Síntomas: Toggling de is_active via RPC admin_toggle_job_active requiere sesión ADMIN; sin login, falla por RLS.
Gravedad: importante.
Áreas a desarrollar: Igual que empresas; sesión de Supabase o mover al Admin API.
Recomendaciones:
Validar sesión ADMIN; o implementar /toggle-job en Admin API con registro en admin_logs.
Moderación de postulaciones
Síntomas: Listado y actualización de estado dependen de RLS; sin sesión ADMIN, la lista aparece vacía y el cambio de estado falla.
Gravedad: importante.
Áreas a desarrollar: Lectura y actualización desde Admin API o asegurar login de Supabase ADMIN.
Recomendaciones:
Crear un endpoint /applications en Admin API para listar con filtros y otro /update-application-status para actualizar, ambas con Service Role y auditoría.
Si se mantiene cliente directo, garantizar sesión Supabase ADMIN en la app.
Estadísticas (conteos)
Síntomas: select('*', { count:'exact', head:true }) en profiles y applications puede devolver null o 0 sin error visible si RLS bloquea; la UI muestra ....
Gravedad: importante.
Áreas a desarrollar: Estrategia de conteos bajo RLS; feedback si el conteo está bloqueado.
Recomendaciones:
Exponer GET /stats en Admin API que retorne los conteos con Service Role.
Mostrar aviso si el cliente detecta error en conteos y sugerir configurar Admin API o iniciar sesión Supabase.
Registro de auditoría (admin_logs)
Síntomas: La UI intenta insertar en admin_logs con supabase y solo cae al Admin API si falla. Sin sesión ADMIN, RLS prohíbe insert y el fallback al Admin API depende de estar configurado; si no lo está, se pierde la auditoría.
Gravedad: menor.
Áreas a desarrollar: Registrar siempre desde backend (server-side) las operaciones críticas para atomicidad.
Recomendaciones:
Mover el logging de authorize, update-profile, toggle-*, update-application al servidor correspondiente que ejecuta la operación.
Mantener logging cliente solo como complemento.
Configuración de entorno y seguridad
Síntomas:
Si ADMIN_API_TOKEN no está seteado en backend, los endpoints quedan abiertos.
Si VITE_ADMIN_API_TOKEN ≠ ADMIN_API_TOKEN, las llamadas fallan con 401.
Si faltan SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY en funciones (/api/*), responden 500.
Gravedad: crítico.
Áreas a desarrollar: Checklist de envs para Vercel y local; verificación al inicio; mensajes de diagnóstico claros.
Recomendaciones:
En Vercel Functions: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_API_TOKEN.
En frontend: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_API_URL=/api y VITE_ADMIN_API_TOKEN igual al backend.
Añadir prueba de salud GET /api/health en el panel (badge).
Desarrollo local (Vite + HashRouter)
Síntomas: Vite no proxya /api; sin vercel dev o servidor Node, las llamadas del Admin API responden 404; varias acciones parecen “rotas”.
Gravedad: importante.
Áreas a desarrollar: Guía y automatización del entorno local; verificación de conectividad desde UI.
Recomendaciones:
Para local: levantar server/index.js en http://localhost:8787 y setear VITE_ADMIN_API_URL=http://localhost:8787.
Alternativa: usar vercel dev para exponer /api con envs.
Hallazgos Técnicos Clave

RPCs implementadas con security definer: admin_update_application_status, admin_toggle_job_active, admin_toggle_company_suspended con chequeo de ADMIN vía auth.uid(); requieren sesión Supabase autenticada para ADMIN.
RPC inexistente: admin_update_profile no está definida; el fallback actual del cliente no sirve.
RLS en policies.sql:
profiles: solo propia o admin, y las políticas admin son “to authenticated” (no aplican a anon).
applications: admin “to authenticated”; estudiantes pueden ver propias; empresas pueden ver aplicaciones de sus jobs.
companies y jobs: lectura pública condicionada por suspended/is_active; el resto exige dueños o admins autenticados.
Admin API /api/* correctamente protege por X-Admin-Token si ADMIN_API_TOKEN está presente; sin token, quedan abiertos.
Prioridad de Correcciones

Crítico
Alinear y activar variables de entorno en backend y frontend; proteger Admin API con ADMIN_API_TOKEN.
Implementar sesión real de Supabase para ADMIN en la app (o migrar todas las operaciones administrativas al Admin API).
Importante
Definir o eliminar admin_update_profile RPC; usar POST /update-profile de forma consistente.
Exponer /stats, /applications, /update-application-status, /toggle-job, /toggle-company en Admin API para operar sin RLS del cliente.
Mejorar feedback de errores y estados en panel (conteos bloqueados, API no disponible).
Menor
Deshabilitar búsqueda por email sin Admin API; avisos explícitos en UI.
Mostrar estado “email verificado” tras autorizar; agregar autorización por email en formulario.
Centralizar logging en backend para acciones críticas.
Recomendaciones Específicas

Autenticación ADMIN
Implementar login real con Supabase; al iniciar sesión, auth.uid() corresponde al perfil con role='ADMIN' para que RLS y RPC funcionen.
Si no se desea login en cliente, mover todas las acciones administrativas a Admin API con Service Role.
Perfil
Eliminar el fallback a supabase.rpc('admin_update_profile') o crear la función en schema.sql con security definer y chequeo de ADMIN.
Usar siempre POST /update-profile; registrar log desde backend.
Toggling y Moderación
Mantener RPCs solo si el admin inicia sesión; si no, crear endpoints en Admin API y consumirlos desde el panel.
Añadir confirmaciones visuales y toasts robustos.
Búsqueda y Estadísticas
Búsqueda por email: bloquear si Admin API no está; mostrar banner.
Conteos: crear /stats en Admin API; en UI, si falla, mostrar advertencia con acción sugerida (“Configure Admin API o inicie sesión como ADMIN”).
Seguridad y Entorno
Establecer ADMIN_API_TOKEN y sincronizar VITE_ADMIN_API_TOKEN.
Verificar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en funciones; si faltan, mostrar aviso en panel.
Añadir GET /api/health badge en panel para diagnóstico rápido.
Auditoría
Mover logs de acciones al backend que ejecuta la modificación; mantener el log cliente como redundancia.
Local Dev
Documentar que, para probar el panel, se debe tener: Supabase con datos y sesión ADMIN, o Admin API levantado.
Proveer npm script para iniciar el Admin API y setear VITE_ADMIN_API_URL.
Resumen Accionable

Activar y proteger Admin API; validar envs y token.
Implementar sesión Supabase para ADMIN o migrar acciones a Admin API.
Corregir adminUpdateProfile eliminando el RPC inexistente o creándolo.
Mejorar UX: estados y errores claros; bloquear email search sin API; mostrar verificación de email.
Añadir endpoints de stats y moderación al Admin API para operar con Service Role y registrar auditorías servidor-side.