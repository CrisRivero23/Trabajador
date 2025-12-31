# Changelog - Aviator Tracker Pro

## [1.1.0] - 2025-12-31

### Agregado
- **Sistema de Estrategias Profesionales**: 7 estrategias configurables (Martingala, Fibonacci, etc.).
- **Sección Colapsable**: Panel de estrategias con UI profesional en el SidePanel.
- **Tooltips**: Explicaciones detalladas para cada parámetro de estrategia.
- **Feedback de Bloqueo**: Estilo visual mejorado para el Kill-Switch.
- **Estructura de Carpetas**: Carpetas `dev-tools/` y `docs/` para mejor organización.
- **Archivo .gitignore**: Para limpieza de repositorio.

### Optimizado
- **MutationObserver**: Ahora observa el contenedor específico en lugar de todo el body.
- **SidePanel Update**: Eliminado polling (setInterval) de 1s, reemplazado por `storage.onChanged`.
- **Rendimiento de DOM**: Reducción de búsquedas repetitivas de elementos.

### Corregido
- **Issue logic**: Implementado `setupStrategyListeners()` que faltaba.
- **Campo de Inputs**: Ampliados a 90px para visibilidad total.
- **Traducciones**: Eliminado texto residual en inglés.

## [1.0.0] - 2025-12-25
- Versión inicial con tracking básico y estadísticas rápidas.
- Soporte para IndexedDB y Chrome Storage.
- Exportación CSV.
