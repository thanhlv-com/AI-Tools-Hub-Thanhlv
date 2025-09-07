/**
 * Utility functions for adding step-by-step indexing to diagrams
 * Adds numbered steps to sequence diagrams and other step-ordered diagram types
 */

// Diagram types that benefit from step indexing
export const STEP_INDEXED_DIAGRAM_TYPES = [
  'sequence-diagram',
  'activity-diagram', 
  'flowchart',
  'timeline',
  'user-journey',
  'gantt-chart'
];

/**
 * Checks if a diagram type should have step indexing
 */
export function shouldAddStepIndexing(diagramType: string): boolean {
  return STEP_INDEXED_DIAGRAM_TYPES.includes(diagramType);
}

/**
 * Adds step-by-step indices to Mermaid diagram code
 */
export function addMermaidStepIndexing(diagramCode: string, diagramType: string): string {
  if (!shouldAddStepIndexing(diagramType)) {
    return diagramCode;
  }

  switch (diagramType) {
    case 'sequence-diagram':
      return addSequenceDiagramSteps(diagramCode);
    case 'activity-diagram':
      return addActivityDiagramSteps(diagramCode);
    case 'flowchart':
      return addFlowchartSteps(diagramCode);
    case 'timeline':
      return addTimelineSteps(diagramCode);
    case 'user-journey':
      return addUserJourneySteps(diagramCode);
    case 'gantt-chart':
      return addGanttSteps(diagramCode);
    default:
      return diagramCode;
  }
}

/**
 * Adds step indices to PlantUML diagram code
 */
export function addPlantUMLStepIndexing(diagramCode: string, diagramType: string): string {
  if (!shouldAddStepIndexing(diagramType)) {
    return diagramCode;
  }

  switch (diagramType) {
    case 'sequence-diagram':
      return addPlantUMLSequenceSteps(diagramCode);
    case 'activity-diagram':
      return addPlantUMLActivitySteps(diagramCode);
    default:
      return diagramCode;
  }
}

/**
 * Adds step indices to ASCII diagram code
 */
export function addASCIIStepIndexing(diagramCode: string, diagramType: string): string {
  if (!shouldAddStepIndexing(diagramType)) {
    return diagramCode;
  }

  // For ASCII diagrams, add step numbers at the beginning of lines with arrows or process indicators
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for arrows, process indicators, or steps in ASCII diagrams
    if (line.match(/^\s*[│├└┌┐┘┤┬┴┼─→←↑↓▲▼►◄]/) || 
        line.match(/^\s*\d+[.)]/) ||
        line.match(/->|<-|\||\+/)) {
      // Add step number if line doesn't already have one
      if (!line.match(/^\s*\d+[.)]/)) {
        return `${stepCounter++}. ${line.trim()}`;
      }
    }
    return line;
  });

  return processedLines.join('\n');
}

/**
 * Main function to add step indexing based on diagram format and type
 */
export function addStepIndexing(diagramCode: string, diagramType: string, outputFormat: string): string {
  if (!shouldAddStepIndexing(diagramType)) {
    return diagramCode;
  }

  switch (outputFormat) {
    case 'mermaid':
      return addMermaidStepIndexing(diagramCode, diagramType);
    case 'plantuml':
      return addPlantUMLStepIndexing(diagramCode, diagramType);
    case 'ascii':
      return addASCIIStepIndexing(diagramCode, diagramType);
    default:
      return diagramCode;
  }
}

// Specific implementations for each diagram type

function addSequenceDiagramSteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for Mermaid sequence diagram message lines (A->>B: message)
    const messageMatch = line.match(/^(\s*)([A-Za-z][A-Za-z0-9_]*)\s*([-→>]+)\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.+)$/);
    if (messageMatch) {
      const [, indent, sender, arrow, receiver, message] = messageMatch;
      // Add step number to the message
      return `${indent}${sender}${arrow}${receiver}: ${stepCounter++}. ${message}`;
    }
    
    // Look for note lines
    const noteMatch = line.match(/^(\s*)(note\s+(right|left|over)\s+[^:]+:\s*)(.+)$/i);
    if (noteMatch) {
      const [, indent, notePrefix, , content] = noteMatch;
      return `${indent}${notePrefix}${stepCounter++}. ${content}`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addActivityDiagramSteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for activity nodes in Mermaid activity diagrams
    const activityMatch = line.match(/^(\s*)([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/);
    if (activityMatch) {
      const [, indent, from, to, label] = activityMatch;
      return `${indent}${from} --> ${to} : ${stepCounter++}. ${label}`;
    }
    
    // Look for node definitions
    const nodeMatch = line.match(/^(\s*)([A-Za-z0-9_]+)\s*\[\s*(.+)\s*\]$/);
    if (nodeMatch) {
      const [, indent, nodeId, label] = nodeMatch;
      return `${indent}${nodeId}[${stepCounter++}. ${label}]`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addFlowchartSteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for flowchart node definitions with labels
    const nodeMatch = line.match(/^(\s*)([A-Za-z0-9_]+)\s*\[\s*(.+?)\s*\]$/);
    if (nodeMatch) {
      const [, indent, nodeId, label] = nodeMatch;
      // Don't add step numbers to start/end nodes
      if (!label.match(/^(start|end|begin|finish)$/i)) {
        return `${indent}${nodeId}[${stepCounter++}. ${label}]`;
      }
    }
    
    // Look for diamond decision nodes
    const decisionMatch = line.match(/^(\s*)([A-Za-z0-9_]+)\s*\{\s*(.+?)\s*\}$/);
    if (decisionMatch) {
      const [, indent, nodeId, label] = decisionMatch;
      return `${indent}${nodeId}{${stepCounter++}. ${label}}`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addTimelineSteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for timeline events
    const eventMatch = line.match(/^(\s*)(.+?)\s*:\s*(.+)$/);
    if (eventMatch && !line.includes('timeline') && !line.includes('title')) {
      const [, indent, date, event] = eventMatch;
      return `${indent}${date} : ${stepCounter++}. ${event}`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addUserJourneySteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for user journey steps
    const journeyMatch = line.match(/^(\s*)(.+?)\s*:\s*(\d+)\s*:\s*(.+)$/);
    if (journeyMatch && !line.includes('journey') && !line.includes('title')) {
      const [, indent, action, score, actors] = journeyMatch;
      return `${indent}${stepCounter++}. ${action} : ${score} : ${actors}`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addGanttSteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for Gantt chart tasks
    const taskMatch = line.match(/^(\s*)(.+?)\s*:\s*(.*?)$/);
    if (taskMatch && !line.includes('gantt') && !line.includes('title') && !line.includes('dateFormat') && !line.includes('section')) {
      const [, indent, taskName, taskDetails] = taskMatch;
      if (!taskName.includes('section')) {
        return `${indent}${stepCounter++}. ${taskName} : ${taskDetails}`;
      }
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addPlantUMLSequenceSteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for PlantUML sequence diagram messages
    const messageMatch = line.match(/^(\s*)([A-Za-z][A-Za-z0-9_]*)\s*(->|-->|->>|<<--)\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.+)$/);
    if (messageMatch) {
      const [, indent, sender, arrow, receiver, message] = messageMatch;
      return `${indent}${sender} ${arrow} ${receiver} : ${stepCounter++}. ${message}`;
    }
    
    // Look for note lines
    const noteMatch = line.match(/^(\s*)(note\s+(right|left|over)\s*.*?:\s*)(.+)$/i);
    if (noteMatch) {
      const [, indent, notePrefix, , content] = noteMatch;
      return `${indent}${notePrefix}${stepCounter++}. ${content}`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}

function addPlantUMLActivitySteps(diagramCode: string): string {
  const lines = diagramCode.split('\n');
  let stepCounter = 1;
  
  const processedLines = lines.map(line => {
    // Look for PlantUML activity steps
    const activityMatch = line.match(/^(\s*):\s*(.+?)\s*;$/);
    if (activityMatch) {
      const [, indent, activity] = activityMatch;
      return `${indent}: ${stepCounter++}. ${activity};`;
    }
    
    return line;
  });

  return processedLines.join('\n');
}