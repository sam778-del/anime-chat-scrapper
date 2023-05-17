const cors = require("cors");
const express = require('express');
const session = require('express-session');
const { aiChatAi, respondtoUserMessage } = require("./controller");
const app = express();
const corsOptions = {
    origin: '*',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200,
}
app.use(express.json());
app.use(cors(corsOptions)) // Use this after the variable declaration
// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to true if using HTTPS
}));

app.get('/ai-to-ai/chat', aiChatAi);
app.post('/ai-to-user', respondtoUserMessage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('App running at ' + PORT);
});