import type { Meta, StoryObj } from '@storybook/react-vite';
import { MermaidDiagram } from '../diagram';

const meta: Meta<typeof MermaidDiagram> = {
  title: 'Diagrams/MermaidDiagram',
  component: MermaidDiagram,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MermaidDiagram>;

export const Flowchart: Story = {
  args: {
    chart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`,
  },
};

export const SequenceDiagram: Story = {
  args: {
    chart: `sequenceDiagram
    participant Client
    participant Server
    participant Database

    Client->>Server: Request Data
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>Client: Response`,
  },
};

export const ClassDiagram: Story = {
  args: {
    chart: `classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }

    class Article {
        +String title
        +String content
        +publish()
    }

    User "1" --> "*" Article : writes`,
  },
};

export const ERDiagram: Story = {
  args: {
    chart: `erDiagram
    USER ||--o{ ARTICLE : writes
    ARTICLE ||--o{ COMMENT : has
    USER ||--o{ COMMENT : posts

    USER {
        int id
        string name
        string email
    }

    ARTICLE {
        int id
        string title
        string content
    }`,
  },
};

export const StateDiagram: Story = {
  args: {
    chart: `stateDiagram-v2
    [*] --> Draft
    Draft --> Review: Submit
    Review --> Published: Approve
    Review --> Draft: Reject
    Published --> [*]`,
  },
};

export const PieChart: Story = {
  args: {
    chart: `pie title Languages Used
    "JavaScript" : 45
    "TypeScript" : 30
    "Python" : 15
    "Other" : 10`,
  },
};

export const GitGraph: Story = {
  args: {
    chart: `gitGraph
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
    commit`,
  },
};
