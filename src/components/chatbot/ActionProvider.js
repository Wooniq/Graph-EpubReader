import Loader from "./Loader";

class ActionProvider {
    constructor(createChatbotMessage, setStateFunc, createClientMessage) {
        this.createChatbotMessage = createChatbotMessage;
        this.setState = setStateFunc;
        this.createClientMessage = createClientMessage;
    }

    handleUserMessage = async (message) => {
        try {
            // 로딩 메시지
            const loading = this.createChatbotMessage(<Loader />)
            this.setState((prev) => ({ ...prev, messages: [...prev.messages, loading], }))

            // 서버에 요청 보내기
            const response = await fetch('http://113.198.85.7:80/run-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }), // 사용자 메시지를 서버로 전달
            });

            const data = await response.json(); // 서버의 응답 받기dataResult
            console.log(`Raw data: ${data.reuslt}`); // 응답 데이터 출력

            // \n을 <br />로 변환
            const formattedResult = data.result ? data.result.replace(/\n/g, '<br />') : "No result returned.";

            // 챗봇 메시지 생성
            const chatbotMessage = this.createChatbotMessage(<span dangerouslySetInnerHTML={{ __html: formattedResult }} />);

            // 상태에 메시지를 추가
            this.setState((prev) => {
                // 로딩 메시지 지우기
                const newPrevMsg = prev.messages.slice(0, -1)
                return { ...prev, messages: [...newPrevMsg, chatbotMessage], }
            })
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
