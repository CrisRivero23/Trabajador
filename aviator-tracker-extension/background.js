// Background Service Worker
// Maneja la lógica en segundo plano
importScripts('db.js');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Aviator Tracker instalado correctamente');

    // Inicializar storages
    aviatorDB.init().then(() => console.log('DB Inicializada'));

    chrome.storage.local.get(['multipliers', 'settings'], (result) => {
        if (!result.multipliers) {
            chrome.storage.local.set({ multipliers: [] });
        }
        if (!result.settings) {
            chrome.storage.local.set({
                settings: {
                    autoTrack: true,
                    showNotifications: true
                }
            });
        }
    });
});

// Escuchar mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'newMultiplier') {
        const entry = request.data;

        // 1. Guardar en Base de Datos Infinita (IndexedDB)
        aviatorDB.saveMultiplier(entry)
            .then(() => console.log('Guardado en DB Infinita'))
            .catch(err => console.error('Error DB:', err));

        // 2. Guardar en Storage Local (Solo últimos 300 para el panel/estadísticas rápidas)
        chrome.storage.local.get(['multipliers'], (result) => {
            let multipliers = result.multipliers || [];
            multipliers.push(entry);

            // Podar historial en storage local (Mantener 300)
            if (multipliers.length > 300) {
                multipliers = multipliers.slice(-300);
            }

            chrome.storage.local.set({ multipliers: multipliers });
        });

        console.log('Nuevo multiplicador registrado:', entry);
    }
    return true;
});
