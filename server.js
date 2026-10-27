const express = require('express');
const https = require('https');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error('Error: Falta la variable TMDB_API_KEY en el archivo .env');
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));

function hacerPeticionTMDB(ruta) {
  return new Promise((resolve, reject) => {
    const url = `https://api.themoviedb.org/3${ruta}&api_key=${TMDB_API_KEY}&language=es-MX`;
    
    const req = https.get(url, (res) => {
      let datos = '';
      
      res.on('data', (chunk) => {
        datos += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject({ tipo: 'limite', codigo: 429 });
          return;
        }
        if (res.statusCode === 401) {
          reject({ tipo: 'clave_invalida', codigo: 401 });
          return;
        }
        if (res.statusCode >= 400) {
          reject({ tipo: 'otro_error', codigo: res.statusCode });
          return;
        }
        
        try {
          const json = JSON.parse(datos);
          resolve(json);
        } catch (e) {
          reject({ tipo: 'json_invalido', codigo: res.statusCode });
        }
      });
    });
    
    req.on('error', (err) => {
      reject({ tipo: 'sin_conexion' });
    });
    
    req.setTimeout(8000, () => {
      req.destroy();
      reject({ tipo: 'tiempo_agotado' });
    });
  });
}

app.get('/api/populares', async (req, res) => {
  try {
    const resultado = await hacerPeticionTMDB('/movie/popular?');
    res.json(resultado);
  } catch (error) {
    if (error.tipo === 'sin_conexion' || error.tipo === 'tiempo_agotado') {
      res.status(503).json({ error: 'Sin conexión o tiempo de espera agotado al contactar TMDB' });
    } else if (error.tipo === 'limite') {
      res.status(429).json({ error: 'Límite de peticiones alcanzado en TMDB' });
    } else if (error.tipo === 'clave_invalida') {
      res.status(500).json({ error: 'Clave de API inválida' });
    } else if (error.tipo === 'json_invalido') {
      res.status(502).json({ error: 'Respuesta inválida de TMDB' });
    } else {
      res.status(502).json({ error: 'Error al obtener películas populares' });
    }
  }
});

app.get('/api/buscar', async (req, res) => {
  const q = req.query.q;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'El parámetro q es requerido' });
  }
  
  try {
    const queryCodificado = encodeURIComponent(q.trim());
    const resultado = await hacerPeticionTMDB(`/search/movie?query=${queryCodificado}&`);
    res.json(resultado);
  } catch (error) {
    if (error.tipo === 'sin_conexion' || error.tipo === 'tiempo_agotado') {
      res.status(503).json({ error: 'Sin conexión o tiempo de espera agotado al contactar TMDB' });
    } else if (error.tipo === 'limite') {
      res.status(429).json({ error: 'Límite de peticiones alcanzado en TMDB' });
    } else if (error.tipo === 'clave_invalida') {
      res.status(500).json({ error: 'Clave de API inválida' });
    } else if (error.tipo === 'json_invalido') {
      res.status(502).json({ error: 'Respuesta inválida de TMDB' });
    } else {
      res.status(502).json({ error: 'Error al buscar películas' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`CineApp corriendo en http://localhost:${PORT}`);
});
