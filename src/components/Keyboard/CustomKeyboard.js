import React, { useState } from "react";
import Keyboard from "react-simple-keyboard";
import styled from "styled-components";
import "react-simple-keyboard/build/css/index.css";
import { koreanLayout } from "./koreanLayout";
import hangul from "hangul-js";
import ActionProvider from "../chatbot/ActionProvider";
import adapter from "../chatbot/Adapter";
import Loader from "../chatbot/Loader";
import { createChatBotMessage, createClientMessage } from "react-chatbot-kit";

const CustomKeyboard = ({ text, setText, setMessages, setForceUpdate }) => {
    const [layoutName, setLayoutName] = useState("default"); // default, shift
    // const [messages, setMessages] = useState([]);
    // const [forceUpdate, setForceUpdate] = useState(false);

    const actionProvider = new ActionProvider(
        createChatBotMessage,
        (newState) => setMessages(newState.messages),
        (message) => createClientMessage(message)
      );

    const enterkey = async (text) => {

        const clientMesage = actionProvider.createClientMessage(text);
        setMessages(prevMessages => [...prevMessages, clientMesage]);
        setForceUpdate((prev) => !prev);
        //console.log("Messages after mic : ", messages); 

        //--------------------------------------------------server - chatbot code -----------------
        //await actionProvider.handleUserMessage(text);
        //const chatBotMessage = actionProvider.createChatbotMessage("chatbot");

        try {

            let resMethod = adapter.getResMethod();
            let resType = adapter.getResType();
            console.log(`Audio resMethod : ${resMethod}`)

            // 로딩 메시지
            const loading = actionProvider.createChatbotMessage(<Loader />)
            setMessages(prevMessages => [...prevMessages, loading]);
            console.log(`before server`);

            // 서버에 요청 보내기
            const response = await fetch('https://uncommon-closely-sparrow.ngrok-free.app/run-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text, resMethod, resType }), // 사용자 메시지를 서버로 전달
            });
            const data = await response.json(); // 서버의 응답 받기 dataResult

            console.log(`Raw data: ${data.result}`); // 응답 데이터 출력

            // \n을 <br />로 변환
            const formattedResult = data.result ? data.result.replace(/\n/g, '<br />') : "No result returned.";

            // 챗봇 메시지 생성
            const chatbotMessage = actionProvider.createChatbotMessage(<span dangerouslySetInnerHTML={{ __html: formattedResult }} />);

            // 상태에 메시지를 추가
            setMessages(prevMessages => {
                const newMessages = prevMessages.filter((msg) => msg != loading);
                return [...newMessages, chatbotMessage];
            });

            setForceUpdate((prev) => !prev);


            return formattedResult;

        } catch (error) {
            console.error("Error executing Python command:", error);
            const errorMessage = actionProvider.createChatbotMessage("An error occurred while processing your request.");
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        }

    };

    const onKeyPress = (key) => {
        if (key === "{pre}") {
            const res = text.slice(0, -1);
            setText(res);
        } else if (key === "{shift}") {
            setLayoutName((prev) => (prev === "default" ? "shift" : "default"));
        } else if (key === "{enterNum}" || key === "{enterText}") {
            console.log("enter clicked!");
            const submittedText = text;  // 현재 입력된 텍스트
            // console.log("Text submitted:", submittedText);
            enterkey(submittedText);
            // 텍스트 입력 초기화
            setText("");
        } else if (key === "{dot}") {
            setText((prev) => prev + ".");
        } else if (key === "{space}") {
            setText((prev) => prev + " ");
        } else {
            // 한글 처리 부분
            setText((prev) => hangul.assemble(hangul.disassemble(prev + key)));
        }
    };

    return (
        <KeyboardWrapper>
            <Keyboard
                layoutName={layoutName}
                layout={{ ...koreanLayout }}
                onKeyPress={onKeyPress}
                display={{
                    "{enterText}": "Enter",
                    "{shift}": "Shift",
                    "{.}": ".",
                    "{space}": " ",
                    "{dot}": ".",
                    "{pre}": "←",
                }}
            />
        </KeyboardWrapper>
    );
};


const KeyboardWrapper = styled.div`
    position: fixed;   /* 화면에 고정 */
    bottom: 90px;      /* 화면 하단에서 20px 떨어지도록 */
    right: 20px;       /* 화면 우측에서 20px 떨어지도록 */
    z-index: 9999;     /* 다른 요소들보다 우선적으로 보이도록 */
    width: 45%;        /* 가로 길이를 화면의 45%로 설정 */
`;

export default CustomKeyboard;