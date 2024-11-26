import { Viewer, Worker } from '@react-pdf-viewer/core'; // PDF 뷰어 임포트
import '@react-pdf-viewer/core/lib/styles/index.css'; // PDF 뷰어 스타일 임포트
import React, { useEffect, useRef, useState } from 'react';
import Chatbot, { createChatBotMessage, createClientMessage } from "react-chatbot-kit";
import "react-chatbot-kit/build/main.css";
import { FaBookmark, FaPalette, FaTrash } from 'react-icons/fa';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import "remixicon/fonts/remixicon.css";
import NetworkChart from './NetworkChart.js';
import ActionProvider from "./components/chatbot/ActionProvider.js";
import Loader from "./components/chatbot/Loader";
import MessageParser from "./components/chatbot/MessageParser.js";
import setting from "./components/chatbot/setting.js";
import data from './json/graphml_data.json';
import "./styles/chatbot.css";
import { startRecording }from './recorder.js';

// WebRTC
import VideoChat from './webRTC/components/VideoChat';

const ownStyles = {
  ...ReactReaderStyle,
  arrow: {
    ...ReactReaderStyle.arrow,
    color: 'rgba(255, 255, 255, 0.7)',
  },
}

const HIGHLIGHT_COLORS = ['yellow', 'lightgreen', 'lightblue', 'pink']

const App = () => {
  const [location, setLocation] = useState(null)
  const [rendition, setRendition] = useState(null);
  const [page, setPage] = useState('')
  const [selections, setSelections] = useState([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [currentColor, setCurrentColor] = useState(HIGHLIGHT_COLORS[0])
  const tocRef = useRef(null)
  const readerRef = useRef(null)
  const [book, setBook] = useState(null)
  const [isOpen, setIsOpen] = useState(false);
  const [recordText, setRecordText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [viewerType/*, setViewerType*/] = useState('epub');  // 뷰어 타입 상태 추가
//////////
  const actionProvider = new ActionProvider(
    createChatBotMessage,
    (newState) => setMessages(newState.messages),
    (message) => createClientMessage(message)
  );

////////
  const mic = async () => { 
    const text = await startRecording(); 
    // const text= "what is the wonderland?";
    console.log("mic button recording text: ", text); 

    const clientMesage = actionProvider.createClientMessage(text);
    setMessages(prevMessages => [...prevMessages, clientMesage]);
    setForceUpdate((prev) => !prev);
    //console.log("Messages after mic : ", messages); 
    
//--------------------------------------------------server - chatbot code -----------------
    //await actionProvider.handleUserMessage(text);
    //const chatBotMessage = actionProvider.createChatbotMessage("chatbot");
    
    try {
            
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
          body: JSON.stringify({ message: text }), // 사용자 메시지를 서버로 전달
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

    //setMessages(prevMessages => [...prevMessages, chatBotMessage]);
    //setForceUpdate((prev) => !prev);

    //console.log("message after mic: ", messages);
  };

  const toggleChatbot = () => {
    console.log("Toggling Chatbot...");
    setIsOpen(!isOpen); // 버튼을 누를 때마다 열리고 닫히는 상태 토글
  };

  const updatePageInfo = (epubcifi) => {
    if (book && book.locations && book.locations.length() > 0) {
      const currentPage = book.locations.locationFromCfi(epubcifi) + 1
      const totalPages = book.locations.total
      setPage(`Page ${currentPage} of ${totalPages}`)
    }
  }

  const locationChanged = (epubcifi) => {
    setLocation(epubcifi)
    updatePageInfo(epubcifi)
  }

  const removeHighlight = (cfiRange) => {
    setSelections(prevSelections => prevSelections.filter(s => s.cfiRange !== cfiRange))
    if (rendition) {
      rendition.annotations.remove(cfiRange, 'highlight')
    }
  }

  const toggleBookmarks = () => setShowBookmarks(!showBookmarks)

  const changeHighlightColor = (color) => {
    setCurrentColor(color)
  }

  useEffect(() => {
    if (rendition) {
      const handleSelected = (cfiRange, contents) => {
        const range = contents.range(cfiRange)
        const text = range.toString()
        const existingSelection = selections.find(s => s.cfiRange === cfiRange)
        if (!existingSelection) {
          const newSelection = { cfiRange, text, color: currentColor }
          setSelections(prevSelections => [...prevSelections, newSelection])
          rendition.annotations.highlight(cfiRange, {}, (e) => {
            console.log('Annotation clicked', e)
          }, '', { fill: currentColor })

          const selection = contents.window.getSelection()
          if (selection) {
            selection.removeAllRanges()
          }
        }
      }

      rendition.on('selected', handleSelected)

      return () => {
        rendition.off('selected', handleSelected)
      }
    }
  }, [rendition, currentColor, selections])

  useEffect(() => {
    if (rendition) {
      rendition.themes.default({
        '::selection': {
          'background': 'rgba(255,255,0, 0.3)'
        },
        'body': {
          'font-family': 'inherit !important',
          'font-size': 'inherit !important',
          'line-height': 'inherit !important'
        }
      })
      rendition.themes.select('default')
    }
  }, [rendition])

  // 뷰어 렌더링 함수
  const renderViewer = () => {
    if (viewerType === 'epub') {
      return (
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
          {/* 기존 EPUB 리더 코드 */}
          <div style={{ position: 'absolute', top: '17px', right: '20px', zIndex: 2, display: 'flex', alignItems: 'center' }}>
            <FaBookmark
              onClick={toggleBookmarks}
              style={{ cursor: 'pointer', fontSize: '20px' }}
            />
          </div>
          {showBookmarks && (
            <div style={{ position: 'absolute', top: '40px', right: '20px', maxHeight: '300px', width: '250px', overflowY: 'auto', background: 'white', border: '1px solid #ccc', padding: '10px', zIndex: 2 }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  {HIGHLIGHT_COLORS.map(color => (
                    <FaPalette
                      key={color}
                      onClick={() => changeHighlightColor(color)}
                      style={{ cursor: 'pointer', marginRight: '5px', color: color }}
                    />
                  ))}
                </div>
              </div>
              {selections.map((selection, index) => (
                <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                  <FaBookmark style={{ marginRight: '5px', color: selection.color }} />
                  <span
                    onClick={() => rendition.display(selection.cfiRange)}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    {selection.text.slice(0, 30)}...
                  </span>
                  <FaTrash
                    onClick={() => removeHighlight(selection.cfiRange)}
                    style={{ cursor: 'pointer', marginLeft: '5px' }}
                  />
                </div>
              ))}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 2 }}>
            {page}
          </div>
          <ReactReader
            url="epub/Peterpan.epub"  // 여기에 미리 지정한 EPUB 파일 경로
            locationChanged={locationChanged}
            getRendition={(rendition) => {
              setRendition(rendition)
            }}
            tocChanged={toc => {
              tocRef.current = toc
              if (readerRef.current) {
                readerRef.current.tocChanged = toc
              }
            }}
            epubInitOptions={{
              openAs: 'epub'
            }}
            getBook={(bookInstance) => {
              setBook(bookInstance)
              bookInstance.locations.generate(1024).then(() => {
                if (location) {
                  updatePageInfo(location)
                }
              })
            }}
            location={location}
            epubOptions={{
              flow: 'paginated',
              width: '100%',
              height: '100%',
              spread: 'always'
            }}
            styles={ownStyles}
            ref={readerRef}
          />
        </div>
      );
    } else if (viewerType === 'pdf') {
      return (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.2.146/build/pdf.worker.min.js`}>
            <Viewer
              fileUrl="/short_pants.pdf"  // 로컬 서버에 위치한 PDF 파일 경로 설정
            />
          </Worker>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 왼쪽: 문서 뷰어 */}
      <div style={{ flex: '0 0 50%', position: 'relative', height: '100%', overflow: 'hidden' }}>
        {/* 뷰어 선택 버튼 */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
          {/* {<button onClick={() => setViewerType('epub')} style={{ marginRight: '10px' }}>EPUB 보기</button>} */}
          {/* <button onClick={() => setViewerType('pdf')}>PDF 보기</button> */}
        </div>
        {renderViewer()}
      </div>

      {/* WebRTC */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
        <VideoChat />
      </div>

      {/* 오른쪽: Knowledge Graph */}
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <NetworkChart data={data} />
      </div>

      {/* 챗봇 */}
      {isOpen && (
        <>
          <Chatbot
              key={forceUpdate}
              config={setting}
              actionProvider={ActionProvider}
              messageParser={MessageParser}
              messageHistory={messages}
          />
        {/* 마이크 버튼 */}
          <button className="mic" onClick={mic}>
            <img src="image/VoiceIcon.png" alt="mic Icon" style={{ width: '20px', height: '20px' }} />
          </button>
        </>
      )}

      {/* 챗봇 버튼 */}
      <button className="chatbot-button" onClick={toggleChatbot}>
        <img src="image/network.png" alt="Chatbot Icon" style={{ width: '30px', height: '30px' }} />
      </button>
      
      
    </div>
  )
}

export default App