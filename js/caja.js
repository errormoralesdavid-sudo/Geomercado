// ==========================================
// MÓDULO DE CAJA (CORREGIDO Y OPTIMIZADO)
// ==========================================

// Definición defensiva de feedback animado en caso de no existir previamente
if (!window.mostrarFeedbackAnimado) {
    window.mostrarFeedbackAnimado = function(tipo, mensaje) {
        var overlay = document.getElementById('scan-feedback') || document.querySelector('.feedback-overlay');
        if (!overlay) {
            window.mostrarToast(mensaje);
            return;
        }
        var textoElem = overlay.querySelector('p') || overlay;
        if (textoElem) textoElem.innerText = mensaje;
        
        overlay.style.display = 'flex';
        overlay.classList.add('feedback-pop');
        
        setTimeout(function() {
            overlay.style.display = 'none';
            overlay.classList.remove('feedback-pop');
        }, 1800);
    };
}

// Definición defensiva de Notificación Toast
if (!window.mostrarToast) {
    window.mostrarToast = function(mensaje) {
        var oldToast = document.querySelector('.toast-notification');
        if (oldToast) oldToast.remove();

        var toast = document.createElement('div');
        toast.className = 'toast-notification feedback-pop';
        toast.innerText = mensaje;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.remove();
        }, 2200);
    };
}

window.recuperarFactura = function() {
    if (!facturasEnEspera || facturasEnEspera.length === 0) { 
        window.mostrarFeedbackAnimado('error', 'No hay facturas pausadas'); 
        return; 
    }
    if (carrito && carrito.length > 0) { 
        window.mostrarFeedbackAnimado('error', 'Limpia o procesa la venta actual'); 
        return; 
    }
    
    var text = "Elige qué factura recuperar (escribe el número):\n";
    for (var i = 0; i < facturasEnEspera.length; i++) {
        var clienteNom = facturasEnEspera[i].cliente || "Cliente sin nombre";
        var totalVES = facturasEnEspera[i].totalVES || 0;
        text += (i + 1) + ". " + clienteNom + " (" + window.formatVE(totalVES) + ")\n";
    }
    
    var resp = prompt(text);
    if (!resp) return;
    
    var idx = parseInt(resp) - 1;

    if (!isNaN(idx) && facturasEnEspera[idx]) {
        var rec = facturasEnEspera.splice(idx, 1)[0];
        if (window.localStorage) {
            window.localStorage.setItem('geomercado_espera_v19', JSON.stringify(facturasEnEspera));
        }
        
        carrito = rec.items || [];
        if (window.recalcularTotalesCarrito) window.recalcularTotalesCarrito();
        
        var inputCliente = document.getElementById('cliente-nombre');
        if (inputCliente) {
            inputCliente.value = (rec.cliente && rec.cliente !== "Cliente sin nombre") ? rec.cliente : "";
        }
        
        if (window.renderizarCarritoCaja) window.renderizarCarritoCaja();
        window.mostrarToast("📂 Factura Recuperada");
    }
};

window.enviarDatosPagoMovilWS = function() {
    var elemPhone = document.getElementById('pm-phone');
    var tlfCliente = elemPhone ? elemPhone.value : "";
    
    var msj = "📲 *DATOS DE PAGO MÓVIL*\n\n";
    msj += "🏢 *" + (perfilNegocio ? perfilNegocio.nombre : "Geo Mercado") + "*\n";
    msj += "🏦 Banco: " + (perfilNegocio && perfilNegocio.pmBanco ? perfilNegocio.pmBanco : "No configurado") + "\n";
    msj += "🪪 CI/RIF: " + (perfilNegocio && perfilNegocio.pmCedula ? perfilNegocio.pmCedula : "No configurado") + "\n";
    msj += "📞 Teléfono: " + (perfilNegocio && perfilNegocio.pmTlf ? perfilNegocio.pmTlf : "No configurado") + "\n\n";
    msj += "💵 Total a pagar: *" + window.formatVE(totalVentaVES) + "* (" + window.formatUSD(totalVentaUSD) + ")\n\n";
    msj += "Por favor envía el comprobante por este medio. ¡Muchas gracias!";

    var numClean = tlfCliente.replace(/\D/g, '');
    var url = numClean 
        ? ("https://api.whatsapp.com/send?phone=" + numClean + "&text=" + encodeURIComponent(msj)) 
        : ("https://api.whatsapp.com/send?text=" + encodeURIComponent(msj));
    window.open(url, '_blank', 'noopener,noreferrer');
};

window.procesarCobro = function(imprimirTicketBooleano) {
    if (!carrito || carrito.length === 0) { 
        window.mostrarFeedbackAnimado('error', 'Carrito Vacío'); 
        return; 
    }
    var ptv = window.extraerNumeroLimpio('pay-ptv');
    var pm = window.extraerNumeroLimpio('pay-pm');
    
    var elemUSD = document.getElementById('pay-usd');
    var usd = elemUSD ? (parseFloat(elemUSD.value) || 0) : 0; 
    var ves = window.extraerNumeroLimpio('pay-ves');
    var now = new Date();
    
    var cNombre = document.getElementById('cliente-nombre') ? document.getElementById('cliente-nombre').value : "";
    var cCedula = document.getElementById('cliente-cedula') ? document.getElementById('cliente-cedula').value : "";
    var cDir = document.getElementById('cliente-dir') ? document.getElementById('cliente-dir').value : "";
    var cTlf = document.getElementById('pm-phone') ? document.getElementById('pm-phone').value : "";

    var costoTotalVentaUSD = 0;
    for (var k = 0; k < carrito.length; k++) {
        costoTotalVentaUSD += (carrito[k].costoTotalUSD || 0);
    }

    var venta = {
        id: new Date().getTime(),
        fecha: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
        items: carrito.slice(),
        totalUSD: totalVentaUSD,
        totalVES: totalVentaVES,
        costoUSD: costoTotalVentaUSD,
        ptv: ptv, pm: pm, usd: usd, ves: ves,
        cliente: cNombre, cedula: cCedula, dir: cDir, tlf: cTlf
    };
    
    ventasHistorico.push(venta);
    if (window.localStorage) {
        window.localStorage.setItem('geomercado_ventas_v19', JSON.stringify(ventasHistorico));
    }
    
    window.mostrarFeedbackAnimado('exito', 'Venta Cobrada Exitosamente');

    if (imprimirTicketBooleano && typeof window.imprimirTicket === 'function') {
        window.imprimirTicket(ventasHistorico.length - 1);
    }

    window.limpiarCaja(true); 
};

window.limpiarCaja = function(silencioso) {
    if (!silencioso) {
        if (carrito && productos) {
            for (var i = 0; i < carrito.length; i++) {
                if (carrito[i].tipo !== 'peso' && carrito[i].tipo !== 'combo') {
                    for (var j = 0; j < productos.length; j++) {
                        if (productos[j].id === carrito[i].id) {
                            productos[j].qty += (carrito[i].qtyVenta || carrito[i].cantidad || 1);
                            break;
                        }
                    }
                }
            }
        }
        if (window.localStorage) {
            window.localStorage.setItem('geomercado_db_v19', JSON.stringify(productos));
        }
        window.mostrarToast("Venta cancelada, stock devuelto");
    }

    totalVentaUSD = 0.00; 
    totalVentaVES = 0.00; 
    carrito = [];
    
    var inputsReset = ['pay-ptv', 'pay-pm', 'pay-usd', 'pay-ves', 'cliente-nombre', 'cliente-cedula', 'cliente-dir', 'pm-phone', 'pm-ref'];
    inputsReset.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });

    if (document.getElementById('modal-cliente')) {
        document.getElementById('modal-cliente').style.display = 'none';
    }
    
    var banner = document.getElementById('pm-status-banner');
    if (banner) banner.style.display = 'none';

    if (window.actualizarEtiquetasPago) window.actualizarEtiquetasPago();
    if (window.renderizarCarritoCaja) window.renderizarCarritoCaja();
};
