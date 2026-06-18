const express = require('express');
const app = express();

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// ✅ FICHERO
const dataFile = 'noticias.json';

// ✅ VARIABLES
let campings = [];
let noticias = [];
let foro = [];
let users = [];
let usuarioActual = null;

// ✅ CREAR JSON SI NO EXISTE
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({
    noticias: [],
    campings: [],
    foro: [],
    users: []
  }, null, 2));
}

// ✅ LEER DATOS
try {
  const data = fs.readFileSync(dataFile, 'utf-8');
  const parsed = JSON.parse(data);

  noticias = parsed.noticias || [];
  campings = parsed.campings || [];
  foro = parsed.foro || [];
  users = parsed.users || [];

} catch (error) {
  console.log("Error leyendo JSON");
}

// ✅ GUARDAR
function guardarDatos() {
  fs.writeFileSync(dataFile, JSON.stringify({
    noticias,
    campings,
    foro,
    users
  }, null, 2));
}


app.get('/login', (req, res) => {
  res.render('login');
});

// ✅ HOME
app.get('/', (req, res) => {
  res.render('index', { campings, usuarioActual });
});

// ✅ LISTADO
app.get('/listado', (req, res) => {
  res.render('listado', { campings, usuarioActual });
});

// ✅ NUEVO CAMPING
app.get('/nuevo', (req, res) => {
  res.render('nuevo', { usuarioActual });
});

app.post('/nuevo', (req, res) => {
  const { nombre, ubicacion, tipo, imagen, descripcion, provincia } = req.body;

  const nuevoCamping = {
    id: Date.now(),
    nombre,
    ubicacion,
    tipo,
    provincia,
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

// ✅ DETALLE
app.get('/campings/:id', (req, res) => {
  const camping = campings.find(c => c.id == req.params.id);
  res.render('detalle', { camping, usuarioActual });
});

// ✅ NOTICIAS
app.get('/noticias', (req, res) => {
  res.render('noticias', { noticias, usuarioActual });
});

app.get('/nueva-noticia', (req, res) => {
  res.render('nueva-noticia', { usuarioActual });
});

app.post('/nueva-noticia', async (req, res) => {
  const { link, titulo } = req.body;

  try {
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);

    let tituloAuto = $('title').text();
    let descripcion =
      $('meta[name="description"]').attr('content') ||
      "Haz clic para ver la noticia";

    let imagen =
      $('meta[property="og:image"]').attr('content') ||
      "https://picsum.photos/400/200";

    noticias.push({
      titulo: titulo || tituloAuto,
      descripcion,
      imagen,
      link,
      fecha: new Date().toLocaleDateString()
    });

  } catch (error) {
    noticias.push({
      titulo: titulo || "Error",
      descripcion: "Haz clic para ver la noticia",
      imagen: "https://picsum.photos/400/200",
      link,
      fecha: new Date().toLocaleDateString()
    });
  }

  guardarDatos();
  res.redirect('/noticias');
});

// ✅ FORO
app.get('/foro', (req, res) => {
  res.render('foro', { foro, usuarioActual });
});

app.post('/foro', (req, res) => {
  const { titulo, contenido } = req.body;

  const nuevoMensaje = {
    id: Date.now(),
    titulo,
    contenido,
    usuario: usuarioActual || "Anónimo",
    fecha: new Date().toLocaleString()
  };

  foro.push(nuevoMensaje);
  guardarDatos();

  res.redirect('/foro');
});

// ✅ LOGIN
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/registro', (req, res) => {
  const { usuario, password } = req.body;

  users.push({ usuario, password });
  guardarDatos();

  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  const user = users.find(
    u => u.usuario === usuario && u.password === password
  );

  if (user) {
    usuarioActual = usuario;
    res.redirect('/');
  } else {
    res.send("❌ Usuario incorrecto");
  }
});

app.get('/logout', (req, res) => {
  usuarioActual = null;
  res.redirect('/');
});

// ✅ SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor funcionando");
});
