const campoBusqueda = document.getElementById('campoBusqueda');
const botonBuscar = document.getElementById('botonBuscar');
const contenedorPeliculas = document.getElementById('contenedorPeliculas');
const mensajeEstado = document.getElementById('mensajeEstado');
const tituloSeccion = document.getElementById('tituloSeccion');

function mostrarMensaje(mensaje) {
    mensajeEstado.textContent = mensaje;
}

function limpiarMensaje() {
    mensajeEstado.textContent = '';
}

function crearEstrella(calificacion) {
    const estrellas = Math.round(calificacion / 2);
    let resultado = '';
    for (let i = 0; i < 5; i++) {
        if (i < estrellas) {
            resultado += '★';
        } else {
            resultado += '☆';
        }
    }
    return resultado;
}

function crearTarjetaPelicula(pelicula) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-pelicula';
    
    const infoPelicula = document.createElement('div');
    infoPelicula.className = 'info-pelicula';
    
    if (pelicula.poster_path) {
        const poster = document.createElement('img');
        poster.className = 'poster-pelicula';
        poster.src = 'https://image.tmdb.org/t/p/w342' + pelicula.poster_path;
        poster.alt = pelicula.title;
        tarjeta.appendChild(poster);
    } else {
        const sinPoster = document.createElement('div');
        sinPoster.className = 'sin-poster';
        sinPoster.textContent = 'Sin póster';
        tarjeta.appendChild(sinPoster);
    }
    
    const titulo = document.createElement('div');
    titulo.className = 'titulo-pelicula';
    titulo.textContent = pelicula.title;
    
    const anio = document.createElement('div');
    anio.className = 'anio-pelicula';
    if (pelicula.release_date) {
        anio.textContent = pelicula.release_date.substring(0, 4);
    } else {
        anio.textContent = 'N/A';
    }
    
    const calificacion = document.createElement('div');
    calificacion.className = 'calificacion-pelicula';
    const estrellas = crearEstrella(pelicula.vote_average || 0);
    calificacion.textContent = estrellas + ' (' + (pelicula.vote_average || 0).toFixed(1) + ')';
    
    const sinopsis = document.createElement('div');
    sinopsis.className = 'sinopsis-pelicula';
    if (pelicula.overview && pelicula.overview.trim() !== '') {
        sinopsis.textContent = pelicula.overview;
    } else {
        sinopsis.textContent = 'Sin sinopsis disponible.';
    }
    
    infoPelicula.appendChild(titulo);
    infoPelicula.appendChild(anio);
    infoPelicula.appendChild(calificacion);
    infoPelicula.appendChild(sinopsis);
    
    tarjeta.appendChild(infoPelicula);
    
    tarjeta.addEventListener('click', () => {
        if (sinopsis.classList.contains('visible')) {
            sinopsis.classList.remove('visible');
        } else {
            sinopsis.classList.add('visible');
        }
    });
    
    return tarjeta;
}

async function cargarPopulares() {
    limpiarMensaje();
    contenedorPeliculas.textContent = '';
    tituloSeccion.textContent = 'Películas Populares';
    mostrarMensaje('Cargando...');
    
    try {
        if (!navigator.onLine) {
            mostrarMensaje('No hay conexión a internet');
            return;
        }
        
        const respuesta = await fetch('/api/populares');
        const datos = await respuesta.json();
        
        limpiarMensaje();
        
        if (!respuesta.ok) {
            if (datos.error) {
                mostrarMensaje(datos.error);
            } else {
                mostrarMensaje('Error al cargar películas populares');
            }
            return;
        }
        
        if (!datos.results || datos.results.length === 0) {
            mostrarMensaje('No se encontraron películas');
            return;
        }
        
        for (let i = 0; i < datos.results.length; i++) {
            const tarjeta = crearTarjetaPelicula(datos.results[i]);
            contenedorPeliculas.appendChild(tarjeta);
        }
    } catch (error) {
        limpiarMensaje();
        mostrarMensaje('No se puede contactar al servidor');
    }
}

async function buscarPeliculas(consulta) {
    limpiarMensaje();
    contenedorPeliculas.textContent = '';
    tituloSeccion.textContent = 'Resultados de búsqueda';
    mostrarMensaje('Cargando...');
    
    try {
        if (!navigator.onLine) {
            mostrarMensaje('No hay conexión a internet');
            return;
        }
        
        const respuesta = await fetch('/api/buscar?q=' + encodeURIComponent(consulta));
        const datos = await respuesta.json();
        
        limpiarMensaje();
        
        if (!respuesta.ok) {
            if (datos.error) {
                mostrarMensaje(datos.error);
            } else {
                mostrarMensaje('Error al buscar películas');
            }
            return;
        }
        
        if (!datos.results || datos.results.length === 0) {
            mostrarMensaje('No se encontraron películas con ese nombre');
            return;
        }
        
        for (let i = 0; i < datos.results.length; i++) {
            const tarjeta = crearTarjetaPelicula(datos.results[i]);
            contenedorPeliculas.appendChild(tarjeta);
        }
    } catch (error) {
        limpiarMensaje();
        mostrarMensaje('No se puede contactar al servidor');
    }
}

botonBuscar.addEventListener('click', () => {
    const consulta = campoBusqueda.value;
    if (consulta.trim() === '') {
        cargarPopulares();
        return;
    }
    buscarPeliculas(consulta);
});

campoBusqueda.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const consulta = campoBusqueda.value;
        if (consulta.trim() === '') {
            cargarPopulares();
            return;
        }
        buscarPeliculas(consulta);
    }
});

cargarPopulares();
