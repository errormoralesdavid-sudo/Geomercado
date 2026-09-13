// ==========================================
// MÓDULO DE FEEDBACK VISUAL Y NOTIFICACIONES (js/ui-effects.js)
// ==========================================

let feedbackTimeoutId = null;

window.mostrarFeedbackAnimado = function(tipo, mensaje) {
    var overlay = document.getElementById('scan-feedback');
    var box = document.getElementById('scan-feedback-box');
    var msgEl = document.getElementById('scan-feedback-msg');

    if (!overlay || !box || !msgEl) return;

    // Cancelar temporizador previo para evitar que el cartel se cierre antes de tiempo
    if (feedbackTimeoutId) {
        clearTimeout(feedbackTimeoutId);
        feedbackTimeoutId = null;
    }

    box.className = 'feedback-pop ' + (tipo === 'exito' ? 'feedback-success' : 'feedback-error');
    box.innerHTML = (tipo === 'exito' || tipo === 'success') ? '✓' : '✕';
    msgEl.innerText = mensaje || "";

    overlay.style.display = 'flex';
    
    feedbackTimeoutId = setTimeout(function() {
        overlay.style.display = 'none';
        feedbackTimeoutId = null;
    }, 1400);
};

window.mostrarToast = function(mensaje) {
    if (!mensaje) return;

    // Limpiar notificaciones previas en pantalla
    var toastsPrevios = document.querySelectorAll('.toast-notification');
    toastsPrevios.forEach(function(t) {
        if (t.parentNode) t.parentNode.removeChild(t);
    });

    var toast = document.createElement('div');
    toast.className = 'toast-notification toast-slide-in';
    toast.innerText = mensaje;
    
    // Estilos inline de respaldo en caso de fallo de CSS externo
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#1f2937';
    toast.style.color = '#ffffff';
    toast.style.padding = '10px 18px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '13px';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'all 0.3s ease';

    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 2500);
};
