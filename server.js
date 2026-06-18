const express = require('express');
const app = express();

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
foro = parsed.foro || [];


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// ✅ FICHERO DE DATOS
const dataFile = 'noticias.json';

// ✅ VARIABLES
let campings = [];
let noticias = [];

// ✅ CREAR JSON SI NO EXISTE
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({
    noticias: [],
    campings: []
  }, null, 2));
}

// ✅ LEER JSON
try {
  const data = fs.readFileSync(dataFile, 'utf-8');
  const parsed = JSON.parse(data);

  noticias = parsed.noticias || [];
  campings = parsed.campings || [];

} catch (error) {
  console.log("Error leyendo JSON");
  noticias = [];
  campings = [];
}

// ✅ GUARDAR TODO
function guardarDatos() {
  fs.writeFileSync(dataFile, JSON.stringify({
    noticias: noticias,
    campings: campings
    foro: foro
  }, null, 2));
}

// ✅ HOME
app.get('/', (req, res) => {
  res.render('index', { campings });
});

// ✅ LISTADO
app.get('/listado', (req, res) => {
  res.render('listado', { campings });
});

// ✅ FORM NUEVO CAMPING
app.get('/nuevo', (req, res) => {
  res.render('nuevo');
});

// ✅ GUARDAR CAMPING
app.post('/nuevo', (req, res) => {
  const { nombre, ubicacion, tipo, imagen, descripcion, provincia } = req.body;

  const nuevoCamping = {
    id: Date.now(),
    nombre,
    ubicacion,
    tipo,
    provincia, // ✅ nuevo campo
    imagen,
    descripcion
  };

  campings.push(nuevoCamping);
  guardarDatos();

  res.redirect('/listado');
});

// ✅ BORRAR CAMPING
app.post('/borrar-camping/:id', (req, res) => {
  const id = parseInt(req.params.id);

  campings = campings.filter(c => c.id !== id);
  guardarDatos();

  res.redirect('/listado');
});

// ✅ DETALLE CAMPING
app.get('/campings/:id', (req, res) => {
  const camping = campings.find(c => c.id == req.params.id);
  res.render('detalle', { camping });
});

// ✅ FORO
app.get('/foro', (req, res) => {
  res.render('foro');
});

// ✅ NOTICIAS
app.get('/noticias', (req, res) => {
  res.render('noticias', { noticias });
});

// ✅ FORM NOTICIA
app.get('/nueva-noticia', (req, res) => {
  res.render('nueva-noticia');
});
app.post('/foro', (req, res) => {
  const { titulo, contenido } = req.body;

  const nuevoMensaje = {
    id: Date.now(),
    titulo,
    contenido,
    fecha: new Date().toLocaleString()
  };

  foro.push(nuevoMensaje);   // ✅ aquí lo añades al array
  guardarDatos();            // ✅ aquí lo guardas en JSON

  res.redirect('/foro');
});

// ✅ GUARDAR NOTICIA
app.post('/nueva-noticia', async (req, res) => {
  const { link, titulo } = req.body;

  try {
    const response = await axios.get(link);
    const html = response.data;
    const $ = cheerio.load(html);

    let tituloAuto = $('title').text();

    if (tituloAuto.includes('|')) {
      tituloAuto = tituloAuto.split('|')[0];
    }

    let descripcion =
      $('meta[name="description"]').attr('content') ||
      "Haz clic para ver la noticia";

    let imagen =
      $('meta[property="og:image"]').attr('content') ||
      "https://picsum.photos/400/200";

    const nuevaNoticia = {
      titulo: titulo && titulo.trim() !== "" ? titulo : tituloAuto,
      descripcion,
      imagen,
      link,
      fecha: new Date().toLocaleDateString()
    };

    noticias.push(nuevaNoticia);

  } catch (error) {
    console.log(error);

    noticias.push({
      titulo: titulo || "No se pudo cargar",
      descripcion: "Haz clic para ver la noticia",
      imagen: "https://picsum.photos/400/200",
      link,
      fecha: new Date().toLocaleDateString()
    });
  }

  guardarDatos();
  res.redirect('/noticias');
});

// ✅ SERVIDOR (IMPORTANTE PARA RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
