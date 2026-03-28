import React, { useState, useEffect, useRef } from 'react';
import { AppState, Challenge, Difficulty, EvaluationResult } from './types';
import { getChallengesByDifficulty } from './data/challenges';
import { evaluateTranscript } from './services/gemini';
import { CircularTimer } from './components/CircularTimer';
import { ScoreDial } from './components/ScoreDial';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Play, RotateCcw, ArrowRight, Settings, Loader2 } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [usedChallengeIds, setUsedChallengeIds] = useState<Set<string>>(new Set());
  
  // Gameplay state
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [hasStartedSpeaking, setHasStartedSpeaking] = useState(false);
  const [utterances, setUtterances] = useState<string[]>([]);
  const [interimText, setInterimText] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for callbacks
  const appStateRef = useRef<AppState>(appState);
  const secondsLeftRef = useRef(secondsLeft);
  const hasStartedSpeakingRef = useRef(hasStartedSpeaking);

  useEffect(() => { appStateRef.current = appState; }, [appState]);
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);
  useEffect(() => { hasStartedSpeakingRef.current = hasStartedSpeaking; }, [hasStartedSpeaking]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (appState === 'PLAYING' && hasStartedSpeaking && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (appState === 'PLAYING' && hasStartedSpeaking && secondsLeft === 0) {
      finishChallenge();
    }
    return () => clearInterval(interval);
  }, [appState, hasStartedSpeaking, secondsLeft]);

  // Auto-scroll to bottom of list
  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [utterances, interimText]);

  const selectRandomChallenge = (diff: Difficulty) => {
    const available = getChallengesByDifficulty(diff).filter(c => !usedChallengeIds.has(c.id));
    
    // Reset if all used
    let challengePool = available;
    if (available.length === 0) {
      challengePool = getChallengesByDifficulty(diff);
      setUsedChallengeIds(new Set());
    }
    
    const selected = challengePool[0]; // Already shuffled in data file
    setCurrentChallenge(selected);
    setUsedChallengeIds(prev => new Set(prev).add(selected.id));
    setDifficulty(diff);
    setAppState('READY');
  };

  const startChallenge = async () => {
    if (appStateRef.current === 'PLAYING') return;

    // Reset state
    setSecondsLeft(60);
    setUtterances([]);
    setInterimText('');
    setEvaluation(null);
    setHasStartedSpeaking(false);
    setAppState('PLAYING');

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition. Please try Chrome or Edge.");
      setAppState('READY');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      if (!hasStartedSpeakingRef.current) {
        setHasStartedSpeaking(true);
      }

      let currentInterim = '';
      const newUtterances: string[] = [];
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript.trim();
          if (finalTranscript) {
            newUtterances.push(finalTranscript);
          }
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }
      
      if (newUtterances.length > 0) {
        setUtterances(prev => [...prev, ...newUtterances]);
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopGame();
        setAppState('READY');
        alert("Microphone access is required to play.");
      }
    };

    recognition.onend = () => {
      // If recognition stops unexpectedly while playing, try to restart it
      if (appStateRef.current === 'PLAYING' && secondsLeftRef.current > 0) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Could not restart recognition", e);
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start recognition", e);
      alert("Failed to access microphone. Please ensure permissions are granted.");
      setAppState('READY');
    }
  };

  const stopGame = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
      recognitionRef.current.stop();
    }
  };

  const finishChallenge = async () => {
    stopGame();
    setAppState('EVALUATING');
    
    // Combine all utterances and any remaining interim text
    const fullTranscript = [...utterances, interimText].filter(Boolean).join('. ');
    
    if (!currentChallenge) return;

    const result = await evaluateTranscript(
      currentChallenge.difficulty,
      currentChallenge.prompt,
      fullTranscript
    );
    
    setEvaluation(result);
    setAppState('RESULTS');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []);

  return (
    <div className="h-[100dvh] bg-gray-50 text-gray-900 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mic className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Word Flow</h1>
        </div>
        {appState !== 'HOME' && appState !== 'PLAYING' && (
          <button 
            onClick={() => setAppState('HOME')}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Home
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col max-w-md mx-auto w-full h-full">
        <AnimatePresence mode="wait">
          
          {/* HOME SCREEN */}
          {appState === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="mb-12">
                <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                  Find your flow.
                </h2>
                <p className="text-lg text-gray-600 max-w-xs mx-auto">
                  Name as many items as you can in 60 seconds. Just speak naturally.
                </p>
              </div>

              <div className="w-full space-y-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select Difficulty
                </p>
                <button 
                  onClick={() => selectRandomChallenge('Easy')}
                  className="w-full bg-white border-2 border-green-200 hover:border-green-500 hover:bg-green-50 text-green-700 font-bold py-4 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-between group"
                >
                  <span className="text-xl">Easy</span>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => selectRandomChallenge('Medium')}
                  className="w-full bg-white border-2 border-yellow-200 hover:border-yellow-500 hover:bg-yellow-50 text-yellow-700 font-bold py-4 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-between group"
                >
                  <span className="text-xl">Medium</span>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => selectRandomChallenge('Hard')}
                  className="w-full bg-white border-2 border-red-200 hover:border-red-500 hover:bg-red-50 text-red-700 font-bold py-4 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-between group"
                >
                  <span className="text-xl">Hard</span>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </motion.div>
          )}

          {/* READY SCREEN */}
          {appState === 'READY' && currentChallenge && (
            <motion.div 
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="mb-8">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${
                  currentChallenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  currentChallenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentChallenge.difficulty} Challenge
                </span>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                  {currentChallenge.prompt}
                </h2>
              </div>

              <div className="w-full mt-8">
                <button 
                  onClick={startChallenge}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-6 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Start 60s Timer
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Your microphone will only be active during the 60 seconds.
                </p>
              </div>
            </motion.div>
          )}

          {/* PLAYING SCREEN */}
          {appState === 'PLAYING' && currentChallenge && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full w-full bg-gray-50 relative"
            >
              {/* Fixed Top Section */}
              <div className="bg-white shadow-sm z-20 px-6 py-4 flex flex-col items-center shrink-0">
                <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  Name items for:
                </p>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-4">
                  {currentChallenge.prompt}
                </h2>
                <CircularTimer secondsLeft={secondsLeft} totalSeconds={60} />
                
                <div className="h-6 mt-3">
                  {!hasStartedSpeaking ? (
                    <p className="text-sm text-blue-600 font-bold animate-pulse bg-blue-50 px-3 py-1 rounded-full">
                      Timer starts when you speak...
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                      Recording...
                    </p>
                  )}
                </div>
              </div>

              {/* Scrollable Text Area */}
              <div className="flex-1 overflow-y-auto p-6 pb-32">
                {!hasStartedSpeaking && utterances.length === 0 && !interimText ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 mt-8">
                    <Mic className="w-16 h-16 mb-6 opacity-20" />
                    <p className="text-xl font-medium text-gray-500">Listening...</p>
                    <p className="text-sm mt-2 text-center max-w-[250px]">
                      Say as many things as you can think of. Don't worry about pauses.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] h-fit break-words">
                    <p className="text-xl sm:text-2xl leading-relaxed text-gray-800 font-medium">
                      {utterances.map((utt, i) => (
                        <span key={i} className="mr-2">{utt}</span>
                      ))}
                      {interimText && (
                        <span className="text-gray-400 italic">{interimText}</span>
                      )}
                    </p>
                    <div ref={listEndRef} />
                  </div>
                )}
              </div>
              
              {/* Gradient fade at bottom to prevent abrupt cutoffs */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none z-10" />
            </motion.div>
          )}

          {/* EVALUATING SCREEN */}
          {appState === 'EVALUATING' && (
            <motion.div 
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Evaluating your response...
              </h2>
              <p className="text-gray-500">
                Our AI is parsing your words and calculating your score.
              </p>
            </motion.div>
          )}

          {/* RESULTS SCREEN */}
          {appState === 'RESULTS' && evaluation && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex flex-col items-center mb-8 mt-4">
                <ScoreDial score={evaluation.performanceScore} />
                <div className="mt-6 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Valid Items Found:</span>
                  <span className="text-xl font-bold text-gray-900">{evaluation.rawScore}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-green-50 border border-green-100 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2">
                    What you did well
                  </h3>
                  <p className="text-green-900 leading-relaxed">
                    {evaluation.whatTheyDidWell}
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">
                    Room for improvement
                  </h3>
                  <p className="text-blue-900 leading-relaxed">
                    {evaluation.roomForImprovement}
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-3 pb-8">
                <button 
                  onClick={() => {
                    setAppState('READY');
                  }}
                  className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retry Same Challenge
                </button>
                <button 
                  onClick={() => selectRandomChallenge(difficulty)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  New Challenge ({difficulty})
                </button>
                <button 
                  onClick={() => setAppState('HOME')}
                  className="w-full bg-transparent text-gray-500 hover:text-gray-800 font-medium py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Change Difficulty
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
