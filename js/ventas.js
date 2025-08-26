// Importar las funciones de consumeApi.js
import { 
    obtainVentas, 
    obtainVentasPorFecha, 
    obtainVentasStats, 
    actualizarEstadoVenta 
} from '../Api/consumeApi.js';

// Variables globales
let ventasData = [];
let currentPage = 1;

// Función para inicializar la sección de ventas
export async function inicializarVentas() {
    try {
        console.log("Inicializando sección de ventas...");
        
        // Cargar ventas iniciales
        await cargarVentas();
        
        // Configurar event listeners
        configurarEventListeners();
        
        // Cargar estadísticas
        await cargarEstadisticas();
        
        console.log("Sección de ventas inicializada correctamente");
    } catch (error) {
        console.error("Error al inicializar ventas:", error);
        mostrarError("Error al cargar la sección de ventas");
    }
}

// Configurar todos los event listeners
function configurarEventListeners() {
    // Botón de búsqueda por fechas
    const btnBuscarFechas = document.getElementById('btnBuscarFechas');
    if (btnBuscarFechas) {
        btnBuscarFechas.addEventListener('click', buscarVentasPorFecha);
    }

    // Botón de limpiar filtros
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }

    // Botón de exportar
    const btnExportarVentas = document.getElementById('btnExportarVentas');
    if (btnExportarVentas) {
        btnExportarVentas.addEventListener('click', exportarVentas);
    }

    // Inputs de fecha con valores por defecto
    configurarFechasDefecto();

    // NUEVO: Limpiar modal cuando se cierre
    $('#modalCambiarEstado').on('hidden.bs.modal', function () {
        limpiarModalCambiarEstado();
    });
}

// Configurar fechas por defecto (último mes)
function configurarFechasDefecto() {
    const fechaFin = document.getElementById('fechaFin');
    const fechaInicio = document.getElementById('fechaInicio');
    
    if (fechaFin && fechaInicio) {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(hoy.getMonth() - 1);
        
        // CORREGIDO: Formatear fechas correctamente para evitar problemas de zona horaria
        fechaFin.value = formatearFechaParaInput(hoy);
        fechaInicio.value = formatearFechaParaInput(haceUnMes);
    }
}

// NUEVO: Función para formatear fechas correctamente
function formatearFechaParaInput(fecha) {
    // Usar métodos que respeten la zona horaria local
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// CORREGIDO: Función para convertir fecha de input a formato ISO sin problemas de zona horaria
function convertirFechaParaAPI(fechaInput) {
    // No crear objetos Date para evitar problemas de zona horaria
    // Usar la fecha tal como viene del input (YYYY-MM-DD)
    return fechaInput; // Ya viene en formato correcto YYYY-MM-DD
}

// Cargar todas las ventas
async function cargarVentas() {
    try {
        mostrarCargando(true);
        
        const ventas = await obtainVentas();
        
        if (ventas && Array.isArray(ventas)) {
            ventasData = ventas;
            mostrarVentas(ventas);
            actualizarContadores(ventas);
        } else {
            console.warn("No se recibieron ventas o formato incorrecto");
            mostrarVentas([]);
        }
        
    } catch (error) {
        console.error("Error al cargar ventas:", error);
        mostrarError("Error al cargar las ventas");
    } finally {
        mostrarCargando(false);
    }
}

// CORREGIDO: Buscar ventas por rango de fechas
async function buscarVentasPorFecha() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarAlerta("Por favor selecciona ambas fechas", "warning");
        return;
    }
    
    if (new Date(fechaInicio) > new Date(fechaFin)) {
        mostrarAlerta("La fecha de inicio no puede ser mayor que la fecha final", "warning");
        return;
    }
    
    try {
        mostrarCargando(true);
        
        // Las fechas ya vienen en formato YYYY-MM-DD del input, no necesitan conversión
        console.log("Buscando ventas entre:", fechaInicio, "y", fechaFin);
        
        const resultado = await obtainVentasPorFecha(fechaInicio, fechaFin);
        
        if (resultado.success) {
            ventasData = resultado.ventas;
            mostrarVentas(resultado.ventas);
            mostrarEstadisticasPeriodo(resultado.estadisticas, resultado.periodo);
            mostrarAlerta(`Se encontraron ${resultado.ventas.length} ventas en el período seleccionado`, "success");
        } else {
            mostrarError("Error al buscar ventas por fecha");
        }
        
    } catch (error) {
        console.error("Error al buscar ventas por fecha:", error);
        mostrarError("Error al buscar ventas por fecha");
    } finally {
        mostrarCargando(false);
    }
}

// Limpiar filtros y mostrar todas las ventas
async function limpiarFiltros() {
    configurarFechasDefecto();
    await cargarVentas();
    limpiarEstadisticasPeriodo();
    mostrarAlerta("Filtros limpiados", "info");
}

// Mostrar las ventas en la tabla
function mostrarVentas(ventas) {
    const tbody = document.getElementById('tablaVentas');
    
    if (!tbody) {
        console.error("No se encontró la tabla de ventas");
        return;
    }
    
    if (!ventas || ventas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center py-4">
                    <div class="no-data">
                        <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay ventas registradas</h5>
                        <p class="text-muted">Las ventas aparecerán aquí cuando se confirmen pedidos</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ventas.map((venta, index) => `
        <tr class="venta-row" data-id="${venta.idVenta}">
            <td>
                <span class="badge badge-primary">#${venta.idVenta}</span>
            </td>
            <td>
                <div class="customer-info">
                    <strong>${venta.infopersona || 'N/A'}</strong><br>
                    <small class="text-muted">${venta.correo_electronico || ''}</small>
                </div>
            </td>
            <td>
                <span class="badge badge-secondary">#${venta.idPedido}</span>
            </td>
            <td>
                <div class="productos-preview">
                    ${venta.nombresProductos || 'N/A'}
                </div>
            </td>
            <td class="text-right">
                <span class="monto-subtotal">${formatearNumero(venta.monto_subtotal)}</span>
            </td>
            <td class="text-right">
                <span class="descuentos text-success">${formatearNumero(venta.descuentos)}</span>
            </td>
            <td class="text-right">
                <span class="impuestos text-info">${formatearNumero(venta.impuestos)}</span>
            </td>
            <td class="text-right">
                <strong class="monto-total">${formatearNumero(venta.monto_total)}</strong>
            </td>
            <td>
                <span class="badge ${getBadgeEstadoVenta(venta.estado_venta)}">
                    ${venta.estado_venta}
                </span>
            </td>
            <td>
                <small class="text-muted">
                    ${formatearFecha(venta.fecha_venta)}
                </small>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-info" onclick="verDetalleVenta(${venta.idVenta})" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="cambiarEstadoVenta(${venta.idVenta}, '${venta.estado_venta}')" title="Cambiar estado">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Cargar estadísticas generales
async function cargarEstadisticas() {
    try {
        const stats = await obtainVentasStats();
        
        if (stats) {
            mostrarEstadisticasGenerales(stats.estadisticas_generales);
            if (stats.ventas_por_mes) {
                mostrarGraficoVentasPorMes(stats.ventas_por_mes);
            }
        }
        
    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}

// Mostrar estadísticas generales
function mostrarEstadisticasGenerales(stats) {
    const statsContainer = document.getElementById('estadisticasGenerales');
    
    if (!statsContainer || !stats) return;
    
    statsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <div class="stat-card bg-primary">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h4>${stats.total_ventas || 0}</h4>
                        <p>Total Ventas</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card bg-success">
                    <div class="stat-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-info">
                        <h4>${formatearNumero(stats.ingresos_totales || 0)}</h4>
                        <p>Ingresos Totales</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card bg-info">
                    <div class="stat-icon">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <div class="stat-info">
                        <h4>${formatearNumero(stats.promedio_venta || 0)}</h4>
                        <p>Promedio por Venta</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card bg-warning">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <h4>${formatearNumero(stats.total_impuestos || 0)}</h4>
                        <p>Total Impuestos</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-4">
                <div class="stat-card-small bg-light-success">
                    <span class="badge badge-success">${stats.ventas_confirmadas || 0}</span>
                    <span>Confirmadas</span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card-small bg-light-danger">
                    <span class="badge badge-danger">${stats.ventas_anuladas || 0}</span>
                    <span>Anuladas</span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card-small bg-light-warning">
                    <span class="badge badge-warning">${stats.ventas_pendientes || 0}</span>
                    <span>Pendientes</span>
                </div>
            </div>
        </div>
    `;
}

// CORREGIDO: Mostrar estadísticas del período con fechas correctas
function mostrarEstadisticasPeriodo(stats, periodo) {
    const container = document.getElementById('estadisticasPeriodo');
    
    if (!container) return;
    
    // Formatear las fechas del período correctamente
    const fechaInicioFormateada = periodo.fecha_inicio ? 
        formatearFechaParaMostrar(periodo.fecha_inicio) : 'N/A';
    const fechaFinFormateada = periodo.fecha_fin ? 
        formatearFechaParaMostrar(periodo.fecha_fin) : 'N/A';
    
    container.innerHTML = `
        <div class="alert alert-info">
            <h6><i class="fas fa-calendar-alt"></i> Estadísticas del Período: ${fechaInicioFormateada} - ${fechaFinFormateada}</h6>
            <div class="row mt-3">
                <div class="col-md-3">
                    <strong>Total Ventas:</strong> ${stats.total_ventas}
                </div>
                <div class="col-md-3">
                    <strong>Monto Total:</strong> ${formatearNumero(stats.monto_total_periodo)}
                </div>
                <div class="col-md-3">
                    <strong>Promedio:</strong> ${formatearNumero(stats.promedio_venta)}
                </div>
                <div class="col-md-3">
                    <strong>Descuentos:</strong> ${formatearNumero(stats.total_descuentos)}
                </div>
            </div>
        </div>
    `;
    
    container.style.display = 'block';
}

// Limpiar estadísticas del período
function limpiarEstadisticasPeriodo() {
    const container = document.getElementById('estadisticasPeriodo');
    if (container) {
        container.style.display = 'none';
    }
}

// Mostrar gráfico de ventas por mes (opcional)
function mostrarGraficoVentasPorMes(ventasPorMes) {
    // Esta función se puede implementar con Chart.js u otra librería de gráficos
    console.log("Ventas por mes:", ventasPorMes);
    // TODO: Implementar gráfico si se requiere
}

// Ver detalle de una venta
// CORREGIDO: Ver detalle de una venta - contenido que se mantiene dentro del modal
window.verDetalleVenta = async function(idVenta) {
    const venta = ventasData.find(v => v.idVenta === idVenta);
    
    if (!venta) {
        mostrarError("Venta no encontrada");
        return;
    }
    
    const modalContent = `
        <div class="container-fluid p-0">
            <div class="row no-gutters">
                <!-- Columna Izquierda: Información General -->
                <div class="col-md-6 pr-md-2">
                    <h6 class="text-primary mb-3"><i class="fas fa-info-circle"></i> Información de la Venta</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-borderless">
                            <tr>
                                <td class="text-muted" style="width: 40%;"><strong>ID Venta:</strong></td>
                                <td><span class="badge badge-primary">#${venta.idVenta}</span></td>
                            </tr>
                            <tr>
                                <td class="text-muted"><strong>ID Pedido:</strong></td>
                                <td><span class="badge badge-secondary">#${venta.idPedido}</span></td>
                            </tr>
                            <tr>
                                <td class="text-muted"><strong>Cliente:</strong></td>
                                <td class="text-truncate" style="max-width: 150px;" title="${venta.infopersona || 'N/A'}">${venta.infopersona || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="text-muted"><strong>Email:</strong></td>
                                <td class="text-truncate" style="max-width: 150px;" title="${venta.correo_electronico || 'N/A'}">${venta.correo_electronico || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="text-muted"><strong>Estado:</strong></td>
                                <td><span class="badge ${getBadgeEstadoVenta(venta.estado_venta)}">${venta.estado_venta}</span></td>
                            </tr>
                            <tr>
                                <td class="text-muted"><strong>Fecha:</strong></td>
                                <td><small>${formatearFecha(venta.fecha_venta)}</small></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Columna Derecha: Montos -->
                <div class="col-md-6 pl-md-2">
                    <h6 class="text-success mb-3"><i class="fas fa-calculator"></i> Desglose de Montos</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Subtotal:</strong></td>
                                <td class="text-right" style="white-space: nowrap;">${formatearNumero(venta.monto_subtotal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Descuentos:</strong></td>
                                <td class="text-right text-success" style="white-space: nowrap;">-${formatearNumero(venta.descuentos)}</td>
                            </tr>
                            <tr>
                                <td><strong>Impuestos:</strong></td>
                                <td class="text-right text-info" style="white-space: nowrap;">+${formatearNumero(venta.impuestos)}</td>
                            </tr>
                            <tr class="border-top border-primary">
                                <td><strong class="text-primary">TOTAL:</strong></td>
                                <td class="text-right" style="white-space: nowrap;"><strong class="text-primary h6">${formatearNumero(venta.monto_total)}</strong></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Fila de Productos -->
            <div class="row no-gutters mt-3">
                <div class="col-12">
                    <h6 class="text-info mb-3"><i class="fas fa-box"></i> Productos</h6>
                    <div class="alert alert-light mb-0" style="max-height: 120px; overflow-y: auto;">
                        ${venta.nombresProductos ? 
                            venta.nombresProductos.split(',').map(producto => 
                                `<span class="badge badge-outline-secondary mr-1 mb-1" style="border: 1px solid #6c757d; color: #6c757d; background: transparent; padding: 0.25rem 0.5rem; font-size: 0.75rem;">${producto.trim()}</span>`
                            ).join('') : 
                            '<em class="text-muted">No se especificaron productos</em>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Usar los modales de Bootstrap del HTML
    document.getElementById('modalDetalleVentaLabel').textContent = `Detalle de Venta #${venta.idVenta}`;
    document.getElementById('contenidoDetalleVenta').innerHTML = modalContent;
    $('#modalDetalleVenta').modal('show');
};

// CORREGIDO: Cambiar estado de una venta - diseño limpio y contenido
window.cambiarEstadoVenta = function(idVenta, estadoActual) {
    console.log("Cambiando estado de venta:", idVenta, "Estado actual:", estadoActual);
    
    const estados = [
        { value: 'confirmada', label: 'Confirmada', class: 'badge-success' },
        { value: 'pendiente', label: 'Pendiente', class: 'badge-warning' },
        { value: 'anulada', label: 'Anulada', class: 'badge-danger' }
    ];
    
    // Obtener el label formateado (ej: Confirmada en vez de confirmada)
    const estadoLabel = estados.find(e => e.value === estadoActual)?.label || estadoActual;

    const opcionesEstado = estados.map(estado => 
        `<option value="${estado.value}" ${estado.value === estadoActual ? 'selected' : ''}>${estado.label}</option>`
    ).join('');
    
    const modalContent = `
        <div class="container-fluid p-3">
            <!-- Información actual -->
            <div class="alert alert-info mb-3">
                <div class="row">
                    <div class="col-6">
                        <strong>Venta ID:</strong> 
                        <span class="badge badge-primary ml-1">#${idVenta}</span>
                    </div>
                    <div class="col-6">
                        <strong>Estado actual:</strong> 
                        <span class="badge ${getBadgeEstadoVenta(estadoActual)} ml-1">${estadoLabel}</span>
                    </div>
                </div>
            </div>

            <!-- Formulario de cambio -->
            <div class="form-group mb-3">
                <label for="nuevoEstado" class="font-weight-bold">
                    <i class="fas fa-edit text-primary"></i> Seleccionar nuevo estado:
                </label>
                <select class="form-control form-control-lg mt-2" id="nuevoEstado">
                    ${opcionesEstado}
                </select>
                <small class="form-text text-muted">
                    Selecciona el nuevo estado para la venta
                </small>
            </div>

            <!-- Botones de acción -->
            <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="button" class="btn btn-primary btn-lg" onclick="confirmarCambioEstado(${idVenta})">
                    <i class="fas fa-save"></i> Actualizar Estado
                </button>
            </div>
        </div>
    `;
    
    // CORREGIDO: Limpiar contenido previo antes de agregar nuevo
    const contenidoCambiarEstado = document.getElementById('contenidoCambiarEstado');
    if (contenidoCambiarEstado) {
        contenidoCambiarEstado.innerHTML = '';
        
        // Usar el modal de Bootstrap del HTML
        document.getElementById('modalCambiarEstadoLabel').textContent = `Cambiar Estado de Venta #${idVenta}`;
        contenidoCambiarEstado.innerHTML = modalContent;
        $('#modalCambiarEstado').modal('show');
    }
};



// NUEVO: Función para limpiar el modal cuando se cierre
function limpiarModalCambiarEstado() {
    const contenidoCambiarEstado = document.getElementById('contenidoCambiarEstado');
    if (contenidoCambiarEstado) {
        contenidoCambiarEstado.innerHTML = '';
    }
}

// Confirmar cambio de estado
window.confirmarCambioEstado = async function(idVenta) {
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    
    if (!nuevoEstado) {
        mostrarAlerta("Por favor selecciona un estado", "warning");
        return;
    }
    
    try {
        console.log("Actualizando estado de venta:", idVenta, "a:", nuevoEstado);
        
        const resultado = await actualizarEstadoVenta(idVenta, nuevoEstado);
        
        if (resultado.success) {
            mostrarAlerta("Estado actualizado correctamente", "success");
            $('#modalCambiarEstado').modal('hide');
            await cargarVentas(); // Recargar las ventas
        } else {
            mostrarError("Error al actualizar el estado de la venta");
        }
        
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        mostrarError("Error al cambiar el estado de la venta");
    }
};

// Exportar ventas a CSV
function exportarVentas() {
    if (ventasData.length === 0) {
        mostrarAlerta("No hay ventas para exportar", "warning");
        return;
    }
    
    const headers = [
        'ID Venta', 'ID Pedido', 'Cliente', 'Email', 'Productos', 
        'Subtotal', 'Descuentos', 'Impuestos', 'Total', 'Estado', 'Fecha'
    ];
    
    const csvContent = [
        headers.join(','),
        ...ventasData.map(venta => [
            venta.idVenta,
            venta.idPedido,
            `"${(venta.infopersona || '').replace(/"/g, '""')}"`,
            venta.correo_electronico || '',
            `"${(venta.nombresProductos || '').replace(/"/g, '""')}"`,
            venta.monto_subtotal,
            venta.descuentos,
            venta.impuestos,
            venta.monto_total,
            venta.estado_venta,
            `"${formatearFecha(venta.fecha_venta)}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta("Archivo CSV exportado correctamente", "success");
}

// Funciones de utilidad
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(numero || 0);
}

// ACTUALIZAR: Función formatearFecha original para usar la nueva función
function formatearFecha(fecha) {
    return formatearFechaParaMostrar(fecha);
}

// NUEVA: Función para formatear fechas para mostrar en la interfaz
function formatearFechaParaMostrar(fechaString) {
    if (!fechaString) return 'N/A';
    
    try {
        // Si la fecha viene como YYYY-MM-DD, procesarla correctamente
        if (fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = fechaString.split('-');
            return `${day}/${month}/${year}`;
        }
        
        // Para fechas con tiempo (ISO strings), usar el procesamiento actual
        const fechaObj = new Date(fechaString);
        
        // Verificar si es una fecha válida
        if (isNaN(fechaObj.getTime())) {
            return fechaString; // Devolver el string original si no es válida
        }
        
        return fechaObj.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Bogota'
        });
    } catch (error) {
        console.error("Error al formatear fecha:", error);
        return fechaString;
    }
}

function getBadgeEstadoVenta(estado) {
    const badgeMap = {
        'confirmada': 'badge-success',
        'pendiente': 'badge-warning',
        'anulada': 'badge-danger'
    };
    return badgeMap[estado] || 'badge-secondary';
}

function mostrarCargando(mostrar) {
    const loader = document.getElementById('cargandoVentas');
    if (loader) {
        loader.style.display = mostrar ? 'block' : 'none';
    }
}

function mostrarError(mensaje) {
    mostrarAlerta(mensaje, "danger");
}

function mostrarAlerta(mensaje, tipo) {
    // Crear alerta temporal usando Bootstrap
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    alertContainer.style.minWidth = '300px';
    
    alertContainer.innerHTML = `
        ${mensaje}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.parentNode.removeChild(alertContainer);
        }
    }, 4000);
}

function actualizarContadores(ventas) {
    const totalVentas = document.getElementById('totalVentasCount');
    if (totalVentas) {
        totalVentas.textContent = ventas.length;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página de admin
    if (document.getElementById('tablaVentas')) {
        inicializarVentas();
    }
});