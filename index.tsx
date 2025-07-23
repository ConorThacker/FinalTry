import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper Functions ---
const generateQuestion = (level: number) => {
  const a = Math.floor(Math.random() * (level * 5)) + level * 2;
  const b = Math.floor(Math.random() * 10) + 1;
  const c = Math.floor(Math.random() * 5) + 1;
  
  switch (level % 5) {
    case 1: // Simple Algebra
      return { question: `Solve for x: x + ${b} = ${a}`, answer: a - b };
    case 2: // Percentages
      const num = (Math.floor(Math.random() * 10) + 1) * 10;
      const total = (Math.floor(Math.random() * 10) + 5) * 20;
      return { question: `What is ${num}% of ${total}?`, answer: (num / 100) * total };
    case 3: // Area of a rectangle
      return { question: `A rectangle has a length of ${a} and a width of ${b}. What is its area?`, answer: a * b };
    case 4: // Fractions
        const d = a * c;
        return { question: `What is 1/${c} of ${d}?`, answer: a };
    case 0: // Multiplication and addition
    default:
      return { question: `What is ${a} × ${b} + ${c}?`, answer: a * b + c };
  }
};

const getInitialLevelStatus = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      unlocked: i === 0,
      completed: false,
    }));
}


// --- Components ---

const LoadingSpinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

const DadJokeModal = ({ joke, onClose, isLoading }: { joke: string; onClose: () => void; isLoading: boolean; }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content roblox-ui">
        <h2>Correct!</h2>
        <p>Here's a cringy dad joke for you...</p>
        <div className="joke-box">
          {isLoading ? <LoadingSpinner /> : <p>{joke}</p>}
        </div>
        <button onClick={onClose} disabled={isLoading} className="roblox-button">
          {isLoading ? "Thinking..." : "Next Question"}
        </button>
      </div>
    </div>
  );
};

const LevelNode = ({ level, unlocked, completed, onSelect }: { level: number; unlocked: boolean; completed: boolean; onSelect: (level: number) => void; }) => (
  <div className={`level-node-container level-${level}`}>
    <button
      className={`level-node ${unlocked ? 'unlocked' : 'locked'}`}
      onClick={() => unlocked && onSelect(level)}
      disabled={!unlocked}
      aria-label={`Level ${level}`}
    >
      {unlocked ? (
        <span className="level-number">{level}</span>
      ) : (
        <span className="lock-icon">🔒</span>
      )}
      {completed && <span className="star-icon">⭐</span>}
    </button>
  </div>
);

const StartScreen = ({ onStart }: { onStart: () => void }) => (
    <div className="app-container">
        <h1 className="main-title">Conor's Maths For Harry!</h1>
        <div className="start-card roblox-ui">
            <h2>Welcome, Maths Adventurer!</h2>
            <p>Ready to solve some problems and unlock cringy dad jokes?</p>
            <button onClick={onStart} className="roblox-button start-button">
                Start Game
            </button>
        </div>
    </div>
);

const CongratulationsScreen = ({ onPlayAgain }: { onPlayAgain: () => void }) => (
    <div className="app-container">
        <h1 className="main-title">Congratulations!</h1>
        <div className="start-card roblox-ui">
            <span className="congrats-icon">🏆</span>
            <h2>You've conquered all the levels!</h2>
            <p>You are a true maths champion. Harry would be proud!</p>
            <button onClick={onPlayAgain} className="roblox-button start-button">
                Play Again
            </button>
        </div>
    </div>
);

const LevelSelect = ({ levels, onSelectLevel }: { levels: { unlocked: boolean; completed: boolean; }[]; onSelectLevel: (level: number) => void; }) => {
  return (
    <div className="app-container">
      <h1 className="main-title">Conor's Maths For Harry!</h1>
      <div className="map-container">
        <div className="map-path"></div>
        {levels.map((levelStatus, index) => (
          <LevelNode
            key={index}
            level={index + 1}
            unlocked={levelStatus.unlocked}
            completed={levelStatus.completed}
            onSelect={onSelectLevel}
          />
        ))}
      </div>
    </div>
  );
};

const Game = ({ level, onBack, onLevelComplete }: { level: number; onBack: () => void; onLevelComplete: () => void; }) => {
  const [questions, setQuestions] = useState<{ question: string; answer: number; }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | ''>('');
  const [showJokeModal, setShowJokeModal] = useState(false);
  const [dadJoke, setDadJoke] = useState('');
  const [isJokeLoading, setIsJokeLoading] = useState(false);

  useEffect(() => {
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion(level));
    setQuestions(newQuestions);
  }, [level]);

  const fetchDadJoke = async () => {
    setIsJokeLoading(true);
    setDadJoke('');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Tell me a ridiculously cringy dad joke.',
      });
      setDadJoke(response.text);
    } catch (error) {
      console.error("Error fetching dad joke:", error);
      setDadJoke("I wanted to tell a construction joke, but I'm still working on it."); // Fallback joke
    } finally {
      setIsJokeLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setShowJokeModal(false);
    setInputValue('');
    setFeedback('');
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
        // This was the last question. Check score after this correct answer.
        if (score + 1 === 10) { 
            onLevelComplete();
        } else {
            alert(`Level finished! Your score: ${score + 1}/10. You need 100% to unlock the next level. Try again!`);
            onBack();
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userAnswer = parseFloat(inputValue);
    const correctAnswer = questions[currentQuestionIndex].answer;

    if (!isNaN(userAnswer) && userAnswer === correctAnswer) {
      setScore(score + 1);
      setFeedback('correct');
      // If it's the last question, handle level completion directly, otherwise show joke.
      if (currentQuestionIndex + 1 === questions.length) {
        handleNextQuestion();
      } else {
        setShowJokeModal(true);
        fetchDadJoke();
      }
    } else {
      setFeedback('incorrect');
      document.querySelector('.game-card')?.classList.add('shake');
      setTimeout(() => {
        setFeedback('');
        document.querySelector('.game-card')?.classList.remove('shake');
      }, 500);
    }
  };

  if (questions.length === 0) {
    return <LoadingSpinner />;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="app-container game-view">
      {showJokeModal && (
        <DadJokeModal 
          joke={dadJoke} 
          onClose={handleNextQuestion} 
          isLoading={isJokeLoading} 
        />
      )}
      <div className="game-header roblox-ui">
        <button onClick={onBack} className="roblox-button back-button">{'< Map'}</button>
        <h2>Level {level}</h2>
        <div className="score">Score: {score} / 10</div>
      </div>

      <div className="game-card roblox-ui">
        <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${((currentQuestionIndex + 1) / 10) * 100}%`}}></div>
        </div>
        <p className="question-number">Question {currentQuestionIndex + 1} of 10</p>
        <p className="question-text">{currentQuestion.question}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            step="any"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`roblox-input ${feedback}`}
            placeholder="Your answer..."
            aria-label="Math question answer"
            autoFocus
          />
          <button type="submit" className="roblox-button submit-button">Submit</button>
        </form>
      </div>
    </div>
  );
};


const App = () => {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'levelSelect' | 'game' | 'congratulations'>('start');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [levelStatus, setLevelStatus] = useState(() => {
    try {
      const savedStatus = localStorage.getItem('mathsGameLevelStatus');
      if (savedStatus) {
        const parsed = JSON.parse(savedStatus);
        // Basic validation to ensure it's an array of the correct length
        if(Array.isArray(parsed) && parsed.length === 10) {
          return parsed;
        }
      }
    } catch (error) {
        console.error("Could not parse level status from localStorage", error);
    }
    return getInitialLevelStatus();
  });

  useEffect(() => {
      try {
        localStorage.setItem('mathsGameLevelStatus', JSON.stringify(levelStatus));
      } catch (error) {
        console.error("Could not save level status to localStorage", error);
      }
  }, [levelStatus]);
  
  const handleStartGame = () => {
    const allCompleted = levelStatus.every(l => l.completed);
    if(allCompleted){
      setCurrentScreen('congratulations');
    } else {
      setCurrentScreen('levelSelect');
    }
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
    setCurrentScreen('game');
  };

  const handleBackToMap = () => {
    setCurrentScreen('levelSelect');
    setSelectedLevel(null);
  };

  const handleLevelComplete = () => {
    if (selectedLevel === null) return;

    if (selectedLevel === 10) {
        // Final level completed
        const newLevelStatus = [...levelStatus];
        newLevelStatus[selectedLevel - 1].completed = true;
        setLevelStatus(newLevelStatus);
        setCurrentScreen('congratulations');
    } else {
        alert(`Level ${selectedLevel} completed with 100%! Next level unlocked!`);
        const newLevelStatus = [...levelStatus];
        newLevelStatus[selectedLevel - 1].completed = true;
        if (selectedLevel < 10) {
            newLevelStatus[selectedLevel].unlocked = true;
        }
        setLevelStatus(newLevelStatus);
        handleBackToMap();
    }
  }

  const handlePlayAgain = () => {
      const initialStatus = getInitialLevelStatus();
      setLevelStatus(initialStatus);
      setCurrentScreen('levelSelect');
  }

  const renderScreen = () => {
    switch(currentScreen) {
        case 'start':
            return <StartScreen onStart={handleStartGame} />;
        case 'levelSelect':
            return <LevelSelect levels={levelStatus} onSelectLevel={handleSelectLevel} />;
        case 'game':
            return selectedLevel !== null && <Game level={selectedLevel} onBack={handleBackToMap} onLevelComplete={handleLevelComplete}/>;
        case 'congratulations':
            return <CongratulationsScreen onPlayAgain={handlePlayAgain} />;
        default:
            return <StartScreen onStart={handleStartGame} />;
    }
  }

  return <>{renderScreen()}</>;
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);