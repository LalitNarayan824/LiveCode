import { useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from "react";

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("Javascript");
  const [code, setCode] = useState("// start code here");
  const [users , setUsers] = useState([]);
  const [typing , setTyping] = useState('');

  useEffect(()=>{
    socket.on("userJoined" , (users)=>{
      setUsers(users);
    })
    socket.on("codeUpdate" , (newCode)=>{
      setCode(newCode)
    })
    socket.on("userTyping", (user)=>{
      setTyping(`${user.slice(0 , 8)} is typing`);
      setTimeout(() => {
        setTyping('')
      }, 2000);
    })

    socket.on("languageUpdate", (newLanguage)=>{
      setLanguage(newLanguage)
    })

    return ()=>{
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    }
    
  }, [])

  useEffect(()=>{
    const handleBeforeUnload = ()=>{
      socket.emit("leaveRoom");
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return ()=>{
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

  }, []);

  console.log(users)


  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
      toast("Room Joined!")
    }
  };

  const leaveRoom = ()=>{
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId('');
    setUserName('');
    setCode('// start code here');
    setLanguage('javascript')
  }

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    socket.emit("codeChange" , {roomId  , code : newCode});
    socket.emit("typing" , {roomId , userName});
  };

  const handleLanguageChange = (e)=>{
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange" , {roomId, language:newLanguage});
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast("Room Id Copied!")
  };

  if (!joined) {
    return (
      <>
        <Toaster 
        position="top-center" 
        toastOptions={{
          // default options
          duration: 3000,
          style: {
            fontFamily: 'system-ui, sans-serif',
          },
        }}
      />
      
      
      <div className="join-container">
        <p>A platform to collaborate on code with friends in real time. Enjoy the coding experience!"</p>
        <div className="join-form">
          <h1> Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          <button onClick={joinRoom}> Join Room </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          // default options
          duration: 3000,
          style: {
            fontSize:"20",
            fontFamily: 'system-ui, sans-serif',
          },
        }}
      />
    
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2> Code Room : {roomId}</h2>
          <button onClick={copyRoomId}>Copy Room Id</button>
        </div>
        <h3>Users in Room</h3>
        <ul>
          {users.map((user , index)=>(
            <li key={index} >{user.slice( 0 , 8)}</li>
          ))}
        </ul>

        <p className="typing-indicator">{typing}</p>

        <select className="language-selector" value={language} onChange={handleLanguageChange}>
          <option value="javascript"> Javascript </option>
          <option value="python"> Python </option>
          <option value="java"> Java </option>
          <option value="cpp"> C++ </option>
        </select>

        <button onClick={leaveRoom} className="leave-room">Leave Room</button>
      </div>
      <div className="editor-wrapper">
        <Editor
        height="100%"
        language={language}
        value={code}
        onChange={handleCodeChange}
        theme="vs-dark"
        beforeMount={(monaco) => {
          // Optional: configure or register custom themes / fonts here
          monaco.editor.defineTheme("minimal-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#0e0e0e",
              "editor.foreground": "#e5e5e5",
              "editorLineNumber.foreground": "#5a5a5a",
              "editorCursor.foreground": "#ffffff",
            },
          });
        }}
        
        options={{
          
          fontSize: 14,
          fontFamily: "Fira Code, Menlo, Consolas, monospace",
          fontLigatures: true,
          wordWrap: "on", // soft wrap long lines
          wrappingIndent: "indent",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          renderWhitespace: "boundary",
          renderIndentGuides: true,
          showFoldingControls: "mouseover",
          cursorStyle: "line",
          cursorBlinking: "smooth",
          automaticLayout: true, // responds to container resize
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
          formatOnPaste: true,
          formatOnType: true,
          quickSuggestions: { other: true, comments: false, strings: true },
          parameterHints: { enabled: true },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          bracketPairColorization: { enabled: true },
          folding: true,
          overviewRulerBorder: false,
          contextmenu: true,
          
          
          // disable unnecessary distractions if wanted:
          hideCursorInOverviewRuler: false,
        }}
      />
      </div>
    </div>
    </>
  );
};

export default App;
