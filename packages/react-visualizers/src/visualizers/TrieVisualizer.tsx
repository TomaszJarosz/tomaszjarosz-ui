import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface TrieNode {
  id: string;
  char: string;
  children: Map<string, string>; // char -> nodeId
  isEndOfWord: boolean;
  word?: string; // Full word if this is end
}

interface TrieStep {
  operation: 'init' | 'insert' | 'traverse' | 'create' | 'markEnd' | 'search' | 'found' | 'notFound' | 'prefix' | 'done';
  nodes: Map<string, TrieNode>;
  rootId: string;
  word?: string;
  prefix?: string;
  currentNodeId?: string;
  highlightChar?: string;
  highlightPath?: string[]; // node IDs in path
  matchedWords?: string[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface TrieVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const OPERATIONS: Array<{ op: 'insert' | 'search' | 'prefix'; word: string }> = [
  { op: 'insert', word: 'cat' },
  { op: 'insert', word: 'car' },
  { op: 'insert', word: 'card' },
  { op: 'insert', word: 'care' },
  { op: 'insert', word: 'dog' },
  { op: 'search', word: 'car' },
  { op: 'search', word: 'cab' },
  { op: 'prefix', word: 'car' },
];

const TRIE_CODE = [
  'class TrieNode:',
  '  children = {}  # char -> node',
  '  isEndOfWord = false',
  '',
  'function insert(word):',
  '  node = root',
  '  for char in word:',
  '    if char not in node.children:',
  '      node.children[char] = TrieNode()',
  '    node = node.children[char]',
  '  node.isEndOfWord = true',
  '',
  'function search(word):',
  '  node = root',
  '  for char in word:',
  '    if char not in node.children:',
  '      return false',
  '    node = node.children[char]',
  '  return node.isEndOfWord',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Node', border: '#d1d5db' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
  { color: 'bg-green-400', label: 'End of word' },
  { color: 'bg-amber-200', label: 'Path', border: '#fbbf24' },
  { color: 'bg-purple-400', label: 'Match found' },
  { color: 'bg-red-400', label: 'Not found' },
];

const BADGES = [
  { label: 'Insert: O(m)', variant: 'teal' as const },
  { label: 'Search: O(m)', variant: 'cyan' as const },
];

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `trie_${nodeIdCounter++}`;
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

  // Create root node
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
    description: 'Initialize empty Trie with root node. Each node stores a character and links to children.',
    codeLine: 0,
  });

  for (const { op, word } of OPERATIONS) {
    if (op === 'insert') {
      // Insert operation
      steps.push({
        operation: 'insert',
        nodes: cloneNodes(nodes),
        rootId,
        word,
        currentNodeId: rootId,
        description: `insert("${word}"): Start at root, traverse/create nodes for each character`,
        codeLine: 4,
        variables: { word: `"${word}"` },
      });

      let currentId = rootId;
      const path: string[] = [rootId];

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const currentNode = nodes.get(currentId)!;

        if (currentNode.children.has(char)) {
          // Character exists, traverse
          const nextId = currentNode.children.get(char)!;
          path.push(nextId);

          steps.push({
            operation: 'traverse',
            nodes: cloneNodes(nodes),
            rootId,
            word,
            currentNodeId: nextId,
            highlightChar: char,
            highlightPath: [...path],
            description: `'${char}' exists → traverse to child node`,
            codeLine: 9,
            variables: { char: `'${char}'`, i, word: `"${word}"` },
          });

          currentId = nextId;
        } else {
          // Create new node
          const newId = generateNodeId();
          nodes.set(newId, {
            id: newId,
            char,
            children: new Map(),
            isEndOfWord: false,
          });
          currentNode.children.set(char, newId);
          path.push(newId);

          steps.push({
            operation: 'create',
            nodes: cloneNodes(nodes),
            rootId,
            word,
            currentNodeId: newId,
            highlightChar: char,
            highlightPath: [...path],
            description: `'${char}' not found → create new node`,
            codeLine: 8,
            variables: { char: `'${char}'`, i, word: `"${word}"` },
          });

          currentId = newId;
        }
      }

      // Mark end of word
      const endNode = nodes.get(currentId)!;
      endNode.isEndOfWord = true;
      endNode.word = word;

      steps.push({
        operation: 'markEnd',
        nodes: cloneNodes(nodes),
        rootId,
        word,
        currentNodeId: currentId,
        highlightPath: path,
        description: `Mark node as end of word "${word}"`,
        codeLine: 10,
        variables: { word: `"${word}"`, isEndOfWord: 'true' },
      });
    } else if (op === 'search') {
      // Search operation
      steps.push({
        operation: 'search',
        nodes: cloneNodes(nodes),
        rootId,
        word,
        currentNodeId: rootId,
        description: `search("${word}"): Check if word exists in Trie`,
        codeLine: 12,
        variables: { word: `"${word}"` },
      });

      let currentId = rootId;
      const path: string[] = [rootId];
      let found = true;

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const currentNode = nodes.get(currentId)!;

        if (currentNode.children.has(char)) {
          const nextId = currentNode.children.get(char)!;
          path.push(nextId);

          steps.push({
            operation: 'traverse',
            nodes: cloneNodes(nodes),
            rootId,
            word,
            currentNodeId: nextId,
            highlightChar: char,
            highlightPath: [...path],
            description: `'${char}' found → continue searching`,
            codeLine: 17,
            variables: { char: `'${char}'`, i, word: `"${word}"` },
          });

          currentId = nextId;
        } else {
          found = false;
          steps.push({
            operation: 'notFound',
            nodes: cloneNodes(nodes),
            rootId,
            word,
            currentNodeId: currentId,
            highlightChar: char,
            highlightPath: path,
            description: `'${char}' not found → word "${word}" does not exist`,
            codeLine: 16,
            variables: { char: `'${char}'`, result: 'false' },
          });
          break;
        }
      }

      if (found) {
        const endNode = nodes.get(currentId)!;
        if (endNode.isEndOfWord) {
          steps.push({
            operation: 'found',
            nodes: cloneNodes(nodes),
            rootId,
            word,
            currentNodeId: currentId,
            highlightPath: path,
            description: `✓ Found! "${word}" exists in Trie`,
            codeLine: 18,
            variables: { word: `"${word}"`, result: 'true' },
          });
        } else {
          steps.push({
            operation: 'notFound',
            nodes: cloneNodes(nodes),
            rootId,
            word,
            currentNodeId: currentId,
            highlightPath: path,
            description: `Path exists but not marked as word end → "${word}" is only a prefix`,
            codeLine: 18,
            variables: { word: `"${word}"`, result: 'false' },
          });
        }
      }
    } else if (op === 'prefix') {
      // Prefix search (find all words with prefix)
      steps.push({
        operation: 'prefix',
        nodes: cloneNodes(nodes),
        rootId,
        prefix: word,
        currentNodeId: rootId,
        description: `startsWith("${word}"): Find all words with this prefix`,
        codeLine: 12,
        variables: { prefix: `"${word}"` },
      });

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
        // Collect all words with this prefix
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
          description: `Found ${matchedWords.length} word(s) with prefix "${word}": ${matchedWords.join(', ')}`,
          codeLine: 18,
          variables: { prefix: `"${word}"`, count: matchedWords.length },
        });
      } else {
        steps.push({
          operation: 'notFound',
          nodes: cloneNodes(nodes),
          rootId,
          prefix: word,
          highlightPath: path,
          description: `No words found with prefix "${word}"`,
          codeLine: 16,
          variables: { prefix: `"${word}"`, count: 0 },
        });
      }
    }
  }

  // Final state
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
    description: `✓ Done! Trie contains ${allWords.length} words: ${allWords.join(', ')}`,
    codeLine: -1,
  });

  return steps;
}

// Recursive component to render trie nodes
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
    nodeStyle = 'border-blue-400 bg-blue-100 ring-2 ring-blue-300';
  } else if (isInPath) {
    nodeStyle = 'border-amber-400 bg-amber-100';
  }
  if (node.isEndOfWord) {
    nodeStyle += ' ring-2 ring-green-400';
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          w-10 h-10 rounded-lg border-2 flex items-center justify-center
          text-sm font-bold transition-all duration-300
          ${nodeStyle}
        `}
      >
        {node.char || '∅'}
      </div>
      {node.isEndOfWord && (
        <div className="text-[9px] text-green-600 font-medium mt-0.5">
          {node.word}
        </div>
      )}
      {children.length > 0 && (
        <>
          <div className="w-0.5 h-4 bg-gray-300" />
          <div className="flex gap-2">
            {children.map(([char, childId]) => (
              <div key={childId} className="flex flex-col items-center">
                <div className="text-[10px] text-gray-500 mb-1">{char}</div>
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

const TrieVisualizerComponent: React.FC<TrieVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'trie-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'trie', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateTrieSteps, []);

  const {
    steps,
    currentStep,
    currentStepData,
    isPlaying,
    speed,
    setSpeed,
    handlePlayPause,
    handleStep,
    handleStepBack,
    handleReset,
  } = useVisualizerPlayback<TrieStep>({
    generateSteps,
  });

  const stepData: TrieStep = currentStepData || {
    operation: 'init' as const,
    nodes: new Map(),
    rootId: '',
    description: '',
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'notFound') return 'error' as const;
    if (stepData.operation === 'found' || stepData.operation === 'markEnd') return 'success' as const;
    if (stepData.operation === 'done') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
        <div className="text-sm font-semibold text-teal-800 mb-2">
          🌲 Trie - Prefix Tree
        </div>
        <div className="text-xs text-teal-700 space-y-1">
          <div>• Each node represents a character</div>
          <div>• Words share common prefixes (space efficient)</div>
          <div>• Perfect for autocomplete & spell checking</div>
          <div>• m = word length, n = number of words</div>
        </div>
      </div>

      {/* Trie Visualization */}
      <div className="flex justify-center overflow-x-auto py-4">
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
      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200 min-h-[64px]">
        <div className="text-xs font-medium text-purple-800 mb-2">
          Words found:
        </div>
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {stepData.matchedWords && stepData.matchedWords.length > 0 ? (
            stepData.matchedWords.map((word) => (
              <span
                key={word}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded font-mono"
              >
                {word}
              </span>
            ))
          ) : (
            <span className="text-xs text-purple-400 italic">No words matched yet...</span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Trie (Prefix Tree)"
      badges={BADGES}
      gradient="teal"
      className={className}
      minHeight={400}
      onShare={handleShare}
      status={{
        description: stepData.description,
        currentStep,
        totalSteps: steps.length,
        variant: getStatusVariant(),
      }}
      controls={{
        isPlaying,
        currentStep,
        totalSteps: steps.length,
        speed,
        onPlayPause: handlePlayPause,
        onStep: handleStep,
        onStepBack: handleStepBack,
        onReset: handleReset,
        onSpeedChange: setSpeed,
        accentColor: 'teal',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? TRIE_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const TrieVisualizer = React.memo(TrieVisualizerComponent);
export default TrieVisualizer;
