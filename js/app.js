// ==========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
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

    // Inicializar listeners de la UI
    inicializarPestañas();
    inicializarTasa();
    renderizarCarrito();
});

// ==========================================
// 2. HELPERS Y FORMATEADORES
// ==========================================
window.escapeHTML = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

window.formatVE = function(monto) {
    return 'Bs. ' + Number(monto || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

window.formatUSD = function(monto) {
    return '$' + Number(monto || 0).toFixed(2);
};

window.extraerNumeroLimpio = function(inputId) {
    var elem = document.getElementById(inputId);
    if (!elem) return 0;
    var raw = elem.value.replace(/\D/g, '');
    if (!raw) return 0;
    return parseFloat(raw) / 100;
};

window.mascaraMoneda = function(input) {
    var valorLimpio = input.value.replace(/\D/g, '');
    if (!valorLimpio) {
        input.value = '';
        return;
    }
    var numero = parseFloat(valorLimpio) / 100;
    input.value = numero.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ==========================================
// 3. CONTROLADOR DE PESTAÑAS (NAVEGACIÓN)
// ==========================================
function inicializarPestañas() {
    var tabButtons = document.querySelectorAll('.tab-btn');
    var tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(function(btn, index) {
        btn.addEventListener('click', function() {
            // Desactivar todos
            tabButtons.forEach(function(b) { b.classList.remove('active'); });
            tabContents.forEach(function(c) { c.classList.remove('active'); });

            // Activar actual
            btn.classList.add('active');
            if (tabContents[index]) {
                tabContents[index].classList.add('active');
            }
        });
    });
}

// ==========================================
// 4. GESTIÓN DE TASA BCV
// ==========================================
function inicializarTasa() {
    var inputTasa = document.getElementById('tasa-bcv');
    if (inputTasa) {
        inputTasa.value = tasaDia.toFixed(2);
        inputTasa.addEventListener('change', function() {
            var val = parseFloat(inputTasa.value);
            if (!isNaN(val) && val > 0) {
                tasaDia = val;
                localStorage.setItem('geomercado_tasa_v19', tasaDia);
                calcularTotales();
            }
        });
    }
}

// ==========================================
// 5. MODALES Y NOTIFICACIONES CON ANIMACIÓN
// ==========================================
window.mostrarNotificacion = function(mensaje) {
    var oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    var toast = document.createElement('div');
    toast.className = 'toast-notification feedback-pop';
    toast.innerText = mensaje;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.remove();
    }, 2500);
};

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

window.cerrarModal = function(idModal) {
    var modal = document.getElementById(idModal);
    if (modal) modal.style.display = 'none';
};

// ==========================================
// 6. CARRITO Y CÁLCULOS DE MONTO
// ==========================================
function calcularTotales() {
    totalVentaUSD = 0;
    carrito.forEach(function(item) {
        totalVentaUSD += item.precio * item.cantidad;
    });
    totalVentaVES = totalVentaUSD * tasaDia;

    var elemUSD = document.getElementById('total-usd');
    var elemVES = document.getElementById('total-ves');

    if (elemUSD) elemUSD.innerText = window.formatUSD(totalVentaUSD);
    if (elemVES) elemVES.innerText = window.formatVE(totalVentaVES);
}

function renderizarCarrito() {
    var contenedor = document.getElementById('carrito-list');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    if (carrito.length === 0) {
        contenedor.innerHTML = '<div style="text-align:center; color:#8b949e; padding:10px;">Carrito Vacío</div>';
    } else {
        carrito.forEach(function(item, index) {
            var div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = '<div>' + escapeHTML(item.nombre) + ' x' + item.cantidad + '</div>' +
                            '<div>' + window.formatUSD(item.precio * item.cantidad) + '</div>';
            contenedor.appendChild(div);
        });
    }
    calcularTotales();
}

// ==========================================
// 7. ACCIONES DE BOTONES
// ==========================================
window.cancelarVenta = function() {
    if (carrito.length === 0) {
        mostrarNotificacion('Carrito Vacío');
        return;
    }
    mostrarConfirmacion('Cancelar Venta', '¿Deseas vaciar la venta actual?', function() {
        carrito = [];
        renderizarCarrito();
        mostrarNotificacion('Venta cancelada, stock devuelto');
    });
};

window.recuperarPausa = function() {
    if (facturasEnEspera.length === 0) {
        mostrarNotificacion('No hay facturas pausadas');
        return;
    }
    // Recuperar la última factura pausada
    carrito = facturasEnEspera.pop();
    localStorage.setItem('geomercado_espera_v19', JSON.stringify(facturasEnEspera));
    renderizarCarrito();
    mostrarNotificacion('Factura recuperada');
};
