# NeuraDesk AI - Help Desk

Aplicativo web pequeño para un **caso práctico de Help Desk en una organización del ámbito de Inteligencia Artificial**.

## Caso práctico

La empresa ficticia **NeuraTech AI** desarrolla soluciones de Inteligencia Artificial y necesita centralizar las incidencias internas que afectan a sus colaboradores. El sistema permite registrar tickets relacionados con modelos de IA, infraestructura, datos, accesos y software.

## Funcionalidades

- Registrar tickets de soporte.
- Clasificar por categoría y prioridad.
- Triaje asistido mediante reglas de palabras clave.
- Visualizar indicadores de tickets totales, abiertos, en proceso y resueltos.
- Buscar y filtrar tickets.
- Cambiar el estado de un ticket.
- Guardar los datos en `localStorage` del navegador.
- Diseño responsive para PC y móvil.

> Nota: el "triaje asistido" es una simulación académica basada en reglas, no un modelo real de machine learning.

## Tecnologías

- HTML5
- CSS3
- JavaScript Vanilla
- LocalStorage

No requiere base de datos, servidor ni instalación de dependencias.

## Cómo abrir el proyecto

### Opción 1 - Visual Studio Code

1. Descarga o clona el repositorio.
2. Abre la carpeta en Visual Studio Code.
3. Abre `index.html`.
4. Puedes usar la extensión **Live Server** y pulsar `Open with Live Server`.

### Opción 2 - Sin extensiones

Abre `index.html` directamente en Google Chrome, Edge o Firefox.

## Estructura

```text
help-desk-ai/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── docs/
│   └── CASO_PRACTICO.md
├── .gitignore
└── README.md
```

## Flujo básico

1. Usuario registra una incidencia.
2. El sistema permite sugerir categoría y prioridad.
3. El ticket inicia en estado `Abierto`.
4. Soporte cambia el estado a `En proceso`.
5. Al solucionar la incidencia, cambia a `Resuelto`.

## Equipo

Proyecto preparado para trabajo grupal. Cada integrante puede clonar el repositorio y trabajar mediante ramas de Git.
