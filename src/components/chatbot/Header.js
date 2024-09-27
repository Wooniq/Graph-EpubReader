import styled from "styled-components";

const HeaderContainer = styled.div`
  background: rgb(92, 130, 255);
  background: #5F80FF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem;

  .ri-close-line,
  .ri-arrow-left-s-line {
    font-size: 1.5rem;
    color: #ffffff;
  }
`;

function Header() {
    return (
        <HeaderContainer>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>GraphBot</div>
            <i className="ri-close-line" />
        </HeaderContainer>
    );
}

export default Header;