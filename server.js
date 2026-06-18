const express = require('express');
const app = express();

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// ✅ DATOS
let campings = [];
let noticias = [];

// ✅ CARGAR DESDE JSON
if (fs.existsSync('noticias.json')) {
  try {
    const data = fs.readFileSync('noticias.json', 'utf-8');
    const parsed = JSON.parse(data || '{}');

    noticias = parsed.noticias || [];
    campings = parsed.campings || [];

  } catch (error) {
    console.log("Error leyendo JSON");
    noticias = [];
    campings = [];
  }
}

// ✅ HOME
app.get('/', (req, res) => {
  res.render('index', { campings });
});

// ✅ LISTADO
app.get('/listado', (req, res) => {
  res.render('listado', { campings });
});

// ✅ NUEVO CAMPING
app.get('/nuevo', (req, res) => {
  res.render('nuevo');
});

app.post('/nuevo', (req, res) => {
  const { nombre, ubicacion, tipo, imagen, descripcion } = req.body;

  const nuevoCamping = {
    id: Date.now(), // ✅ mejor que length+1
    nombre,
    ubicacion,
    tipo,
    imagen,
    descripcion
  };

  campings.push(nuevoCamping);

  // ✅ GUARDAR TODO
  fs.writeFileSync('noticias.json', JSON.stringify({
    noticias: noticias,
    campings: campings
  }, null, 2));

  res.redirect('/listado');
});

// ✅ BORRAR CAMPING
app.post('/borrar-camping/:id', (req, res) => {
  const id = parseInt(req.params.id);

  campings = campings.filter(c => c.id !== id);

  fs.writeFileSync('noticias.json', JSON.stringify({
    noticias: noticias,
    campings: campings
  }, null, 2));

  res.redirect('/listado');
});

// ✅ DETALLE
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

// ✅ FORMULARIO NOTICIA
app.get('/nueva-noticia', (req, res) => {
  res.render('nueva-noticia');
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

  // ✅ IMPORTANTE: guardar todo
  fs.writeFileSync('noticias.json', JSON.stringify({
    noticias: noticias,
    campings: campings
  }, null, 2));

  res.redirect('/noticias');
});

// ✅ SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});