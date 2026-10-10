
import { useState, useEffect, useRef } from "react";
import "./App.css";

const API = "https://161.118.176.127:5000";

function App() {
  const [code, setCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [loading, setLoading] = useState(false);


const [saveVersion, setSaveVersion] = useState(0);

// Auto-save to the database 1 second after typing stops
useEffect(() => {
  if (!code || saveVersion === 0) return;

  let cancelled = false;

  const timeout = setTimeout(async () => {
    setMessage("Saving...");

    try {
      // const response = await fetch(
      //   `${API}/clipboards/${encodeURIComponent(code)}`,
      //   {
      //     method: "PUT",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ body: content }),
      //   }
      // );

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.message || "Failed to save");
      // }

      await saveClipboard();
      if (!cancelled) {
        setMessage("Auto-saved ✓");
      }
    } catch (error) {
      if (!cancelled) {
        console.error("Auto-save error:", error);
        setMessage("Auto-save failed");
      }
    }
  }, 1000);

  return () => {
    cancelled = true;
    clearTimeout(timeout);
  };
}, [code, content, saveVersion]);




  const inputRef = useRef(null);

  // Focus the code input on the entry screen
  useEffect(() => {
    if (!code) {
      inputRef.current?.focus();
    }
  }, [code]);

  // Create a new clipboard using the backend
  async function createClipboard() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/clipboards`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create clipboard");
      }

      setCode(data.code);
      setContent("");
      setInputCode("");
      setMessage("New clipboard created");
      setCodeMessage("");
    } catch (error) {
      console.error("Create error:", error);
      setMessage(error.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  // Open an existing clipboard from the database
  async function openClipboard() {
    const enteredCode = inputCode.trim();

    if (!/^\d{4}$/.test(enteredCode)) {
      setMessage("Please enter a valid 4-digit code");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/clipboards/${encodeURIComponent(enteredCode)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Clipboard not found");
      }

      setCode(enteredCode);
      setContent(data.body);
      setMessage("");
      setCodeMessage("");
    } catch (error) {
      console.error("Open error:", error);
      setMessage(error.message || "Unable to connect to server");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  // Save clipboard content to SQLite
  async function saveClipboard() {
    if (!code || loading) return;

    setLoading(true);
    setMessage("Saving...");

    try {
      const response = await fetch(
        `${API}/clipboards/${encodeURIComponent(code)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: content }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save clipboard");
      }

      setMessage("Saved ✓");
    } catch (error) {
      console.error("Save error:", error);
      setMessage(error.message || "Unable to save clipboard");
    } finally {
      setLoading(false);
    }
  }

  // Copy clipboard code
  async function copyCode(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCodeMessage("Code copied!");
    } catch (error) {
      console.error("Copy error:", error);
      setCodeMessage("Unable to copy code");
    }
  }

  // Return to the code entry screen
  function changeClipboard() {
    setCode("");
    setContent("");
    setInputCode("");
    setMessage("");
    setCodeMessage("");
  }

  // Code entry screen
  if (!code) {
    return (
      <main className="container">
        <div className="card">
          <h1>Online Clipboard</h1>

          <p>Enter a clipboard code to open it</p>

          <input
            ref={inputRef}
            value={inputCode}
            onChange={(e) => {
              setInputCode(
                e.target.value.replace(/\D/g, "").slice(0, 4)
              );
            }}
            placeholder="Enter code"
            maxLength={4}
            inputMode="numeric"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                openClipboard();
              }
            }}
          />

          <button onClick={openClipboard} disabled={loading}>
            {loading ? "Please wait..." : "Open Clipboard"}
          </button>

          <div className="divider">OR</div>

          <button
            className="secondary"
            onClick={createClipboard}
            disabled={loading}
          >
            Create New Clipboard
          </button>

          {message && <p className="message">{message}</p>}
        </div>
      </main>
    );
  }

  // Clipboard editor screen
  return (
    <main className="container">
      <div className="clipboard">
        <div className="topbar">
          <div>
            <h1>Clipboard</h1>

            <br />

            <span className="code">{code}</span>
            &nbsp;
            <button onClick={() => copyCode(code)}>Copy Code</button>
            &nbsp;
            <span>{codeMessage}</span>
            
          </div>

          <button className="change" onClick={changeClipboard}>
            Change Clipboard
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaveVersion((version) => version + 1);
            setMessage("Unsaved changes");
          }}
          placeholder="Write or paste anything here..."
          spellCheck="false"
        />

        <div className="bottom">
          <span>{message}</span>

          <button onClick={saveClipboard} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
