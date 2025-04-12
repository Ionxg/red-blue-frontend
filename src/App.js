import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';

const socket = io("https://red-blue-backend.onrender.com");

function App() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);
  const [inRoom, setInRoom] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [myVote, setMyVote] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [roundStarted, setRoundStarted] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [gameRestarted, setGameRestarted] = useState(false);

  useEffect(() => {
    socket.on("playerList", (data) => {
      setPlayers(data);
    });

    socket.on("revealVotes", () => {
      setShowVotes(true);
      setTimeout(() => {
        setMyVote(null);
        setShowVotes(false);
      }, 5000);
    });

    socket.on("win", () => {
      setIsWinner(true);
    });

    socket.on("gameOver", () => {
      setGameOver(true);
    });

    socket.on("gameRestarted", () => {
      setIsWinner(false);
      setGameOver(false);
      setMyVote(null);
      setShowVotes(false);
      setGameRestarted(true);
      setTimeout(() => setGameRestarted(false), 2000);
    });

    socket.on("roundStarted", () => {
      setRoundStarted(true);
      setCountdown(10);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setRoundStarted(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  }, []);

  const createRoom = async () => {
    const res = await axios.post("http://localhost:3000/create-room");
    setRoomId(res.data.roomId);
  };

  const joinRoom = () => {
    socket.emit("joinRoom", { roomId, name });
    setInRoom(true);
  };

  const vote = (choice) => {
    setMyVote(choice);
    socket.emit("vote", { roomId, choice });
  };

  const startRound = () => {
    socket.emit("startRound", { roomId });
  };

  const declareWinner = () => {
    socket.emit("declareWinner", { roomId });
  };

  const restartGame = () => {
    socket.emit("restartGame", { roomId });
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>🔴🔵 Red vs Blue Game</h1>

      {!inRoom ? (
        <div style={{ padding: 20 }}>
          <button onClick={createRoom}>Create Room</button><br /><br />
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          /><br /><br />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h2 style={{ textAlign: 'center' }}>Room: {roomId}</h2>

          {gameRestarted && (
            <div style={{ textAlign: "center", color: "green", fontWeight: "bold" }}>
              ✅ Game restarted!
            </div>
          )}

          {roundStarted && (
            <div style={{ textAlign: "center", fontSize: "1.5rem", color: "orange" }}>
              ⏳ Voting ends in: {countdown}s
            </div>
          )}

          {isWinner && (
            <div style={{ textAlign: 'center', fontSize: "2rem", color: "green", marginTop: 20 }}>
              🎉 YOU WIN!
            </div>
          )}

          {gameOver && !isWinner && (
            <div style={{ textAlign: 'center', fontSize: "2rem", color: "gray", marginTop: 20 }}>
              ❌ Game Over
            </div>
          )}

          {!showVotes && !myVote && !isWinner && !gameOver && (
            <div style={{ display: 'flex', height: '70vh' }}>
              <div
                onClick={() => vote("red")}
                style={{
                  flex: 1,
                  backgroundColor: "red",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  cursor: "pointer"
                }}
              >
                🔴 RED
              </div>
              <div
                onClick={() => vote("blue")}
                style={{
                  flex: 1,
                  backgroundColor: "blue",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  cursor: "pointer"
                }}
              >
                🔵 BLUE
              </div>
            </div>
          )}

          {myVote && !showVotes && (
            <p style={{ textAlign: "center" }}>
              You chose: <strong>{myVote.toUpperCase()}</strong> ✅
            </p>
          )}

          {showVotes && (
            <div style={{ textAlign: "center" }}>
              <h3>Votes:</h3>
              <ul style={{ listStyle: "none" }}>
                {players.filter(p => p.active).map(p => (
                  <li key={p.id}>
                    {p.name} → <strong>{p.choice ? p.choice.toUpperCase() : "-"}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {name.toLowerCase() === "host" && !roundStarted && !showVotes && !gameOver && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={startRound}>Start Round (10s Countdown)</button>
            </div>
          )}

          {name.toLowerCase() === "host" && !roundStarted && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button onClick={declareWinner}>Declare Winner</button><br /><br />
              <button onClick={restartGame}>🔁 Restart Game</button>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <h4>Players In Game:</h4>
            <ul style={{ listStyle: "none" }}>
              {players.filter(p => p.active).map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
