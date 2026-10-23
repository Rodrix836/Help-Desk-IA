# Caso práctico: NeuraDesk AI

## 1. Contexto y problema

**NeuraTech AI** es una empresa ficticia que desarrolla modelos predictivos y soluciones de visión artificial. Sus colaboradores reportan fallos por correo y chat. El equipo de soporte no tiene una lista central, pierde el contexto de cada solicitud y no puede distinguir los casos urgentes de los resueltos.

**Situación medible inicial (supuesto del caso):** 30 incidencias por semana, 15 minutos para localizar el historial de una solicitud y ausencia de una cifra confiable de pendientes. Estas cifras son hipótesis para la exposición, no resultados observados.

## 2. Propuesta de valor del servicio

NeuraDesk AI ofrece un portal web en el que cada colaborador registra y sigue sus incidencias. El equipo de soporte dispone de una cola común y actualiza su estado. La base PostgreSQL de Supabase conserva los tickets para todos los dispositivos. La autenticación y las políticas de acceso limitan lo que cada persona puede ver o cambiar.

El servicio aporta trazabilidad, priorización y una vista compartida del trabajo. El resumen por estado permite al equipo detectar acumulación de casos.

## 3. Actores y permisos

| Actor | Puede hacer |
| --- | --- |
| Solicitante | Crear cuenta, iniciar sesión, registrar tickets y consultar solo sus propios tickets |
| Soporte TI/IA | Consultar todos los tickets y cambiar su estado |
| Administrador del proyecto Supabase | Asignar el rol de soporte desde SQL Editor |

El navegador solo utiliza la clave publicable. La autorización se aplica en PostgreSQL con Row Level Security (RLS), no únicamente en la interfaz.

## 4. Requisitos funcionales

- RF01. Autenticar a las personas con correo y contraseña.
- RF02. Registrar solicitante, asunto, descripción, categoría y prioridad.
- RF03. Asignar a cada ticket un identificador, propietario, estado inicial y fecha.
- RF04. Consultar los tickets permitidos por rol.
- RF05. Buscar y filtrar por texto, estado y prioridad.
- RF06. Permitir únicamente a soporte actualizar el estado.
- RF07. Mostrar cantidades por estado.
- RF08. Sugerir categoría y prioridad con reglas de palabras clave; el usuario puede corregirlas.

## 5. Requisitos no funcionales

- RNF01. Interfaz adaptable a móvil y escritorio.
- RNF02. Persistencia compartida en Supabase PostgreSQL.
- RNF03. Uso de HTTPS, Supabase Auth y RLS.
- RNF04. No publicar contraseñas de base de datos ni claves de servicio en GitHub.
- RNF05. Mensajes visibles cuando falle una consulta o escritura.
- RNF06. Código HTML, CSS y JavaScript comprensible para un proyecto académico.

## 6. Modelo de datos

- **profiles**: identificador del usuario de Supabase Auth, nombre, rol y fecha de alta.
- **tickets**: identificador UUID, usuario dueño, nombre y correo del solicitante, asunto, descripción, categoría, prioridad, estado y marcas de tiempo.
- **Relación**: un usuario puede registrar muchos tickets; cada ticket pertenece a un usuario.

La migración SQL está en `supabase/migrations/20261023_initial.sql`. Los identificadores y fechas los genera la base. El correo se toma del token autenticado y el estado inicial es «Abierto». El cliente solo puede insertar las columnas del contenido. La persona solicitante lee sus tickets; soporte lee todos y solo puede actualizar la columna de estado.

## 7. Flujo de ejemplo

1. Ana crea su cuenta, confirma el correo si el proyecto lo exige e inicia sesión.
2. Registra «El modelo de clasificación no responde». El análisis de palabras sugiere «Modelos IA» y prioridad «Alta».
3. El ticket se guarda en PostgreSQL con estado «Abierto» y un código visible como `HD-1234ABCD`.
4. Ana consulta su ticket desde otro dispositivo con la misma cuenta.
5. Un usuario con rol de soporte ve el ticket, cambia el estado a «En proceso» y luego a «Resuelto».
6. Ana observa el nuevo estado. No puede cambiarlo por sí misma.

## 8. Indicadores para evaluar el valor

| Indicador | Fórmula | Meta inicial del caso |
| --- | --- | --- |
| Trazabilidad | Tickets con identificador y estado / tickets recibidos | 100 % |
| Tiempo de primera atención | Mediana de horas entre creación y paso a «En proceso» | Menos de 8 h hábiles |
| Resolución | Tickets resueltos / tickets creados en el periodo | 80 % |
| Pendientes | Tickets «Abierto» + «En proceso» | Tendencia descendente |

El prototipo muestra conteos por estado. Las métricas de tiempo y periodo son criterios de evaluación para una fase posterior; no se calculan todavía en la interfaz.

## 9. Alcance y límites

El prototipo implementa el flujo principal de tickets y roles. No envía correos de notificación, no adjunta archivos y no usa un modelo real de IA. El «triaje asistido» son reglas locales de palabras clave. El administrador asigna el rol de soporte manualmente en Supabase. La carga de tickets usa páginas de 500 registros para evitar truncar el listado en el límite habitual de la API.

