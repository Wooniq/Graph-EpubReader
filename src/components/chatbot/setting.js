import { createChatBotMessage } from "react-chatbot-kit";
import Header from "./Header.js";
import ChatMessage from "./ChatMessage.js";

const setting = {
    initialMessages: [
        createChatBotMessage(
            "안녕하세요!"
        ),
    ],
    customComponents: {
        // Replaces the default header
        header: () => <Header />,
        // Replaces the default bot avatar
        botAvatar: (props) => <div {...props} />,
        // Replaces the default bot chat message container
        botChatMessage: (props) => <ChatMessage {...props} bot />,
        // Replaces the default user icon
        userAvatar: (props) => <div {...props} />,
        // Replaces the default user chat message
        userChatMessage: (props) => <ChatMessage {...props} />,
    },
};

export default setting;