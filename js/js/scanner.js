let html5QrScannerInstancia = null;

window.abrirCamaraEnVivo = function(modo) {
    if (typeof Html5Qrcode === 'undefined') { 
        window.mostrarFeedbackAnimado('error', 'Cargando escáner...'); 
        return; 
    }
    document.getElementById('modal-camara').style.display = 'flex';

    if (html5QrScannerInstancia) {
        try {
            html5QrScannerInstancia.stop().then(function() {
                html5QrScannerInstancia.clear();
                window.iniciarCamaraInstancia(modo);
            }).catch(function() {
                window.iniciarCamaraInstancia(modo);
            });
            return;
        } catch(e) {}
    }
    window.iniciarCamaraInstancia(modo);
};

window.iniciarCamaraInstancia = function(modo) {
    html5QrScannerInstancia = new Html5Qrcode("interactive-scanner");
    html5QrScannerInstancia.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 130 } },
        function(decodedText) {
            window.cerrarCamaraEnVivo();
            if (modo === 'registro') {
                var eSerial = document.getElementById('prod-serial');
                if (eSerial) eSerial.value = decodedText;
                window.mostrarFeedbackAnimado('exito', 'Código Leído');
            } else if (modo === 'caja') {
                var match = null;
                for (var i = 0; i < productos.length; i++) {
                    if (productos[i].serial === decodedText) { 
                        match = productos[i]; 
                        break; 
                    }
                }
                if (match) {
                    window.mostrarFeedbackAnimado('exito', match.nombre);
                    window.agregarAlCarritoDesdeCaja(match.id);
                } else {
                    window.mostrarFeedbackAnimado('error', 'Código No Registrado');
                }
            }
        },
        function(errorMessage) {}
    ).catch(function(err) {
        document.getElementById('modal-camara').style.display = 'none';
        if (modo === 'registro') {
            document.getElementById('file-barcode-reg').click();
        } else {
            document.getElementById('file-barcode-caja').click();
        }
    });
};

window.cerrarCamaraEnVivo = function() {
    if (html5QrScannerInstancia) {
        html5QrScannerInstancia.stop().then(function() {
            html5QrScannerInstancia.clear();
            html5QrScannerInstancia = null;
            document.getElementById('modal-camara').style.display = 'none';
        }).catch(function() {
            html5QrScannerInstancia = null;
            document.getElementById('modal-camara').style.display = 'none';
        });
    } else {
        document.getElementById('modal-camara').style.display = 'none';
    }
};

window.escanearBarcodeFoto = function(event, modo) {
    if (typeof Html5Qrcode === 'undefined') { 
        window.mostrarToast("Conectando cámara..."); 
        return; 
    }
    var file = event.target.files[0];
    if (!file) return;

    var html5QrCode = new Html5Qrcode("hidden-qr-reader");
    html5QrCode.scanFile(file, true)
    .then(function(decodedText) {
        if (modo === 'registro') {
            var eSerial = document.getElementById('prod-serial');
            if (eSerial) eSerial.value = decodedText;
            window.mostrarFeedbackAnimado('exito', 'Código Detectado');
        } else if (modo === 'caja') {
            var match = null;
            for (var i = 0; i < productos.length; i++) {
                if (productos[i].serial === decodedText) { 
                    match = productos[i]; 
                    break; 
                }
            }
            if (match) {
                window.mostrarFeedbackAnimado('exito', match.nombre);
                window.agregarAlCarritoDesdeCaja(match.id);
            } else {
                window.mostrarFeedbackAnimado('error', 'Código No Registrado');
            }
        }
    })
    .catch(function() { 
        window.mostrarFeedbackAnimado('error', 'No se detectó código'); 
    });
};
