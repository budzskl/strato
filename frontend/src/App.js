import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:5050/home")

      .then((res) => {
        console.log("RAW RESPONSE →", res.status, res.headers.get("content-type"));
        return res.json();
      })
      .then((data) => {
        console.log("PARSED JSON →", data);
        setMessage(data.message);
      })
      .catch((err) => {
        console.error("FETCH ERROR →", err);
        setMessage("Failed to connect to backend");
      });
  }, []);
  
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Strato Frontend</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
