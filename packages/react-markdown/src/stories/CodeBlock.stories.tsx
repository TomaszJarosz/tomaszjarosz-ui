import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlockWithLanguage, SimpleCodeBlock, InlineCode } from '../code';

const meta: Meta<typeof CodeBlockWithLanguage> = {
  title: 'Code/CodeBlockWithLanguage',
  component: CodeBlockWithLanguage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeBlockWithLanguage>;

const javaCode = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

const typescriptCode = `interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}`;

const longCode = Array.from({ length: 50 }, (_, i) =>
  `// Line ${i + 1}: Some code here`
).join('\n');

export const Java: Story = {
  args: {
    language: 'java',
    code: javaCode,
    highlightLines: [],
    codeStyle: {},
  },
};

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    code: typescriptCode,
    highlightLines: [],
    codeStyle: {},
  },
};

export const WithHighlightedLines: Story = {
  args: {
    language: 'typescript',
    code: typescriptCode,
    highlightLines: [1, 2, 3, 4, 5],
    codeStyle: {},
  },
};

export const LongCodeCollapsible: Story = {
  args: {
    language: 'javascript',
    code: longCode,
    highlightLines: [],
    codeStyle: {},
  },
};

export const DiffMode: Story = {
  args: {
    language: 'diff',
    code: `- const oldValue = 1;
+ const newValue = 2;
  const unchanged = 3;`,
    highlightLines: [],
    codeStyle: {},
  },
};

// SimpleCodeBlock stories
const simpleCodeMeta: Meta<typeof SimpleCodeBlock> = {
  title: 'Code/SimpleCodeBlock',
  component: SimpleCodeBlock,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export const SimpleCodeBlockStory: StoryObj<typeof SimpleCodeBlock> = {
  render: () => (
    <SimpleCodeBlock code="npm install @tomaszjarosz/react-markdown" props={{}}>
      npm install @tomaszjarosz/react-markdown
    </SimpleCodeBlock>
  ),
};

// InlineCode stories
export const InlineCodeStory: StoryObj<typeof InlineCode> = {
  render: () => (
    <p>
      Use <InlineCode>const x = 1</InlineCode> to declare a variable.
    </p>
  ),
};
