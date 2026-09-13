window.recuperarFactura = function() {
    if (facturasEnEspera.length === 0) { 
        window.mostrarFeedbackAnimado('error', 'No hay facturas pausadas'); 
        return; 
    }
    if (carrito.length > 0) { 
        window.mostrarFeedbackAnimado('error', 'Limpia o procesa la venta actual'); 
        return; 
    }
    
    var text = "Elige qué factura recuperar (escribe el número):\n";
    for (var i = 0; i < facturasEnEspera.length; i++) {
        text += (i + 1) + ". " + facturasEnEspera[i].cliente + " (" + window.formatVE(facturasEnEspera[i].totalVES) + ")\n";
    }
    var resp = prompt(text);
    var idx = parseInt(resp) - 1;

    if (!isNaN(idx) && facturasEnEspera[idx]) {
        var rec = facturasEnEspera.splice(idx, 1)[0];
        if (window.localStorage) {
            window.localStorage.setItem('geomercado_espera_v19', JSON.stringify(facturasEnEspera));
        }
        
        carrito = rec.items;
        if (window.recalcularTotalesCarrito) window.recalcularTotalesCarrito();
        document.getElementById('cliente-nombre').value = rec.cliente !== "Cliente sin nombre" ? rec.cliente : "";
        if (window.renderizarCarritoCaja) window.renderizarCarritoCaja();
        window.mostrarToast("📂 Factura Recuperada");
    }
};

window.enviarDatosPagoMovilWS = function() {
    var tlfCliente = document.getElementById('pm-phone').value || "";
    var msj = "📲 *DATOS DE PAGO MÓVIL*\n\n";
    msj += "🏢 *" + perfilNegocio.nombre + "*\n";
    msj += "🏦 Banco: " + (perfilNegocio.pmBanco || "No configurado") + "\n";
    msj += "🪪 CI/RIF: " + (perfilNegocio.pmCedula || "No configurado") + "\n";
    msj += "📞 Teléfono: " + (perfilNegocio.pmTlf || "No configurado") + "\n\n";
    msj += "💵 Total a pagar: *" + window.formatVE(totalVentaVES) + "* (" + window.formatUSD(totalVentaUSD) + ")\n\n";
    msj += "Por favor envía el comprobante por este medio. ¡Muchas gracias!";

    var numClean = tlfCliente.replace(/\D/g, '');
    var url = numClean 
        ? ("https://api.whatsapp.com/send?phone=" + numClean + "&text=" + encodeURIComponent(msj)) 
        : ("https://api.whatsapp.com/send?text=" + encodeURIComponent(msj));
    window.open(url, '_blank', 'noopener,noreferrer');
};

window.procesarCobro = function(imprimirTicketBooleano) {
    if (carrito.length === 0) { 
        window.mostrarFeedbackAnimado('error', 'Carrito Vacío'); 
        return; 
    }
    var ptv = window.extraerNumeroLimpio('pay-ptv');
    var pm = window.extraerNumeroLimpio('pay-pm');
    var usd = parseFloat(document.getElementById('pay-usd').value) || 0; 
    var ves = window.extraerNumeroLimpio('pay-ves');
    var now = new Date();
    
    var cNombre = document.getElementById('cliente-nombre').value;
    var cCedula = document.getElementById('cliente-cedula').value;
    var cDir = document.getElementById('cliente-dir').value;
    var cTlf = document.getElementById('pm-phone').value;

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

    if (imprimirTicketBooleano && window.imprimirTicket) {
        window.imprimirTicket(ventasHistorico.length - 1);
    }

    window.limpiarCaja(true); 
};

window.limpiarCaja = function(silencioso) {
    if (!silencioso) {
        for (var i = 0; i < carrito.length; i++) {
            if (carrito[i].tipo !== 'peso' && carrito[i].tipo !== 'combo') {
                for (var j = 0; j < productos.length; j++) {
                    if (productos[j].id === carrito[i].id) {
                        productos[j].qty += carrito[i].qtyVenta;
                        break;
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
    
    document.getElementById('pay-ptv').value = ''; 
    document.getElementById('pay-pm').value = '';
    document.getElementById('pay-usd').value = ''; 
    document.getElementById('pay-ves').value = '';
    document.getElementById('cliente-nombre').value = ''; 
    document.getElementById('cliente-cedula').value = ''; 
    document.getElementById('cliente-dir').value = '';
    document.getElementById('pm-phone').value = ''; 
    document.getElementById('pm-ref').value = '';
    if (document.getElementById('modal-cliente')) {
        document.getElementById('modal-cliente').style.display = 'none';
    }
    
    var banner = document.getElementById('pm-status-banner');
    if (banner) banner.style.display = 'none';

    if (window.actualizarEtiquetasPago) window.actualizarEtiquetasPago();
    if (window.renderizarCarritoCaja) window.renderizarCarritoCaja();
};
