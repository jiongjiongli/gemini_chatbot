import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { GoogleGenerativeAI } from "@google/generative-ai"
import './App.css'

function App() {
  const defaultButtonStyle = {
      position: 'absolute',
      top: '50%',
      right: '10px',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: '1px solid #007bff',
      padding: '5px 10px',
      borderRadius: '3px',
      color: '#007bff',
      outline: 'none',
      cursor: 'pointer',
      opacity: 0,
      pointerEvents: 'none',
      transition: '0.3s all ease'
  };

  const [msg, setMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [isKeyUpEnabled, setIsKeyUpEnabled] = useState(true);
  const [password, setPassword] = useState('');

  const handlePasswordChange = (event) => {
      setPassword(event.target.value);
  };
  const endHistoryRef = useRef(null);
  const genAIRef = useRef(null);
  const maxLength = 100;

  const apiKeyIssues = ["Method doesn't allow unregistered callers",
    "API key not valid"];

  const updateButtonStyle = (isEnabled, isHover) => {
    const buttonStyle = isEnabled
        ? (isHover
           ? {
            ...defaultButtonStyle,
            opacity: 1,
            pointerEvents: 'auto',
            background: '#007bff',
            color: 'white',
          } : {
            ...defaultButtonStyle,
            opacity: 1,
            pointerEvents: 'auto',
          })
        : {
            ...defaultButtonStyle,
          };

    return buttonStyle;
  };

  const handleMsgText = text => {
    setMsg(text);
    const isTextNonWhitespace = text.trim().length > 0;
    // console.log('text:' + text);
    // console.log('isTextNonWhitespace:' + isTextNonWhitespace);
    setButtonEnabled(isTextNonWhitespace);
  };

  const handleChange = event => {
    handleMsgText(event.target.value);
  };

  const handleMsg = event => {
    // console.log('handleMsg...');
    setButtonEnabled(false);

    async function run() {
      const userChat = (
        <div className="UserRound">
          <div className="item right">
              <div className="msg">
                  <p>{msg.trim()}</p>
              </div>
          </div>
          <br clear="both" />
        </div>);

      const userChatHistory = [...chatHistory, userChat];
      setChatHistory(userChatHistory);
      handleMsgText('');

      let robotMsg = "";

      if (!genAIRef.current){
            const genAI = new GoogleGenerativeAI(password);
            // For text-only input, use the gemini-pro model
            const model = genAI.getGenerativeModel({ model: "gemini-pro"});

            const chat = model.startChat({
              generationConfig: {
                maxOutputTokens: 100,
              },
            });

            genAIRef.current = {genAI, model, chat};
      }


      try {
        const result = await genAIRef.current?.chat.sendMessage(msg);
        const response = await result.response;
        robotMsg = response.text();
      } catch (error) {
        // console.error("Error occured! " + error); // You might send an exception to your error tracker like AppSignal
        // console.error("error.name: " + error.name);
        // console.error("error.message: " + error.message);

        for (let apiKeyIssue of apiKeyIssues) {
          if (error.message.includes(apiKeyIssue)) {
            robotMsg = error.message;
            genAIRef.current = null;
            break;
          }
        }

        if (robotMsg.trim() === '') {
          robotMsg = "Internal server error. Please ask another question.";
        }

      }

      if (robotMsg.trim() === '') {
        robotMsg = "Empty response. Please ask another question.";
      }

      const robotChat = (
        <div className="robotRound">
          <div className="item">
              <div className="icon">
                <i className="fa fa-user">G</i>
              </div>
              <div className="msg">
                  <p>{robotMsg}</p>
              </div>
          </div>
          <br clear="both" />
        </div>);

      const robotChatHistory = [...userChatHistory, robotChat];
      setChatHistory(robotChatHistory);
    }

    run();
  };

  const handleKeyUp = event => {
    if (!isKeyUpEnabled) {
      return;
    }

    setIsKeyUpEnabled(false);

    // if (event.key === 'Enter' && event.ctrlKey && msg.trim() !== '') {
    if (event.key === 'Enter' && msg.trim() !== '') {
      handleMsg(event);
    }

    setIsKeyUpEnabled(true);
  };

  const handleClearHistory = event => {
    setChatHistory([]);
  };

  const handleMouseEnter = event => {
    setButtonHover(true);
  };

  const handleMouseLeave = event => {
    setButtonHover(false);
  };

  // Scroll to the end of the divs every time a new div is added
  useEffect(() => {
      endHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="wrapper">
      <div>
      <div className="title">Gemni Chatbot</div>
        <label htmlFor="password" className="password">Gemni API Key: </label>
        <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
        />
      </div>
      <div className="box">
        {chatHistory.map((roundChat, index) => <div key={index}>{roundChat}</div>) }
        {/* Hidden div for scrolling purpose */}
        <div ref={endHistoryRef} />
      </div>

      <div className="typing-area">
          <div className="input-field">
              <textarea type="text"
                id="userMsg"
                maxLength={`${maxLength}`}
                placeholder={`Type your message (max ${maxLength} characters) and press "ENTER" keys or "Send" button to send message.`}
                required
                value={msg}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
              />
              <button onClick={handleMsg}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={updateButtonStyle(buttonEnabled, buttonHover)}
                > Send </button>
          </div>
      </div>
      <button onClick={handleClearHistory} className="clearButton" > Clear History </button>
    </div>);
}

export default App;
