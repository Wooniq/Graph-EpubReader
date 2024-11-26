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
  .ri-heart-3-fill {
    font-size: 1.5rem;
    color: #ffffff;
  }
`;


function Header() {
  const [isClicked, setIsClicked] = useState(false); // 아이콘 상태 관리

  useEffect(() => {
    setIsClicked(adapter.getType() === 'local' ? isClicked : !isClicked);
  }, []);

  const toggleHeart = () => {
    setIsClicked(!isClicked);
    adapter.setType(isClicked? 'local' : 'global');
  };
  
    return (
        <HeaderContainer>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Rabbit</div>
          {isClicked ? (
            <i className="ri-heart-3-fill" onClick={toggleHeart} /> // 채워진 하트 아이콘
          ) : (
            <i className="ri-heart-3-line" onClick={toggleHeart} /> // 빈 하트 아이콘
          )}
        </HeaderContainer>
    );
}

export default Header;