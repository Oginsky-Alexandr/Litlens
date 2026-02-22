import React from "react";

function BookConfirmation({ data }) {
  if (!data) return null;

  const { title, author, meta, welcomeText } = data;

  return (
    <section>
      
      {/* Context label */}
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
        BOOK RECOGNIZED
      </div>

      {/* Book identity */}
      <h1 style={{ marginBottom: 4 }}>
        {title}
      </h1>

      <h2 style={{ marginTop: 0, fontWeight: "normal", opacity: 0.8 }}>
        {author}
      </h2>

      {/* Meta line */}
      {meta && (
        <div style={{ margin: "12px 0", fontSize: 14, opacity: 0.7 }}>
          {meta}
        </div>
      )}

      {/* Welcome text */}
      <p style={{ marginTop: 20, lineHeight: 1.6 }}>
        {welcomeText}
      </p>

      {/* Transition hint */}
      <p style={{ marginTop: 24, fontSize: 14, opacity: 0.7 }}>
        Мы будем рядом, когда текст станет сложным.
      </p>

    </section>
  );
}

export default BookConfirmation;
