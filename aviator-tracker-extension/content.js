/**
 * Sniper Trigger Pro - Master Executor (100% Compliance)
 * Implementado por Antigravity
 */

class SniperTrigger {
    constructor() {
        this.SELECTORS = {
            // Unificado: Soporte para Aviator y High Flyer (Pragmatic)
            BET_BUTTON_1: '.AB_AC:nth-of-type(1) button, .bet-button-1, .bet-btn:first-child',
            BET_BUTTON_2: '.AB_AC:nth-of-type(2) button, .bet-button-2, .bet-btn:last-child',

            BET_INPUT_1: '.AB_AC:nth-of-type(1) input, .bet-amount-input1',
            BET_INPUT_2: '.AB_AC:nth-of-type(2) input, .bet-amount-input2',

            CASHOUT_INPUT_1: '.AB_AC:nth-of-type(1) input:last-of-type, .auto-cashout-input:first-of-type',
            CASHOUT_INPUT_2: '.AB_AC:nth-of-type(2) input:last-of-type, .auto-cashout-input:last-of-type',

            HISTORY_CONTAINER: '[data-testid="inline-recent-results"], .qv_qy, .h_history-list-wrapper, .last-results',
            HISTORY_ITEMS: '.bk_bl, .h_multiplier', // Se usa para asegurar que el contenedor es el correcto

            BALANCE: '[data-testid="balance-value"]',
            TOTAL_BET: '[data-testid="total-bet-value"]'
        };

        this.memory = {
            lastResult: null,
            waitingForConfirmation: false,
            consecutiveWins: 0,
            isLocked: false,
            lockUntil: null,
            lastUpdateTime: Date.now(),
            networkBroken: false
        };

        this.init();
    }

    init() {
        console.log('%c🎯 SNIPER TRIGGER: Monitor de Análisis Activo (v3)', 'color: #6366f1; font-weight: bold; font-size: 1.2em;');
        this.startObserver();
        // El watchdog se iniciará solo cuando se detecte el juego por primera vez para evitar falsos SAFE-EXIT
        this.setupEmergencyListener();
    }

    startObserver() {
        const container = document.querySelector(this.SELECTORS.HISTORY_CONTAINER);

        // Desconectar observador previo si existe
        if (this.observer) {
            this.observer.disconnect();
        }

        if (container) {
            this.historyContainer = container;
            this.observer = new MutationObserver(() => this.scanForNewResult());
            this.observer.observe(container, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });
            console.log('%c🎯 SNIPER: Conectado al historial (v3)', 'color: #4ade80');

            // Iniciar watchdog solo si no está corriendo
            if (!this.watchdog) {
                this.watchdog = this.startNetworkWatchdog();
            }
        } else {
            this.retrySearch = setInterval(() => {
                const c = document.querySelector(this.SELECTORS.HISTORY_CONTAINER);
                if (c) {
                    this.startObserver();
                    clearInterval(this.retrySearch);
                }
            }, 2000);

            // Evitar observar el body si no existe o si ya tenemos un observador global
            if (document.body && !this.observer) {
                this.observer = new MutationObserver(() => this.scanForNewResult());
                this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
            }
        }
    }

    scanForNewResult() {
        const container = this.historyContainer || document.querySelector(this.SELECTORS.HISTORY_CONTAINER);
        if (!container) return;

        // ESTRATEGIA v3: Parseo de texto plano (innerText)
        const text = container.innerText || "";
        const lines = text.split('\n');

        const multiplierRegex = /(\d+(?:[.,]\d+)?)[xX]?/;
        let firstValidVal = null;

        for (const line of lines) {
            const clean = line.trim().toUpperCase();
            if (clean === '' || clean.includes('PLAY') || clean.includes('RESULT') || clean.includes('CASHED')) continue;

            const match = clean.match(multiplierRegex);
            if (match) {
                const val = parseFloat(match[1].replace(',', '.'));
                if (!isNaN(val) && val > 0 && val < 1000000) {
                    firstValidVal = val;
                    break;
                }
            }
        }

        if (firstValidVal !== null && firstValidVal !== this.memory.lastResult) {
            console.log(`%c[SNIPER] Resultado detectado: ${firstValidVal}x`, 'color: #4ade80');
            this.handleNewRound(firstValidVal);
        }
    }

    handleNewRound(currentResult) {
        this.memory.lastUpdateTime = Date.now();
        this.memory.lastResult = currentResult;
        this.memory.networkBroken = false;
        this.restoreButtons(); // Asegurar que están activos al recibir datos

        console.log(`%c[RONDA] ${currentResult}x`, 'color: #94a3b8');

        // Notificar al background para guardado permanente
        chrome.runtime.sendMessage({
            action: 'newMultiplier',
            data: {
                multiplier: currentResult,
                timestamp: Date.now(),
                url: window.location.href
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('[SNIPER] Error enviando multiplier:', chrome.runtime.lastError.message);
            } else {
                console.log('[SNIPER] Multiplier confirmado por Background:', response);
            }
        });

        if (this.checkLockdown()) return;

        if (!this.memory.waitingForConfirmation) {
            if (currentResult < 1.12) {
                console.log('%c🔍 PATRÓN: Bajo detectado (<1.12). Esperando confirmación...', 'color: #fbbf24');
                this.memory.waitingForConfirmation = true;
                this.broadcastToSidePanel('pattern_low');
            }
        } else {
            if (currentResult > 1.25) {
                console.log('%c✅ GATILLO: Confirmación exitosa (>1.25). DISPARANDO...', 'color: #4ade80; font-weight: bold');
                this.executeTriggers();
                this.memory.waitingForConfirmation = false;
            } else {
                console.log('%c🛡️ RESET: Fallo de confirmación. Memoria limpia.', 'color: #ef4444');
                this.memory.waitingForConfirmation = false;
                this.memory.consecutiveWins = 0;
                this.broadcastToSidePanel('pattern_fail');
            }
        }
        this.evaluateRiskDensity();
    }

    executeTriggers() {
        if (!this.validateInputs()) {
            console.log('%c🚫 BLOQUEO: Montos de apuesta vacíos o en $0.', 'color: #ef4444');
            return;
        }

        const btn1 = document.querySelector(this.SELECTORS.BET_BUTTON_1);
        const btn2 = document.querySelector(this.SELECTORS.BET_BUTTON_2);

        if (btn1 && btn2 && !btn1.disabled && !btn2.disabled) {
            // Ejecución ultra-rápida (Mismo frame)
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            btn1.dispatchEvent(clickEvent);
            btn2.dispatchEvent(clickEvent);

            this.memory.consecutiveWins++;
            console.log(`%c🚀 APUESTA DUAL EJECUTADA (Racha: ${this.memory.consecutiveWins})`, 'background: #4ade80; color: #000; padding: 3px');

            if (this.memory.consecutiveWins >= 3) {
                this.applyLockdown(15, 'PROTECCIÓN TRAS GANANCIA (3 consecutivas)');
            }
        }
    }

    checkLockdown() {
        if (this.memory.isLocked) {
            if (Date.now() < this.memory.lockUntil) {
                const rem = Math.ceil((this.memory.lockUntil - Date.now()) / 60000);
                console.log(`%c🛑 SISTEMA BLOQUEADO: Faltan ${rem} min por ${this.memory.lockReason}`, 'color: #ef4444');
                this.disableButtons('LOCKDOWN');
                return true;
            }
            this.memory.isLocked = false;
            this.restoreButtons();
            console.log('%c🔓 BLOQUEO FINALIZADO', 'color: #4ade80');
        }
        return false;
    }

    evaluateRiskDensity() {
        const container = document.querySelector(this.SELECTORS.HISTORY_CONTAINER);
        if (!container) return;

        const elements = Array.from(container.querySelectorAll(this.SELECTORS.HISTORY_ITEMS)).slice(0, 15);
        const highRiskCount = elements.filter(el => parseFloat(el.textContent.trim().replace(',', '.')) < 1.05).length;

        if (highRiskCount >= 3) {
            this.applyLockdown(5, `ALTA VOLATILIDAD (${highRiskCount} valores < 1.05)`);
        }
    }

    applyLockdown(minutes, reason) {
        this.memory.isLocked = true;
        const until = Date.now() + (minutes * 60 * 1000);
        this.memory.lockUntil = until;
        this.memory.lockReason = reason;
        this.memory.consecutiveWins = 0;
        this.memory.waitingForConfirmation = false;

        // Sincronizar con el sidepanel vía storage
        chrome.storage.local.set({ lockdown: { isLocked: true, until: until, reason: reason } });

        this.disableButtons(`LOCKDOWN: ${reason}`);
        console.error(`%c[SEGURIDAD] Bloqueo de ${minutes} min: ${reason}`, 'padding: 5px; background: #ef4444; color: #fff');
    }

    startNetworkWatchdog() {
        // Watchdog y Mirror de Inputs
        return setInterval(() => {
            const idle = (Date.now() - this.memory.lastUpdateTime) / 1000;
            if (idle > 5 && !this.memory.networkBroken) {
                this.memory.networkBroken = true;
                this.memory.waitingForConfirmation = false;
                this.disableButtons('FALLO WEBSOCKET (>5s)');
                console.warn(`%c⚠️ SAFE-EXIT: Flujo de datos detenido (${idle.toFixed(1)}s). Botones bloqueados.`, 'color: #fbbf24');
            }

            // Sync Inputs (Mirror Dashboard)
            const val1 = parseFloat(document.querySelector(this.SELECTORS.BET_INPUT_1)?.value || 0);
            const val2 = parseFloat(document.querySelector(this.SELECTORS.BET_INPUT_2)?.value || 0);
            this.broadcastToSidePanel('sync_inputs', { val1, val2 });
        }, 1000);
    }

    disableButtons(reason) {
        const btns = [document.querySelector(this.SELECTORS.BET_BUTTON_1), document.querySelector(this.SELECTORS.BET_BUTTON_2)];
        btns.forEach(b => {
            if (b) {
                b.disabled = true;
                b.style.opacity = '0.5';
                b.title = `Bloqueado por Sniper: ${reason}`;
            }
        });
    }

    restoreButtons() {
        const btns = [document.querySelector(this.SELECTORS.BET_BUTTON_1), document.querySelector(this.SELECTORS.BET_BUTTON_2)];
        btns.forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
                b.title = '';
            }
        });
    }

    validateInputs() {
        const val1 = parseFloat(document.querySelector(this.SELECTORS.BET_INPUT_1)?.value || 0);
        const val2 = parseFloat(document.querySelector(this.SELECTORS.BET_INPUT_2)?.value || 0);
        return (val1 > 0 || val2 > 0);
    }

    broadcastToSidePanel(status, extra = {}) {
        chrome.runtime.sendMessage({
            action: 'analysis_update',
            status: status,
            timestamp: Date.now(),
            ...extra,
            inputs: extra.val1 !== undefined ? extra : undefined
        }, (response) => {
            if (chrome.runtime.lastError) {
                // Silencioso si el panel está cerrado
            } else {
                console.log('[SNIPER] Update sidepanel ok:', response);
            }
        });
    }

    setupEmergencyListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === 'kill_switch') {
                this.killSwitch();
            } else if (message.action === 'apply_strategy') {
                this.updateGameInputs(message.data);
            }
        });
    }

    updateGameInputs(data) {
        if (!data) return;

        // Caso 1: Apuesta Dual
        if (data.dual) {
            this.setInputValue(this.SELECTORS.BET_INPUT_1, data.bet1.amount);
            this.setInputValue(this.SELECTORS.CASHOUT_INPUT_1, data.bet1.target);
            this.setInputValue(this.SELECTORS.BET_INPUT_2, data.bet2.amount);
            this.setInputValue(this.SELECTORS.CASHOUT_INPUT_2, data.bet2.target);
        } else {
            // Caso 2: Apuesta Simple (Generalmente en el primer slot)
            this.setInputValue(this.SELECTORS.BET_INPUT_1, data.amount);
            this.setInputValue(this.SELECTORS.CASHOUT_INPUT_1, data.target);
        }

        console.log(`%c[ESTRATEGIA] Valores actualizados: ${data.amount || data.bet1.amount}x`, 'color: #6366f1');
    }

    setInputValue(selector, value) {
        const input = document.querySelector(selector);
        if (input && value) {
            input.value = value.toString();
            // Disparar eventos para que el juego detecte el cambio
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
    }

    killSwitch() {
        if (this.observer) this.observer.disconnect();
        if (this.watchdog) clearInterval(this.watchdog);
        this.memory.isLocked = true;
        this.memory.lockUntil = Infinity; // Nunca desbloquear
        chrome.storage.local.set({ lockdown: { isLocked: true, until: Infinity, reason: 'KILL-SWITCH' } });
        this.disableButtons('KILL-SWITCH ACTIVADO');
        console.error('%c🛑 STOP TOTAL: Sniper Trigger desactivado permanentemente.', 'background: #ef4444; color: #fff; font-size: 1.5em; padding: 10px;');
    }
}

window.sniperTrigger = new SniperTrigger();
