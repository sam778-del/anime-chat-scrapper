const puppeteer = require('puppeteer');
const { Configuration, OpenAIApi } = require("openai");
const session = require('express-session');

// Generate an AI response based on a prompt
async function generateAIResponse(prompt) {
    const configuration = new Configuration({
        apiKey: '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',
    });

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
    });

    return completion.data.choices[0].text.trim();
}

// Scrape anime and manga data from a website
async function scrapeData() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--single-process", "--no-zygote", "--no-sandbox"],
    });
    const browserWSEndpoint = await browser.wsEndpoint();
    const browser2 = await puppeteer.connect({ browserWSEndpoint });
    const page = await browser2.newPage();
    await page.goto('https://www.anime-planet.com/anime/all', {
        waitUntil: [
            "load",
            "domcontentloaded",
            "networkidle0",
            "networkidle2",
        ],
        timeout: 300000,
    });

    const animeTitles = await page.$$eval('ul.cardGrid > li > a > h3', elements => {
        return elements.map(element => element.textContent);
    });

    const mangaTitles = await page.$$eval('ul.cardGrid > li > a > h3', elements => {
        return elements.map(element => element.textContent);
    });

    await browser.close();
    return { animeTitles, mangaTitles };
}

const aiChatAi = async (req, res) => {
    try {
        let ai1Prompt = '';
        let ai2Response = '';
        let ai1Response = '';
        let currentTitle = '';
        let sessionData = req.session.data || {};

        // If sessionData contains previous conversation data, use it to continue the conversation
        if (sessionData.currentTitle && sessionData.ai2Response) {
            currentTitle = sessionData.currentTitle;
            ai2Response = sessionData.ai2Response;
        }

        // If the conversation has lasted for more than 5 minutes, move on to another random title
        if (Date.now() - sessionData.conversationStartTime > 300000) {
            currentTitle = '';
        }

        // If there is no current title or it's been more than 2 minutes since the last title was generated, generate a new random title
        if (!currentTitle || (Date.now() - sessionData.lastTitleTime > 120000)) {
            const { animeTitles, mangaTitles } = await scrapeData();
            const allTitles = [...animeTitles, ...mangaTitles];
            currentTitle = allTitles[Math.floor(Math.random() * allTitles.length)];
            sessionData.lastTitleTime = Date.now();
        }

        // AI 1 generates a prompt based on the current title and AI 2's response
        ai1Prompt = `Aliee Beta: What do you think of "${currentTitle}"?`;
        if (ai2Response) {
            ai1Prompt += ` I think "${ai2Response}"`;
        }

        // AI 2 generates a response based on the prompt
        ai2Response = await generateAIResponse(ai1Prompt);

        // AI 1 generates a response based on AI 2's response
        ai1Response = await generateAIResponse(`Aliee Beta: ${ai2Response}`);

        // AI 2 generates a response based on AI 1's response
        const ai2Prompt = `Aliee Charlie: ${ai1Response}`;
        const ai2ShouldRespond = Math.random() < 0.75; // AI 2 randomly decides whether to respond to AI 1's response
        let ai2ResponseToAi1Response = '';
        if (ai2ShouldRespond) {
            ai2ResponseToAi1Response = await generateAIResponse(ai2Prompt);
        }

        // Update session data with the latest conversation
        sessionData.currentTitle = currentTitle;
        sessionData.ai2Response = ai2Response;
        sessionData.conversationStartTime = sessionData.conversationStartTime || Date.now(); // Set conversation start time if it doesn't exist
        req.session.data = sessionData;

        // Send JSON response
        res.json({
            ai1Prompt,
            ai2Response,
            ai1Response,
            ai2ResponseToAi1Response
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const respondtoUserMessage = async (req, res) => {
    const message = req.body.message;
    const configuration = new Configuration({
        apiKey: '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',
    });

    const openai = new OpenAIApi(configuration);

    // Set up the initial prompt for the ChatGPT model
    let prompt = `User: ${message}\nAI: `;

    // Wait for AI response for up to 2 minutes
    let aiResponse = '';
    const timeout = Date.now() + 120000;
    while (Date.now() < timeout && aiResponse === '') {
        // Call the ChatGPT model to generate an AI response based on the prompt
        const completion = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
        });

        // Extract AI response from ChatGPT output
        aiResponse = completion.data.choices[0].text.trim();

        // Wait for 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // If there's no response from the AI after 2 minutes, ask the user if there's anything else the bot could help with
    if (aiResponse === '') {
        aiResponse = "I'm sorry, I didn't get a chance to respond. Is there anything else I can help you with?";
    }

    // Send AI response to user
    res.json({
        message: aiResponse
    });
}


module.exports = {
    aiChatAi,
    respondtoUserMessage
}