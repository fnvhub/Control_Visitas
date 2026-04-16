# Control de Clientes · Franez

Aplicación web progresiva (PWA) para gestión de visitas comerciales. Funciona completamente offline una vez instalada.

## Instalación en tablet / móvil

1. Activa GitHub Pages en este repositorio: **Settings → Pages → Branch: main → / (root)**
2. Tu app estará en: `https://TU_USUARIO.github.io/NOMBRE_REPO`
3. Abre esa URL en Chrome del tablet
4. Menú (⋮) → **"Añadir a pantalla de inicio"** o **"Instalar app"**
5. Ya tienes el icono en el escritorio y funciona sin internet

## Usar la app

### Primera vez
1. Ve a **Ajustes** (⚙️)
2. Toca **"Importar JSON de clientes"** y selecciona tu archivo `backup_pedidos_XXXX.json`
3. Confirma la importación

### Actualizar clientes
Cada vez que tengas un JSON nuevo con pedidos actualizados, repite el proceso de importación. La app **fusiona** los datos: preserva las visitas que ya has registrado y los campos que hayas editado manualmente (zona, tipo, días).

### Uso diario
1. Abre la app → **Inicio**
2. Selecciona la zona del día (Marbella, Fuengirola, etc.)
3. La app ordena los clientes por prioridad (tipo A primero, luego los que llevan más días sin visita)
4. Marca cada visita con el ✓ — la fecha queda registrada y el algoritmo aprende

## Archivos

```
index.html     → App completa
manifest.json  → Configuración PWA (nombre, icono, colores)
sw.js          → Service Worker (funciona offline)
icon-192.png   → Icono app 192×192
icon-512.png   → Icono app 512×512
```

## Zonas precargadas

Marbella · Fuengirola · Málaga · Cádiz · Chiclana · Ronda-Antequera

Puedes añadir y eliminar zonas desde **Ajustes**.

## Algoritmo de prioridad

El score de cada cliente se calcula así:
- **Tipo A** = base 100 · **Tipo B** = base 60 · **Tipo C** = base 30
- Se añade urgencia según días transcurridos desde la última visita vs frecuencia configurada
- Sin datos de visita = aparece al final con score base
- Conforme registras visitas el sistema se vuelve más preciso

---
*Versión 2.0 · Datos almacenados localmente en el dispositivo (localStorage)*
