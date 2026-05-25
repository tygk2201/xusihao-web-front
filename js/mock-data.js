const MockData = {
  reports: [
    {
      id: "doc-001",
      name: "3号机组故障分析报告",
      type: "故障分析报告",
      status: "completed",
      uploadedAt: "2026-05-20 14:15",
      systems: 5,
      equipments: 47,
      relations: 23,
      completion: 100
    },
    {
      id: "doc-002",
      name: "冷却系统改造设计报告",
      type: "设计报告",
      status: "need_review",
      uploadedAt: "2026-05-21 09:40",
      systems: 4,
      equipments: 32,
      relations: 16,
      completion: 78
    },
    {
      id: "doc-003",
      name: "主变压器设备手册",
      type: "设备手册",
      status: "processing",
      uploadedAt: "2026-05-22 10:12",
      systems: 2,
      equipments: 18,
      relations: 6,
      completion: 45
    }
  ],

  hierarchy: {
    id: "root",
    name: "联合循环电站",
    type: "System",
    children: [
      {
        id: "sys-power",
        name: "供电系统",
        type: "System",
        children: [
          {
            id: "equ-transformer",
            name: "主变压器",
            type: "Equipment",
            parameters: [
              { name: "额定容量", value: 50000, unit: "kVA", source: "表T-201" },
              { name: "额定电压", value: 110, unit: "kV", source: "表T-201" }
            ],
            children: []
          },
          { id: "equ-switchgear", name: "高压配电柜", type: "Equipment", parameters: [], children: [] }
        ]
      },
      {
        id: "sys-cooling",
        name: "冷却系统",
        type: "System",
        children: [
          {
            id: "equ-pump",
            name: "循环水泵",
            type: "Equipment",
            parameters: [
              { name: "流量", value: 1200, unit: "m³/h", source: "表P-101" },
              { name: "功率", value: 250, unit: "kW", source: "表P-101" },
              { name: "扬程", value: 85, unit: "m", source: "文本" }
            ],
            children: [
              { id: "comp-impeller", name: "叶轮", type: "Component", parameters: [], children: [] },
              { id: "comp-bearing", name: "轴承", type: "Component", parameters: [], children: [] },
              { id: "comp-seal", name: "密封件", type: "Component", parameters: [], children: [] }
            ]
          },
          { id: "equ-tower", name: "冷却塔", type: "Equipment", parameters: [], children: [] }
        ]
      },
      {
        id: "sys-thermal",
        name: "热力系统",
        type: "System",
        children: [
          { id: "equ-turbine", name: "燃气轮机", type: "Equipment", parameters: [], children: [] },
          { id: "equ-boiler", name: "余热锅炉", type: "Equipment", parameters: [], children: [] }
        ]
      }
    ]
  },

  parameters: [
    { id: 1, equipmentId: "equ-transformer", equipmentName: "主变压器", paramName: "额定容量", value: 50000, unit: "kVA", source: "表T-201" },
    { id: 2, equipmentId: "equ-transformer", equipmentName: "主变压器", paramName: "额定电压", value: 110, unit: "kV", source: "表T-201" },
    { id: 3, equipmentId: "equ-pump", equipmentName: "循环水泵", paramName: "流量", value: 1200, unit: "m³/h", source: "表P-101" },
    { id: 4, equipmentId: "equ-pump", equipmentName: "循环水泵", paramName: "功率", value: 250, unit: "kW", source: "表P-101" },
    { id: 5, equipmentId: "equ-pump", equipmentName: "循环水泵", paramName: "扬程", value: 85, unit: "m", source: "文本" },
    { id: 6, equipmentId: "equ-turbine", equipmentName: "燃气轮机", paramName: "出力", value: 150, unit: "MW", source: "表G-001" },
    { id: 7, equipmentId: "equ-turbine", equipmentName: "燃气轮机", paramName: "热效率", value: 38.5, unit: "%", source: "文本" }
  ],

  relations: [
    { id: 1, type: "composition", source: "sys-power", sourceName: "供电系统", target: "equ-transformer", targetName: "主变压器", label: "包含" },
    { id: 2, type: "composition", source: "sys-cooling", sourceName: "冷却系统", target: "equ-pump", targetName: "循环水泵", label: "包含" },
    { id: 3, type: "composition", source: "equ-pump", sourceName: "循环水泵", target: "comp-bearing", targetName: "轴承", label: "包含" },
    { id: 4, type: "impact", source: "bearing-wear", sourceName: "轴承磨损", sourceType: "Condition", target: "rotor-imbalance", targetName: "转子失衡", targetType: "Condition", label: "导致" },
    { id: 5, type: "impact", source: "rotor-imbalance", sourceName: "转子失衡", sourceType: "Condition", target: "vibration-high", targetName: "振动超标", targetType: "Condition", label: "导致" },
    { id: 6, type: "impact", source: "vibration-high", sourceName: "振动超标", sourceType: "Condition", target: "alarm", targetName: "报警装置启动", targetType: "Event", label: "触发" },
    { id: 7, type: "impact", source: "alarm", sourceName: "报警装置启动", sourceType: "Event", target: "shutdown", targetName: "紧急停机", targetType: "Event", label: "触发" },
    { id: 8, type: "impact", source: "shutdown", sourceName: "紧急停机", sourceType: "Event", target: "replace-bearing", targetName: "更换轴承", targetType: "Measure", label: "触发" },
    { id: 9, type: "impact", source: "cooling-loss", sourceName: "冷却中断", sourceType: "Condition", target: "temperature-rise", targetName: "温度升高", targetType: "Condition", label: "导致" }
  ]
};
