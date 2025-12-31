# 🧪 Plan de Pruebas - Aviator Tracker Pro

**Versión:** 1.1.0  
**Fecha:** 31 de Diciembre, 2025

---

## 1. Pruebas Funcionales

### 1.1 Sistema de Detección (content.js)
| ID | Descripción | Criterio de Aceptación | Estado |
|----|-------------|-----------------------|--------|
| TC-01 | Detección de Multiplicador | El sistema detecta cada nuevo multiplicador en < 200ms. | [ ] |
| TC-02 | Conversión de Formato | Los valores con coma (ej. 1,05) se convierten correctamente a punto (1.05). | [ ] |
| TC-03 | Estabilidad del Observer | El MutationObserver solo observa el contenedor de resultados (optimizado). | [ ] |
| TC-04 | Watchdog | Tras 5s sin datos, los botones de apuesta se bloquean automáticamente. | [ ] |

### 1.2 Sniper Trigger & Estrategias
| ID | Descripción | Criterio de Aceptación | Estado |
|----|-------------|-----------------------|--------|
| TC-05 | Patrón Low-Confirm | Detecta < 1.12 y espera > 1.25 para disparar. | [ ] |
| TC-06 | Ejecución de Apuesta | Simula clic en ambos botones al cumplirse el patrón. | [ ] |
| TC-07 | Martingala | Duplica apuesta tras pérdida y resetea tras victoria. | [ ] |
| TC-08 | Lockdown High-Risk | Se bloquea tras 3 valores < 1.05 en los últimos 15 rounds. | [ ] |
| TC-09 | Kill-Switch | El botón rojo detiene permanentemente la ejecución y el observer. | [ ] |

### 1.3 Almacenamiento (db.js & background.js)
| ID | Descripción | Criterio de Aceptación | Estado |
|----|-------------|-----------------------|--------|
| TC-10 | IndexedDB | Los datos se guardan de forma persistente e ilimitada. | [ ] |
| TC-11 | Local Storage | Solo se mantienen los últimos 300 registros para rendimiento. | [ ] |
| TC-12 | Sincronización | El SidePanel se actualiza vía storage.onChanged (optimizado). | [ ] |

---

## 2. Pruebas de Interfaz (UX)

### 2.1 SidePanel
- [ ] La sección de estrategias se expande/colapsa correctamente.
- [ ] Los tooltips aparecen al pasar el cursor sobre los labels de parámetros.
- [ ] Los inputs tienen el ancho suficiente (90px) para ver cifras completas.
- [ ] El indicador de latencia muestra valores realistas (normalmente < 100ms).

### 2.2 Popup & Historial
- [ ] El popup muestra las estadísticas de los últimos 300 rounds correctamente.
- [ ] La tabla de historial carga los datos de IndexedDB sin lag.
- [ ] El botón de descarga CSV genera un archivo válido.

---

## 3. Pruebas de Estrés
- [ ] Dejar la extensión activa durante 100+ rounds sin interrupción.
- [ ] Verificar que el uso de memoria no exceda los 100MB.
- [ ] Forzar errores de red y validar que el Safe-Exit funcione.

---

## 4. Matriz de Resultados

| Fase | Pass | Fail | N/A | Total | % |
|------|------|------|-----|-------|---|
| Core | 0 | 0 | 0 | 12 | 0% |
| UI/UX | 0 | 0 | 0 | 8 | 0% |
| Stress| 0 | 0 | 0 | 3 | 0% |

---

**Tester:** Antigravity  
**Resultado Final:** ⏳ Pendiente
