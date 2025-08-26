import { getHistorialCompras } from "../Api/consumeApi.js";

document.addEventListener("DOMContentLoaded", () => {
    obtenerHistorialCompras();
});


async function obtenerHistorialCompras() {
    try {
        const historial = await getHistorialCompras();
        const container = document.querySelector('#tablaPedidos');
        container.innerHTML = "";

        if (!historial.success || historial.historial.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No tienes compras registradas</td>
                </tr>
            `;
            return;
        }

        historial.historial.forEach((pedido) => {
            const { idPedido, estado, nombresProductos, subtotal, impuestos_totales, descuentos_totales, total, fecha_pedido } = pedido;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${idPedido}</td>
                <td>${estado}</td>
                <td>${nombresProductos}</td>
                <td>${new Date(fecha_pedido).toLocaleString()}</td>
                <td>$${Number(subtotal).toLocaleString('es-CO')}</td>
                <td>$${Number(descuentos_totales).toLocaleString('es-CO')}</td>
                <td>$${Number(impuestos_totales).toLocaleString('es-CO')}</td>
                <td><strong>$${Number(total).toLocaleString('es-CO')}</strong></td>
                
            `;
            container.appendChild(row);
        });

    } catch (error) {
        console.error("Error al obtener historial de compras:", error);
        const container = document.querySelector('#tablaHistorial');
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">Error al cargar el historial</td>
            </tr>
        `;
    }
}
