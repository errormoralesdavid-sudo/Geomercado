window.mostrarFeedbackAnimado = function(tipo, mensaje) {
    var overlay = document.getElementById('scan-feedback');
    var box = document.getElementById('scan-feedback-box');
    var msgEl = document.getElementById('scan-feedback-msg');

    if (!overlay || !box || !msgEl) return;

    box.className = 'feedback-pop ' + (tipo === 'exito' ? 'feedback-success' : 'feedback-error');
    box.innerHTML = tipo === 'exito' ? '✓' : '✕';
    msgEl.innerText = mensaje;

    overlay.style.display = 'flex';
    
    setTimeout(function() {
        overlay.style.display = 'none';
    }, 1400);
};

window.mostrarToast = function(mensaje) {
    var toast = document.createElement('div');
    toast.className = 'toast-notification toast-slide-in';
    toast.innerText = mensaje;
    
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.classList.remove('toast-slide-in');
        toast.classList.add('toast-slide-out');
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 2500);
};
