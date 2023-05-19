const axios = require('axios');
const models = require('../models');
const { Configuration, OpenAIApi } = require("openai");
const EngineGroup = models.engine4_group_groups;
const EngineActions = models.engine4_group_actions;
const EngineStream = models.engine4_activity_stream;
const EngineComment = models.engine4_activity_comments

async function retrieveAllGroups() {
    try {
        // Retrieve all groups using Sequelize
        const groups = await EngineGroup.findAll();

        // Return the groups as an array
        return groups;
    } catch (error) {
        // If an error occurs, throw it to be caught by the caller
        throw error;
    }
}

async function sendToOpenAi(prompt) {
    try {
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
        const response = await axios.post("https://api.openai.com/v1/chat/completions", data, { headers });
        // console.log(response.data.choices[0].message);
        return response.data.choices[0].message.content;
    } catch (error) {
        throw "something went wrong";
    }
}

async function activityStream(target_type, target_id, subject_type, subject_id, object_type, object_id, type, action_id) {
    await EngineStream.create({
        target_type: target_type,
        target_id: target_id,
        subject_type: subject_type,
        subject_id: subject_id,
        object_type: object_type,
        object_id: object_id,
        type: type,
        action_id: action_id
    });
}

async function detectConversation(messages) {
    // Set up OpenAI API request
    const prompt = `Is this a conversation?\n\n${messages}`;
    const response = await sendToOpenAi(prompt);

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


async function ChatCompletionRequest(title) {
    let ai1Prompt = '';
    let ai2Response = '';
    let ai1Response = '';
    let ai2ResponseToAi1Response = '';

    // If a title is provided as a parameter, use it for the conversation
    if (title) {
        ai1Prompt = `create brief forum discussion between one or more user on "${title}" staying within the bounds of anime and manga`;
    } else {
        ai1Prompt = `create brief forum forum discussion between one or more user on a topic within the bounds of anime and manga`;
    }

    // AI 2 generates a response based on the prompt
    ai2Response = await sendToOpenAi(ai1Prompt);

    // AI 1 generates a response based on AI 2's response
    ai1Response = await sendToOpenAi(`${ai2Response}`);

    // AI 2 generates a response based on AI 1's response
    const ai2Prompt = `${ai1Response}`;
    const ai2ShouldRespond = Math.random() < 0.75; // AI 2 randomly decides whether to respond to AI 1's response
    if (ai2ShouldRespond) {
        ai2ResponseToAi1Response = await sendToOpenAi(ai2Prompt);
    }

    // Send JSON response
    return {
        ai2Response,
        ai1Response,
        ai2ResponseToAi1Response
    };
}

async function sendConversation(user_id, group_id, message, modifiedMessages) {
    const conversationData = await EngineActions.create({
        type: 'post_group',
        subject_type: 'user',
        subject_id: user_id,
        object_type: 'group',
        object_id: group_id,
        body: `${message}`,
        privacy: 'everyone',
        comment_count: modifiedMessages.length - 1,
        params: '{"count":"0"}'
    }).then((data) => {
        const targets = ['everyone', 'group', 'owner', 'parent', 'registered'];
        targets.forEach(async (target) => {
            switch (target) {
                case 'everyone':
                    await activityStream(target, 0, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type, data.action_id);
                    break;

                case 'registered':
                    await activityStream(target, 0, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type, data.action_id);
                    break;

                case 'group':
                    await activityStream(target, data.object_id, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type, data.action_id);
                    break;

                case 'owner':
                    await activityStream(target, data.subject_id, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type, data.action_id);
                    break;

                case 'parent':
                    await activityStream(target, 1, data.subject_type, data.subject_id, data.object_type, data.object_id, data.type, data.action_id);
                    break;

                default:
                    break;
            }
        })

        // send the comment data
        modifiedMessages.forEach(async (response) => {
            switch (response.type) {
                case 'comment':
                    await EngineComment.create({
                        resource_id: data.action_id,
                        poster_type: 'user',
                        poster_id: response.user_id,
                        body: response.message
                    });
                    console.log(response.length);
                    break;

                default:
                    console.log('sending comment removed');
                    break;
            }
        });
    });
    return conversationData;
}


const createRandomGroupChat = async (req, res) => {
    try {
        const groups = await retrieveAllGroups();
        groups.forEach(async (data) => {
            // AI 2 generates a more relevant response based on the initial AI response
            const request = await ChatCompletionRequest(data.title);
            // check if text is a conversation
            if (request.ai2Response && request.ai1Response && request.ai2ResponseToAi1Response) {
                const conversation = await detectConversation(`${request.ai2Response} ${request.ai1Response} ${request.ai2ResponseToAi1Response}`);
                if (conversation.isConversation || conversation.conversations.length != 0 || conversation.numUsers != 0) {
                    const conversationalArray = conversation.conversations;
                    const firstConversation = conversationalArray[0];
                    const firstMessage = {
                        message: firstConversation.message.replace(/User ?\w+: ?/g, ''),
                        user_id: 2,
                        type: 'start'
                    };
                    const lastMessage = {
                        message: conversationalArray[conversationalArray.length - 1].message.replace(/User ?\w+: ?/g, ''),
                        user_id: 2,
                        type: 'comment'
                    };
                    const modifiedMessages = []; // Existing array to push the messages into
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
                    modifiedMessages.forEach(async (response) => {
                        switch (response.type) {
                            case 'comment':
                                console.log('sending comment removed');
                                break;

                            default:
                                await sendConversation(response.user_id, data.group_id, response.message, modifiedMessages);
                                break;
                        }
                    });
                }
            }
        });
    } catch (error) {
        throw error
    }
}

const checkComment = async (req, res) => {
    try {
        const co = await EngineComment.findAll()
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createRandomGroupChat
}