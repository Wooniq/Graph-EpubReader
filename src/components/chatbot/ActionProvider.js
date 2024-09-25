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
            const dataResult = data.result;
            console.log(`Raw data: ${dataResult}`); // 응답 데이터 출력

            // // SUCCESS: Global Search Response 또는 SUCCESS: Local Search Response 이후의 텍스트 추출
            // const regex = /SUCCESS: (?:Global|Local) Search Response:\s*(.*?)\s*(?:\[Data:.*?\])*$/;

            // // 정규 표현식을 사용하여 앞뒤 제거된 메시지를 추출
            // const match = dataResult.match(regex);
            // let answer;

            // if (match) {
            //     answer = match[1].trim(); // 실제 메시지 부분만 추출
            //     console.log(`Extracted answer: ${answer}`); // 추출된 답변 출력
            // } else {
            //     console.log("No match found.");
            //     answer = "No valid response found."; // 매칭이 되지 않으면 기본 메시지 설정
            // }

            // 챗봇 메시지 생성
            const chatbotMessage = this.createChatbotMessage(dataResult || "No result returned.");

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
