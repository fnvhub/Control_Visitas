# Control_Visitas_MVP

MVP web estático para publicar con GitHub Pages.

## Publicación
1. Crea un repositorio nuevo: `Control_Visitas_MVP`.
2. Sube el contenido de esta carpeta directamente a la raíz (index.html debe quedar en la raíz).
3. En GitHub: Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
4. Abre la URL que GitHub Pages muestra.

## Incluye
- Importación de JSON (array o `clients`, `clientes`, `data`).
- Filtros por zona y tipo; búsqueda.
- Prioridad básica por categoría y atraso según frecuencia.
- Registro de visitas y notas; fecha puntual próxima.
- Plan semanal orientativo de hasta 6 visitas/día, editable.
- Alta manual, exportación y copia completa.
- Caché offline básica.

## Campos JSON reconocidos
`name/nombre/cliente`, `locality/localidad/POB1`, `zone/zona/zonaVisita`, `type/tipo/tipoVisita`, `category/categoria/Visita`, `frequency/diasVisita/Dias`, `lastVisit/ultimaVisita`, `address/direccion/DIR1`.

## Límites de esta primera versión
No calcula rutas por carretera, no sincroniza dispositivos y no sustituye una copia de seguridad. Guarda datos en el navegador del dispositivo. La importación empareja por nombre y localidad; valida el maestro real antes de usarlo como registro definitivo. Es una base de pruebas, no una versión auditada.
