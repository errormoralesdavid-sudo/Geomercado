window.escanearCapturePagoCompleto = function(event) {
    if (typeof Tesseract === 'undefined') { 
        window.mostrarToast("Cargando motor OCR..."); 
        return; 
    }
    var input = event.target;
    if (!input.files || !input.files[0]) return;

    var eRef = document.getElementById('pm-ref');
    var banner = document.getElementById('pm-status-banner');
    
    if (eRef) eRef.value = "Leyendo Capture...";
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
        msgEl.innerText = 'Procesando Capture...';
        overlay.style.display = 'flex';
    }

    Tesseract.recognize(input.files[0], 'spa')
    .then(function(result) {
        if (overlay) overlay.style.display = 'none';
        if (box) box.innerHTML = '';
        
        var text = result.data.text;
        var textLimpio = text.replace(/[\n\r]/g, ' ').toLowerCase();

        var ref = text.match(/\d{6,12}/);
        
        var patronMontoBDV = /([\d\.]+,\d{2})\s*Bs/i;
        var patronMontoGen = /(?:bs|monto|pagado|ref)?[:.\s]*([\d.]+,\d{2})/i;
        var matchMonto = text.match(patronMontoBDV) || text.match(patronMontoGen);

        if (eRef) eRef.value = ref ? ref[0] : "Manual";
        
        if (matchMonto) {
            var limpio = matchMonto[1] || matchMonto[0];
            var numeroParaInput = parseFloat(limpio.replace(/\./g, '').replace(',', '.'));
            var inputPm = document.getElementById('pay-pm');
            
            if (inputPm && !isNaN(numeroParaInput)) {
                inputPm.value = Math.round(numeroParaInput * 100).toString();
                window.mascaraMoneda(inputPm);
                window.mostrarFeedbackAnimado('exito', 'Monto: ' + window.formatVE(numeroParaInput));
            }
        } else {
            window.mostrarFeedbackAnimado('error', 'Revisa el monto manualmente');
        }

        if (banner) {
            var coincidenciaCedula = perfilNegocio.pmCedula && textLimpio.includes(perfilNegocio.pmCedula.toLowerCase().trim());
            var coincidenciaTelefono = perfilNegocio.pmTlf && textLimpio.includes(perfilNegocio.pmTlf.toLowerCase().replace(/\D/g, ''));
            var coincidenciaBanco = perfilNegocio.pmBanco && textLimpio.includes(perfilNegocio.pmBanco.toLowerCase().trim());

            if (coincidenciaCedula || coincidenciaTelefono || coincidenciaBanco) {
                banner.className = 'pm-status-banner pm-status-success';
                banner.innerText = "✓ Pago Móvil verificado: Datos coinciden con tu cuenta.";
                banner.style.display = 'block';
            } else if (perfilNegocio.pmCedula || perfilNegocio.pmTlf || perfilNegocio.pmBanco) {
                banner.className = 'pm-status-banner pm-status-warning';
                banner.innerText = "⚠️ Verifica manualmente: No se confirmaron datos de destino.";
                banner.style.display = 'block';
            }
        }

        if (window.actualizarEtiquetasPago) window.actualizarEtiquetasPago();
        if (window.calcularCaja) window.calcularCaja();
    })
    .catch(function(err) {
        console.error(err);
        if (overlay) overlay.style.display = 'none';
        if (box) box.innerHTML = '';
        if (eRef) eRef.value = "";
        window.mostrarFeedbackAnimado('error', 'Error al leer imagen');
    });
};
