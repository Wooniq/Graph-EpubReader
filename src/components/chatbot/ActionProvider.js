import Loader from "./Loader";
import adapter from "./Adapter";

class ActionProvider {
    constructor(createChatbotMessage, setStateFunc, createClientMessage) {
        this.createChatbotMessage = createChatbotMessage;
        this.setState = setStateFunc;
        this.createClientMessage = createClientMessage;
    }

    handleUserMessage = async (message) => {
        try {

            let resMethod = adapter.getResMethod();
            console.log(`handleUserMessage resMethod : ${resMethod}`)
            
            // 로딩 메시지
            const loading = this.createChatbotMessage(<Loader />)
            this.setState((prev) => ({
                ...prev,
                messages: [...(Array.isArray(prev.messages) ? prev.messages : []) , loading],  // prev.messages가 배열이 아닐 경우 빈 문자열로 처리
            }));
            console.log(`before server`);
            
            // 서버에 요청 보내기
            const response = await fetch('https://uncommon-closely-sparrow.ngrok-free.app/run-query', {
            // const response = await fetch('http://localhost:5000/run-query', { // local로 실행
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, resMethod }), // 사용자 메시지를 서버로 전달
            });
            const data = await response.json(); // 서버의 응답 받기 dataResult

            console.log(`Raw data: ${data.result}`); // 응답 데이터 출력
            


            // \n을 <br />로 변환           ?????????????????????/
            const formattedResult = data.result ? data.result.replace(/\n/g, '<br />') : "No result returned.";

            // 챗봇 메시지 생성
            const chatbotMessage = this.createChatbotMessage(<span dangerouslySetInnerHTML={{ __html: formattedResult }} />);

            // 상태에 메시지를 추가
            this.setState((prev) => {
                const newPrevMsg = Array.isArray(prev.messages) ? prev.messages.slice(0, -1) : []; // 배열이 아니면 빈 문자열로 처리
                return { 
                    ...prev, 
                    messages: [...newPrevMsg, chatbotMessage],
                };
            });
            return formattedResult;
            
        } catch (error) {
            console.error("Error executing Python command:", error);
            const errorMessage = this.createChatbotMessage("An error occurred while processing your request.");
            this.setState((prev) => ({
                ...prev,
                messages: [...(prev.messages || []), errorMessage],
            }));
        }
    };
}

export default ActionProvider;
