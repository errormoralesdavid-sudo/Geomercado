// ==========================================
// MÓDULO DE CIERRE DE CAJA (CORREGIDO)
// ==========================================

window.renderizarCierreDeCaja = function() {
    var totalPM = 0; var totalUSDFisico = 0; var totalVESFisico = 0; var totalPTV = 0; 
    var totalVentasUSD = 0; var totalCostoUSD = 0;
    
    var container = document.getElementById('lista-historial-ventas');
    if (!container) return;
    var html = "";

    var ventas = window.ventasHistorico || [];

    for (var i = 0; i < ventas.length; i++) {
        var v = ventas[i];
        totalPM += (v.pm || 0); 
        totalUSDFisico += (v.usd || 0); 
        totalVESFisico += (v.ves || 0); 
        totalPTV += (v.ptv || 0); 
        totalVentasUSD += (v.totalUSD || 0);
        totalCostoUSD += (v.costoUSD || 0);
        
        var itemsArr = v.items || [];
        var itemsStr = itemsArr.map(function(it) { 
            var cant = it.qtyVenta || it.cantidad || it.detalle || 1;
            return window.escapeHTML(it.nombre || 'Producto') + " (x" + cant + ")"; 
        }).join(', ');

        html += '<div class="cierre-card" style="background:#161b22; border:1px solid #30363d; border-radius:8px; padding:12px; margin-bottom:10px;">';
        html += '<div style="display:flex; justify-content:space-between;"><h4>🛒 ' + (v.fecha || '') + '</h4></div>';
        if (v.cliente) html += '<div style="color:#c9d1d9; font-size:11px; margin-bottom:4px;">Cliente: ' + window.escapeHTML(v.cliente) + '</div>';
        
        html += '<div class="cierre-item" style="font-size:12px; margin:4px 0;">Artículos: <span>' + itemsStr + '</span></div>';
        html += '<div class="cierre-item" style="font-size:13px; margin:4px 0;">Total Factura: <span style="font-size:14px; color:#3fb950; font-weight:bold;">' + window.formatVE(v.totalVES) + '</span></div>';
        
        if (v.usd > 0) {
            html += '<div class="cierre-item" style="color:#8b949e; font-size:11px;">Efectivo ($) Entregado: <span>$' + Number(v.usd).toFixed(2) + '</span></div>';
        }
        
        html += '<div style="display:flex; gap:6px; margin-top:10px;">';
        html += '<button style="flex:1; background:#f0f6fc; color:#0d1117; font-weight:bold; border:none; padding:8px; border-radius:6px; cursor:pointer;" onclick="window.imprimirTicket(' + i + ')">🖨️ Ticket</button>';
        html += '<button style="flex:1; background:#238636; color:#fff; font-weight:bold; border:none; padding:8px; border-radius:6px; cursor:pointer;" onclick="window.enviarFacturaWS(' + i + ')">📲 WhatsApp</button>';
        html += '<button style="flex:1; background:#da3633; color:#fff; font-weight:bold; border:none; padding:8px; border-radius:6px; cursor:pointer;" onclick="window.anularVenta(' + i + ')">❌ Anular</button>';
        html += '</div></div>';
    }

    if (ventas.length === 0) {
        html = '<div style="text-align:center; color:#8b949e; font-size:13px; padding:20px;">No hay ventas registradas en el turno.</div>';
    }
    container.innerHTML = html;

    var gananciaNetaUSD = totalVentasUSD - totalCostoUSD;
    var tasaActual = window.tasaDia || 36.50;
    var gananciaTotalVES = gananciaNetaUSD * tasaActual;
    var fondo = window.fondoCaja || { usd: 0, ves: 0 };

    if (document.getElementById('resumen-ptv')) document.getElementById('resumen-ptv').innerText = window.formatVE(totalPTV);
    if (document.getElementById('resumen-pm')) document.getElementById('resumen-pm').innerText = window.formatVE(totalPM);
    if (document.getElementById('resumen-ves')) document.getElementById('resumen-ves').innerText = window.formatVE(totalVESFisico);
    if (document.getElementById('resumen-ganancia-ves')) document.getElementById('resumen-ganancia-ves').innerText = window.formatVE(gananciaTotalVES) + " (" + window.formatUSD(gananciaNetaUSD) + ")";
    if (document.getElementById('resumen-efectivo-usd')) document.getElementById('resumen-efectivo-usd').innerText = "$" + totalUSDFisico.toFixed(2);
    if (document.getElementById('cierre-fondo-usd')) document.getElementById('cierre-fondo-usd').innerText = "$" + (fondo.usd || 0).toFixed(2);
    if (document.getElementById('cierre-fondo-ves')) document.getElementById('cierre-fondo-ves').innerText = window.formatVE(fondo.ves);

    var esperadoUSD = (fondo.usd || 0) + totalUSDFisico;
    var esperadoVES = (fondo.ves || 0) + totalVESFisico;

    if (document.getElementById('esperado-usd')) document.getElementById('esperado-usd').innerText = "$" + esperadoUSD.toFixed(2);
    if (document.getElementById('esperado-ves')) document.getElementById('esperado-ves').innerText = window.formatVE(esperadoVES);
};

// Alias de compatibilidad para evitar cierres en blanco por diferencias de nombre
window.renderizarCierre = window.renderizarCierreDeCaja;

window.imprimirTicket = function(index) {
    var v = (window.ventasHistorico || [])[index];
    if (!v) return;

    var pw = window.open('', '_blank');
    if (!pw) { 
        if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'Habilita las ventanas emergentes'); 
        return; 
    }
    
    var doc = pw.document;
    var perfil = window.perfilNegocio || { nombre: "Geo Mercado" };
    var h = '<html><head><title>Ticket</title><style>body{font-family:monospace; color:#000; width:280px; margin:0 auto; padding:10px;} .it{display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;}</style></head><body>';
    h += '<h2 style="text-align:center; margin:0; font-size:16px;">' + window.escapeHTML(perfil.nombre) + '</h2>';
    if (perfil.rif) h += '<p style="text-align:center; margin:0; font-size:11px;">RIF: ' + window.escapeHTML(perfil.rif) + '</p>';
    if (perfil.dir) h += '<p style="text-align:center; margin:0; font-size:10px;">' + window.escapeHTML(perfil.dir) + '</p>';
    if (perfil.tlf) h += '<p style="text-align:center; margin:0; font-size:10px;">Tlf: ' + window.escapeHTML(perfil.tlf) + '</p>';
    h += '<p style="text-align:center; font-size:11px; margin-top:6px;">' + (v.fecha || '') + '</p><hr>';
    
    if (v.cliente) h += '<p style="font-size:11px;">Cliente: ' + window.escapeHTML(v.cliente) + '<br>CI/RIF: ' + window.escapeHTML(v.cedula || '') + '</p>';
    if (v.dir) h += '<p style="font-size:11px;">Dir: ' + window.escapeHTML(v.dir) + '</p>';
    if (v.tlf) h += '<p style="font-size:11px;">Tlf: ' + window.escapeHTML(v.tlf) + '</p>';
    h += '<hr>';
    
    var itemsArr = v.items || [];
    for (var i = 0; i < itemsArr.length; i++) {
        var item = itemsArr[i];
        var cant = item.qtyVenta || item.cantidad || item.detalle || 1;
        var itemTotalUSD = item.totalUSD || (item.precio * cant) || 0;
        var precioBsItem = itemTotalUSD * (v.totalVES / (v.totalUSD || 1));
        h += '<div class="it"><span>' + cant + 'x ' + window.escapeHTML(item.nombre || 'Prod') + '</span><span>' + window.formatVE(precioBsItem) + '</span></div>';
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
    var v = (window.ventasHistorico || [])[index];
    if (!v) return;

    var perfil = window.perfilNegocio || { nombre: "Geo Mercado" };
    var msj = "🧾 *COMPROBANTE DE COMPRA*\n";
    msj += "🏢 *" + perfil.nombre + "*\n";
    if (perfil.rif) msj += "RIF: " + perfil.rif + "\n";
    msj += "📅 Fecha: " + (v.fecha || '') + "\n";
    if (v.cliente) msj += "👤 Cliente: " + v.cliente + "\n";
    msj += "-----------------------------------\n";
    
    var itemsArr = v.items || [];
    for (var i = 0; i < itemsArr.length; i++) {
        var item = itemsArr[i];
        var cant = item.qtyVenta || item.cantidad || item.detalle || 1;
        var itemTotalUSD = item.totalUSD || (item.precio * cant) || 0;
        var precioBsItem = itemTotalUSD * (v.totalVES / (v.totalUSD || 1));
        msj += cant + "x " + (item.nombre || 'Prod') + " - " + window.formatVE(precioBsItem) + "\n";
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
    if (typeof window.mostrarConfirmacion !== 'function') {
        if (!confirm("¿Deseas anular esta venta y reponer el inventario?")) return;
        ejecutarAnulacion(index);
        return;
    }

    window.mostrarConfirmacion("❌ Anular Venta", "¿Deseas anular esta venta y reponer el inventario?", function() {
        ejecutarAnulacion(index);
    });
};

function ejecutarAnulacion(index) {
    var ventas = window.ventasHistorico || [];
    var prods = window.productos || [];
    var v = ventas[index];
    
    if (!v) return;

    var itemsArr = v.items || [];
    for (var i = 0; i < itemsArr.length; i++) {
        var item = itemsArr[i];
        if (item.tipo !== 'peso' && item.tipo !== 'combo') {
            for (var j = 0; j < prods.length; j++) {
                if (prods[j].id === item.id) {
                    var cant = item.qtyVenta || item.cantidad || 1;
                    prods[j].qty = (prods[j].qty || 0) + cant;
                    break;
                }
            }
        }
    }
    
    ventas.splice(index, 1);
    if (window.localStorage) {
        window.localStorage.setItem('geomercado_db_v19', JSON.stringify(prods));
        window.localStorage.setItem('geomercado_ventas_v19', JSON.stringify(ventas));
    }
    
    window.renderizarCierreDeCaja();
    if (window.mostrarToast) window.mostrarToast("Venta anulada con éxito");
}

window.imprimirCierreZ = function() {
    var pw = window.open('', '_blank');
    if (!pw) { 
        if (window.mostrarFeedbackAnimado) window.mostrarFeedbackAnimado('error', 'Habilita las ventanas emergentes'); 
        return; 
    }
    
    var doc = pw.document;
    var now = new Date();
    var totalPM = 0, totalUSDFisico = 0, totalVESFisico = 0, totalPTV = 0, totalVentasUSD = 0, totalCostoUSD = 0;
    var ventas = window.ventasHistorico || [];

    for (var i = 0; i < ventas.length; i++) {
        var v = ventas[i];
        totalPM += (v.pm || 0); 
        totalUSDFisico += (v.usd || 0); 
        totalVESFisico += (v.ves || 0); 
        totalPTV += (v.ptv || 0);
        totalVentasUSD += (v.totalUSD || 0);
        totalCostoUSD += (v.costoUSD || 0);
    }

    var gananciaNetaUSD = totalVentasUSD - totalCostoUSD;
    var tasaActual = window.tasaDia || 36.50;
    var gananciaTotalVES = gananciaNetaUSD * tasaActual;
    var fondo = window.fondoCaja || { usd: 0, ves: 0 };
    var perfil = window.perfilNegocio || { nombre: "Geo Mercado" };

    var h = '<html><head><title>Cierre Z</title><style>body{font-family:monospace; color:#000; width:280px; margin:0 auto; padding:10px;} .it{display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;}</style></head><body>';
    h += '<h2 style="text-align:center; margin:0; font-size:16px;">REPORTE DE CIERRE (Z)</h2>';
    h += '<p style="text-align:center; margin:0; font-size:11px;">' + window.escapeHTML(perfil.nombre) + '</p>';
    h += '<p style="text-align:center; font-size:10px;">Fecha: ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString() + '</p><hr>';
    h += '<div class="it"><span>Transacciones:</span><span>' + ventas.length + '</span></div>';
    h += '<div class="it"><span>Punto de Venta:</span><span>' + window.formatVE(totalPTV) + '</span></div>';
    h += '<div class="it"><span>Pago Móvil:</span><span>' + window.formatVE(totalPM) + '</span></div>';
    h += '<div class="it"><span>Efectivo Bs:</span><span>' + window.formatVE(totalVESFisico) + '</span></div>';
    h += '<div class="it"><span>Efectivo Divisas ($):</span><span>$' + totalUSDFisico.toFixed(2) + '</span></div><hr>';
    h += '<div class="it"><strong>Ganancia Estimada:</strong><strong>' + window.formatVE(gananciaTotalVES) + '</strong></div>';
    h += '<div class="it"><span>Fondo Cajón ($):</span><span>$' + ((fondo.usd || 0) + totalUSDFisico).toFixed(2) + '</span></div>';
    h += '<div class="it"><span>Fondo Cajón (Bs):</span><span>' + window.formatVE((fondo.ves || 0) + totalVESFisico) + '</span></div>';
    h += '</body></html>';
    
    doc.write(h);
    doc.close();
    pw.focus();
    pw.print();
    pw.close();
};

window.borrarHistorial = function() {
    var accion = function() {
        window.ventasHistorico = [];
        if (window.localStorage) window.localStorage.removeItem('geomercado_ventas_v19');
        window.renderizarCierreDeCaja();
        if (window.mostrarToast) window.mostrarToast("Día reiniciado");
    };

    if (typeof window.mostrarConfirmacion === 'function') {
        window.mostrarConfirmacion("⚠️ Reiniciar Día", "¿Estás seguro de vaciar el historial de ventas? Esto no restablecerá el stock del inventario.", accion);
    } else if (confirm("¿Estás seguro de vaciar el historial de ventas?")) {
        accion();
    }
};
