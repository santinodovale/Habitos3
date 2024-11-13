// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB3Aia_g9y_CpKXbNsLfdBmlocnmPRKhlI",
    authDomain: "app-habitos-32de7.firebaseapp.com",
    databaseURL: "https://app-habitos-32de7-default-rtdb.firebaseio.com/",
    projectId: "app-habitos-32de7",
    storageBucket: "app-habitos-32de7.appspot.com",
    messagingSenderId: "732855675001",
    appId: "1:732855675001:web:5f5ed31507495839488ca8",
    measurementId: "G-ESEFTEB89J"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Función para mostrar y ocultar secciones
function mostrarSeccion(idSeccion) {
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.classList.remove('activa');
    });

    const seccionSeleccionada = document.getElementById(idSeccion);
    if (seccionSeleccionada) {
        seccionSeleccionada.classList.add('activa');
        
        if (idSeccion === 'seccion-ver-habitos') {
            mostrarHabitos();
        }
    }

    document.querySelectorAll('.pestañas button').forEach(button => {
        button.classList.remove('active');
    });
    const buttonSeleccionado = document.querySelector(`.pestañas button[onclick="mostrarSeccion('${idSeccion}')"]`);
    if (buttonSeleccionado) {
        buttonSeleccionado.classList.add('active');
    }
}

// Funcion para agregar habito
function agregarHabito(event) {
    event.preventDefault();
    const nombreHábito = document.getElementById('nombre-habito').value;
    
    if (nombreHábito) {
        const nuevoHabitoRef = db.ref('habitos').push();
        nuevoHabitoRef.set({
            nombre: nombreHábito,
            fecha: new Date().toISOString()
        }).then(() => {
            const mensaje = document.getElementById('mensaje-confirmacion');
            mensaje.classList.remove('oculto'); // Muestra el mensaje
            document.getElementById('formulario-agregar-habito').reset(); // Reinicia el formulario

            setTimeout(() => {
                mensaje.classList.add('oculto');
            }, 3000);
        })
    }
}

// Función para mostrar los hábitos en "Ver Hábitos"
function mostrarHabitos() {
    const contenedorProgreso = document.getElementById('progreso-habitos');
    contenedorProgreso.innerHTML = ''; // Limpiar el contenido antes de mostrar los hábitos

    db.ref('habitos').on('value', (snapshot) => {
        contenedorProgreso.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const habito = childSnapshot.val();
            const habitoID = childSnapshot.key;

            // Crear un contenedor para cada hábito
            const habitoElemento = document.createElement('div');
            habitoElemento.classList.add('progreso-habito-item');
            habitoElemento.innerHTML = `
                <h3>${habito.nombre}</h3>
                <p>Fecha de creación: ${new Date(habito.fecha).toLocaleDateString()}</p>
                <p>Veces registradas: <span id="contador-${habitoID}">0</span></p>
                <canvas id="grafico-${habitoID}" width="400" height="200"></canvas>
                <button class="registrar-accion" onclick="registrarAccion('${habitoID}')">Hecho</button>
                <button class="btn-eliminar" onclick="eliminarHabito('${habitoID}')">Eliminar</button>
            `;
            contenedorProgreso.appendChild(habitoElemento);

            // Actualizar el conteo y mostrar el gráfico
            actualizarConteo(habitoID);
            mostrarGrafico(habitoID);
        });
    });
}

//Funcion para registrar cada accion
function registrarAccion(habitoId) {
    const contadorElemento = document.getElementById(`contador-${habitoId}`);
    const today = new Date().toLocaleDateString('sv-SE');

    // Incrementar el conteo en Firebase
    db.ref(`habitos/${habitoId}/acciones`).child(today).transaction((currentCount) => {
        return (currentCount || 0) + 1; // Incrementar el conteo
    }).then(() => {
        actualizarConteo(habitoId); 
    });
}


// Función para actualizar el conteo en la interfaz
function actualizarConteo(habitoId) {
    const contadorElemento = document.getElementById(`contador-${habitoId}`);
    const habitRef = db.ref(`habitos/${habitoId}/acciones`);

    habitRef.once('value', (snapshot) => {
        let total = 0;
        snapshot.forEach((childSnapshot) => {
            total += childSnapshot.val() || 0; // Sumar todos los conteos
        });
        contadorElemento.textContent = total; // Actualizar el conteo en la interfaz
    });
}

// Función para eliminar un hábito de Firebase con confirmación
function eliminarHabito(habitoID) {
    const confirmar = confirm("¿Estás seguro de que deseas eliminar este hábito?");
    if (confirmar) {
        db.ref('habitos/' + habitoID).remove()
            .then(() => {
                console.log("Hábito eliminado correctamente");
                mostrarHabitos(); // Actualiza la lista después de eliminar
            })
    }
}
function mostrarGrafico(habitoId) {
    const ctx = document.getElementById(`grafico-${habitoId}`).getContext('2d');

    db.ref(`habitos/${habitoId}/acciones`).on('value', (snapshot) => {
        const fechas = [];
        const conteos = [];

        snapshot.forEach((childSnapshot) => {
            fechas.push(childSnapshot.key); // Fecha (ej. "2024-11-07")
            conteos.push(childSnapshot.val() || 0); // Conteo de acciones ese día
        });

        // Crear o actualizar el gráfico con los datos
        new Chart(ctx, {
            type: 'bar', // Cambia a 'line' si prefieres gráfico de líneas
            data: {
                labels: fechas,
                datasets: [{
                    label: 'Veces completado',
                    data: conteos,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

