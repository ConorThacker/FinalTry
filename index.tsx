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
    const rand = (max: number, min = 1) => Math.floor(Math.random() * (max - min + 1)) + min;
  
    let a, b, c, d, question, answer;
  
    switch (level) {
      case 1: // Simple Algebra x + b = a
        a = rand(20, 5);
        b = rand(a - 1, 1);
        return { question: `Solve for x: x + ${b} = ${a}`, answer: a - b };
      case 2: // Order of Operations (BODMAS/BIDMAS)
        a = rand(10);
        b = rand(10);
        c = rand(5);
        return { question: `What is ${a} × ${b} + ${c}?`, answer: a * b + c };
      case 3: // Percentages
        const percent = rand(19) * 5; // 5, 10, 15... 95
        b = rand(20, 4) * 5; // Multiple of 5 for easier calculation
        return { question: `What is ${percent}% of ${b}?`, answer: (percent / 100) * b };
      case 4: // Fractions of amounts
        c = rand(8, 2); // Denominator
        a = rand(10, 2);
        d = a * c;
        return { question: `What is 1/${c} of ${d}?`, answer: a };
      case 5: // Area of a rectangle
        a = rand(20, 3);
        b = rand(20, 3);
        return { question: `A rectangle has a length of ${a}cm and a width of ${b}cm. What is its area in cm²?`, answer: a * b };
      case 6: // Mean of a set of numbers
        const nums = [rand(20), rand(20), rand(30), rand(30)];
        const sum = nums.reduce((acc, val) => acc + val, 0);
        return { question: `Find the mean of these numbers: ${nums.join(', ')}`, answer: sum / nums.length };
      case 7: // More complex linear equations (ax + b = c)
        a = rand(5, 2); // a
        const x = rand(10, 1); // x
        b = rand(10, 1); // b
        c = a * x + b; // c
        return { question: `Solve for x: ${a}x + ${b} = ${c}`, answer: x };
      case 8: // Negative numbers
        a = rand(15, 1);
        b = rand(15, 1);
        if (Math.random() > 0.5) {
          return { question: `What is ${a} - ${a + b}?`, answer: -b };
        } else {
          return { question: `What is -${a} + ${b}?`, answer: -a + b };
        }
      case 9: // Volume of a cuboid
        a = rand(10);
        b = rand(10);
        c = rand(10);
        return { question: `A cuboid has dimensions ${a}m, ${b}m, and ${c}m. What is its volume in m³?`, answer: a * b * c };
      case 10: // Ratio
        a = rand(10);
        b = rand(10);
        const ratioTotal = a+b;
        const shareAmount = ratioTotal * rand(10, 2);
        return { question: `Share £${shareAmount} in the ratio ${a}:${b}. What is the larger share?`, answer: Math.max(a,b) * (shareAmount/ratioTotal) }
      default:
        // Fallback to level 1 for any unexpected level number
        a = rand(10, 5);
        b = rand(a-1, 1);
        return { question: `Solve for x: x + ${b} = ${a}`, answer: a - b };
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

const LevelNode = ({ level, unlocked, completed, onSelect }: { level: number; unlocked: boolean; completed: boolean; onSelect: (level: number) => void; }) => {
    const levelIcons = ['⭕', '🔼', '⭐', '☂️'];
    const icon = levelIcons[(level - 1) % levelIcons.length];

    return (
        <div className={`level-node-container level-${level}`}>
            <button
                className={`level-node ${unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => unlocked && onSelect(level)}
                disabled={!unlocked}
                aria-label={`Level ${level}`}
            >
                {unlocked ? (
                    <>
                        <span className="level-icon">{icon}</span>
                        <span className="level-number-small">{level}</span>
                    </>
                ) : (
                    <span className="lock-icon">🔒</span>
                )}
                {completed && <span className="completion-icon">🏆</span>}
            </button>
        </div>
    );
};

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

interface GameProps {
  level: number;
  onBack: () => void;
  onLevelComplete: () => void;
  toldJokes: string[];
  onNewJoke: (joke: string) => void;
}

const Game = ({ level, onBack, onLevelComplete, toldJokes, onNewJoke }: GameProps) => {
  const [questions, setQuestions] = useState<{ question: string; answer: number; }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | ''>('');
  const [showJokeModal, setShowJokeModal] = useState(false);
  const [dadJoke, setDadJoke] = useState('');
  const [isJokeLoading, setIsJokeLoading] = useState(false);
  
  const levelThemes = [
    'The First Step', 'The Dalgona Challenge', 'Tug of War', 'The Marble Game',
    'Glass Bridge', 'The Circle Trial', 'The Triangle Trial', 'The Star Trial',
    'The Squid Game', 'The Final Boss'
  ];
  const levelName = levelThemes[level - 1] || `Level ${level}`;

  useEffect(() => {
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion(level));
    setQuestions(newQuestions);
  }, [level]);

  const fetchDadJoke = async () => {
    setIsJokeLoading(true);
    setDadJoke('');
    try {
      const instruction = toldJokes.length > 0
        ? `Tell me a ridiculously cringy dad joke. Please do not repeat any of these: ${toldJokes.join('; ')}`
        : 'Tell me a ridiculously cringy dad joke.';
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: instruction,
      });
      const newJoke = response.text;
      setDadJoke(newJoke);
      onNewJoke(newJoke);
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

    if (!isNaN(userAnswer) && userAnswer.toFixed(2) === correctAnswer.toFixed(2)) {
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
        <div className="level-title-container">
          <h2>Level {level}</h2>
          <span className="level-subtitle">{levelName}</span>
        </div>
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
        if(Array.isArray(parsed) && parsed.length === 10) {
          return parsed;
        }
      }
    } catch (error) {
        console.error("Could not parse level status from localStorage", error);
    }
    return getInitialLevelStatus();
  });

  const [toldJokes, setToldJokes] = useState<string[]>(() => {
    try {
        const savedJokes = localStorage.getItem('mathsGameToldJokes');
        if (savedJokes) {
            const parsed = JSON.parse(savedJokes);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Could not parse told jokes from localStorage", error);
    }
    return [];
  });

  useEffect(() => {
      try {
        localStorage.setItem('mathsGameLevelStatus', JSON.stringify(levelStatus));
      } catch (error) {
        console.error("Could not save level status to localStorage", error);
      }
  }, [levelStatus]);

  useEffect(() => {
    try {
        localStorage.setItem('mathsGameToldJokes', JSON.stringify(toldJokes));
    } catch (error) {
        console.error("Could not save told jokes to localStorage", error);
    }
  }, [toldJokes]);

  const handleNewJoke = (joke: string) => {
    if (!toldJokes.includes(joke)) {
      setToldJokes(prevJokes => [...prevJokes, joke]);
    }
  };
  
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
      setToldJokes([]);
      localStorage.removeItem('mathsGameToldJokes');
      setCurrentScreen('levelSelect');
  }

  const renderScreen = () => {
    switch(currentScreen) {
        case 'start':
            return <StartScreen onStart={handleStartGame} />;
        case 'levelSelect':
            return <LevelSelect levels={levelStatus} onSelectLevel={handleSelectLevel} />;
        case 'game':
            return selectedLevel !== null && (
              <Game 
                level={selectedLevel} 
                onBack={handleBackToMap} 
                onLevelComplete={handleLevelComplete}
                toldJokes={toldJokes}
                onNewJoke={handleNewJoke}
              />
            );
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
