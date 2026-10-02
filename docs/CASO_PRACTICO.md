# Caso práctico: Help Desk en una organización de Inteligencia Artificial

## 1. Organización

**NeuraTech AI** es una empresa ficticia que desarrolla sistemas de visión artificial, modelos predictivos y automatización inteligente para clientes empresariales.

## 2. Problema

Los colaboradores reportan incidencias por mensajes y chats separados. Esto dificulta conocer qué problemas siguen pendientes, cuáles son urgentes y quién solicitó la atención.

## 3. Solución propuesta

Crear un aplicativo Help Desk pequeño denominado **NeuraDesk AI**, donde los usuarios puedan registrar incidencias y el equipo de soporte pueda gestionarlas desde una única interfaz.

## 4. Actores

- **Solicitante:** colaborador que registra una incidencia.
- **Soporte TI/IA:** revisa, prioriza y actualiza los tickets.

## 5. Requerimientos funcionales

- RF01: Registrar un ticket con solicitante, correo, asunto y descripción.
- RF02: Clasificar un ticket por categoría.
- RF03: Definir prioridad alta, media o baja.
- RF04: Consultar el listado de tickets.
- RF05: Filtrar tickets por estado y prioridad.
- RF06: Buscar tickets por texto.
- RF07: Cambiar el estado entre Abierto, En proceso y Resuelto.
- RF08: Mostrar un resumen de cantidades por estado.
- RF09: Sugerir categoría y prioridad con reglas de palabras clave.

## 6. Requerimientos no funcionales

- RNF01: Interfaz sencilla y responsive.
- RNF02: No requiere instalación de base de datos.
- RNF03: Debe funcionar en navegadores modernos.
- RNF04: El código debe ser fácil de comprender y modificar por estudiantes.

## 7. Ejemplo de incidente

**Asunto:** Modelo de clasificación no responde  
**Descripción:** El endpoint de inferencia devuelve timeout cuando procesa nuevas imágenes.  
**Categoría:** Modelos IA  
**Prioridad:** Alta  
**Estado inicial:** Abierto

## 8. Flujo del proceso

```text
[Usuario detecta problema]
          |
          v
[Registra ticket]
          |
          v
[Clasificación / prioridad]
          |
          v
       [Abierto]
          |
          v
    [En proceso]
          |
          v
      [Resuelto]
```

## 9. Alcance

El proyecto es un prototipo académico. No incluye autenticación real, servidor, base de datos externa, correo ni integración con un modelo de IA real.
