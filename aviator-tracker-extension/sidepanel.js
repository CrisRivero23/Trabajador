// SidePanel Script - Versión Pro Maestro: Visualizador de Análisis de Código
class SidePanelManager {
    constructor() {
        this.multipliers = [];
        this.session = { wins: 0, losses: 0, profit: 0 };
        this.memory = {};
        this.lastProcessedTimestamp = null;
        this.init();
    }

    async init() {
        console.log('[MONITOR] Inicializando SidePanelManager...');
        try {
            await this.loadSession();
            await this.loadData();
            this.setupEventListeners();
            this.setupMessageListener();
            this.setupStorageListener();
            this.startPollingFallback(); // Sistema de respaldo
            console.log('[MONITOR] Inicialización completada.');
        } catch (error) {
            console.error('[MONITOR] Error crítico en inicialización:', error);
        }
    }

    startPollingFallback() {
        // Cada 2 segundos verificamos si hay nuevos datos en storage como fallback
        this.pollingInterval = setInterval(() => {
            const now = Date.now();
            // Solo sincronizamos si no hemos recibido actualizaciones en los últimos 2.5s
            if (!this.lastUpdateMessageTime || (now - this.lastUpdateMessageTime > 2500)) {
                this.loadData();
            }
        }, 2000);
    }

    setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                if (changes.multipliers || changes.lockdown) {
                    this.loadData();
                }
            }
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.lastUpdateMessageTime = Date.now();
            if (message.action === 'analysis_update') {
                this.handleLiveUpdate(message);
                sendResponse({ status: 'ok', received: 'analysis_update' });
            } else if (message.action === 'newMultiplier') {
                console.log('[MONITOR] Nuevo dato recibido directamente');
                this.loadData();
                sendResponse({ status: 'ok', received: 'newMultiplier' });
            }
            return true;
        });
    }

    handleLiveUpdate(message) {
        const latencyMs = document.getElementById('latencyMs');
        const statusIndicator = document.getElementById('statusIndicator');

        // 1. Latencia y Mirror
        if (message.timestamp) {
            const delay = Date.now() - message.timestamp;
            if (latencyMs) latencyMs.textContent = `(${delay}ms)`;

            if (statusIndicator) {
                statusIndicator.classList.remove('latency-warning', 'latency-critical');
                if (delay > 1000) statusIndicator.classList.add('latency-critical');
                else if (delay > 300) statusIndicator.classList.add('latency-warning');
            }
        }

        // 2. Mirror de Inputs y Validación (Double-Check)
        if (message.inputs) {
            const m1 = document.getElementById('mirror1');
            const m2 = document.getElementById('mirror2');
            const condInputs = document.getElementById('condInputs');

            if (m1) m1.textContent = (message.inputs.val1 || 0).toFixed(2);
            if (m2) m2.textContent = (message.inputs.val2 || 0).toFixed(2);

            // Validación de Errores Humanos (ej. 1.9 en lugar de 1.09)
            if (message.inputs.val1 > 50000 || message.inputs.val2 > 50000) {
                this.updateDecision("ALERTA DE SEGURIDAD", "Montos de apuesta sospechosos.", true);
                if (condInputs) {
                    condInputs.textContent = "Revisar Montos";
                    condInputs.classList.remove('active');
                }
            } else {
                if (condInputs) {
                    condInputs.textContent = "Sincronizado";
                    condInputs.classList.add('active');
                }
            }
        }

        const status = message.status;
        if (status === 'pattern_low') {
            this.updateDecision("ESPERANDO CONFIRMACIÓN", "Bajo detectado. Buscando > 1.25x");
        } else if (status === 'pattern_fail') {
            this.updateDecision("CONFIRMACIÓN FALLIDA", "Fallo detectado. Reset de algoritmo.");
        } else if (status === 'killed') {
            this.updateDecision("SISTEMA DETENIDO", "Kill-Switch activado. Refresca para reactivar.");
            document.getElementById('decisionCard')?.classList.add('risk-alert');
            if (statusIndicator) {
                const dot = statusIndicator.querySelector('.latency-dot');
                const label = statusIndicator.querySelector('span:not(#latencyMs)');
                if (label) label.textContent = "🛑 STOP TOTAL";
                statusIndicator.style.background = "#ef4444";
                statusIndicator.style.color = "white";
                if (dot) dot.style.boxShadow = "none";
            }
        }
    }

    async loadData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['multipliers', 'lockdown'], (result) => {
                const newMultipliers = result.multipliers || [];
                if (newMultipliers.length > 0) {
                    const last = newMultipliers[newMultipliers.length - 1];
                    if (this.lastProcessedTimestamp !== last.timestamp) {
                        this.processAnalysis(last, newMultipliers);
                        this.lastProcessedTimestamp = last.timestamp;
                        this.renderVisualLog(newMultipliers);
                    }
                }
                this.multipliers = newMultipliers;
                this.handleLockdownTimer(result.lockdown);
                this.updateBasicUI();
                resolve();
            });
        });
    }

    handleLockdownTimer(lockdown) {
        const countdownEl = document.getElementById('lockdownCountdown');
        const patSafe = document.getElementById('patSafe');
        const condRisk = document.getElementById('condRisk');

        if (lockdown && lockdown.isLocked && (lockdown.until === Infinity || lockdown.until > Date.now())) {
            if (lockdown.until === Infinity) {
                if (countdownEl) countdownEl.textContent = "(PERMANENTE)";
            } else {
                const remaining = Math.ceil((lockdown.until - Date.now()) / 1000);
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                if (countdownEl) countdownEl.textContent = `(${mins}:${secs.toString().padStart(2, '0')})`;
            }

            if (patSafe) {
                patSafe.textContent = "BLOQUEO ACTIVO";
                patSafe.className = "pattern-status status-fail";
            }
            if (condRisk) {
                condRisk.textContent = "En Pausa";
                condRisk.classList.remove('active');
            }
        } else {
            if (countdownEl) countdownEl.textContent = "";
            if (patSafe) {
                patSafe.textContent = "SISTEMA SEGURO";
                patSafe.className = "pattern-status status-ok";
            }
            if (condRisk) {
                condRisk.textContent = "Sin Bloqueo";
                condRisk.classList.add('active');
            }
        }
    }

    renderVisualLog(history) {
        const container = document.getElementById('visualLogContainer');
        if (!container) return;

        const latest = history.slice(-20).reverse();
        container.innerHTML = latest.map(m => {
            let colorClass = 'chip-yellow';
            if (m.multiplier < 1.12) colorClass = 'chip-red';
            else if (m.multiplier > 1.25) colorClass = 'chip-green';

            return `<div class="log-chip ${colorClass}">${m.multiplier.toFixed(2)}</div>`;
        }).join('');
    }

    async loadSession() {
        const result = await chrome.storage.local.get(['sessionStats']);
        if (result.sessionStats) {
            this.session = result.sessionStats;
            this.updateBasicUI();
        }
    }

    setupEventListeners() {
        document.getElementById('resetSessionBtn')?.addEventListener('click', () => this.resetSession());
        document.getElementById('viewHistoryBtn')?.addEventListener('click', () => window.open('history.html', '_blank'));
        document.getElementById('openSimulatorBtn')?.addEventListener('click', () => window.open('simulator.html', '_blank'));
        document.getElementById('killSwitchBtn')?.addEventListener('click', () => this.emergencyStop());
    }

    emergencyStop() {
        if (confirm('🚨 ¿ACTIVAR STOP TOTAL? Esto detendrá toda ejecución de la extensión inmediatamente.')) {
            chrome.runtime.sendMessage({ action: 'kill_switch' });
            this.logDecision("🚨 KILL-SWITCH ACTIVADO.");
            this.handleLiveUpdate({ status: 'killed' });

            const killBtn = document.getElementById('killSwitchBtn');
            if (killBtn) {
                killBtn.textContent = "🛑 SISTEMA DETENIDO";
                killBtn.style.background = "#4b5563";
                killBtn.disabled = true;
            }
        }
    }

    processAnalysis(lastEntry, history) {
        const val = lastEntry.multiplier;

        const valEl = document.getElementById('currentVal');
        if (valEl) {
            valEl.textContent = val.toFixed(2) + 'x';
            valEl.style.color = val < 1.12 ? '#f87171' : (val > 1.25 ? '#4ade80' : '#fbbf24');
        }

        this.evaluateConditions();
    }

    evaluateConditions() {
        const riskDensity = document.getElementById('riskDensity');
        const safetyBox = document.getElementById('safetyStatusBox');

        const density = this.multipliers.slice(-15).filter(m => m.multiplier < 1.05).length;
        if (riskDensity) {
            riskDensity.textContent = `${density}/15`;
            riskDensity.className = `pattern-status ${density >= 3 ? 'status-fail' : 'status-ok'}`;
        }

        if (density >= 3) {
            this.updateDecision("BLOQUEO RIESGO", `Densidad Crítica (${density} bajas).`, true);
            safetyBox?.classList.add('risk-alert');
        } else {
            safetyBox?.classList.remove('risk-alert');
        }
    }

    updateDecision(title, msg, isWarning = false) {
        const titleEl = document.getElementById('decisionTitle');
        const msgEl = document.getElementById('decisionReason');
        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = msg;

        const card = document.getElementById('decisionCard');
        if (card) {
            card.className = "decision-card"; // Reset
            if (isWarning) card.classList.add('safety-warning');

            if (title.includes('DETENIDO')) card.style.borderColor = '#ef4444';
            else if (title.includes('ARMADO') || title.includes('CONFIRMACIÓN')) card.style.borderColor = '#4ade80';
            else card.style.borderColor = 'rgba(99, 102, 241, 0.2)';
        }
    }

    logDecision(message) {
        // Log interno para consola si fuera necesario
        console.log(`[MONITOR] ${message}`);
    }

    resetSession() {
        if (confirm('¿Reiniciar estadísticas de análisis?')) {
            this.session = { wins: 0, losses: 0, profit: 0 };
            chrome.storage.local.set({ sessionStats: this.session });
            this.updateBasicUI();
            this.logDecision("Sesión reiniciada.");
        }
    }

    updateBasicUI() {
        if (document.getElementById('wins')) document.getElementById('wins').textContent = this.session.wins;
        if (document.getElementById('losses')) document.getElementById('losses').textContent = this.session.losses;
        if (document.getElementById('profit')) {
            const el = document.getElementById('profit');
            el.textContent = this.session.profit.toFixed(2);
            el.style.color = this.session.profit >= 0 ? '#4ade80' : '#f87171';
        }
    }
}

// Inicialización garantizada
const initManager = () => {
    if (!window.sidePanelManagerStarted) {
        window.sidePanelManagerStarted = true;
        window.sidePanelManager = new SidePanelManager();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManager);
} else {
    initManager();
}
// Triple verificación
setTimeout(initManager, 500);
