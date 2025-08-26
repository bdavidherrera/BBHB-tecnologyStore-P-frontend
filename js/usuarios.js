import { registrarUsuario, loginUsuario} from '../Api/consumeApi.js';


document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("formRegistro");
    const formularioLogin = document.getElementById("loginForm");

    if(formulario){
        formulario.addEventListener("submit", async (e) => {
        e.preventDefault(); // Evita que el formulario se recargue

        const datosUsuario = {
            cedula: document.getElementById("cedula").value,
            nombre: document.getElementById("nombre").value,
            correo: document.getElementById("correo").value,
            direccion: document.getElementById("direccion").value,
            telefono: document.getElementById("telefono").value,
            password: document.getElementById("password").value,
            activo: "1", // Asignamos un estado por defecto
            rol: document.getElementById("rol").value
        };

        try {
            const resultado = await registrarUsuario(datosUsuario);
            if (resultado.affectedRows > 0) {
                console.log("Registro exitoso");
                 alert("Usuario registrado con éxito.");
                 window.location.href = "login.html"; 
                formulario.reset();
            } else {
                alert("El usuario no se pudo registrar. Intenta de nuevo");
                console.log("El resultado no fue válido:", resultado);
            }
        } catch (error) {
            console.error("Error en el registro:", error);
            alert("Hubo un error al registrar el usuario. Datos duplicados revisar tus datos");
        }
    });
    }

  if(formularioLogin){          
    formularioLogin.addEventListener("submit", async (e) => {         
        e.preventDefault();           
        
        const datosLogin = {             
            correo: document.getElementById("correo").value,             
            password: document.getElementById("password").value         
        };          

        try {             
            const resultado = await loginUsuario(datosLogin);              
            console.log("Resultado completo del login:", resultado);
            
            let usuario;
            
            if (Array.isArray(resultado)) {
                usuario = resultado[0]; 
            } else {
                usuario = resultado; 
            }
            
            if (!usuario) {
                alert("No se encontró información del usuario.");
                return;
            }
            
            
            
            const rol = (usuario.rol || "").toLowerCase().trim();

            // GUARDAR TODOS LOS DATOS EN SESSIONSTORAGE
            sessionStorage.setItem("idUsuario", usuario.idUsuario);
            sessionStorage.setItem("rol", usuario.rol);
            sessionStorage.setItem("correo", usuario.correo);
            sessionStorage.setItem("nombre", usuario.nombre || "");
            sessionStorage.setItem("cedula", usuario.cedula || "");
            sessionStorage.setItem("telefono", usuario.telefono || ""); // ESTE CAMPO SÍ EXISTE
            sessionStorage.setItem("direccion", usuario.direccion || ""); // ESTE CAMPO SÍ EXISTE
            
            
            
            if (rol === "admin") {  
                alert("Bienvenido Administrador"); 
                window.location.href = "admin.html";  
            } else if (rol === "cliente") {                      
                alert("Bienvenido Cliente");
                window.location.href = "cliente.html";  
            } else {                     
                alert("Rol desconocido: " + rol);                 
            }                  
            
            formularioLogin.reset();                       
            
        } catch (error) {             
            console.error("Error en el login:", error);             
            alert("Hubo un error al iniciar sesión.");         
        }     
    });     
}
    
});


