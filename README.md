# Control_Visitas 1.3.5 — Secretaria comercial

## Instalación
Sube el contenido de este ZIP a la raíz de la rama `Control_Visitas_MVP` sustituyendo `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js` y `version.json`. Añade `datos_iniciales.json` y `version.json`. No borres iconos ni archivos ajenos a esta versión.

## Actualización
Sustituye los archivos de la versión anterior por los de esta versión. Conserva `datos_iniciales.json` junto a `index.html`. La caché del service worker se renueva automáticamente. Los datos guardados en el navegador se normalizan sin eliminar contactos, seguimientos ni compromisos.

## Primera ejecución
Abre Ajustes / Datos y pulsa **Cargar datos aportados en esta conversación**. Se incorporan el backup CRM 3.0.9 y las 295 filas de la hoja Malaga como fuentes diferenciadas. El backup completo se conserva dentro de los datos locales. Las filas Excel que no se han podido conciliar quedan como **Revisar**; no se clasifican automáticamente como clientes o prospectos.

## Qué incluye
- Cartera CRM y candidatos separados; prioridad comercial distinta de categoría A/B/C.
- Seguimiento por estados, canal, notas y fecha de recontacto.
- La opción “esta semana no, la próxima sí” crea seguimiento, no cita confirmada.
- Citas confirmadas registradas como compromisos fijos.
- Plan semanal con corredor, objetivo y hasta 10 candidatos para selección manual.
- Compromisos personales/profesionales que condicionan disponibilidad.
- Exportación de copia completa y cartera.

## Limitaciones conocidas
- Almacenamiento local por navegador/dispositivo; no sincroniza todavía con Drive ni Calendar.
- El planificador propone candidatos por corredor textual y prioridad; aún no calcula distancias, tráfico ni tiempos de carretera.
- Los datos del maestro Excel conservan sus fechas como referencias históricas; no se convierten en visitas registradas.
- Las filas Excel no conciliadas necesitan revisión manual antes de incorporarse a propuestas.
- No se importan automáticamente eventos de Google Calendar.

## Seguridad de datos
Haz una copia completa antes de importar o actualizar. La carga inicial no se ejecuta automáticamente: el usuario la inicia desde Ajustes / Datos.

### 1.3.8
- Aplazar ya no abre ventanas emergentes. La acción rápida aplaza una semana.
- Otras fechas se configuran de forma opcional dentro de cada candidato.
- Nevera no abre prompts; el motivo es opcional y se introduce solo si se despliega.
- Se puede volver a seleccionar «Que recomiende la secretaria».
- La recomendación geográfica prioriza la localidad actual frente a zonas antiguas del CRM.
