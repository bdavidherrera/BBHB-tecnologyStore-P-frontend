//Usuarios API
const urlRegistarUsu = "http://localhost:8000/Registrar";
const urlLoginUsu = "http://localhost:8000/Login";
const urlUsuarios = "http://localhost:8000/api/usuarios/admin"
const urlActualizarUsuarios = "http://localhost:8000/api/usuarios/Actualizar";
const urlEliminarUsuarios = "http://localhost:8000/api/usuarios/EliminarUsuario/:idusuarios";

//Productos API
const urlProductos = "http://localhost:8000/api/tecnologia"
const urlRegistrarProductos = "http://localhost:8000/api/tecnologia/RegistrarProducto"
const urlActualizarProductos = "http://localhost:8000/api/tecnologia/ActualizarProducto"
const urlEliminarProductos = "http://localhost:8000/api/tecnologia/EliminarProducto/:idProducto"

//Pedidos API
const urlPedidos = "http://localhost:8000/api/pedidos";
const urlPedidosUsuario = "http://localhost:8000/api/pedidos/usuario/:idUsuario";
const urlPedidoDetalle = "http://localhost:8000/api/pedidos/:idPedido/detalle";
const urlPedidoEstado = "http://localhost:8000/api/pedidos/:idPedido/estado";
const urlPedidosTodo = "http://localhost:8000/api/pedidos/mostrarPedidos";

//Pagos API
const urlPagos = "http://localhost:8000/api/pagos";
const urlPagosUsuario = "http://localhost:8000/api/pagos/usuario/:idUsuario";
const urlFormasPago = "http://localhost:8000/api/pagos/formas-pago";
const urlPagoEstado = "http://localhost:8000/api/pagos/:idPago/estado";
const urlPagosTodo = "http://localhost:8000/api/pagos/MostrarP";
const urlPagosCount = "http://localhost:8000/api/pagos/count";

//Ventas API 
const urlVentas = "http://localhost:8000/api/ventas";
const urlVentasRangoFechas = "http://localhost:8000/api/ventas/rango-fechas";
const urlVentasStats = "http://localhost:8000/api/ventas/estadisticas";
const urlVentasUsuario = "http://localhost:8000/api/ventas/usuario/:idUsuario";
const urlVentaEstado = "http://localhost:8000/api/ventas/:idVenta/estado";

//Usuarios CRUD

export const registrarUsuario = async (datosUsuario) => {
    try {
        const response = await fetch(`${urlRegistarUsu}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosUsuario)
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al registrar usuario:", error);
    }
}

export const loginUsuario = async (datosLogin) => {
    try {
        const response = await fetch(`${urlLoginUsu}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosLogin)
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
    }
}

export const obtainUsuarios = async ()=>{
    try {
        const resultadousuarios = await fetch(urlUsuarios);
        const usuarios = await resultadousuarios.json();
        return usuarios;
    } catch (error) {
        console.error("error al obtener los usuarios");
    }
}

export const actualizarUsuarios = async (datosUsuarios) => {
    try {
        const response = await fetch(`${urlActualizarUsuarios}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosUsuarios)
        });
        const resultado = await response.json();
        return resultado;                                   
    } catch (error) {
        console.error("Error al actualizar usuarios:", error);
    }
} 

export const eliminarUsuarios = async (idusuarios) => {
    try {
        const response = await fetch(`${urlEliminarUsuarios.replace(':idusuarios', idusuarios)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }   
        });
        const resultado = await response.json();
        return resultado;
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
    }
}

//Productos Tecnologicos CRUD

export const obtainProductos = async ()=>{
    try {
        const resultado = await fetch(urlProductos);
        const productos = await resultado.json();
        return productos;
    } catch (error) {
        console.error("error al obtener los productos");
    }
}

// ACTUALIZADO: Función para registrar productos con imagen (usando FormData)
export const RegistrarProductos = async (datosProductos) => {
    try {
        // Si recibe FormData, enviarlo directamente
        if (datosProductos instanceof FormData) {
            const response = await fetch(`${urlRegistrarProductos}`, {
                method: 'POST',
                body: datosProductos // No establecer Content-Type para FormData
            });
            
            const resultado = await response.json();
            return resultado;
        }
        
        // Si recibe objeto normal (compatibilidad hacia atrás)
        const response = await fetch(`${urlRegistrarProductos}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosProductos)
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al registrar los productos:", error);
        throw error;
    }
}

// ACTUALIZADO: Función para actualizar productos con imagen (usando FormData)
export const actualizarProductos = async (datosProductos) => {
    try {
        // Si recibe FormData, enviarlo directamente
        if (datosProductos instanceof FormData) {
            const response = await fetch(`${urlActualizarProductos}`, {
                method: 'PUT',
                body: datosProductos // No establecer Content-Type para FormData
            });

            const resultado = await response.json();

            if (response.ok) {
                // Refrescar la página después de 1 segundo
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                console.error("❌ Error en la actualización:", resultado);
            }

            return resultado;
        }

        // Si recibe objeto normal (compatibilidad hacia atrás)
        const response = await fetch(`${urlActualizarProductos}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosProductos)
        });

        const resultado = await response.json();

        if (response.ok) {
            // Refrescar la página después de 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.error("❌ Error en la actualización:", resultado);
        }

        return resultado;

    } catch (error) {
        console.error("Error al actualizar los productos:", error);
        throw error;
    }
}

export const eliminarProductos = async (idproductos) => {
    try {
        const response = await fetch(`${urlEliminarProductos.replace(':idProducto', idproductos)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }   
        });
        const resultado = await response.json();
        return resultado;
    } catch (error) {
        console.error("Error al eliminar el Producto:", error);
    }
}

//Pedidos CRUD

export const crearPedido = async (datosPedido) => {
    try {
        const response = await fetch(`${urlPedidos}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosPedido)
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al crear el pedido:", error);
        throw error;
    }
}

export const obtenerPedidos = async () => {
    try {
        const resultado = await fetch(urlPedidos);
        const pedidos = await resultado.json();
        return pedidos;
    } catch (error) {
        console.error("Error al obtener los pedidos:", error);
    }
}

export const obtenerPedidosPorUsuario = async (idUsuario) => {
    try {
        const url = urlPedidosUsuario.replace(':idUsuario', idUsuario);
        const resultado = await fetch(url);
        const pedidos = await resultado.json();
        return pedidos;
    } catch (error) {
        console.error("Error al obtener los pedidos del usuario:", error);
    }
}

export const obtenerDetallePedido = async (idPedido) => {
    try {
        const url = urlPedidoDetalle.replace(':idPedido', idPedido);
        const resultado = await fetch(url);
        const detalle = await resultado.json();
        return detalle;
    } catch (error) {
        console.error("Error al obtener el detalle del pedido:", error);
    }
}

export const actualizarEstadoPedido = async (idPedido, estado) => {
    try {
        const url = urlPedidoEstado.replace(':idPedido', idPedido);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado })
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al actualizar el estado del pedido:", error);
    }
}

export const obtainPedidos = async ()=>{
    try {
        const resultadopedidos = await fetch(urlPedidosTodo);
        const pedidos = await resultadopedidos.json();
        return pedidos;
    } catch (error) {
        console.error("error al obtener los pedidos");
    }
}

//Pagos CRUD

export const crearPago = async (datosPago) => {
    try {
        const response = await fetch(`${urlPagos}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosPago)
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al crear el pago:", error);
        throw error;
    }
}

export const obtenerPagos = async () => {
    try {
        const resultado = await fetch(urlPagos);
        const pagos = await resultado.json();
        return pagos;
    } catch (error) {
        console.error("Error al obtener los pagos:", error);
    }
}

export const obtenerPagosPorUsuario = async (idUsuario) => {
    try {
        const url = urlPagosUsuario.replace(':idUsuario', idUsuario);
        const resultado = await fetch(url);
        const pagos = await resultado.json();
        return pagos;
    } catch (error) {
        console.error("Error al obtener los pagos del usuario:", error);
    }
}

export const obtenerFormasPago = async () => {
    try {
        const resultado = await fetch(urlFormasPago);
        const formasPago = await resultado.json();
        return formasPago;
    } catch (error) {
        console.error("Error al obtener las formas de pago:", error);
    }
}

export const actualizarEstadoPago = async (idPago, estado_pago, notas_pago = null) => {
    try {
        const url = urlPagoEstado.replace(':idPago', idPago);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado_pago, notas_pago })
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al actualizar el estado del pago:", error);
    }
}

export const obtainPagos = async ()=>{
    try {
        const resultadoPagos = await fetch(urlPagosTodo);
        const pagos = await resultadoPagos.json();
        return pagos;
    } catch (error) {
        console.error("error al obtener los pagos");
    }
}

export const obtainPagosCount = async ()=>{
    try {
        const resultadoPagos = await fetch(urlPagosCount);
        const pagos = await resultadoPagos.json();
        return pagos;
    } catch (error) {
        console.error("error al obtener los pagos");
    }
}

//Historial compras

export async function getHistorialCompras() {
    try {
        const idUsuario = sessionStorage.getItem("idUsuario");
        const rol = sessionStorage.getItem("rol");

        if (!idUsuario || rol !== "cliente") {
            return { success: false, message: "No autorizado: debes ser cliente" };
        }

        const response = await fetch(`http://localhost:8000/historial/${idUsuario}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al obtener historial de compras:", error);
        return { success: false, message: "No se pudo obtener el historial" };
    }
}

// Crear nueva venta
export const crearVenta = async (datosVenta) => {
    try {
        const response = await fetch(`${urlVentas}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosVenta)
        });
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al crear la venta:", error);
        throw error;
    }
}

// Obtener todas las ventas
export const obtainVentas = async () => {
    try {
        const resultado = await fetch(urlVentas);
        if (!resultado.ok) {
            throw new Error(`Error HTTP: ${resultado.status}`);
        }
        const ventas = await resultado.json();
        return ventas;
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        throw error;
    }
}

// Obtener ventas por rango de fechas
export const obtainVentasPorFecha = async (fechaInicio, fechaFin) => {
    try {
        const url = `${urlVentasRangoFechas}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        return resultado;
    } catch (error) {
        console.error("Error al obtener ventas por fecha:", error);
        throw error;
    }
}

// Obtener estadísticas de ventas
export const obtainVentasStats = async () => {
    try {
        const response = await fetch(urlVentasStats);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const stats = await response.json();
        return stats;
    } catch (error) {
        console.error("Error al obtener estadísticas de ventas:", error);
        throw error;
    }
}

// Obtener ventas por usuario
export const obtenerVentasPorUsuario = async (idUsuario) => {
    try {
        const url = urlVentasUsuario.replace(':idUsuario', idUsuario);
        const resultado = await fetch(url);
        
        if (!resultado.ok) {
            throw new Error(`Error HTTP: ${resultado.status}`);
        }
        
        const ventas = await resultado.json();
        return ventas;
    } catch (error) {
        console.error("Error al obtener las ventas del usuario:", error);
        throw error;
    }
}

// Actualizar estado de una venta
export const actualizarEstadoVenta = async (idVenta, estado_venta) => {
    try {
        const url = urlVentaEstado.replace(':idVenta', idVenta);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado_venta })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
         if (response.ok) {
            // Refrescar la página después de 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.error("❌ Error en la actualización:", resultado);
        }
        
        const resultado = await response.json();
        return resultado;
        
    } catch (error) {
        console.error("Error al actualizar el estado de la venta:", error);
        throw error;
    }
}