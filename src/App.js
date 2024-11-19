import React, { useState, useRef, useEffect } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { FaBookmark, FaTrash, FaPalette } from 'react-icons/fa';
import Chatbot from "react-chatbot-kit";
import setting from "./components/chatbot/setting.js";
import MessageParser from "./components/chatbot/MessageParser.js";
import ActionProvider from "./components/chatbot/ActionProvider.js";
import { Worker, Viewer } from '@react-pdf-viewer/core';  // PDF 뷰어 임포트
import '@react-pdf-viewer/core/lib/styles/index.css';     // PDF 뷰어 스타일 임포트
import "react-chatbot-kit/build/main.css";
import "./styles/chatbot.css";
import "remixicon/fonts/remixicon.css";
import NetworkChart from './NetworkChart.js';
import data from './json/graphml_data.json';


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
  const [viewerType/*, setViewerType*/] = useState('epub');  // 뷰어 타입 상태 추가

  const toggleChatbot = () => {
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
            url="https://react-reader.metabits.no/files/alice.epub"  // 여기에 미리 지정한 EPUB 파일 경로
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
      <div style={{ flex: '0 0 100%', position: 'relative', height: '100%' }}>
        <NetworkChart data={data} />
      </div>

      {/* 챗봇 */}
      {isOpen && (
        <Chatbot
          config={setting}
          actionProvider={ActionProvider}
          messageParser={MessageParser}
        />
      )}

      {/* 챗봇 버튼 */}
      <button className="chatbot-button" onClick={toggleChatbot}>
        <img src="image/network.png" alt="Chatbot Icon" style={{ width: '30px', height: '30px' }} />
      </button>
      
      
    </div>
  )
}

export default App