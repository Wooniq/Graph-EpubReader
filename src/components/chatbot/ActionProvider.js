// class ActionProvider {
//     constructor(createChatbotMessage, setStateFunc, createClientMessage) {
//         this.createChatbotMessage = createChatbotMessage;
//         this.setState = setStateFunc;
//         this.createClientMessage = createClientMessage;
//     }

//     // "Yes" 응답을 처리하는 메서드
//     handleUserMessage = (message) => {

//         const response = this.createChatbotMessage("Yes");

//         // 상태에 메시지를 추가
//         this.setState((prev) => ({
//             ...prev,
//             messages: [...prev.messages, response],
//         }));
//     };
// }

// export default ActionProvider;

class ActionProvider {
    constructor(createChatbotMessage, setStateFunc, createClientMessage) {
        this.createChatbotMessage = createChatbotMessage;
        this.setState = setStateFunc;
        this.createClientMessage = createClientMessage;
    }

    handleUserMessage = async (message) => {
        try {
            // 서버에 요청 보내기
            const response = await fetch('http://localhost:5000/run-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }), // 사용자 메시지를 서버로 전달
            });

            const data = await response.json(); // 서버의 응답 받기

            // 챗봇 메시지 생성
            const chatbotMessage = this.createChatbotMessage(data.result || "No result returned.");

            // 상태에 메시지를 추가
            this.setState((prev) => ({
                ...prev,
                messages: [...prev.messages, chatbotMessage],
            }));
        } catch (error) {
            console.error("Error executing Python command:", error);
            const errorMessage = this.createChatbotMessage("An error occurred while processing your request.");
            this.setState((prev) => ({
                ...prev,
                messages: [...prev.messages, errorMessage],
            }));
        }
    };
}

export default ActionProvider;
