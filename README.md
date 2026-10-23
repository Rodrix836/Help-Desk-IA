# NeuraDesk AI — Help Desk con Supabase

Prototipo web de un servicio de gestión de incidencias para la empresa ficticia NeuraTech AI. Cada solicitante registra y consulta sus tickets; soporte ve la cola completa y actualiza estados. Los datos se guardan en PostgreSQL de Supabase y el acceso se controla con Supabase Auth y Row Level Security (RLS).

**Demo publicada:** [NeuraDesk AI en GitHub Pages](https://rodrix836.github.io/Help-Desk-IA/). La publicación utiliza la rama `feature/neuradesk-supabase` mientras se revisa el pull request.

El planteamiento completo, objetivos e indicadores están en [docs/CASO_PRACTICO.md](docs/CASO_PRACTICO.md).

## Funciones

- Registro e inicio de sesión con correo y contraseña.
- Tickets persistentes y compartidos entre dispositivos.
- Roles «solicitante» y «soporte» con permisos aplicados en la base de datos.
- Búsqueda, filtros, conteos y cambio de estado.
- Sugerencia de categoría y prioridad mediante palabras clave (no es IA real).
- Interfaz adaptable a móvil y escritorio.

## Puesta en marcha

Esta copia ya apunta al proyecto gratuito **NeuraDesk AI** (`qfpufmpkucnqcbdnuuuv`). La migración SQL se ejecutó allí el 23 de octubre de 2026, `js/config.js` contiene únicamente la URL y la clave publicable, y Supabase Auth permite el retorno a la demo publicada. Para usar otro proyecto:

1. Crea un proyecto de Supabase.
2. En **SQL Editor**, ejecuta el contenido de `supabase/migrations/20261023_initial.sql` una sola vez sobre ese proyecto nuevo.
3. En **Project Settings → API Keys**, copia la URL y la **publishable key** (o la clave pública `anon` de un proyecto anterior) a `js/config.js`. No uses `service_role` ni la contraseña de PostgreSQL en el navegador.
4. En **Authentication → URL Configuration**, configura la URL donde abrirás la app como Site URL o Redirect URL permitida. La app envía esa URL al registrar una cuenta para que el enlace de confirmación vuelva al portal.
5. Sirve la carpeta mediante un servidor HTTP local o publícala en GitHub Pages. Por ejemplo, desde la raíz del repositorio: `python -m http.server 8000`. Abre `http://localhost:8000` y registra esa URL en Supabase para la prueba local.
6. Registra una cuenta, confirma el correo si Supabase lo solicita e inicia sesión. Crea un ticket y comprueba que se conserve al recargar.

En el proyecto conectado, puedes comenzar por el paso 4. Abrir el archivo con `file://` no es recomendable para el flujo de confirmación de correo.

## Habilitar la cuenta de soporte

Registra primero la cuenta que usará el equipo de soporte. Luego, desde SQL Editor, ejecuta esta sentencia sustituyendo el correo por el de esa cuenta:

```sql
update public.profiles
set role = 'soporte'
where id = (select id from auth.users where email = 'soporte@tu-dominio.com');
```

Cierra sesión y vuelve a entrar para que la interfaz muestre el nuevo rol. Un solicitante no puede asignarse ese permiso desde la app ni modificar estados mediante la API.

## Prueba del caso

1. Entra como solicitante, registra un ticket y recarga la página: debe seguir visible.
2. Entra con otra cuenta solicitante: no debe verse el ticket anterior.
3. Entra como soporte: debe ver ambos y poder pasar uno a «En proceso» y «Resuelto».
4. Vuelve a la primera cuenta: debe ver el estado actualizado.
5. Prueba los filtros y la sugerencia de triaje.

## Estructura

```text
index.html
css/styles.css
js/config.js
js/app.js
supabase/migrations/20261023_initial.sql
docs/CASO_PRACTICO.md
```

El navegador carga `@supabase/supabase-js@2` desde jsDelivr. La clave publicable puede estar en el código cliente porque RLS controla las filas y operaciones permitidas. Nunca publiques una clave secreta ni una contraseña de base de datos. El antiguo contenido de `localStorage` no se migra automáticamente: la nueva versión consulta únicamente Supabase.

## Limitaciones del prototipo

La asignación del rol de soporte es manual. No hay notificaciones por correo, archivos adjuntos ni automatización real de triaje. La app carga todos los tickets visibles en lotes de 500 para este caso académico; una instalación grande debería añadir paginación y métricas calculadas en el servidor.

