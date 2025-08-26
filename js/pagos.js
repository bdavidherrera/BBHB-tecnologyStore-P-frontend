import { obtainPagos, obtainPagosCount } from './../Api/consumeApi.js';

document.addEventListener("DOMContentLoaded", () => {
    const tablaProductosS = document.querySelector('#tablaPagos')
    const contador = document.querySelector('#countPagos')
    
    
    if (tablaProductosS) {
        obtenerPagos()
        obtenerPagosCountFrontend()
      
    }
    
})

async function obtenerPagos() {
    try {
        const ProductosObtained = await obtainPagos();
        const container = document.querySelector('#tablaPagos');
        container.innerHTML = "";

        ProductosObtained.forEach((productos) => {
            const { idPago, NombrePersona, Direccion, idFormaPago, Telefono, correo_electronico, monto_subtotal,
                 descuentos, impuestos, monto_total, fecha_pago, estado_pago, idUsuario, idPedido, referencia_pago, notas_pago } = productos;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${idPago}</td>
                <td>${NombrePersona}</td>
                <td>${Direccion}</td>
                <td>${idFormaPago}</td>
                <td>${Telefono}</td>
                <td>${correo_electronico}</td>
                <td>${monto_subtotal}</td>
                <td>${descuentos}</td>
                <td>${impuestos}</td>
                <td>${monto_total}</td>
                <td>${new Date(fecha_pago).toLocaleString()}</td>
                <td>${estado_pago}</td>
                <td>${idUsuario}</td>
                <td>${idPedido}</td>
                <td>${referencia_pago}</td>
                <td>${notas_pago || ''}</td>
            `;
            container.appendChild(row);
        });

        

    } catch (error) {
        console.error('Error al obtener ventas:', error);
    }
}

async function obtenerPagosCountFrontend() {
    try {
        const result = await obtainPagosCount();
        const contador = document.querySelector('#countPagos');

        if (result && result.count !== undefined) {
            contador.textContent = `Total: ${result.count}`;
        } else {
            contador.textContent = "No se pudo obtener el conteo.";
        }
    } catch (error) {
        console.error("Error al obtener count de pagos:", error);
    }
}