const AppState = {
  user: {
    name: "张建国",
    role: "高级架构师"
  },
  currentPage: "dashboard",
  currentDoc: MockData.reports[0],
  parseResult: {
    hierarchy: MockData.hierarchy,
    parameters: MockData.parameters,
    relations: MockData.relations,
    annotations: [],
    rawParse: {
      texts: [],
      tables: [],
      formulas: [],
      images: [],
      entities: []
    }
  },
  graphState: {
    mode: "composition",
    selectedNodeId: "equ-pump",
    highlightPath: null,
    expandedNodes: new Set(["root", "sys-power", "sys-cooling", "sys-thermal", "equ-pump"])
  },
  qaState: {
    sessions: [],
    currentSessionId: "session-001",
    messages: [],
    isGenerating: false
  }
};
