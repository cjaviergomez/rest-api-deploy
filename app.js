const express = require('express') // require -> commonJS
const movies = require('./movies.json')
const crypto = require('node:crypto')
const cors = require('cors')

const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()

app.use(express.json())

app.disable('x-powered-by')  // Deshabilitar cabecera de express

// Métodos normal: GET/HEAD/POST
// Métodos complejos: PUT/PATCH/DELETE  --> Aquí ocurre el pre-flight
// CORS Pre-Flight: se hace una petición previa OPTIONS

const VALID_ORIGINS = [
    'http://localhost:1234',
    'http://localhost:8080',
    'https://movies.com'
]

// TODO: Manejar CORS desde el Middleware
app.use(cors({
    origin: (origin, callback) => {
        if(VALID_ORIGINS.includes(origin) || !origin) return callback(null, true)
        return callback(new Error('Not allowed by CORS'))
    }
}))

// Todos los recuersos que sean movies se identifican con /movies
app.get('/movies', (req, res) => {
    // TODO: Manejar CORS manualmente
    // Las siguientes dos lineas son para manejar el CORS
    // const origin = req.header('origin')
    // if(VALID_ORIGINS.includes(origin) || !origin) res.header('Access-Control-Allow-Origin', origin)

    // Forma de trabajar con query params
    const { genre } = req.query

    if (genre) {
        const filterMoviesByGender = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
        return res.json(filterMoviesByGender)
    }
    res.json(movies)
})

// Forma de trabajar con path params
app.get('/movies/:id', (req, res) => { // path-to-regexp
 const { id } = req.params

 const movie = movies.find(movie => movie.id === id)

 movie ? res.json(movie) : res.status(404).json({ message: 'Movie not found'})

})

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)

    if(result.error) {
        // 422 Unprocessable Entity
        return res.status(400).json({ message: JSON.parse(result.error.message) })
    }

    // En base de datos
    const newMovie = {
        id: crypto.randomUUID, // uuid v4
        ...result.data
    }

    // ❌ Esto NO seria REST, porque estamos guardando
    // el estado de la aplicación en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body)
    
    if(result.error) {
        // 422 Unprocessable Entity
        return res.status(400).json({ message: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1) return res.status(404).json({ message: 'Movie not found'})

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)

})

app.delete('/movies/:id', (req, res) => {
    // TODO: Manejar CORS manualmente
    // Las siguientes dos lineas son para manejar el CORS
    // const origin = req.header('origin')
    // if(VALID_ORIGINS.includes(origin) || !origin) res.header('Access-Control-Allow-Origin', origin)

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1) return res.status(404).json({ message: 'Movie not found'})

    movies.splice(movieIndex, 1)

    return res.json({ message: 'Movie deleted'})
})

// TODO: Manejar CORS manualmente
// Esto se hace para manejar el CORS en las peticiones que hacen pre-flight
// app.options('/movies/:id', (req, res) => {
//     const origin = req.header('origin')
//     if(VALID_ORIGINS.includes(origin) || !origin) {
//         res.header('Access-Control-Allow-Origin', origin)
//         res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE')
//     }

//     res.send(200)
// })

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
})