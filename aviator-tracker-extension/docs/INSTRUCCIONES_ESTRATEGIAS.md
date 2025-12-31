# Instrucciones para Agregar Estrategias Profesionales

## Paso 1: Agregar CSS

1. Abrir `sidepanel.html`
2. Buscar la línea 159 que contiene `</style>`
3. **ANTES** de esa línea, copiar todo el contenido de `strategies_css_snippet.txt`

## Paso 2: Agregar HTML

1. En `sidepanel.html`, buscar la línea 264 que contiene `</div>` (cierre de la sección "Control Automático")
2. **DESPUÉS** de esa línea y **ANTES** de la línea 266 (`<!-- Historial y Acción -->`), copiar todo el contenido de `strategies_html_snippet.txt`

## Paso 3: Agregar JavaScript - Parte 1 (Constructor)

1. Abrir `sidepanel.js`
2. Buscar la línea 25 (después de `this.init();`)
3. **DESPUÉS** de esa línea, copiar la **PARTE 1** de `strategies_js_snippet.txt`

## Paso 4: Agregar JavaScript - Parte 2 (Métodos)

1. En `sidepanel.js`, buscar la línea 93 (después del método `setupEventListeners()`)
2. **DESPUÉS** de esa línea, copiar la **PARTE 2** de `strategies_js_snippet.txt`

## Paso 5: Agregar JavaScript - Parte 3 (Inicialización)

1. En `sidepanel.js`, buscar el método `init()` (alrededor de la línea 28-33)
2. Dentro del método `init()`, **DESPUÉS** de la línea `this.setupEventListeners();`
3. Agregar esta línea:
   ```javascript
   this.setupStrategyListeners();
   ```

## Verificación

Después de realizar todos los cambios:

1. Recargar la extensión en Chrome (`chrome://extensions/` → botón de recarga)
2. Abrir el SidePanel
3. Deberías ver una nueva sección "🎲 Estrategias de Apuestas" con una flecha ▶
4. Al hacer click, se expande mostrando un selector con 7 estrategias
5. Al seleccionar una estrategia, aparecen sus configuraciones específicas

## Estrategias Disponibles

1. **Martingala Clásica** - Duplica apuesta tras pérdida
2. **Anti-Martingala (Paroli)** - Duplica apuesta tras victoria
3. **Fibonacci** - Progresión según secuencia de Fibonacci
4. **D'Alembert** - Incremento/decremento lineal
5. **Conservadora** - Apuestas fijas en objetivos bajos (1.2x-2.0x)
6. **Alto Riesgo** - Gestión de bankroll para objetivos altos
7. **Dual (Cobertura)** - Dos apuestas simultáneas

## Notas Importantes

- Todas las estrategias respetan el límite de 1.00x - 29.99x
- Los inputs tienen validación HTML5 (min/max)
- La sección está colapsada por defecto para no ocupar espacio
- El botón "Activar Estrategia" guarda la configuración seleccionada
