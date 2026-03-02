import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const CONTEXT_TITLES = {
  historical: "Historical Context",
  cultural: "Cultural Context",
  characters: "Main Characters",
  references: "References",
  quotes: "Key Quotes",
  lesson: "Key Lesson",
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

function App() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); 
  // idle | loading | confirmed | journey
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pinnedBook, setPinnedBook] = useState(null);
  const [contextData, setContextData] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [chatThreads, setChatThreads] = useState({});
  const [activeChatThreadId, setActiveChatThreadId] = useState(null);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const mainRef = useRef(null);
  const nextCtxId = useRef(1);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.scrollTop = 0;
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2 != null) cancelAnimationFrame(raf2);
    };
  }, [contextData]);

  const startAnalysis = async () => {
    if (!input || status === "loading") return;

    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const serverMessage =
          data?.error?.message ||
          (response.status >= 500
            ? "Server error while analyzing the book. Please try again."
            : "Request failed. Please check your input and try again.");

        setError(serverMessage);
        setStatus("idle");
        return;
      }

      if (data?.ok) {
        setResult(data);
        setStatus("confirmed");
      } else {
        setError(
          data?.error?.message ||
            "Could not analyze the book. Please adjust your description and try again."
        );
        setStatus("idle");
      }
    } catch (e) {
      console.error(e);
      setError("Network error while contacting SageRead. Please try again.");
      setStatus("idle");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      startAnalysis();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setError(null);

    // reset confirmation when user edits input
    if (status === "confirmed") {
      setStatus("idle");
      setResult(null);
    }
  };

  const resetSession = () => {
    setPinnedBook(null);
    setInput("");
    setStatus("idle");
    setResult(null);
    setChatThreads({});
    setActiveChatThreadId(null);
    setChatStreaming(false);
    setStreamingContent("");
  };

  const confirmAndContinue = () => {
    if (result?.book?.recognized) {
      setPinnedBook({
        title: result.book.title,
        author: result.book.author,
        meta: result.book.meta,
        language: result.book.language,
        contexts: [],
      });
      setStatus("journey");
      setInput("");
    }
  };

  const fetchContext = async (type) => {
    if (!pinnedBook || contextLoading) return;

    setContextLoading(true);
    setContextData(null);

    try {
      const response = await fetch(`${API_BASE}/api/context/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: pinnedBook.title,
          author: pinnedBook.author,
          meta: pinnedBook.meta,
          language: pinnedBook.language,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setContextData(data.context);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setContextLoading(false);
    }
  };

  const confirmContext = () => {
    if (contextData && pinnedBook) {
      const id = `ctx-${nextCtxId.current++}`;
      setPinnedBook({
        ...pinnedBook,
        contexts: [
          ...pinnedBook.contexts,
          {
            id,
            type: contextData.type,
            title: CONTEXT_TITLES[contextData.type] || contextData.type,
            content: contextData.content,
          },
        ],
      });
      setContextData(null);
    }
  };

  const openChat = (contextId) => {
    if (!chatThreads[contextId]) {
      const ctx = pinnedBook.contexts.find((c) => c.id === contextId);
      const initialMessages = ctx
        ? [{ id: `m-${Date.now()}`, role: "assistant", content: ctx.content, fromContext: true }]
        : [];
      setChatThreads((prev) => ({ ...prev, [contextId]: { messages: initialMessages } }));
    }
    setActiveChatThreadId(contextId);
    setContextData(null);
  };

  const openGeneralChat = () => {
    if (!chatThreads["general"]) {
      setChatThreads((prev) => ({
        ...prev,
        general: { boundToContextId: null, messages: [] },
      }));
    }
    setActiveChatThreadId("general");
    setContextData(null);
  };

  const closeChat = () => {
    setActiveChatThreadId(null);
  };

  const handleFetchContext = (type) => {
    setActiveChatThreadId(null);
    fetchContext(type);
  };

  const markMessageSaved = (threadId, messageId) => {
    setChatThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        messages: prev[threadId].messages.map((m) =>
          m.id === messageId ? { ...m, saved: true } : m
        ),
      },
    }));
  };

  const saveToContext = async (messageId) => {
    const threadId = activeChatThreadId;
    const thread = chatThreads[threadId];
    if (!thread || !pinnedBook) return;

    const message = thread.messages.find((m) => m.id === messageId);
    if (!message || message.role !== "assistant") return;

    if (threadId !== "general") {
      setPinnedBook((prev) => ({
        ...prev,
        contexts: prev.contexts.map((ctx) =>
          ctx.id === threadId
            ? { ...ctx, content: ctx.content + "\n\n---\n\n" + message.content }
            : ctx
        ),
      }));
      markMessageSaved(threadId, messageId);
    } else {
      const generalThread = chatThreads["general"];
      if (generalThread.boundToContextId) {
        const boundId = generalThread.boundToContextId;
        setPinnedBook((prev) => ({
          ...prev,
          contexts: prev.contexts.map((ctx) =>
            ctx.id === boundId
              ? { ...ctx, content: ctx.content + "\n\n---\n\n" + message.content }
              : ctx
          ),
        }));
        markMessageSaved(threadId, messageId);
      } else {
        try {
          const titleRes = await fetch(`${API_BASE}/api/chat/title`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message.content, language: pinnedBook.language }),
          });
          const titleData = await titleRes.json();
          const title = titleData.ok ? titleData.title : "Chat Discussion";

          const newCtxId = `ctx-${nextCtxId.current++}`;
          setPinnedBook((prev) => ({
            ...prev,
            contexts: [
              ...prev.contexts,
              { id: newCtxId, type: "chat", title, content: message.content },
            ],
          }));

          setChatThreads((prev) => ({
            ...prev,
            general: {
              ...prev.general,
              boundToContextId: newCtxId,
              messages: prev.general.messages.map((m) =>
                m.id === messageId ? { ...m, saved: true } : m
              ),
            },
          }));
        } catch (e) {
          console.error("Title generation error:", e);
        }
      }
    }
  };

  const sendChatMessage = async (text) => {
    if (!text.trim() || chatStreaming || !pinnedBook) return;

    const threadId = activeChatThreadId;
    const currentThread = chatThreads[threadId] || { messages: [] };
    const userMsg = { id: `m-${Date.now()}`, role: "user", content: text.trim() };
    const updatedMessages = [...currentThread.messages, userMsg];

    setChatThreads((prev) => ({
      ...prev,
      [threadId]: { ...prev[threadId], messages: updatedMessages },
    }));

    setChatStreaming(true);
    setStreamingContent("");

    const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

    let contextContent = null;
    if (threadId !== "general") {
      const ctx = pinnedBook.contexts.find((c) => c.id === threadId);
      if (ctx) contextContent = ctx.content;
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pinnedBook.title,
          author: pinnedBook.author,
          meta: pinnedBook.meta,
          language: pinnedBook.language,
          contextContent,
          messages: apiMessages,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                fullContent += parsed.token;
                setStreamingContent(fullContent);
              }
            } catch {}
          }
        }
      }

      const aiMsg = { id: `m-${Date.now() + 1}`, role: "assistant", content: fullContent };
      setChatThreads((prev) => ({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          messages: [...prev[threadId].messages, aiMsg],
        },
      }));
    } catch (e) {
      console.error("Chat stream error:", e);
    } finally {
      setChatStreaming(false);
      setStreamingContent("");
    }
  };

  return (
    <>
      {/* Top header */}
      <header className="app-header">
        <div className="app-header-left">
          <strong>SageRead</strong>
          <span className="powered-by">POWERED BY DEEPSEEK</span>
        </div>

        <div className="app-header-right">
          <div className="prompt-bar">
            <button
              className="prompt-button"
              onClick={() => handleFetchContext("historical")}
              disabled={status !== "journey" || !pinnedBook || contextLoading}
            >
              <div className="prompt-icon">🕐</div>
              <span>Historical Context</span>
            </button>

            <button
              className="prompt-button"
              onClick={() => handleFetchContext("cultural")}
              disabled={status !== "journey" || !pinnedBook || contextLoading}
            >
              <div className="prompt-icon">🛡️</div>
              <span>Cultural Context</span>
            </button>

            <button
              className="prompt-button"
              onClick={() => handleFetchContext("characters")}
              disabled={status !== "journey" || !pinnedBook || contextLoading}
            >
              <div className="prompt-icon">👥</div>
              <span>Main Characters</span>
            </button>

            <button
              className="prompt-button"
              onClick={() => handleFetchContext("references")}
              disabled={status !== "journey" || !pinnedBook || contextLoading}
            >
              <div className="prompt-icon">🔗</div>
              <span>References</span>
            </button>

            <button
              className="prompt-button"
              onClick={() => handleFetchContext("quotes")}
              disabled={status !== "journey" || !pinnedBook || contextLoading}
            >
              <div className="prompt-icon">💬</div>
              <span>Key Quotes</span>
            </button>

            <button
              className="prompt-button"
              onClick={() => handleFetchContext("lesson")}
              disabled={status !== "journey" || !pinnedBook || contextLoading}
            >
              <div className="prompt-icon">💡</div>
              <span>Key Lesson</span>
            </button>

            <button
              className={`prompt-button ${
                activeChatThreadId === "general" ? "prompt-button--active" : ""
              }`}
              onClick={openGeneralChat}
              disabled={status !== "journey" || !pinnedBook}
            >
              <div className="prompt-icon">💭</div>
              <span>Chat</span>
            </button>
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* Left panel - Library Context */}
        <aside className="library-panel">
        <h3 className="library-title">LIBRARY CONTEXT</h3>
        
        {pinnedBook ? (
          <div className="pinned-book">
            <h4>{pinnedBook.title}</h4>
            <p className="author">{pinnedBook.author}</p>
            <p className="meta">{pinnedBook.meta}</p>
            
            {pinnedBook.contexts?.map((ctx) => (
              <div
                className={`pinned-context pinned-context--clickable ${activeChatThreadId === ctx.id ? "pinned-context--active" : ""}`}
                key={ctx.id}
                onClick={() => openChat(ctx.id)}
              >
                <p className="context-type-label">
                  {ctx.type === "chat" ? "💬 " : "● "}{ctx.title}
                </p>
                <div className="context-text">
                  <ReactMarkdown>{ctx.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            
            <button className="reset-button" onClick={resetSession}>
              × RESET SESSION
            </button>
          </div>
        ) : (
          <p className="library-placeholder">
            Confirmed book details will appear here.
          </p>
        )}
      </aside>

      {/* Right side - Main content */}
      <div className="right-container">
      {/* Main content - align top in journey to avoid cumulative shift */}
      <main
        className={`main ${status === "journey" && pinnedBook ? "main--journey" : ""}`}
        ref={mainRef}
      >
        <div className="card">
          {!pinnedBook ? (
            <>
              <h2>Which book are you reading?</h2>

              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="1984 - George Orwell"
              />

              <button
                onClick={startAnalysis}
                disabled={!input || status === "loading"}
              >
                Start Analysis
              </button>
            </>
          ) : null}

          <div className="card-content">
            {error && <div className="error-banner">{error}</div>}
            {status === "idle" && <Guidance />}

            {status === "loading" && (
              <p className="loading">
                Preparing your reading journey...
              </p>
            )}

            {status === "confirmed" && result && (
              <Confirmation data={result} onConfirm={confirmAndContinue} />
            )}

            {status === "journey" && pinnedBook && !activeChatThreadId && (
              <Journey 
                book={pinnedBook} 
                onFetchContext={handleFetchContext}
                onConfirmContext={confirmContext}
                contextData={contextData}
                contextLoading={contextLoading}
              />
            )}

            {status === "journey" && pinnedBook && activeChatThreadId && (
              <Chat
                thread={chatThreads[activeChatThreadId]}
                streamingContent={streamingContent}
                chatStreaming={chatStreaming}
                onSendMessage={sendChatMessage}
                onSaveToContext={saveToContext}
                onClose={closeChat}
              />
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
    </>
  );
}

export default App;

/* ---------------- Subcomponents ---------------- */

function Guidance() {
  return (
    <>
      <p className="section-title">Examples:</p>
      <ul className="examples">
        <li>"To Kill a Mockingbird by Harper Lee"</li>
        <li>"1984 - George Orwell"</li>
      </ul>

      <p className="hint">
        Enter the book in any format, we'll figure it out!
        <br />
        <strong>Tip:</strong> Including both title and author helps ensure accurate
        analysis.
      </p>
    </>
  );
}

function Confirmation({ data, onConfirm }) {
  const { book, welcome } = data;

  if (!book || !book.recognized) {
    return (
      <div className="confirmation">
        <p className="label">BOOK NOT RECOGNIZED</p>
        {welcome?.text && <p className="welcome">{welcome.text}</p>}
      </div>
    );
  }

  return (
    <div className="confirmation">
      <p className="label">IDENTITY VERIFIED</p>

      <h3>{book.title}</h3>
      <p className="author">{book.author}</p>
      <p className="meta">{book.meta}</p>

      <p className="welcome">{welcome.text}</p>

      <button className="confirm-button" onClick={onConfirm}>
        Confirm & Continue →
      </button>

      <p className="hint-unlock">CLICK TO UNLOCK CONTEXTUAL INSIGHTS</p>
    </div>
  );
}

function Journey({ book, onFetchContext, onConfirmContext, contextData, contextLoading }) {
  const scrollableRef = useRef(null);

  useEffect(() => {
    if (!contextData || !scrollableRef.current) return;
    const el = scrollableRef.current;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = 0;
    });
    return () => cancelAnimationFrame(raf);
  }, [contextData]);

  // Show loading state
  if (contextLoading) {
    return (
      <div className="journey">
        <p className="loading">Loading context...</p>
      </div>
    );
  }

  // If context is loaded, show it with confirm button
  if (contextData) {
    return (
      <div className="journey">
        <div className="context-result">
          <div className="context-header">
            <p className="context-label">
              {(CONTEXT_TITLES[contextData.type] || contextData.type).toUpperCase()}
            </p>
          </div>
          <div className="context-scrollable" ref={scrollableRef}>
            <div className="context-content">
              <ReactMarkdown>{contextData.content}</ReactMarkdown>
            </div>
          </div>
          <div className="context-footer">
            <button className="confirm-button" onClick={onConfirmContext}>
              Confirm & Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state - show instruction
  return (
    <div className="journey">
      <h2 className="journey-title">Continue journey</h2>
      <p className="journey-description">
        Select an analysis type from the options above to explore "{book.title}".
      </p>
    </div>
  );
}

function Chat({ thread, streamingContent, chatStreaming, onSendMessage, onSaveToContext, onClose }) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const messages = thread?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  const handleSend = () => {
    if (!inputValue.trim() || chatStreaming) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="chat-back-button" onClick={onClose}>
          ← Back to Journey
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            <p className="chat-message-role">
              {msg.role === "assistant" ? "SageRead" : "You"}
            </p>
            <div className="chat-message-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {msg.role === "assistant" && !msg.fromContext && (
              <div className="chat-message-actions">
                {msg.saved ? (
                  <span className="chat-saved-label">Saved</span>
                ) : (
                  <button
                    className="chat-save-button"
                    onClick={() => onSaveToContext(msg.id)}
                    disabled={chatStreaming}
                  >
                    Save to context
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {chatStreaming && streamingContent && (
          <div className="chat-message chat-message--assistant chat-message--streaming">
            <p className="chat-message-role">SageRead</p>
            <div className="chat-message-content">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
              <span className="streaming-cursor" />
            </div>
          </div>
        )}

        {chatStreaming && !streamingContent && (
          <div className="chat-message chat-message--assistant">
            <p className="chat-message-role">SageRead</p>
            <div className="chat-message-content">
              <span className="loading">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={chatStreaming}
          rows={1}
        />
        <button
          className="chat-send-button"
          onClick={handleSend}
          disabled={chatStreaming || !inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

