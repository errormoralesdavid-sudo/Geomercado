// ESTADO GLOBAL DE LA APLICACIÓN
var productos = [];
var carrito = [];
var ventasHistorico = [];
var facturasEnEspera = [];
var tasaDia = 36.50; // Tasa por defecto
var totalVentaUSD = 0.00;
var totalVentaVES = 0.00;

var perfilNegocio = {
    nombre: "Geo Mercado",
    rif: "",
    dir: "",
    tlf: "",
    pmBanco: "",
    pmCedula: "",
    pmTlf: ""
};

var fondoCaja = {
    usd: 0,
    ves: 0
};

// Carga inicial de datos desde localStorage
window.addEventListener('DOMContentLoaded', function() {
    if (window.localStorage) {
        var dbProd = localStorage.getItem('geomercado_db_v19');
        if (dbProd) productos = JSON.parse(dbProd);

        var dbVentas = localStorage.getItem('geomercado_ventas_v19');
        if (dbVentas) ventasHistorico = JSON.parse(dbVentas);

        var dbPerfil = localStorage.getItem('geomercado_perfil_v19');
        if (dbPerfil) perfilNegocio = JSON.parse(dbPerfil);

        var dbFondo = localStorage.getItem('geomercado_fondo_v19');
        if (dbFondo) fondoCaja = JSON.parse(dbFondo);

        var dbTasa = localStorage.getItem('geomercado_tasa_v19');
        if (dbTasa) tasaDia = parseFloat(dbTasa) || 36.50;

        var dbEspera = localStorage.getItem('geomercado_espera_v19');
        if (dbEspera) facturasEnEspera = JSON.parse(dbEspera);
    }
});

// Helper para sanear texto y evitar fallos
window.escapeHTML = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Formateadores de Moneda
window.formatVE = function(monto) {
    return 'Bs. ' + Number(monto || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

window.formatUSD = function(monto) {
    return '$' + Number(monto || 0).toFixed(2);
};

// Saneado e ingreso de montos de input
window.extraerNumeroLimpio = function(inputId) {
    var elem = document.getElementById(inputId);
    if (!elem) return 0;
    var raw = elem.value.replace(/\D/g, '');
    if (!raw) return 0;
    return parseFloat(raw) / 100;
};

// Máscara dinámica para inputs monetarios
window.mascaraMoneda = function(input) {
    var valorLimpio = input.value.replace(/\D/g, '');
    if (!valorLimpio) {
        input.value = '';
        return;
    }
    var numero = parseFloat(valorLimpio) / 100;
    input.value = numero.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Modal dinámico de confirmaciones
window.mostrarConfirmacion = function(titulo, mensaje, callbackAceptar) {
    var modal = document.getElementById('modal-confirmar');
    if (!modal) {
        if (confirm(mensaje)) callbackAceptar();
        return;
    }
    document.getElementById('confirm-titulo').innerText = titulo;
    document.getElementById('confirm-mensaje').innerText = mensaje;
    modal.style.display = 'flex';

    var btnAceptar = document.getElementById('btn-confirm-aceptar');
    btnAceptar.onclick = function() {
        modal.style.display = 'none';
        callbackAceptar();
    };
};
