// ==========================================
// MÓDULO DE ESCÁNER DE CÓDIGOS DE BARRAS / QR (CORREGIDO)
// ==========================================

let html5QrScannerInstancia = null;

window.abrirCamaraEnVivo = function(modo) {
    if (typeof Html5Qrcode === 'undefined') { 
        if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'Cargando escáner...'); 
        return; 
    }
    
    var modal = document.getElementById('modal-camara');
    if (modal) modal.style.display = 'flex';

    if (html5QrScannerInstancia) {
        window.cerrarCamaraEnVivo(function() {
            window.iniciarCamaraInstancia(modo);
        });
    } else {
        window.iniciarCamaraInstancia(modo);
    }
};

window.iniciarCamaraInstancia = function(modo) {
    var elementId = "interactive-scanner";
    if (!document.getElementById(elementId)) return;

    // Configuración dinámica adaptada a celulares
    var config = {
        fps: 15,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
            var minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
                width: Math.floor(minEdge * 0.75),
                height: Math.floor(minEdge * 0.45)
            };
        },
        aspectRatio: 1.0
    };

    html5QrScannerInstancia = new Html5Qrcode(elementId);
    
    html5QrScannerInstancia.start(
        { facingMode: "environment" },
        config,
        function(decodedText) {
            window.cerrarCamaraEnVivo();
            
            var serialLimpio = decodedText.trim();
            
            if (modo === 'registro') {
                var eSerial = document.getElementById('prod-serial');
                if (eSerial) eSerial.value = serialLimpio;
                if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('exito', 'Código Leído');
            } else if (modo === 'caja') {
                var prods = window.productos || [];
                var match = null;
                
                for (var i = 0; i < prods.length; i++) {
                    if (String(prods[i].serial).trim() === serialLimpio) { 
                        match = prods[i]; 
                        break; 
                    }
                }
                
                if (match) {
                    if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('exito', match.nombre);
                    if (window.agregarAlCarritoDesdeCaja) window.agregarAlCarritoDesdeCaja(match.id);
                } else {
                    if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'Código No Registrado');
                }
            }
        },
        function(errorMessage) {
            // Ignorar errores de frame para no saturar consola
        }
    ).catch(function(err) {
        console.warn("Fallo cámara en vivo, recurriendo a input file:", err);
        var modal = document.getElementById('modal-camara');
        if (modal) modal.style.display = 'none';
        
        var fileInputId = (modo === 'registro') ? 'file-barcode-reg' : 'file-barcode-caja';
        var fileInput = document.getElementById(fileInputId);
        if (fileInput) fileInput.click();
    });
};

window.cerrarCamaraEnVivo = function(callback) {
    var modal = document.getElementById('modal-camara');
    
    if (html5QrScannerInstancia) {
        html5QrScannerInstancia.stop().then(function() {
            try { html5QrScannerInstancia.clear(); } catch(e){}
            html5QrScannerInstancia = null;
            if (modal) modal.style.display = 'none';
            if (callback) callback();
        }).catch(function(err) {
            html5QrScannerInstancia = null;
            if (modal) modal.style.display = 'none';
            if (callback) callback();
        });
    } else {
        if (modal) modal.style.display = 'none';
        if (callback) callback();
    }
};

window.escanearBarcodeFoto = function(event, modo) {
    if (typeof Html5Qrcode === 'undefined') { 
        if (window.mostrarToast) window.mostrarToast("Cargando motor de lectura..."); 
        return; 
    }
    
    var input = event.target;
    var file = input.files ? input.files[0] : null;
    if (!file) return;

    var readerId = "hidden-qr-reader";
    if (!document.getElementById(readerId)) {
        var hiddenDiv = document.createElement('div');
        hiddenDiv.id = readerId;
        hiddenDiv.style.display = 'none';
        document.body.appendChild(hiddenDiv);
    }

    var html5QrCode = new Html5Qrcode(readerId);
    
    html5QrCode.scanFile(file, true)
    .then(function(decodedText) {
        var serialLimpio = decodedText.trim();
        
        if (modo === 'registro') {
            var eSerial = document.getElementById('prod-serial');
            if (eSerial) eSerial.value = serialLimpio;
            if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('exito', 'Código Detectado');
        } else if (modo === 'caja') {
            var prods = window.productos || [];
            var match = null;
            
            for (var i = 0; i < prods.length; i++) {
                if (String(prods[i].serial).trim() === serialLimpio) { 
                    match = prods[i]; 
                    break; 
                }
            }
            
            if (match) {
                if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('exito', match.nombre);
                if (window.agregarAlCarritoDesdeCaja) window.agregarAlCarritoDesdeCaja(match.id);
            } else {
                if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'Código No Registrado');
            }
        }
        
        input.value = ""; // Limpieza para permitir escanear de nuevo la misma foto
        try { html5QrCode.clear(); } catch(e){}
    })
    .catch(function(err) { 
        if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'No se detectó código'); 
        input.value = "";
        try { html5QrCode.clear(); } catch(e){}
    });
};
