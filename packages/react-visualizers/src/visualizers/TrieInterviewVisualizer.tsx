import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface TrieNode {
  id: string;
  char: string;
  children: Map<string, string>;
  isEndOfWord: boolean;
  word?: string;
}

interface TrieStep {
  operation: 'init' | 'insert' | 'traverse' | 'create' | 'markEnd' | 'search' | 'found' | 'notFound' | 'prefix' | 'done';
  nodes: Map<string, TrieNode>;
  rootId: string;
  word?: string;
  prefix?: string;
  currentNodeId?: string;
  highlightPath?: string[];
  matchedWords?: string[];
  description: string;
}

interface TrieInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'trie-interview-visualizer';

const BADGES = [
  { label: 'O(m) ops', variant: 'cyan' as const },
];

const OPERATIONS: Array<{ op: 'insert' | 'search' | 'prefix'; word: string }> = [
  { op: 'insert', word: 'cat' },
  { op: 'insert', word: 'car' },
  { op: 'insert', word: 'card' },
  { op: 'insert', word: 'care' },
  { op: 'insert', word: 'dog' },
  { op: 'search', word: 'car' },
  { op: 'prefix', word: 'car' },
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Node', border: '#d1d5db' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
  { color: 'bg-green-400', label: 'End of word' },
  { color: 'bg-yellow-200', label: 'Path', border: '#fbbf24' },
];

// Interview questions about Trie
const TRIE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'trie-1',
    question: 'What is the primary advantage of a Trie over a Hash Map for string storage?',
    options: [
      'Faster insertion time',
      'Less memory usage',
      'Efficient prefix-based operations',
      'Better cache locality',
    ],
    correctAnswer: 2,
    explanation: 'Tries excel at prefix operations: autocomplete, prefix search, and finding all words with common prefix are O(m) where m is prefix length. Hash maps would require scanning all keys.',
    hint: 'Think about autocomplete functionality.',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'trie-2',
    question: 'What is the time complexity of searching for a word in a Trie?',
    options: ['O(1)', 'O(log n)', 'O(m) where m is word length', 'O(n) where n is number of words'],
    correctAnswer: 2,
    explanation: 'Search time is O(m) where m is the length of the word being searched. We traverse one node per character, independent of how many words are stored in the Trie.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'trie-3',
    question: 'What is the worst-case space complexity of a Trie storing n words of average length m?',
    options: ['O(n)', 'O(m)', 'O(n * m)', 'O(alphabet_size^m)'],
    correctAnswer: 2,
    explanation: 'In the worst case (no shared prefixes), each word needs m nodes. With n words, thats O(n * m) nodes. However, with many shared prefixes, actual space is much less.',
    hint: 'Consider the case where no words share prefixes.',
    difficulty: 'hard',
    topic: 'Space',
  },
  {
    id: 'trie-4',
    question: 'Which data structure is most commonly used to implement Trie node children?',
    options: ['Array of size 26', 'HashMap', 'Linked List', 'All of these are valid'],
    correctAnswer: 3,
    explanation: 'All are valid: Array (fast but wastes space for sparse nodes), HashMap (space-efficient, flexible), Linked List (memory-efficient for very sparse nodes). Choice depends on alphabet size and density.',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'trie-5',
    question: 'What is a "compressed trie" or "radix tree"?',
    options: [
      'A trie that uses compression algorithms',
      'A trie where chains of single-child nodes are merged',
      'A trie stored in compressed file format',
      'A trie with fewer levels',
    ],
    correctAnswer: 1,
    explanation: 'A radix tree (Patricia trie) compresses chains of nodes with single children into single edges labeled with strings. This saves space when there are long unique suffixes.',
    difficulty: 'hard',
    topic: 'Variants',
  },
  {
    id: 'trie-6',
    question: 'Which operation is NOT efficiently supported by a standard Trie?',
    options: [
      'Find all words with given prefix',
      'Check if word exists',
      'Find words matching a pattern with wildcards',
      'Find the longest common prefix of all words',
    ],
    correctAnswer: 2,
    explanation: 'Wildcard matching (e.g., "c?t" matching "cat", "cut") requires exploring multiple branches at wildcard positions, which can be expensive. Specialized trie variants exist for this.',
    hint: 'Think about what happens when you dont know which branch to take.',
    difficulty: 'hard',
    topic: 'Operations',
  },
  {
    id: 'trie-7',
    question: 'In a Trie, how do you distinguish between a complete word and a prefix?',
    options: [
      'Complete words are stored in leaf nodes only',
      'Each node has a boolean flag marking end of word',
      'The character stored in the node is different',
      'Complete words have a different pointer type',
    ],
    correctAnswer: 1,
    explanation: 'Each node has an "isEndOfWord" boolean. When inserting "car" and "card", the node for "r" has isEndOfWord=true (for "car"), but also has child "d" (for "card").',
    difficulty: 'easy',
    topic: 'Structure',
  },
  {
    id: 'trie-8',
    question: 'What is the time complexity to find all words with a given prefix in a Trie?',
    options: [
      'O(prefix_length)',
      'O(prefix_length + number_of_matches)',
      'O(n) where n is total words',
      'O(n * prefix_length)',
    ],
    correctAnswer: 1,
    explanation: 'We first traverse O(prefix_length) to reach the prefix node, then collect all words in that subtree. Total time is O(prefix_length + k) where k is the number of matching words.',
    difficulty: 'medium',
    topic: 'Complexity',
  },
  {
    id: 'trie-9',
    question: 'Which application is LEAST suitable for a Trie?',
    options: [
      'Autocomplete suggestions',
      'Spell checker',
      'IP routing tables',
      'Storing user passwords securely',
    ],
    correctAnswer: 3,
    explanation: 'Passwords should be hashed, not stored in searchable structures. Tries are great for autocomplete (prefix search), spell checking (similar word lookup), and IP routing (longest prefix matching).',
    difficulty: 'easy',
    topic: 'Use Cases',
  },
  {
    id: 'trie-10',
    question: 'How does a Trie compare to a balanced BST for dictionary operations?',
    options: [
      'BST is always faster',
      'Trie is always faster',
      'Trie is faster for prefix operations, BST has guaranteed O(log n) for point queries',
      'They have identical performance',
    ],
    correctAnswer: 2,
    explanation: 'BST operations are O(log n) regardless of word length. Trie operations are O(m) based on word length. For short words in large dictionaries, Trie wins. For long words, BST may be better.',
    difficulty: 'hard',
    topic: 'Comparison',
  },
];

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `trie_int_${nodeIdCounter++}`;
}

function cloneNodes(nodes: Map<string, TrieNode>): Map<string, TrieNode> {
  const cloned = new Map<string, TrieNode>();
  nodes.forEach((node, id) => {
    cloned.set(id, {
      ...node,
      children: new Map(node.children),
    });
  });
  return cloned;
}

function generateTrieSteps(): TrieStep[] {
  nodeIdCounter = 0;
  const steps: TrieStep[] = [];
  const nodes = new Map<string, TrieNode>();

  const rootId = generateNodeId();
  nodes.set(rootId, {
    id: rootId,
    char: '',
    children: new Map(),
    isEndOfWord: false,
  });

  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    rootId,
    description: 'Initialize empty Trie with root node',
  });

  for (const { op, word } of OPERATIONS) {
    if (op === 'insert') {
      let currentId = rootId;
      const path: string[] = [rootId];

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const currentNode = nodes.get(currentId)!;

        if (currentNode.children.has(char)) {
          const nextId = currentNode.children.get(char)!;
          path.push(nextId);
          currentId = nextId;
        } else {
          const newId = generateNodeId();
          nodes.set(newId, {
            id: newId,
            char,
            children: new Map(),
            isEndOfWord: false,
          });
          currentNode.children.set(char, newId);
          path.push(newId);
          currentId = newId;
        }
      }

      const endNode = nodes.get(currentId)!;
      endNode.isEndOfWord = true;
      endNode.word = word;

      steps.push({
        operation: 'insert',
        nodes: cloneNodes(nodes),
        rootId,
        word,
        currentNodeId: currentId,
        highlightPath: path,
        description: `insert("${word}"): Added to Trie`,
      });
    } else if (op === 'search') {
      let currentId = rootId;
      const path: string[] = [rootId];
      let found = true;

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const currentNode = nodes.get(currentId)!;

        if (currentNode.children.has(char)) {
          const nextId = currentNode.children.get(char)!;
          path.push(nextId);
          currentId = nextId;
        } else {
          found = false;
          break;
        }
      }

      if (found) {
        const endNode = nodes.get(currentId)!;
        found = endNode.isEndOfWord;
      }

      steps.push({
        operation: found ? 'found' : 'notFound',
        nodes: cloneNodes(nodes),
        rootId,
        word,
        currentNodeId: currentId,
        highlightPath: path,
        description: found ? `search("${word}"): Found!` : `search("${word}"): Not found`,
      });
    } else if (op === 'prefix') {
      let currentId = rootId;
      const path: string[] = [rootId];
      let prefixExists = true;

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const currentNode = nodes.get(currentId)!;

        if (currentNode.children.has(char)) {
          const nextId = currentNode.children.get(char)!;
          path.push(nextId);
          currentId = nextId;
        } else {
          prefixExists = false;
          break;
        }
      }

      if (prefixExists) {
        const matchedWords: string[] = [];
        const collectWords = (nodeId: string) => {
          const node = nodes.get(nodeId)!;
          if (node.isEndOfWord && node.word) {
            matchedWords.push(node.word);
          }
          node.children.forEach((childId) => collectWords(childId));
        };
        collectWords(currentId);

        steps.push({
          operation: 'found',
          nodes: cloneNodes(nodes),
          rootId,
          prefix: word,
          currentNodeId: currentId,
          highlightPath: path,
          matchedWords,
          description: `prefix("${word}"): Found ${matchedWords.length} words: ${matchedWords.join(', ')}`,
        });
      }
    }
  }

  const allWords: string[] = [];
  const collectAllWords = (nodeId: string) => {
    const node = nodes.get(nodeId)!;
    if (node.isEndOfWord && node.word) {
      allWords.push(node.word);
    }
    node.children.forEach((childId) => collectAllWords(childId));
  };
  collectAllWords(rootId);

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    rootId,
    matchedWords: allWords,
    description: `Done! Trie contains ${allWords.length} words`,
  });

  return steps;
}

const TrieNodeComponent: React.FC<{
  nodeId: string;
  nodes: Map<string, TrieNode>;
  currentNodeId?: string;
  highlightPath?: string[];
  depth: number;
}> = ({ nodeId, nodes, currentNodeId, highlightPath, depth }) => {
  const node = nodes.get(nodeId);
  if (!node) return null;

  const isCurrent = currentNodeId === nodeId;
  const isInPath = highlightPath?.includes(nodeId);
  const children = Array.from(node.children.entries());

  let nodeStyle = 'border-gray-300 bg-gray-50';
  if (isCurrent) {
    nodeStyle = 'border-teal-400 bg-teal-100 ring-2 ring-teal-300';
  } else if (isInPath) {
    nodeStyle = 'border-yellow-400 bg-yellow-100';
  }
  if (node.isEndOfWord) {
    nodeStyle += ' ring-2 ring-green-400';
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${nodeStyle}`}
      >
        {node.char || 'R'}
      </div>
      {node.isEndOfWord && (
        <div className="text-[8px] text-green-600 font-medium mt-0.5">{node.word}</div>
      )}
      {children.length > 0 && (
        <>
          <div className="w-0.5 h-3 bg-gray-300" />
          <div className="flex gap-1">
            {children.map(([char, childId]) => (
              <div key={childId} className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 mb-0.5">{char}</div>
                <TrieNodeComponent
                  nodeId={childId}
                  nodes={nodes}
                  currentNodeId={currentNodeId}
                  highlightPath={highlightPath}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TrieInterviewVisualizerComponent: React.FC<TrieInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'trie-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateTrieSteps, []);

  const playback = useVisualizerPlayback<TrieStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: TRIE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: TrieStep = playback.currentStepData || {
    operation: 'init',
    nodes: new Map(),
    rootId: '',
    description: '',
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      {/* Info */}
      <div className="mb-3 p-2 bg-teal-50 rounded-lg border border-teal-200">
        <div className="text-xs text-teal-800 text-center">
          <span className="font-medium">Trie:</span> Efficient prefix-based operations, autocomplete, spell checking
        </div>
      </div>

      {/* Trie Visualization */}
      <div className="flex justify-center overflow-x-auto py-2">
        {stepData.nodes.size > 0 && (
          <TrieNodeComponent
            nodeId={stepData.rootId}
            nodes={stepData.nodes}
            currentNodeId={stepData.currentNodeId}
            highlightPath={stepData.highlightPath}
            depth={0}
          />
        )}
      </div>

      {/* Matched Words - always visible container */}
      <div className="mt-2 p-2 rounded border min-h-[36px] flex items-center justify-center bg-purple-50 border-purple-200">
        {stepData.matchedWords && stepData.matchedWords.length > 0 && stepData.operation !== 'done' ? (
          <div className="text-xs text-purple-700">
            <span className="font-medium">Found:</span> {stepData.matchedWords.join(', ')}
          </div>
        ) : (
          <span className="text-purple-400 text-xs italic">Matched words will appear here...</span>
        )}
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-teal-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-teal-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Interview
      </button>
    </div>
  );

  const sidePanel = mode === 'interview' ? (
    <InterviewModePanel
      currentQuestion={interview.currentQuestion}
      currentQuestionIndex={interview.session.currentQuestionIndex}
      totalQuestions={interview.session.questions.length}
      selectedAnswer={interview.selectedAnswer}
      showExplanation={interview.showExplanation}
      showHint={interview.showHint}
      isAnswered={interview.isAnswered}
      isComplete={interview.isComplete}
      score={interview.score}
      onSelectAnswer={interview.selectAnswer}
      onNextQuestion={interview.nextQuestion}
      onPreviousQuestion={interview.previousQuestion}
      onUseHint={interview.useHint}
      onRestart={interview.restartSession}
      accentColor="cyan"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Trie (Prefix Tree) - Interview Mode"
      badges={BADGES}
      gradient="cyan"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant:
          stepData.operation === 'notFound'
            ? 'error'
            : stepData.operation === 'found' || stepData.operation === 'done'
              ? 'success'
              : 'default',
      }}
      controls={{
        isPlaying: playback.isPlaying,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        speed: playback.speed,
        onPlayPause: playback.handlePlayPause,
        onStep: playback.handleStep,
        onStepBack: playback.handleStepBack,
        onReset: playback.handleReset,
        onSpeedChange: playback.setSpeed,
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const TrieInterviewVisualizer = React.memo(TrieInterviewVisualizerComponent);
export default TrieInterviewVisualizer;
