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
const cron = require('node-cron');
const { createRandomGroupChat, checkComment } = require("./controller/group");
app.use(express.json());
app.use(cors(corsOptions)) // Use this after the variable declaration
// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Change to true if using HTTPS
}));

// Define the cron job
const job = cron.schedule('*/5 * * * *', async () => {
    // Run the function here
    try {
        await createRandomGroupChat();
    } catch (error) {
        console.log(error);
    }
});

const job2 = cron.schedule('* * * * * *', async () => {
    // Run the function here
    try {
        // await checkComment();
    } catch (error) {
        console.log(error);
    }
});

// Start the cron job
job.start();
job2.start();

app.get('/ai-to-ai/chat', aiChatAi);
app.post('/ai-to-user', respondtoUserMessage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('App running at ' + PORT);
});