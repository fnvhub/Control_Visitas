# Control_Visitas_MVP — versión corregida

Esta versión es una base de pruebas. No sustituye todavía el algoritmo definitivo de rutas.

## Instalación en la rama de pruebas
1. En la rama `Control_Visitas_MVP`, sustituye los archivos incluidos en este ZIP manteniendo la estructura.
2. No hagas merge ni pull request hacia `main` hasta probarla.
3. Publica GitHub Pages desde `Control_Visitas_MVP` y `/ (root)` si quieres probarla como web.

## Cambios incluidos
- Plan semanal de hasta 23 visitas: 5 de lunes a jueves y máximo 3 el viernes.
- La propuesta conserva las visitas ya colocadas por el usuario; no las borra ni las mueve.
- Prioriza urgencia por próxima visita vencida, atraso, categoría y prioridad comercial alta.
- Agrupa de forma orientativa por zona registrada. No calcula rutas por carretera ni sustituye la ubicación real confirmada.
- Importación con fusión que conserva decisiones manuales, visitas, próxima visita puntual y prioridad comercial.
- Fecha local para el registro de visitas.
- Copia completa y exportación.

## Importante
Los datos se guardan en el almacenamiento local del navegador y dispositivo. Haz una copia completa antes de importar el maestro real. La importación debe probarse primero con una copia de datos. La ubicación actual del cliente debe revisarse y corregirse si el maestro contiene zonas antiguas.

## Campos JSON reconocidos
`name/nombre/cliente`, `locality/localidad/POB1`, `zone/zona/zonaVisita`, `currentZone/ubicacionActual`, `type/tipo/tipoVisita`, `category/categoria/Visita`, `frequency/diasVisita/Dias`, `lastVisit/ultimaVisita`, `address/direccion/DIR1`, `nextVisit/proximaVisita`, `commercialPriority/prioridadComercial`, `notes/notas`.
