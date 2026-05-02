import type { CodeDrawingType } from '@platejs/code-drawing';

export type CodeDrawingPreset = {
  code: string;
  drawingType: CodeDrawingType;
  id: string;
  label: string;
};

const trimPresetCode = (value: string) => value.trim().replace(/\r\n/g, '\n');

export const CODE_DRAWING_PRESET_VALUE_PREFIX = 'preset:';

export const CODE_DRAWING_PRESETS: CodeDrawingPreset[] = [
  {
    id: 'mermaid-flowchart',
    label: 'Mermaid: Flowchart',
    drawingType: 'Mermaid',
    code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[Alternative]
    C --> E[End]
    D --> E`,
  },
  {
    id: 'mermaid-sequence',
    label: 'Mermaid: Sequence Diagram',
    drawingType: 'Mermaid',
    code: `sequenceDiagram
    participant Client
    participant Server
    participant Database
    Client->>Server: Request data
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>Client: Response`,
  },
  {
    id: 'mermaid-class',
    label: 'Mermaid: Class Diagram',
    drawingType: 'Mermaid',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    Animal <|-- Dog`,
  },
  {
    id: 'mermaid-state',
    label: 'Mermaid: State Diagram',
    drawingType: 'Mermaid',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> [*]
    Error --> Idle: Retry`,
  },
  {
    id: 'mermaid-er',
    label: 'Mermaid: Entity Relationship',
    drawingType: 'Mermaid',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int orderNumber
        date orderDate
    }`,
  },
  {
    id: 'mermaid-gantt',
    label: 'Mermaid: Gantt Chart',
    drawingType: 'Mermaid',
    code: `gantt
    title Project Schedule
    dateFormat  YYYY-MM-DD
    section Planning
    Research           :a1, 2024-01-01, 7d
    Design             :a2, after a1, 5d
    section Development
    Implementation     :a3, after a2, 10d
    Testing            :a4, after a3, 5d`,
  },
  {
    id: 'mermaid-pie',
    label: 'Mermaid: Pie Chart',
    drawingType: 'Mermaid',
    code: `pie title Distribution
    "Category A" : 45
    "Category B" : 30
    "Category C" : 15
    "Category D" : 10`,
  },
  {
    id: 'mermaid-journey',
    label: 'Mermaid: User Journey',
    drawingType: 'Mermaid',
    code: `journey
    title User Shopping Experience
    section Browse
      View Products: 5: Customer
      Filter Results: 3: Customer
    section Purchase
      Add to Cart: 4: Customer
      Checkout: 2: Customer`,
  },
  {
    id: 'mermaid-git-graph',
    label: 'Mermaid: Git Graph',
    drawingType: 'Mermaid',
    code: `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit`,
  },
  {
    id: 'mermaid-mindmap',
    label: 'Mermaid: Mindmap',
    drawingType: 'Mermaid',
    code: `mindmap
  root((Project))
    Planning
      Requirements
      Design
    Development
      Frontend
      Backend
    Testing
      Unit Tests
      Integration`,
  },
  {
    id: 'mermaid-requirement',
    label: 'Mermaid: Requirement Diagram',
    drawingType: 'Mermaid',
    code: `requirementDiagram
    requirement user_req {
        id: 1
        text: User shall be able to login
        risk: high
        verifymethod: test
    }
    element login_system {
        type: system
    }
    user_req - satisfies -> login_system`,
  },
  {
    id: 'mermaid-c4',
    label: 'Mermaid: C4 Diagram',
    drawingType: 'Mermaid',
    code: `C4Context
    title System Context diagram for Internet Banking System
    Person(customer, "Customer", "A customer of the bank")
    System(banking, "Internet Banking System", "Allows customers to view information")
    System_Ext(email, "E-mail System", "Sends e-mails")
    Rel(customer, banking, "Uses")
    Rel(banking, email, "Sends e-mails using")`,
  },
  {
    id: 'mermaid-sankey',
    label: 'Mermaid: Sankey Diagram',
    drawingType: 'Mermaid',
    code: `sankey-beta
    Agricultural 'waste',Bio-conversion,124.729
    Bio-conversion,Liquid,0.597
    Bio-conversion,Losses,26.862
    Bio-conversion,Solid,280.322
    Bio-conversion,Gas,81.144`,
  },
  {
    id: 'mermaid-xy',
    label: 'Mermaid: XY Chart',
    drawingType: 'Mermaid',
    code: `xychart-beta
    title "Sales Revenue"
    x-axis [Jan, Feb, Mar, Apr, May]
    y-axis "Revenue (in $)" 0 --> 100
    line [30, 40, 50, 60, 70]
    bar [20, 30, 40, 50, 60]`,
  },
  {
    id: 'mermaid-quadrant',
    label: 'Mermaid: Quadrant Chart',
    drawingType: 'Mermaid',
    code: `quadrantChart
    title Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Quick Wins
    quadrant-2 Major Projects
    quadrant-3 Fill-Ins
    quadrant-4 Hard Slogs
    Feature A: [0.3, 0.8]
    Feature B: [0.7, 0.7]
    Feature C: [0.2, 0.3]`,
  },
  {
    id: 'graphviz-directed',
    label: 'Graphviz: Directed Graph',
    drawingType: 'Graphviz',
    code: `digraph G {
  rankdir=LR;
  Start -> Decision;
  Decision -> Process [label="yes"];
  Decision -> Alternative [label="no"];
  Process -> End;
  Alternative -> End;
}`,
  },
  {
    id: 'flowchart-basic',
    label: 'Flowchart.js: Process',
    drawingType: 'Flowchart',
    code: `st=>start: Start
op=>operation: Process
cond=>condition: Continue?
e=>end: End

st->op->cond
cond(yes)->op
cond(no)->e`,
  },
];

const PRESET_CODE_SET = new Set(
  CODE_DRAWING_PRESETS.map((preset) => trimPresetCode(preset.code))
);

export const getCodeDrawingPresetValue = (preset: CodeDrawingPreset) =>
  `${CODE_DRAWING_PRESET_VALUE_PREFIX}${preset.id}`;

export const getCodeDrawingPresetByValue = (value: string) => {
  if (!value.startsWith(CODE_DRAWING_PRESET_VALUE_PREFIX)) {
    return null;
  }

  const id = value.slice(CODE_DRAWING_PRESET_VALUE_PREFIX.length);
  return CODE_DRAWING_PRESETS.find((preset) => preset.id === id) ?? null;
};

export const canReplaceCodeDrawingCodeWithPreset = (currentCode: string) => {
  const normalized = trimPresetCode(currentCode);
  return normalized.length === 0 || PRESET_CODE_SET.has(normalized);
};
