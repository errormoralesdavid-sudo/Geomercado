window.renderizarCierreDeCaja = function() {
    var totalPM = 0; var totalUSDFisico = 0; var totalVESFisico = 0; var totalPTV = 0; 
    var totalVentasUSD = 0; var totalCostoUSD = 0;
    var container = document.getElementById('lista-historial-ventas');
    if (!container) return;
    var html = "";

    for (var i = 0; i < ventasHistorico.length; i++) {
        var v = ventasHistorico[i];
        totalPM += v.pm; totalUSDFisico += v.usd; totalVESFisico += v.ves; totalPTV += v.ptv; 
        totalVentasUSD += v.totalUSD;
        totalCostoUSD += (v.costoUSD || 0);
        
        var itemsStr = v.items.map(function(it) { 
            return window.escapeHTML(it.nombre) + " (x" + (it.qtyVenta || it.detalle) + ")"; 
        }).join(', ');

        html += '<div class="cierre-card">';
        html += '<div style="display:flex; justify-content:space-between;"><h4>🛒 ' + v.fecha + '</h4></div>';
        if (v.cliente) html += '<div style="color:#fff; font-size:11px; margin-bottom:4px;">Cliente: ' + window.escapeHTML(v.cliente) + '</div>';
        
        html += '<div class="cierre-item">Artículos: <span>' + itemsStr + '</span></div>';
        html += '<div class="cierre-item">Total Factura: <span style="font-size:14px; color:#00ff66;">' + window.formatVE(v.totalVES) + '</span></div>';
        
        if (v.usd > 0) {
            html += '<div class="cierre-item" style="color:#8fa0b7;">Efectivo ($) Entregado: <span>$' + v.usd.toFixed(2) + '</span></div>';
        }
        
        html += '<div style="display:flex; gap:6px; margin-top:8px;">';
        html += '<button style="flex:1; background:#fff; color:#000; font-weight:bold; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.imprimirTicket(' + i + ')">🖨️ Ticket</button>';
        html += '<button style="flex:1; background:#25D366; color:#fff; font-weight:bold; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.enviarFacturaWS(' + i + ')">📲 WhatsApp</button>';
        html += '<button style="flex:1; background:#ff5252; color:#fff; font-weight:bold; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.anularVenta(' + i + ')">❌ Anular</button>';
        html += '</div></div>';
    }

    if (ventasHistorico.length === 0) {
        html = '<div style="text-align:center; color:#57687e; font-size:12px;">No hay ventas registradas.</div>';
    }
    container.innerHTML = html;

    var gananciaNetaUSD = totalVentasUSD - totalCostoUSD;
    var gananciaTotalVES = gananciaNetaUSD * tasaDia;

    if (document.getElementById('resumen-ptv')) document.getElementById('resumen-ptv').innerText = window.formatVE(totalPTV);
    if (document.getElementById('resumen-pm')) document.getElementById('resumen-pm').innerText = window.formatVE(totalPM);
    if (document.getElementById('resumen-ves')) document.getElementById('resumen-ves').innerText = window.formatVE(totalVESFisico);
    if (document.getElementById('resumen-ganancia-ves')) document.getElementById('resumen-ganancia-ves').innerText = window.formatVE(gananciaTotalVES) + " (" + window.formatUSD(gananciaNetaUSD) + ")";
    if (document.getElementById('resumen-efectivo-usd')) document.getElementById('resumen-efectivo-usd').innerText = "$" + totalUSDFisico.toFixed(2);
    if (document.getElementById('cierre-fondo-usd')) document.getElementById('cierre-fondo-usd').innerText = "$" + fondoCaja.usd.toFixed(2);
    if (document.getElementById('cierre-fondo-ves')) document.getElementById('cierre-fondo-ves').innerText = window.formatVE(fondoCaja.ves);

    var esperadoUSD = fondoCaja.usd + totalUSDFisico;
    var esperadoVES = fondoCaja.ves + totalVESFisico;

    if (document.getElementById('esperado-usd')) document.getElementById('esperado-usd').innerText = "$" + esperadoUSD.toFixed(2);
    if (document.getElementById('esperado-ves')) document.getElementById('esperado-ves').innerText = window.formatVE(esperadoVES);
};

window.imprimirTicket = function(index) {
    var v = ventasHistorico[index];
    if (!v) return;

    var pw = window.open('', '_blank');
    if (!pw) { 
        window.mostrarFeedbackAnimado('error', 'Habilita las ventanas emergentes'); 
        return; 
    }
    
    var doc = pw.document;
    var h = '<html><head><title>Ticket</title><style>body{font-family:monospace; color:#000; width:280px; margin:0 auto; padding:10px;} .it{display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;}</style></head><body>';
    h += '<h2 style="text-align:center; margin:0; font-size:16px;">' + window.escapeHTML(perfilNegocio.nombre) + '</h2>';
    if (perfilNegocio.rif) h += '<p style="text-align:center; margin:0; font-size:11px;">RIF: ' + window.escapeHTML(perfilNegocio.rif) + '</p>';
    if (perfilNegocio.dir) h += '<p style="text-align:center; margin:0; font-size:10px;">' + window.escapeHTML(perfilNegocio.dir) + '</p>';
    if (perfilNegocio.tlf) h += '<p style="text-align:center; margin:0; font-size:10px;">Tlf: ' + window.escapeHTML(perfilNegocio.tlf) + '</p>';
    h += '<p style="text-align:center; font-size:11px; margin-top:6px;">' + v.fecha + '</p><hr>';
    
    if (v.cliente) h += '<p style="font-size:11px;">Cliente: ' + window.escapeHTML(v.cliente) + '<br>CI/RIF: ' + window.escapeHTML(v.cedula) + '</p>';
    if (v.dir) h += '<p style="font-size:11px;">Dir: ' + window.escapeHTML(v.dir) + '</p>';
    if (v.tlf) h += '<p style="font-size:11px;">Tlf: ' + window.escapeHTML(v.tlf) + '</p>';
    h += '<hr>';
    
    for (var i = 0; i < v.items.length; i++) {
        var item = v.items[i];
        var precioBsItem = item.totalUSD * (v.totalVES / (v.totalUSD || 1));
        h += '<div class="it"><span>' + (item.qtyVenta || item.detalle) + 'x ' + window.escapeHTML(item.nombre) + '</span><span>' + window.formatVE(precioBsItem) + '</span></div>';
    }
    
    h += '<hr><h3 style="text-align:right; margin:4px 0; font-size:14px;">TOTAL: ' + window.formatVE(v.totalVES) + '</h3>';
    h += '<p style="text-align:center; margin-top:15px; font-size:11px;">¡Gracias por su compra!</p>';
    h += '</body></html>';
    
    doc.write(h);
    doc.close();
    pw.focus();
    pw.print();
    pw.close();
};

window.enviarFacturaWS = function(index) {
    var v = ventasHistorico[index];
    var msj = "🧾 *COMPROBANTE DE COMPRA*\n";
    msj += "🏢 *" + perfilNegocio.nombre + "*\n";
    if (perfilNegocio.rif) msj += "RIF: " + perfilNegocio.rif + "\n";
    msj += "📅 Fecha: " + v.fecha + "\n";
    if (v.cliente) msj += "👤 Cliente: " + v.cliente + "\n";
    msj += "-----------------------------------\n";
    
    for (var i = 0; i < v.items.length; i++) {
        var item = v.items[i];
        var precioBsItem = item.totalUSD * (v.totalVES / (v.totalUSD || 1));
        msj += (item.qtyVenta || item.detalle) + "x " + item.nombre + " - " + window.formatVE(precioBsItem) + "\n";
    }
    
    msj += "-----------------------------------\n";
    msj += "💰 *TOTAL: " + window.formatVE(v.totalVES) + "* (" + window.formatUSD(v.totalUSD) + ")\n\n";
    msj += "¡Gracias por su compra!";

    var numClean = (v.tlf || "").replace(/\D/g, '');
    var url = numClean 
        ? ("https://api.whatsapp.com/send?phone=" + numClean + "&text=" + encodeURIComponent(msj)) 
        : ("https://api.whatsapp.com/send?text=" + encodeURIComponent(msj));
    window.open(url, '_blank', 'noopener,noreferrer');
};

window.anularVenta = function(index) {
    window.mostrarConfirmacion("❌ Anular Venta", "¿Deseas anular esta venta y reponer el inventario?", function() {
        var v = ventasHistorico[index];
        for (var i = 0; i < v.items.length; i++) {
            var item = v.items[i];
            if (item.tipo !== 'peso' && item.tipo !== 'combo') {
                for (var j = 0; j < productos.length; j++) {
                    if (productos[j].id === item.id) {
                        productos[j].qty += item.qtyVenta;
                        break;
                    }
                }
            }
        }
        ventasHistorico.splice(index, 1);
        if (window.localStorage) {
            window.localStorage.setItem('geomercado_db_v19', JSON.stringify(productos));
            window.localStorage.setItem('geomercado_ventas_v19', JSON.stringify(ventasHistorico));
        }
        window.renderizarCierreDeCaja();
        window.mostrarToast("Venta anulada con éxito");
    });
};

window.imprimirCierreZ = function() {
    var pw = window.open('', '_blank');
    if (!pw) { 
        window.mostrarFeedbackAnimado('error', 'Habilita las ventanas emergentes'); 
        return; 
    }
    
    var doc = pw.document;
    var now = new Date();
    var totalPM = 0, totalUSDFisico = 0, totalVESFisico = 0, totalPTV = 0, totalVentasUSD = 0, totalCostoUSD = 0;

    for (var i = 0; i < ventasHistorico.length; i++) {
        var v = ventasHistorico[i];
        totalPM += v.pm; totalUSDFisico += v.usd; totalVESFisico += v.ves; totalPTV += v.ptv;
        totalVentasUSD += v.totalUSD;
        totalCostoUSD += (v.costoUSD || 0);
    }

    var gananciaNetaUSD = totalVentasUSD - totalCostoUSD;
    var gananciaTotalVES = gananciaNetaUSD * tasaDia;

    var h = '<html><head><title>Cierre Z</title><style>body{font-family:monospace; color:#000; width:280px; margin:0 auto; padding:10px;} .it{display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;}</style></head><body>';
    h += '<h2 style="text-align:center; margin:0; font-size:16px;">REPORTAZO DE CIERRE (Z)</h2>';
    h += '<p style="text-align:center; margin:0; font-size:11px;">' + window.escapeHTML(perfilNegocio.nombre) + '</p>';
    h += '<p style="text-align:center; font-size:10px;">Fecha: ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString() + '</p><hr>';
    h += '<div class="it"><span>Transacciones:</span><span>' + ventasHistorico.length + '</span></div>';
    h += '<div class="it"><span>Punto de Venta:</span><span>' + window.formatVE(totalPTV) + '</span></div>';
    h += '<div class="it"><span>Pago Móvil:</span><span>' + window.formatVE(totalPM) + '</span></div>';
    h += '<div class="it"><span>Efectivo Bs:</span><span>' + window.formatVE(totalVESFisico) + '</span></div>';
    h += '<div class="it"><span>Efectivo Divisas ($):</span><span>$' + totalUSDFisico.toFixed(2) + '</span></div><hr>';
    h += '<div class="it"><strong>Ganancia Estimada:</strong><strong>' + window.formatVE(gananciaTotalVES) + '</strong></div>';
    h += '<div class="it"><span>Fondo Cajón ($):</span><span>$' + (fondoCaja.usd + totalUSDFisico).toFixed(2) + '</span></div>';
    h += '<div class="it"><span>Fondo Cajón (Bs):</span><span>' + window.formatVE(fondoCaja.ves + totalVESFisico) + '</span></div>';
    h += '</body></html>';
    
    doc.write(h);
    doc.close();
    pw.focus();
    pw.print();
    pw.close();
};

window.borrarHistorial = function() {
    window.mostrarConfirmacion("⚠️ Reiniciar Día", "¿Estás seguro de vaciar el historial de ventas? Esto no restablecerá el stock del inventario.", function() {
        ventasHistorico = [];
        if (window.localStorage) window.localStorage.removeItem('geomercado_ventas_v19');
        window.renderizarCierreDeCaja();
        window.mostrarToast("Día reiniciado");
    });
};
