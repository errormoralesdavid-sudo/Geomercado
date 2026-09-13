// ==========================================
// ESCÁNER OCR PARA COMPROBANTES DE PAGO (CORREGIDO)
// ==========================================

window.escanearCapturePagoCompleto = function(event) {
    if (typeof Tesseract === 'undefined') { 
        if (window.mostrarToast) window.mostrarToast("Cargando motor OCR..."); 
        return; 
    }
    
    var input = event.target;
    if (!input.files || !input.files[0]) return;

    var file = input.files[0];
    var eRef = document.getElementById('pm-ref');
    var banner = document.getElementById('pm-status-banner');
    
    if (eRef) eRef.value = "Leyendo...";
    if (banner) { 
        banner.style.display = 'none'; 
        banner.className = 'pm-status-banner'; 
    }
    
    var overlay = document.getElementById('scan-feedback');
    var box = document.getElementById('scan-feedback-box');
    var msgEl = document.getElementById('scan-feedback-msg');

    if (overlay && box && msgEl) {
        box.className = '';
        box.innerHTML = '<div class="spinner-loader"></div>';
        msgEl.innerText = 'Procesando captura...';
        overlay.style.display = 'flex';
    }

    Tesseract.recognize(file, 'spa')
    .then(function(result) {
        if (overlay) overlay.style.display = 'none';
        if (box) box.innerHTML = '';
        
        var text = result.data.text || "";
        var textLimpio = text.toLowerCase().replace(/[\n\r]/g, ' ');

        // 1. Detección Inteligente de Referencia
        var patronRefClave = /(?:ref|referencia|nro|operacion|aprobacion|comprobante)[:.\s]*(\d{4,12})/i;
        var matchRefClave = text.match(patronRefClave);
        var matchRefGenerico = text.match(/\d{6,12}/);
        
        var refFinal = "";
        if (matchRefClave && matchRefClave[1]) {
            refFinal = matchRefClave[1];
        } else if (matchRefGenerico) {
            refFinal = matchRefGenerico[0];
        }

        if (eRef) eRef.value = refFinal || "Manual";

        // 2. Extracción de Monto
        var patronMontoConSimbolo = /(?:bs\.?|bolivares|monto|pagado)[:.\s]*([\d.]+(?:,\d{1,2})?)/i;
        var patronMontoEstandar = /([\d.]+(?:,\d{2}))\s*(?:bs|bolivares)?/i;
        
        var matchMonto = text.match(patronMontoConSimbolo) || text.match(patronMontoEstandar);

        if (matchMonto) {
            var rawMonto = matchMonto[1] || matchMonto[0];
            var limpio = rawMonto.replace(/[^\d,.]/g, '');
            
            // Convertir formato venezolano (1.234,56) a flotante
            if (limpio.indexOf(',') !== -1) {
                limpio = limpio.replace(/\./g, '').replace(',', '.');
            }
            
            var numeroParaInput = parseFloat(limpio);
            var inputPm = document.getElementById('pay-pm');
            
            if (inputPm && !isNaN(numeroParaInput) && numeroParaInput > 0) {
                inputPm.value = Math.round(numeroParaInput * 100).toString();
                if (window.mascaraMoneda) window.mascaraMoneda(inputPm);
                if (window.mostrarFeedbackAnimado) {
                    window.mostrarFeedbackAnimado('exito', 'Monto: ' + window.formatVE(numeroParaInput));
                }
            }
        } else if (window.mostrarFeedbackAnimado) {
            window.mostrarFeedbackAnimado('error', 'Revisa el monto manualmente');
        }

        // 3. Verificación de Datos de Destino
        if (banner) {
            var perfil = window.perfilNegocio || {};
            var cedulaLimpia = (perfil.pmCedula || "").replace(/\D/g, '');
            var tlfLimpio = (perfil.pmTlf || "").replace(/\D/g, '');
            var bancoLimpio = (perfil.pmBanco || "").toLowerCase().trim();
            var textoSoloDigitos = text.replace(/\D/g, '');

            var coincidenciaCedula = cedulaLimpia && (textSoloDigitos.includes(cedulaLimpia) || textLimpio.includes(cedulaLimpia));
            var coincidenciaTelefono = tlfLimpio && (textSoloDigitos.includes(tlfLimpio) || textLimpio.includes(tlfLimpio));
            var coincidenciaBanco = bancoLimpio && textLimpio.includes(bancoLimpio);

            if (coincidenciaCedula || coincidenciaTelefono || coincidenciaBanco) {
                banner.className = 'pm-status-banner pm-status-success';
                banner.innerText = "✓ Pago Móvil verificado: Datos coinciden con tu cuenta.";
                banner.style.display = 'block';
            } else if (perfil.pmCedula || perfil.pmTlf || perfil.pmBanco) {
                banner.className = 'pm-status-banner pm-status-warning';
                banner.innerText = "⚠️ Verifica manualmente: No se confirmaron datos de destino.";
                banner.style.display = 'block';
            }
        }

        if (window.actualizarEtiquetasPago) window.actualizarEtiquetasPago();
        if (window.calcularCaja) window.calcularCaja();
        
        // Limpiar el input para permitir volver a subir el mismo archivo
        input.value = "";
    })
    .catch(function(err) {
        console.error("Error OCR:", err);
        if (overlay) overlay.style.display = 'none';
        if (box) box.innerHTML = '';
        if (eRef) eRef.value = "";
        if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'Error al leer la imagen');
        input.value = "";
    });
};
