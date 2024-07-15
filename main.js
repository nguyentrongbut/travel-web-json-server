const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.get("/echo", (req, res) => {
    res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
    if (req.method === "POST") {
        req.body.createdAt = Date.now();
    }
    if (req.method === "PATCH") {
        req.body.updateAt = Date.now();
    }
    // Continue to JSON Server router
    next();
});

// Custom route to embed comments, users, and expand countries with places
server.get("/api/places-expanded-comment-country-user/:id", (req, res) => {
    const { id } = req.params;
    const db = router.db; // Get the lowdb instance
    const places = db.get("places").value();
    const comments = db.get("comments").value();
    const countries = db.get("countries").value();
    const users = db.get("users").value(); // Assuming you have a 'users' collection in your db

    // Find the place by id
    const place = places.find((place) => place.id === parseInt(id));
    if (!place) {
        res.status(404).json({ error: "Place not found" });
        return;
    }

    // Filter comments for the specific place, embed users, and sort by createdAt descending
    const placeComments = comments
        .filter((comment) => comment.placeId === place.id)
        .map((comment) => ({
            ...comment,
            user: users.find((user) => user.id === comment.userId), // Embed user
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt descending

    // Find the country for the place
    const country = countries.find((country) => country.id === place.countryId);

    // Create response object with place, comments, country, and users
    const response = {
        ...place,
        comments: placeComments,
        country: country,
    };

    res.json(response);
});

// Use default router
server.use("/api", router);
server.listen(9000, () => {
    console.log("JSON Server is running");
});
