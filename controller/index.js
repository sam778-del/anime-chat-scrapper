const puppeteer = require('puppeteer');
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const session = require('express-session');

// Generate an AI response based on a prompt
async function generateAIResponse(prompt) {
    // try {
    //     const configuration = new Configuration({
    //         apiKey: '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',
    //     });

    //     const openai = new OpenAIApi(configuration);

    //     const completion = await openai.createCompletion({
    //         model: 'text-davinci-003',
    //         prompt,
    //     });

    //     return completion.data.choices[0].text.trim();
    // } catch (err) {
    //     console.error(err);
    // }
    const openaiAPIKey = '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';
    const headers = {
        "Authorization": "Bearer " + openaiAPIKey,
        "Content-Type": "application/json"
    };

    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                "role": "user",
                "content": prompt
            }
        ]
    };
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", data, { headers });
        // console.log(response.data.choices[0].message);
        return response.data.choices[0].message.content;
    } catch (error) {
        throw "something went wrong";
    }
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

async function detectConversation(messages) {
    // Set up OpenAI API request
    const prompt = `Is this a conversation?\n\n${messages}`;
    const response = await generateAIResponse(prompt);

    // Check if response indicates input is a conversation
    const isConversation = response.includes('Yes');

    // Count number of unique usernames mentioned in conversation
    const usernames = [...new Set(messages.match(/User ?\d+:/g))]; // Match all occurrences of "User" followed by a number
    const numUsers = usernames.length;

    // Split messages into array of conversations with unique keys
    let conversations = [];
    messages.split('\n').forEach((message) => {
        let userMessage = message.replace(usernames, "");
        if (userMessage) {
            conversations.push({ message: userMessage });
        }
    });

    // Determine if conversation is between one or more users
    const isMultiUserConversation = numUsers > 1;

    // Return result
    return {
        isConversation,
        conversations,
        numUsers,
        isMultiUserConversation,
    };
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
        ai1Prompt = `create brief forum discussion between one or more user on "${currentTitle}" staying within the bounds of anime and manga`;

        // AI 2 generates a response based on the prompt
        ai2Response = await generateAIResponse(ai1Prompt);

        // AI 1 generates a response based on AI 2's response
        ai1Response = await generateAIResponse(`create brief forum discussion between one or more user on ${ai2Response}`);

        // AI 2 generates a response based on AI 1's response
        const ai2Prompt = `create brief forum discussion between one or more user on ${ai1Response}`;
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

        const modifiedMessages = []; // Existing array to push the messages into
        const conversation = await detectConversation(`${ai2Response} ${ai1Response} ${ai2ResponseToAi1Response}`);
        if (conversation.isConversation || conversation.conversations.length != 0 || conversation.numUsers != 0) {
            const conversationalArray = conversation.conversations;
            const firstConversation = conversationalArray[0];
            const firstMessage = {
                message: firstConversation.message.replace(/User ?\d+:/g, ""),
                user_id: 2,
                type: 'start'
            };
            const lastMessage = {
                message: conversationalArray[conversationalArray.length - 1].message.replace(/User ?\d+:/g, ""),
                user_id: 2,
                type: 'comment'
            };
            modifiedMessages.push(firstMessage);
            const getRandomUserId = () => {
                const userIds = [3, 4];
                return userIds[Math.floor(Math.random() * userIds.length)];
            };
            let lastUserId; // Variable to store the last user ID
            for (let i = 1; i < conversationalArray.length - 1; i++) {
                const conversation = conversationalArray[i];

                // Determine the next user ID based on the last user ID
                let nextUserId;
                if (lastUserId === 3) {
                    nextUserId = 4;
                } else if (lastUserId === 4) {
                    nextUserId = 3;
                } else {
                    nextUserId = getRandomUserId(); // Assign a random user ID initially
                }

                const otherMessages = {
                    message: conversation.message.replace(/User ?\w+: ?/g, ''),
                    user_id: nextUserId,
                    type: 'comment'
                };

                modifiedMessages.push(otherMessages);
                lastUserId = nextUserId; // Store the current user ID as the last user ID
            }
            modifiedMessages.push(lastMessage);

            // console.log(modifiedMessages);
        }
        // Send JSON response
        res.json({
            modifiedMessages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const respondtoUserMessage = async (req, res) => {
    try {
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
    } catch (error) {
        // Handle the error
        console.error('Error:', error);
    }
}

module.exports = {
    aiChatAi,
    respondtoUserMessage

}