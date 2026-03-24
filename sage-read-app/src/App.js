import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import bookAltIcon from "./assets/book-alt.png";

const CONTEXT_TITLES = {
  historical: "Historical Context",
  cultural: "Cultural Context",
  characters: "Main Characters",
  references: "References",
  quotes: "Key Quotes",
  lesson: "Key Lesson",
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

function clampTitleWords(title, maxWords = 3) {
  if (!title || typeof title !== "string") return "";
  const words = title.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return words.slice(0, maxWords).join(" ");
}

function App() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [pinnedBook, setPinnedBook] = useState(null);
  const [bookRecognitionMessages, setBookRecognitionMessages] = useState([]);
  const [bookRecognitionLoading, setBookRecognitionLoading] = useState(false);
  const [lastRecognizedResult, setLastRecognizedResult] = useState(null);
  const [contextData, setContextData] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [chatThreads, setChatThreads] = useState({});
  const [activeChatThreadId, setActiveChatThreadId] = useState(null);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const mainRef = useRef(null);
  const nextCtxId = useRef(1);
  const nextBookMsgId = useRef(1);

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

  /* When opening a chat thread, scroll main to top so message history is visible (not below the fold). */
  useEffect(() => {
    if (!activeChatThreadId) return;
    const el = mainRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = 0;
    });
    return () => cancelAnimationFrame(raf);
  }, [activeChatThreadId]);

  useEffect(() => {
    const bookTitle =
      pinnedBook?.title ||
      (lastRecognizedResult?.book?.recognized && lastRecognizedResult?.book?.title
        ? lastRecognizedResult.book.title
        : null);
    document.title = bookTitle ? `${bookTitle} — LitLense` : "LitLense";
  }, [pinnedBook?.title, lastRecognizedResult?.book?.recognized, lastRecognizedResult?.book?.title]);

  const sendBookQuery = async () => {
    const text = input.trim();
    if (!text || bookRecognitionLoading) return;

    const userMsg = {
      id: `bm-${nextBookMsgId.current++}`,
      role: "user",
      content: text,
    };
    setBookRecognitionMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBookRecognitionLoading(true);
    setLastRecognizedResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const assistantContent =
        !response.ok
          ? (data?.error?.message ||
            (response.status >= 500
              ? "Server error while analyzing the book. Please try again."
              : "Request failed. Please check your input and try again."))
          : data?.ok
            ? (data.welcome?.text || "Done.")
            : (data?.error?.message ||
              "Could not analyze the book. Please adjust your description and try again.");

      const assistantMsg = {
        id: `bm-${nextBookMsgId.current++}`,
        role: "assistant",
        content: assistantContent,
        result: response.ok && data ? data : undefined,
      };

      setBookRecognitionMessages((prev) => [...prev, assistantMsg]);
      if (response.ok && data?.book?.recognized) {
        setLastRecognizedResult(data);
      } else {
        setLastRecognizedResult(null);
      }
    } catch (e) {
      console.error(e);
      setBookRecognitionMessages((prev) => [
        ...prev,
        {
          id: `bm-${nextBookMsgId.current++}`,
          role: "assistant",
          content: "Network error while contacting LitLense. Please try again.",
        },
      ]);
      setLastRecognizedResult(null);
    } finally {
      setBookRecognitionLoading(false);
    }
  };

  const handleBookInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBookQuery();
    }
  };

  const resetSession = () => {
    setPinnedBook(null);
    setInput("");
    setStatus("idle");
    setBookRecognitionMessages([]);
    setBookRecognitionLoading(false);
    setLastRecognizedResult(null);
    setChatThreads({});
    setActiveChatThreadId(null);
    setChatStreaming(false);
    setStreamingContent("");
    setIsLibraryOpen(false);
  };

  const confirmAndContinue = () => {
    if (!lastRecognizedResult?.book?.recognized) return;
    const { book } = lastRecognizedResult;
    setPinnedBook({
      title: book.title,
      author: book.author,
      meta: book.meta,
      language: book.language,
      contexts: [],
    });
    setStatus("journey");
    setInput("");
    setLastRecognizedResult(null);
    setBookRecognitionMessages([]);
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

  const confirmContext = async () => {
    if (!contextData || !pinnedBook) return;

    const id = `ctx-${nextCtxId.current++}`;
    const language = pinnedBook.language;

    const newContext = {
      id,
      type: contextData.type,
      title: CONTEXT_TITLES[contextData.type] || contextData.type,
      content: contextData.content,
    };

    setPinnedBook((prev) => ({
      ...prev,
      contexts: [...prev.contexts, newContext],
    }));
    setContextData(null);

    try {
      const response = await fetch(`${API_BASE}/api/chat/title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contextData.content,
          language,
        }),
      });

      const data = await response.json();
      if (data?.ok && data.title) {
        const shortTitle = clampTitleWords(data.title, 3);
        if (shortTitle) {
          setPinnedBook((prev) => ({
            ...prev,
            contexts: prev.contexts.map((ctx) =>
              ctx.id === id ? { ...ctx, title: shortTitle } : ctx
            ),
          }));
        }
      }
    } catch (e) {
      console.error("Context title generation error:", e);
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
    setIsLibraryOpen(false);
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

  const addSectionToContext = async (contextId, text) => {
    if (!text || !pinnedBook?.language) return;

    try {
      const res = await fetch(`${API_BASE}/api/chat/title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          language: pinnedBook.language,
        }),
      });
      const data = await res.json();
      if (!data?.ok || !data.title) return;

      const shortTitle = clampTitleWords(data.title, 3);
      if (!shortTitle) return;

      setPinnedBook((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          contexts: prev.contexts.map((ctx) => {
            if (ctx.id !== contextId) return ctx;
            const existingSections = Array.isArray(ctx.sections)
              ? ctx.sections
              : [];
            const newSection = {
              id: `sec-${Date.now()}-${existingSections.length + 1}`,
              title: shortTitle,
            };
            return {
              ...ctx,
              sections: [...existingSections, newSection],
            };
          }),
        };
      });
    } catch (e) {
      console.error("Section title generation error:", e);
    }
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
      addSectionToContext(threadId, message.content);
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
        addSectionToContext(boundId, message.content);
      } else {
        try {
          const titleRes = await fetch(`${API_BASE}/api/chat/title`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message.content, language: pinnedBook.language }),
          });
          const titleData = await titleRes.json();
          const rawTitle = titleData.ok ? titleData.title : "Chat Discussion";
          const title = clampTitleWords(rawTitle, 3) || "Chat Discussion";

          const newCtxId = `ctx-${nextCtxId.current++}`;
          setPinnedBook((prev) => ({
            ...prev,
            contexts: [
              ...prev.contexts,
              {
                id: newCtxId,
                type: "chat",
                title,
                content: message.content,
                sections: [
                  { id: `sec-1-${newCtxId}`, title },
                ],
              },
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

  const sendChatMessage = async (text, threadIdOverride) => {
    if (!text.trim() || chatStreaming || !pinnedBook) return;

    const threadId = threadIdOverride ?? activeChatThreadId;
    if (!threadId) return;

    if (threadIdOverride) setActiveChatThreadId(threadId);

    const userMsg = { id: `m-${Date.now()}`, role: "user", content: text.trim() };
    const currentThread = chatThreads[threadId] || { boundToContextId: null, messages: [] };
    const updatedMessages = [...currentThread.messages, userMsg];

    setChatThreads((prev) => ({
      ...prev,
      [threadId]: { ...(prev[threadId] || { boundToContextId: null }), messages: updatedMessages },
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
        <div className="app-header-left-zone">
          <button
            type="button"
            className="library-toggle-button"
            onClick={() => setIsLibraryOpen(true)}
            disabled={!pinnedBook}
            aria-label="Open library context"
          >
            <span
              className="library-icon"
              role="img"
              aria-hidden
              style={{
                maskImage: `url(${bookAltIcon})`,
                WebkitMaskImage: `url(${bookAltIcon})`,
              }}
            />
          </button>
        </div>
        <div className="app-header-logo">
          <strong>LitLense</strong>
          <span className="powered-by">POWERED BY DEEPSEEK</span>
        </div>
        <div className="app-header-right">
          <div className="prompt-bar prompt-bar--header">
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
          <LibraryPanelContent
            pinnedBook={pinnedBook}
            activeChatThreadId={activeChatThreadId}
            openChat={openChat}
            resetSession={resetSession}
          />
      </aside>

      {/* Right side - Main content */}
      <div className="right-container">
      {/* Main content - align top in journey to avoid cumulative shift */}
      <main
        className={`main ${status === "journey" && pinnedBook ? "main--journey" : ""}`}
        ref={mainRef}
      >
        <div className={`card ${!pinnedBook ? "card--book-recognition" : ""}`}>
          {!pinnedBook ? (
            <BookRecognitionThread
              messages={bookRecognitionMessages}
              loading={bookRecognitionLoading}
              input={input}
              onInputChange={setInput}
              onSend={sendBookQuery}
              lastRecognizedResult={lastRecognizedResult}
              onConfirm={confirmAndContinue}
            />
          ) : (
          <div className="card-content">
            {status === "journey" && pinnedBook && !activeChatThreadId && (
              <>
                <ContextPillRow
                  onFetchContext={handleFetchContext}
                  openGeneralChat={openGeneralChat}
                  contextLoading={contextLoading}
                  activeChatThreadId={activeChatThreadId}
                />
                <Journey 
                  book={pinnedBook} 
                  onFetchContext={handleFetchContext}
                  onConfirmContext={confirmContext}
                  contextData={contextData}
                  contextLoading={contextLoading}
                />
                <JourneyChatInput
                  onSend={(msg) => sendChatMessage(msg, "general")}
                  chatStreaming={chatStreaming}
                />
              </>
            )}

            {status === "journey" && pinnedBook && activeChatThreadId && (
              <Chat
                thread={chatThreads[activeChatThreadId]}
                streamingContent={streamingContent}
                chatStreaming={chatStreaming}
                onSendMessage={sendChatMessage}
                onSaveToContext={saveToContext}
                onClose={closeChat}
                contextButtonsSlot={
                  <ContextPillRow
                    onFetchContext={handleFetchContext}
                    openGeneralChat={openGeneralChat}
                    contextLoading={contextLoading}
                    activeChatThreadId={activeChatThreadId}
                  />
                }
              />
            )}
          </div>
          )}
        </div>
      </main>
      </div>
    </div>

      {isLibraryOpen && (
        <LibraryDrawer
          pinnedBook={pinnedBook}
          activeChatThreadId={activeChatThreadId}
          openChat={openChat}
          resetSession={resetSession}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}
    </>
  );
}

export default App;

/* ---------------- Subcomponents ---------------- */

function LibraryPanelContent({ pinnedBook, activeChatThreadId, openChat, resetSession, hideTitle }) {
  return (
    <>
      {!hideTitle && <h3 className="library-title">LIBRARY CONTEXT</h3>}

      {pinnedBook ? (
        <div className="pinned-book">
          <h4>{pinnedBook.title}</h4>
          <p className="author">{pinnedBook.author}</p>
          <p className="meta">{pinnedBook.meta}</p>

          {pinnedBook.contexts?.map((ctx) => (
            <div
              className={`pinned-context pinned-context--clickable ${
                activeChatThreadId === ctx.id ? "pinned-context--active" : ""
              }`}
              key={ctx.id}
              onClick={() => openChat(ctx.id)}
            >
              <p className="context-type-label">
                {ctx.type === "chat" ? "💬 " : "● "}
                {(CONTEXT_TITLES[ctx.type] || ctx.type).toUpperCase()}
              </p>
              <p className="context-topic-title">{ctx.title}</p>
              {Array.isArray(ctx.sections) && ctx.sections.length > 0 && (
                <ul className="context-sections">
                  {ctx.sections.map((section) => (
                    <li key={section.id} className="context-section-item">
                      {section.title}
                    </li>
                  ))}
                </ul>
              )}
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
    </>
  );
}

function LibraryDrawer({
  pinnedBook,
  activeChatThreadId,
  openChat,
  resetSession,
  onClose,
}) {
  return (
    <div className="library-drawer-overlay" onClick={onClose}>
      <div
        className="library-drawer"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="library-drawer-header">
          <span className="library-drawer-title">Library context</span>
        </div>
        <div className="library-drawer-body">
          <LibraryPanelContent
            pinnedBook={pinnedBook}
            activeChatThreadId={activeChatThreadId}
            openChat={openChat}
            resetSession={resetSession}
            hideTitle
          />
        </div>
      </div>
    </div>
  );
}

function BookRecognitionThread({
  messages,
  loading,
  input,
  onInputChange,
  onSend,
  lastRecognizedResult,
  onConfirm,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="chat-header-title">Which book are you reading?</h2>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            <p className="chat-message-role">
              {msg.role === "assistant" ? "LitLense" : "You"}
            </p>
            <div className="chat-message-content">
              {msg.role === "assistant" && msg.result?.book?.recognized && (
                <p className="book-recognition-meta">
                  <strong>{msg.result.book.title}</strong>
                  {msg.result.book.author && ` — ${msg.result.book.author}`}
                </p>
              )}
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message chat-message--assistant">
            <p className="chat-message-role">LitLense</p>
            <div className="chat-message-content">
              <span className="loading">Preparing your reading journey...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {lastRecognizedResult?.book?.recognized && (
        <div className="book-confirm-bar">
          <button className="confirm-button book-confirm-button" onClick={onConfirm}>
            ← Put in Library context
          </button>
        </div>
      )}

      <div className="chat-input-bar">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="1984 - George Orwell"
          disabled={loading}
          rows={1}
        />
        <button
          className="chat-send-button"
          onClick={onSend}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function JourneyChatInput({ onSend, chatStreaming }) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim() || chatStreaming) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-bar journey-chat-input">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={chatStreaming}
        rows={1}
      />
      <button
        className="chat-send-button"
        onClick={handleSend}
        disabled={chatStreaming || !value.trim()}
      >
        Send
      </button>
    </div>
  );
}

function ContextPillRow({
  onFetchContext,
  openGeneralChat,
  contextLoading,
  activeChatThreadId,
}) {
  const disabled = contextLoading;
  return (
    <div className="context-pill-row" role="group" aria-label="Context actions">
      <button
        type="button"
        className="context-pill-button"
        onClick={() => onFetchContext("historical")}
        disabled={disabled}
      >
        <span className="context-pill-icon">🕐</span>
        <span>Historical</span>
      </button>
      <button
        type="button"
        className="context-pill-button"
        onClick={() => onFetchContext("cultural")}
        disabled={disabled}
      >
        <span className="context-pill-icon">🛡️</span>
        <span>Cultural</span>
      </button>
      <button
        type="button"
        className="context-pill-button"
        onClick={() => onFetchContext("characters")}
        disabled={disabled}
      >
        <span className="context-pill-icon">👥</span>
        <span>Characters</span>
      </button>
      <button
        type="button"
        className="context-pill-button"
        onClick={() => onFetchContext("references")}
        disabled={disabled}
      >
        <span className="context-pill-icon">🔗</span>
        <span>References</span>
      </button>
      <button
        type="button"
        className="context-pill-button"
        onClick={() => onFetchContext("quotes")}
        disabled={disabled}
      >
        <span className="context-pill-icon">💬</span>
        <span>Quotes</span>
      </button>
      <button
        type="button"
        className="context-pill-button"
        onClick={() => onFetchContext("lesson")}
        disabled={disabled}
      >
        <span className="context-pill-icon">💡</span>
        <span>Lesson</span>
      </button>
      <button
        type="button"
        className={`context-pill-button ${activeChatThreadId === "general" ? "context-pill-button--active" : ""}`}
        onClick={openGeneralChat}
      >
        <span className="context-pill-icon">💭</span>
        <span>Chat</span>
      </button>
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
              ← Put in Library context
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state - show instruction
  return (
    <div className="journey">
      <div className="journey-arrow" aria-hidden="true">↑</div>
      <h2 className="journey-title">Continue journey</h2>
      <p className="journey-description">
        Select an analysis type from the options above to explore "<strong>{book.title}</strong>"
        <br />
        OR
      </p>
    </div>
  );
}

function Chat({ thread, streamingContent, chatStreaming, onSendMessage, onSaveToContext, onClose, contextButtonsSlot }) {
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

      {contextButtonsSlot}

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            <p className="chat-message-role">
              {msg.role === "assistant" ? "LitLense" : "You"}
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
            <p className="chat-message-role">LitLense</p>
            <div className="chat-message-content">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
              <span className="streaming-cursor" />
            </div>
          </div>
        )}

        {chatStreaming && !streamingContent && (
          <div className="chat-message chat-message--assistant">
            <p className="chat-message-role">LitLense</p>
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

