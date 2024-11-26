import React, { useState, useEffect } from "react";
import styled from "styled-components";
import adapter from "./Adapter.js";

const HeaderContainer = styled.div`
  background: rgb(92, 130, 255);
  background: #B6ABFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem;

  .ri-heart-3-line,
  .ri-heart-3-fill,
  .ri-chat-3-line,
  .ri-chat-3-fill {
    font-size: 1.5rem;
    padding-left: 0.5rem;
    color: #ffffff;
  }
`;

function Header() {
  const [isClicked, setIsClicked] = useState(false); // 아이콘 상태 관리
  const [isClickedType, setIsClickedType] = useState(false); // 아이콘 상태 관리

  useEffect(() => {
    setIsClicked(adapter.getResMethod() === 'local' ? isClicked : !isClicked);
    setIsClickedType(adapter.getResType() === 'Single Sentence' ? isClickedType : !isClickedType);
  }, []);

  const toggleMethod = () => {
    setIsClicked(!isClicked);
    adapter.setResMethod(isClicked? 'local' : 'global');
  };

  const toggleType = () => {
    setIsClickedType(!isClickedType);
    adapter.setResType(isClickedType? 'Single Sentence' : 'Single Paragraph');
  };
  
    return (
        <HeaderContainer>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Rabbit</div>
          <div>
            {isClicked ? (
              <i className="ri-heart-3-fill" onClick={toggleMethod} /> // 채워진 하트 아이콘
            ) : (
              <i className="ri-heart-3-line" onClick={toggleMethod} /> // 빈 하트 아이콘
            )}
            {isClickedType ? (
              <i className="ri-chat-3-fill" onClick={toggleType} /> 
            ) : (
              <i className="ri-chat-3-line" onClick={toggleType} /> 
            )}
          </div>
        </HeaderContainer>
    );
}

export default Header;