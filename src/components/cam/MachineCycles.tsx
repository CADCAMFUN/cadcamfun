import React, { useState } from 'react';

export interface CycleParameter {
  name: string;
  label: string;
  type: 'number' | 'select' | 'checkbox';
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  unit?: string;
  description?: string;
}

export interface CycleTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  controllerTypes: ('fanuc' | 'heidenhain')[];
  parameters: CycleParameter[];
  generateCode: (params: Record<string, any>, controllerType: 'fanuc' | 'heidenhain') => string;
}

interface MachineCyclesProps {
  controllerType: 'fanuc' | 'heidenhain';
  onCycleCodeGenerated: (code: string) => void;
}

const MachineCycles: React.FC<MachineCyclesProps> = ({ controllerType, onCycleCodeGenerated }) => {
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [cycleParams, setCycleParams] = useState<Record<string, any>>({});
  const [previewCode, setPreviewCode] = useState<string>('');

  // Collection of predefined cycles
  const cycleTemplates: CycleTemplate[] = [
    // Simple drilling cycle
    {
      id: 'simple-drilling',
      name: 'Simple Drilling',
      description: 'Base drilling cycle with depth and feedrate',
      icon: <DrillIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'drillDiameter',
          label: 'Drill Diameter',
          type: 'number',
          defaultValue: 8,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the drill bit to use' 
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 20,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total drilling depth'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for drilling'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 1000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'retractHeight',
          label: 'Retract Height',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Return height of the drill after drilling'
        },
        {
          name: 'dwellTime',
          label: 'Dwell Time',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 100,
          step: 0.1,
          unit: 'sec',
          description: 'Dwell time at the bottom (0 for no dwell)'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(SIMPLE DRILLING CYCLE)
(DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z${params.retractHeight} H1
S${params.spindleSpeed} M3
G00 X0 Y0
G99 G81 R${params.retractHeight} Z-${params.depth} F${params.feedrate} P${params.dwellTime * 1000}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z${params.retractHeight}
M5`;
        } else {
          return `; SIMPLE DRILLING CYCLE
; DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+${params.retractHeight} R0 FMAX
CYCL DEF 200 DRILLING
  Q200=${params.retractHeight}  ; SAFETY DISTANCE
  Q201=-${params.depth}         ; DEPTH
  Q206=${params.feedrate}       ; FEEDRATE FOR PLUNGING
  Q202=${params.depth}          ; PLUNGING DEPTH
  Q210=0                        ; DWELL TIME AT TOP
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q211=${params.dwellTime}      ; DWELL TIME AT BOTTOM
L X+0 Y+0 R0 FMAX M99
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+${params.retractHeight} FMAX
M5`;
        }
      }
    },
    
    // Rectangular pocket cycle
    {
      id: 'rectangular-pocket',
      name: 'Rectangular Pocket',
      description: 'Cycle for milling a rectangular pocket',
      icon: <PocketIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the milling cutter to use'
        },
        {
          name: 'pocketWidth',
          label: 'Pocket Width',
          type: 'number',
          defaultValue: 50,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Width of the pocket along the X-axis'
        },
        {
          name: 'pocketLength',
          label: 'Pocket Length',
          type: 'number',
          defaultValue: 80,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Length of the pocket along the Y-axis'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 15,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the pocket'
        },
        {
          name: 'stepdown',
          label: 'Z Increment',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of cut for each increment'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 800,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 300,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging in Z'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'cornerRadius',
          label: 'Corner Radius',
          type: 'number',
          defaultValue: 5,
          min: 0,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Radius of the pocket corners (0 for sharp corners)'
        },
        {
          name: 'finishAllowance',
          label: 'Finish Allowance',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 10,
          step: 0.05,
          unit: 'mm',
          description: 'Stock left for finishing'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(RECTANGULAR POCKET CYCLE)
(DIMENSIONS: ${params.pocketWidth}x${params.pocketLength}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X${-params.pocketWidth/2 + params.toolDiameter/2 + params.finishAllowance} Y${-params.pocketLength/2 + params.toolDiameter/2 + params.finishAllowance}
${Array.from({ length: Math.ceil(params.depth / params.stepdown) }).map((_, i) => {
  const currentDepth = Math.min((i + 1) * params.stepdown, params.depth);
  return `
(PASS ${i + 1} - DEPTH: ${currentDepth}mm)
G01 Z-${currentDepth} F${params.plungeFeedrate}
G01 X${params.pocketWidth/2 - params.toolDiameter/2 - params.finishAllowance} F${params.feedrate}
G01 Y${params.pocketLength/2 - params.toolDiameter/2 - params.finishAllowance}
G01 X${-params.pocketWidth/2 + params.toolDiameter/2 + params.finishAllowance}
G01 Y${-params.pocketLength/2 + params.toolDiameter/2 + params.finishAllowance}`;
}).join('')}
G00 Z50
M9
M5`;
        } else {
          return `; RECTANGULAR POCKET CYCLE
; DIMENSIONS: ${params.pocketWidth}x${params.pocketLength}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 251 RECTANGULAR POCKET
  Q215=0                        ; MACHINING TYPE
  Q218=${params.pocketWidth}    ; LENGTH SIDE 1
  Q219=${params.pocketLength}   ; LENGTH SIDE 2
  Q220=${params.cornerRadius}   ; CORNER RADIUS
  Q368=${params.finishAllowance}; SIDE ALLOWANCE
  Q224=0                        ; ROTATION
  Q201=-${params.depth}         ; DEPTH
  Q367=0                        ; POCKET POSITION
  Q202=${params.stepdown}       ; PLUNGING DEPTH
  Q207=${params.feedrate}       ; MILLING FEEDRATE
  Q206=${params.plungeFeedrate} ; PLUNGING FEEDRATE
  Q385=${params.feedrate}       ; FINISHING FEEDRATE
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q351=+1                       ; MILLING MODE
  Q370=1                        ; PATH OVERLAP
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Contour milling cycle
    {
      id: 'contour-milling',
      name: 'Contour Milling',
      description: 'Cycle for milling an external or internal profile',
      icon: <ContourIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the milling cutter to use'
        },
        {
          name: 'contourType',
          label: 'Contour Type',
          type: 'select',
          defaultValue: 'external',
          options: [
            { value: 'external', label: 'External (right)' },
            { value: 'internal', label: 'Internal (left)' }
          ],
          description: 'Contour type: external or internal'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the contour'
        },
        {
          name: 'stepdown',
          label: 'Z Increment',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of cut for each increment'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 800,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 300,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging in Z'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'approachDistance',
          label: 'Approach Distance',
          type: 'number',
          defaultValue: 5,
          min: 0,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Distance to approach the contour'
        },
        {
          name: 'useToolCompensation',
          label: 'Use Tool Compensation',
          type: 'checkbox',
          defaultValue: true,
          description: 'Activate tool radius compensation'
        }
      ],
      generateCode: (params, controllerType) => {
        const compensationCode = params.contourType === 'external' 
          ? (controllerType === 'fanuc' ? 'G42' : 'RR')
          : (controllerType === 'fanuc' ? 'G41' : 'RL');
        
        if (controllerType === 'fanuc') {
          return `(CONTOUR MILLING CYCLE ${params.contourType === 'external' ? 'EXTERNAL' : 'INTERNAL'})
(DEPTH: ${params.depth}mm, PASSES: ${Math.ceil(params.depth / params.stepdown)})
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
${Array.from({ length: Math.ceil(params.depth / params.stepdown) }).map((_, i) => {
  const currentDepth = Math.min((i + 1) * params.stepdown, params.depth);
  return `
(PASS ${i + 1} - DEPTH: ${currentDepth}mm)
G00 X${-params.approachDistance} Y0
G00 Z5
G01 Z-${currentDepth} F${params.plungeFeedrate}
${params.useToolCompensation ? `${compensationCode} D1` : ''}
G01 X0 Y0 F${params.feedrate}
G01 X50
G01 Y50
G01 X0
G01 Y0
${params.useToolCompensation ? 'G40' : ''}
G00 Z5`;
}).join('')}
G00 Z50
M9
M5`;
        } else {
          return `; CONTOUR MILLING CYCLE ${params.contourType === 'external' ? 'EXTERNAL' : 'INTERNAL'}
; DEPTH: ${params.depth}mm, PASSES: ${Math.ceil(params.depth / params.stepdown)}
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
${Array.from({ length: Math.ceil(params.depth / params.stepdown) }).map((_, i) => {
  const currentDepth = Math.min((i + 1) * params.stepdown, params.depth);
  return `
; PASS ${i + 1} - DEPTH: ${currentDepth}mm
L X-${params.approachDistance} Y+0 R0 FMAX
L Z+5 R0 FMAX
L Z-${currentDepth} F${params.plungeFeedrate}
${params.useToolCompensation ? `L ${compensationCode} R${params.toolDiameter/2}` : ''}
L X+0 Y+0 F${params.feedrate}
L X+50
L Y+50
L X+0
L Y+0
${params.useToolCompensation ? 'L R0' : ''}
L Z+5 FMAX`;
}).join('')}
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Tapping cycle
    {
      id: 'tapping-cycle',
      name: 'Tapping',
      description: 'Tapping cycle for metric threads',
      icon: <TapIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'threadSize',
          label: 'Thread Size',
          type: 'select',
          defaultValue: 'M8',
          options: [
            { value: 'M3', label: 'M3 (pitch 0.5mm)' },
            { value: 'M4', label: 'M4 (pitch 0.7mm)' },
            { value: 'M5', label: 'M5 (pitch 0.8mm)' },
            { value: 'M6', label: 'M6 (pitch 1.0mm)' },
            { value: 'M8', label: 'M8 (pitch 1.25mm)' },
            { value: 'M10', label: 'M10 (pitch 1.5mm)' },
            { value: 'M12', label: 'M12 (pitch 1.75mm)' }
          ],
          description: 'Size of the metric thread'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 20,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the thread'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 500,
          min: 1,
          max: 10000,
          step: 10,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'rigidTapping',
          label: 'Rigid Tapping',
          type: 'checkbox',
          defaultValue: true,
          description: 'Use rigid tapping mode (synchronized)'
        },
        {
          name: 'chamferDepth',
          label: 'Chamfer Depth',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of the chamfer at the thread entrance'
        }
      ],
      generateCode: (params, controllerType) => {
        // Determine the pitch based on the thread size
        const threadPitchMap: Record<string, number> = {
          'M3': 0.5,
          'M4': 0.7,
          'M5': 0.8,
          'M6': 1.0,
          'M8': 1.25,
          'M10': 1.5,
          'M12': 1.75
        };
        const pitch = threadPitchMap[params.threadSize];
        const feedrate = params.spindleSpeed * pitch; // Feedrate for tapping
        
        if (controllerType === 'fanuc') {
          return `(TAPPING CYCLE ${params.threadSize})
(DEPTH: ${params.depth}mm, PITCH: ${pitch}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
${params.rigidTapping ? 'M29 S' + params.spindleSpeed + ' (RIGID TAPPING)' : 'S' + params.spindleSpeed + ' M3'}
G00 X0 Y0
G00 Z5
G84 R5 Z-${params.depth} F${feedrate} ${params.rigidTapping ? '' : 'P100'}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z50
M5`;
        } else {
          return `; TAPPING CYCLE ${params.threadSize}
; DEPTH: ${params.depth}mm, PITCH: ${pitch}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 207 RIGID TAPPING
  Q200=2                        ; SAFETY DISTANCE
  Q201=-${params.depth}         ; THREAD DEPTH
  Q239=${pitch}                 ; THREAD PITCH
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // NEW CYCLES ADDED
    
    // Deep drilling cycle
    {
      id: 'deep-drilling',
      name: 'Deep Drilling',
      description: 'Deep drilling cycle with chip evacuation',
      icon: <DeepDrillIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'drillDiameter',
          label: 'Drill Diameter',
          type: 'number',
          defaultValue: 8,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the drill bit to use'
        },
        {
          name: 'depth',
          label: 'Total Depth',
          type: 'number',
          defaultValue: 80,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the hole'
        },
        {
          name: 'peckDepth',
          label: 'Peck Depth',
          type: 'number',
          defaultValue: 15,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of each peck'
        },
        {
          name: 'retractDistance',
          label: 'Retract Distance',
          type: 'number',
          defaultValue: 3,
          min: 0.1,
          max: 50,
          step: 0.1,
          unit: 'mm',
          description: 'Retract distance for chip evacuation'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 120,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for drilling'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 1200,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'dwellAtBottom',
          label: 'Dwell at Bottom',
          type: 'number',
          defaultValue: 0.5,
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'sec',
          description: 'Dwell time at the bottom of each peck'
        },
        {
          name: 'useChipBreaking',
          label: 'Use Chip Breaking',
          type: 'checkbox',
          defaultValue: true,
          description: 'Activate chip breaking during drilling'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(DEEP DRILLING CYCLE)
(DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
${params.useChipBreaking ? 
  `G83 R5 Z-${params.depth} Q${params.peckDepth} F${params.feedrate} K0 P${params.dwellAtBottom * 1000}` : 
  `G73 R${params.retractDistance} Z-${params.depth} Q${params.peckDepth} F${params.feedrate} K0 P${params.dwellAtBottom * 1000}`}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z50
M9
M5`;
        } else {
          return `; DEEP DRILLING CYCLE
; DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF ${params.useChipBreaking ? '203 UNIVERSAL DRILLING' : '200 DRILLING'}
  Q200=2                        ; SAFETY DISTANCE
  Q201=-${params.depth}         ; DEPTH
  Q206=${params.feedrate}       ; FEEDRATE FOR PLUNGING
  Q202=${params.peckDepth}      ; PLUNGING DEPTH
  ${params.useChipBreaking ? `Q210=0                        ; DWELL TIME AT TOP
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q212=${params.retractDistance}; RETRACTION AMOUNT
  Q213=3                        ; NO. OF CHIP BREAKS
  Q205=1                        ; MIN. PLUNGING DEPTH
  Q211=${params.dwellAtBottom}  ; DWELL TIME AT BOTTOM
  Q208=500                      ; FEEDRATE FOR RETRACT
  Q256=${params.retractDistance}; RETRACT CHIP BREAK` : 
  `Q210=0                        ; DWELL TIME AT TOP
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q211=${params.dwellAtBottom}  ; DWELL TIME AT BOTTOM`}
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Slot milling cycle
    {
      id: 'slot-milling',
      name: 'Slot Milling',
      description: 'Cycle for milling linear slots',
      icon: <SlotIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 8,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the milling cutter to use'
        },
        {
          name: 'slotLength',
          label: 'Slot Length',
          type: 'number',
          defaultValue: 50,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Length of the slot'
        },
        {
          name: 'slotWidth',
          label: 'Slot Width',
          type: 'number',
          defaultValue: 12,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Width of the slot'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the slot'
        },
        {
          name: 'stepdown',
          label: 'Z Increment',
          type: 'number',
          defaultValue: 3,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of cut for each increment'
        },
        {
          name: 'stepover',
          label: 'Stepover',
          type: 'number',
          defaultValue: 4,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Lateral stepover between passes'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 600,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 300,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging in Z'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3500,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'angle',
          label: 'Angle',
          type: 'number',
          defaultValue: 0,
          min: -360,
          max: 360,
          step: 1,
          unit: 'degrees',
          description: 'Angle of the slot relative to the X-axis'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          // Check if slot width is greater than tool diameter
          const needsMultiplePasses = params.slotWidth > params.toolDiameter;
          const numberOfPasses = needsMultiplePasses ? Math.ceil((params.slotWidth - params.toolDiameter) / params.stepover) + 1 : 1;
          
          let code = `(SLOT MILLING CYCLE)
(DIMENSIONS: ${params.slotLength}x${params.slotWidth}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8\n`;
          
          for (let depthPass = 0; depthPass < Math.ceil(params.depth / params.stepdown); depthPass++) {
            const currentDepth = Math.min((depthPass + 1) * params.stepdown, params.depth);
            code += `(Z PASS ${depthPass + 1} - DEPTH: ${currentDepth}mm)\n`;
            
            if (needsMultiplePasses) {
              // Calculate the first lateral offset (tool center to slot edge)
              const startOffset = (params.slotWidth - params.toolDiameter) / 2;
              
              for (let widthPass = 0; widthPass < numberOfPasses; widthPass++) {
                // Calculate the lateral offset for this pass
                const offset = startOffset - (widthPass * params.stepover);
                const yOffset = offset * Math.sin(params.angle * Math.PI / 180);
                const xOffset = offset * Math.cos(params.angle * Math.PI / 180);
                
                // Calculate the start and end points of the slot with the angle
                const startX = -params.slotLength/2 * Math.cos(params.angle * Math.PI / 180) + xOffset;
                const startY = -params.slotLength/2 * Math.sin(params.angle * Math.PI / 180) + yOffset;
                const endX = params.slotLength/2 * Math.cos(params.angle * Math.PI / 180) + xOffset;
                const endY = params.slotLength/2 * Math.sin(params.angle * Math.PI / 180) + yOffset;
                
                code += `G00 X${startX.toFixed(3)} Y${startY.toFixed(3)}\n`;
                if (widthPass === 0 && depthPass === 0) {
                  code += `G00 Z5\n`;
                }
                code += `G01 Z-${currentDepth.toFixed(3)} F${params.plungeFeedrate}\n`;
                code += `G01 X${endX.toFixed(3)} Y${endY.toFixed(3)} F${params.feedrate}\n`;
                code += `G00 Z5\n`;
              }
            } else {
              // Calculate the start and end points of the slot with the angle
              const startX = -params.slotLength/2 * Math.cos(params.angle * Math.PI / 180);
              const startY = -params.slotLength/2 * Math.sin(params.angle * Math.PI / 180);
              const endX = params.slotLength/2 * Math.cos(params.angle * Math.PI / 180);
              const endY = params.slotLength/2 * Math.sin(params.angle * Math.PI / 180);
              
              code += `G00 X${startX.toFixed(3)} Y${startY.toFixed(3)}\n`;
              if (depthPass === 0) {
                code += `G00 Z5\n`;
              }
              code += `G01 Z-${currentDepth.toFixed(3)} F${params.plungeFeedrate}\n`;
              code += `G01 X${endX.toFixed(3)} Y${endY.toFixed(3)} F${params.feedrate}\n`;
              code += `G00 Z5\n`;
            }
          }
          
          code += `G00 Z50\nM9\nM5`;
          return code;
        } else {
          return `; SLOT MILLING CYCLE
; DIMENSIONS: ${params.slotLength}x${params.slotWidth}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 253 SLOT MILLING
  Q215=0                        ; MACHINING TYPE
  Q218=${params.slotLength}     ; SLOT LENGTH
  Q219=${params.slotWidth}      ; SLOT WIDTH
  Q368=0                        ; SIDE ALLOWANCE
  Q374=${params.angle}          ; ANGLE OF ROTATION
  Q367=0                        ; SLOT POSITION
  Q207=${params.feedrate}       ; MILLING FEEDRATE
  Q351=+1                       ; MILLING MODE
  Q201=-${params.depth}         ; DEPTH
  Q202=${params.stepdown}       ; PLUNGING DEPTH
  Q369=0                        ; DEPTH ALLOWANCE
  Q206=${params.plungeFeedrate} ; PLUNGING FEEDRATE
  Q338=${params.stepover}       ; FINISHING INCREMENT
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q366=0                        ; PLUNGING STRATEGY
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Boring cycle
    {
      id: 'boring-cycle',
      name: 'Boring',
      description: 'Precision boring cycle',
      icon: <BoringIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'initialDiameter',
          label: 'Initial Diameter',
          type: 'number',
          defaultValue: 20,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the pre-drilled hole'
        },
        {
          name: 'finalDiameter',
          label: 'Final Diameter',
          type: 'number',
          defaultValue: 22,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Final diameter after boring'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 30,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the boring operation'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 80,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for boring'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 800,
          min: 1,
          max: 24000,
          step: 10,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'dwellTime',
          label: 'Dwell Time',
          type: 'number',
          defaultValue: 0.5,
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'sec',
          description: 'Dwell time at the bottom for finishing'
        },
        {
          name: 'retractFeedrate',
          label: 'Retract Feedrate',
          type: 'number',
          defaultValue: 150,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for retraction'
        },
        {
          name: 'orientation',
          label: 'Spindle Orientation',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 360,
          step: 1,
          unit: 'degrees',
          description: 'Spindle orientation angle upon exit'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(BORING CYCLE)
(DIAMETER: ${params.initialDiameter}mm -> ${params.finalDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z5
G76 R5 Z-${params.depth} Q${params.orientation} P${params.dwellTime * 1000} F${params.feedrate} K${params.retractFeedrate}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z50
M9
M5`;
        } else {
          return `; BORING CYCLE
; DIAMETER: ${params.initialDiameter}mm -> ${params.finalDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 202 BORING
  Q200=2                        ; SAFETY DISTANCE
  Q201=-${params.depth}         ; DEPTH
  Q206=${params.feedrate}       ; FEEDRATE FOR PLUNGING
  Q211=${params.dwellTime}      ; DWELL TIME AT BOTTOM
  Q208=${params.retractFeedrate}; FEEDRATE FOR RETRACT
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q214=1                        ; RETRACTION DIRECTION
  Q336=${params.orientation}    ; SPINDLE ANGLE
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Back boring cycle
    {
      id: 'back-boring',
      name: 'Back Boring',
      description: 'Inverse boring cycle for machining from the bottom',
      icon: <BackBoringIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'holeDiameter',
          label: 'Hole Diameter',
          type: 'number',
          defaultValue: 20,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the through hole'
        },
        {
          name: 'counterboreDiameter',
          label: 'Counterbore Diameter',
          type: 'number',
          defaultValue: 28,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the bottom counterbore'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of the counterbore (from the bottom surface)'
        },
        {
          name: 'thickness',
          label: 'Part Thickness',
          type: 'number',
          defaultValue: 30,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total thickness of the part'
        },
        {
          name: 'safetyDistance',
          label: 'Safety Distance',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Safety distance inside the hole'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for boring'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 600,
          min: 1,
          max: 24000,
          step: 10,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'dwellTime',
          label: 'Dwell Time',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'sec',
          description: 'Dwell time at depth'
        }
      ],
      generateCode: (params, controllerType) => {
        const approachDepth = params.thickness - params.safetyDistance;
        const totalDepth = params.thickness + params.depth;
        
        if (controllerType === 'fanuc') {
          return `(BACK BORING CYCLE)
(COUNTERBORE DIAMETER: ${params.counterboreDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z5
(POSITION TOOL INSIDE HOLE)
G00 Z-${approachDepth}
(SPINDLE ORIENTATION)
M19
G31 Z-${totalDepth} F50
G01 Z-${totalDepth} F${params.feedrate}
G04 P${params.dwellTime * 1000}
G01 Z-${approachDepth} F${params.feedrate}
G00 Z5
X10 Y10
(REPEAT CYCLE)
G00 Z-${approachDepth}
M19
G31 Z-${totalDepth} F50
G01 Z-${totalDepth} F${params.feedrate}
G04 P${params.dwellTime * 1000}
G01 Z-${approachDepth} F${params.feedrate}
G00 Z5
G00 Z50
M9
M5`;
        } else {
          return `; BACK BORING CYCLE
; COUNTERBORE DIAMETER: ${params.counterboreDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 204 BACK BORING
  Q200=2                        ; SAFETY DISTANCE
  Q249=${params.depth}          ; BACK BORE DEPTH
  Q250=${params.thickness}      ; MATERIAL THICKNESS
  Q251=2                        ; ECCENTRICITY
  Q252=0                        ; CUTTING EDGE HEIGHT
  Q253=500                      ; FEEDRATE FOR APPROACH
  Q254=${params.feedrate}       ; FEEDRATE FOR MACHINING
  Q255=${params.dwellTime}      ; DWELL TIME
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Thread milling cycle
    {
      id: 'thread-milling',
      name: 'Thread Milling',
      description: 'Cycle for internal or external thread milling',
      icon: <ThreadMillingIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'threadDiameter',
          label: 'Thread Diameter',
          type: 'number',
          defaultValue: 16,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Nominal diameter of the thread'
        },
        {
          name: 'threadPitch',
          label: 'Thread Pitch',
          type: 'number',
          defaultValue: 2,
          min: 0.1,
          max: 10,
          step: 0.05,
          unit: 'mm',
          description: 'Pitch of the thread'
        },
        {
          name: 'threadDepth',
          label: 'Thread Depth (Radial)',
          type: 'number',
          defaultValue: 1.6,
          min: 0.1,
          max: 10,
          step: 0.05,
          unit: 'mm',
          description: 'Depth of the thread (radial)'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 20,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the thread'
        },
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 8,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the thread milling cutter'
        },
        {
          name: 'threadType',
          label: 'Thread Type',
          type: 'select',
          defaultValue: 'internal',
          options: [
            { value: 'internal', label: 'Internal' },
            { value: 'external', label: 'External' }
          ],
          description: 'Thread type: internal or external'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 400,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'threadTurns',
          label: 'Number of Turns',
          type: 'number',
          defaultValue: 1,
          min: 1,
          max: 10,
          step: 0.25,
          unit: 'turns',
          description: 'Number of complete thread turns'
        }
      ],
      generateCode: (params, controllerType) => {
        // Calculate the working radius based on thread type
        const workRadius = params.threadType === 'internal' ? 
          (params.threadDiameter / 2) - params.threadDepth :
          (params.threadDiameter / 2) + params.threadDepth;
        
        const helixRadius = workRadius - (params.threadType === 'internal' ? 1 : -1) * (params.toolDiameter / 2);
        
        if (controllerType === 'fanuc') {
          return `(THREAD MILLING CYCLE ${params.threadType === 'internal' ? 'INTERNAL' : 'EXTERNAL'})
(DIAMETER: ${params.threadDiameter}mm, PITCH: ${params.threadPitch}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z5
(POSITION AT CENTER)
${params.threadType === 'internal' ? 
  `G00 X${-(helixRadius)}` :
  `G00 X${helixRadius}`}
(APPROACH TO WORKING DEPTH)
G01 Z0 F${params.feedrate}
(HELICAL MOVEMENT)
G17
${params.threadType === 'internal' ?
  `G02 X${helixRadius} Y0 I${helixRadius} J0 Z-${params.depth} F${params.feedrate}` :
  `G03 X${-helixRadius} Y0 I${-helixRadius} J0 Z-${params.depth} F${params.feedrate}`}
(COMPLETE THREAD CYCLE)
${params.threadType === 'internal' ?
  `G02 X${helixRadius} Y0 I${-(helixRadius)} J0 F${params.feedrate}` :
  `G03 X${-helixRadius} Y0 I${helixRadius} J0 F${params.feedrate}`}
(RETURN TO CENTER)
${params.threadType === 'internal' ?
  `G01 X0` :
  `G01 X0`}
G00 Z50
M9
M5`;
        } else {
          return `; THREAD MILLING CYCLE ${params.threadType === 'internal' ? 'INTERNAL' : 'EXTERNAL'}
; DIAMETER: ${params.threadDiameter}mm, PITCH: ${params.threadPitch}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 262 THREAD MILLING
  Q335=${params.threadDiameter} ; NOMINAL DIAMETER
  Q239=${params.threadPitch}    ; THREAD PITCH
  Q201=-${params.depth}         ; THREAD DEPTH
  Q355=${params.threadTurns}    ; THREADS PER PASS
  Q253=750                      ; FEEDRATE FOR APPROACH
  Q351=+1                       ; MILLING MODE
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q207=${params.feedrate}       ; MILLING FEEDRATE
CYCL DEF 264 THREAD MILLING FROM SOLID
  Q335=${params.threadDiameter} ; NOMINAL DIAMETER
  Q239=${params.threadPitch}    ; THREAD PITCH
  Q201=-${params.depth}         ; THREAD DEPTH
  Q222=${params.threadDiameter + (params.threadType === 'internal' ? -2 : 2) * params.threadDepth} ; PRE-DRILLED DIAMETER
  Q355=${params.threadTurns}    ; THREADS PER PASS
  Q253=750                      ; FEEDRATE FOR APPROACH
  Q351=+1                       ; MILLING MODE
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q207=${params.feedrate}       ; MILLING FEEDRATE
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Circular pocket milling cycle
    {
      id: 'circular-pocket',
      name: 'Circular Pocket',
      description: 'Cycle for milling circular pockets',
      icon: <CircularPocketIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the milling cutter to use'
        },
        {
          name: 'pocketDiameter',
          label: 'Pocket Diameter',
          type: 'number',
          defaultValue: 80,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Final diameter of the pocket'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 15,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the pocket'
        },
        {
          name: 'stepdown',
          label: 'Z Increment',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of cut for each increment'
        },
        {
          name: 'stepover',
          label: 'Radial Stepover',
          type: 'number',
          defaultValue: 4,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Radial stepover between passes'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 800,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 300,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging in Z'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'finishAllowance',
          label: 'Finish Allowance',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 10,
          step: 0.05,
          unit: 'mm',
          description: 'Stock left for finishing'
        },
        {
          name: 'helicalEntrance',
          label: 'Helical Entrance',
          type: 'checkbox',
          defaultValue: true,
          description: 'Use helical entrance instead of vertical'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(CIRCULAR POCKET CYCLE)
(DIAMETER: ${params.pocketDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z5
${params.helicalEntrance ? 
  `(HELICAL ENTRANCE)
G17
G03 X0 Y0 I${params.toolDiameter/4} J0 Z-${params.stepdown} F${params.plungeFeedrate}` : 
  `(VERTICAL ENTRANCE)
G01 Z-${params.stepdown} F${params.plungeFeedrate}`}

${Array.from({ length: Math.ceil(params.depth / params.stepdown) }).map((_, i) => {
  const currentDepth = Math.min((i + 1) * params.stepdown, params.depth);
  const maxRadius = (params.pocketDiameter - params.toolDiameter) / 2 - params.finishAllowance;
  
  let passCode = `(PASS ${i + 1} - DEPTH: ${currentDepth}mm)\n`;
  
  // If not the first pass, plunge to the new depth
  if (i > 0) {
    passCode += `G01 Z-${currentDepth} F${params.plungeFeedrate}\n`;
  }
  
  // Calculate how many radial passes are needed
  const numRadialPasses = Math.ceil(maxRadius / params.stepover);
  
  for (let j = 0; j < numRadialPasses; j++) {
    const currentRadius = Math.min((j + 1) * params.stepover, maxRadius);
    passCode += `G03 X0 Y0 I0 J0 R${currentRadius} F${params.feedrate}\n`; // Note: R is non-standard on many Fanucs
  }
  
  return passCode;
}).join('')}

(SIDE FINISHING)
G03 X0 Y0 I0 J0 R${(params.pocketDiameter - params.toolDiameter) / 2} F${params.feedrate}
 // Note: R is non-standard
G00 Z50
M9
M5`;
        } else {
          return `; CIRCULAR POCKET CYCLE
; DIAMETER: ${params.pocketDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 252 CIRCULAR POCKET
  Q215=0                        ; MACHINING TYPE
  Q223=${params.pocketDiameter} ; POCKET DIAMETER
  Q368=${params.finishAllowance}; SIDE ALLOWANCE
  Q207=${params.feedrate}       ; MILLING FEEDRATE
  Q351=+1                       ; MILLING MODE
  Q201=-${params.depth}         ; DEPTH
  Q202=${params.stepdown}       ; PLUNGING DEPTH
  Q369=0                        ; DEPTH ALLOWANCE
  Q206=${params.plungeFeedrate} ; PLUNGING FEEDRATE
  Q338=${params.stepover}       ; FINISHING STEP
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q370=1                        ; PATH OVERLAP
  Q366=${params.helicalEntrance ? '1' : '0'} ; PLUNGING STRATEGY
  Q385=${params.feedrate}       ; FINISHING FEEDRATE
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Circular island milling cycle
    {
      id: 'circular-island',
      name: 'Circular Island',
      description: 'Cycle for milling circular islands',
      icon: <CircularIslandIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the milling cutter to use'
        },
        {
          name: 'islandDiameter',
          label: 'Island Diameter',
          type: 'number',
          defaultValue: 50,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Final diameter of the island'
        },
        {
          name: 'stockDiameter',
          label: 'Stock Diameter',
          type: 'number',
          defaultValue: 60,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the raw material'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 15,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the machining operation'
        },
        {
          name: 'stepdown',
          label: 'Z Increment',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of cut for each increment'
        },
        {
          name: 'stepover',
          label: 'Radial Stepover',
          type: 'number',
          defaultValue: 4,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Radial stepover between passes'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 800,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 300,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging in Z'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'finishAllowance',
          label: 'Finish Allowance',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 10,
          step: 0.05,
          unit: 'mm',
          description: 'Stock left for finishing'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(CIRCULAR ISLAND CYCLE)
(ISLAND DIAMETER: ${params.islandDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X${(params.stockDiameter + params.toolDiameter) / 2} Y0
G00 Z5

${Array.from({ length: Math.ceil(params.depth / params.stepdown) }).map((_, i) => {
  const currentDepth = Math.min((i + 1) * params.stepdown, params.depth);
  const finishRadius = (params.islandDiameter + params.toolDiameter) / 2 + params.finishAllowance;
  const startRadius = (params.stockDiameter + params.toolDiameter) / 2;
  
  let passCode = `(PASS ${i + 1} - DEPTH: ${currentDepth}mm)\n`;
  
  // Plunge to the new depth
  passCode += `G01 Z-${currentDepth} F${params.plungeFeedrate}\n`;
  
  // First pass - full circle from the outer diameter
  passCode += `G03 X${startRadius} Y0 I${-startRadius} J0 F${params.feedrate}\n`; // Note: I/J relative to start point
  
  // Calculate how many radial passes are needed
  const radialDistance = (startRadius - finishRadius);
  const numRadialPasses = Math.ceil(radialDistance / params.stepover);
  
  for (let j = 1; j <= numRadialPasses; j++) {
    // Calculate the radius for this pass
    const currentRadius = startRadius - Math.min(j * params.stepover, radialDistance);
    
    // Move inwards
    passCode += `G01 X${currentRadius} F${params.feedrate}\n`;
    
    // Full circle
    passCode += `G03 X${currentRadius} Y0 I${-currentRadius} J0 F${params.feedrate}\n`; // Note: I/J relative to start point
  }
  
  return passCode;
}).join('')}

(SIDE FINISHING)
G01 X${(params.islandDiameter + params.toolDiameter) / 2} F${params.feedrate}
G03 X${(params.islandDiameter + params.toolDiameter) / 2} Y0 I${-(params.islandDiameter + params.toolDiameter) / 2} J0 F${params.feedrate}
 // Note: I/J relative to start point
G00 Z50
M9
M5`;
        } else {
          return `; CIRCULAR ISLAND CYCLE
; ISLAND DIAMETER: ${params.islandDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 257 CIRCULAR ISLAND
  Q223=${params.islandDiameter} ; FINISHED PART DIAMETER
  Q222=${params.stockDiameter}  ; RAW PART DIAMETER
  Q368=${params.finishAllowance}; SIDE ALLOWANCE
  Q207=${params.feedrate}       ; MILLING FEEDRATE
  Q351=+1                       ; MILLING MODE
  Q201=-${params.depth}         ; DEPTH
  Q202=${params.stepdown}       ; PLUNGING DEPTH
  Q206=${params.plungeFeedrate} ; PLUNGING FEEDRATE
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q370=1                        ; PATH OVERLAP
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Chip breaking drilling cycle
    {
      id: 'chip-breaking-drill',
      name: 'Chip Breaking Drilling',
      description: 'Drilling cycle with programmed chip breaking',
      icon: <ChipBreakingIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'drillDiameter',
          label: 'Drill Diameter',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the drill bit to use'
        },
        {
          name: 'depth',
          label: 'Total Depth',
          type: 'number',
          defaultValue: 50,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the hole'
        },
        {
          name: 'incrementDepth',
          label: 'Increment Depth',
          type: 'number',
          defaultValue: 5,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of each increment'
        },
        {
          name: 'chipBreakDistance',
          label: 'Chip Break Distance',
          type: 'number',
          defaultValue: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          unit: 'mm',
          description: 'Retract distance for chip breaking'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 150,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for drilling'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 1500,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'returnType',
          label: 'Return Type',
          type: 'select',
          defaultValue: 'rapid',
          options: [
            { value: 'rapid', label: 'Rapid' },
            { value: 'feed', label: 'Feedrate' }
          ],
          description: 'Type of retraction movement'
        },
        {
          name: 'chipBreakCount',
          label: 'Breaks per Step',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 20,
          step: 1,
          unit: 'breaks',
          description: 'Number of chip breaks per increment'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(CHIP BREAKING DRILLING CYCLE)
(DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z5
G73 R${params.chipBreakDistance} Z-${params.depth} Q${params.incrementDepth} F${params.feedrate} K${params.chipBreakCount}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z50
M9
M5`;
        } else {
          return `; CHIP BREAKING DRILLING CYCLE
; DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 203 UNIVERSAL DRILLING
  Q200=2                        ; SAFETY DISTANCE
  Q201=-${params.depth}         ; DEPTH
  Q206=${params.feedrate}       ; FEEDRATE FOR PLUNGING
  Q202=${params.incrementDepth} ; PLUNGING DEPTH
  Q210=0                        ; DWELL TIME AT TOP
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q212=0                        ; RETRACTION AMOUNT
  Q213=${params.chipBreakCount} ; NO. OF CHIP BREAKS
  Q205=1                        ; MIN. PLUNGING DEPTH
  Q211=0                        ; DWELL TIME AT BOTTOM
  Q208=${params.returnType === 'rapid' ? 99999 : params.feedrate} ; FEEDRATE FOR RETRACT
  Q256=${params.chipBreakDistance} ; RETRACT CHIP BREAK
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // T-slot milling cycle
    {
      id: 't-slot-milling',
      name: 'T-Slot Milling',
      description: 'Cycle for milling T-slots',
      icon: <TSlotIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Tool Diameter',
          type: 'number',
          defaultValue: 12,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the T-slot cutter'
        },
        {
          name: 'slotWidth',
          label: 'Slot Width',
          type: 'number',
          defaultValue: 16,
          min: 1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Width of the upper part of the slot'
        },
        {
          name: 'tSlotWidth',
          label: 'T-Slot Width',
          type: 'number',
          defaultValue: 22,
          min: 1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Width of the lower T-shaped part'
        },
        {
          name: 'slotDepth',
          label: 'Slot Depth',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of the main slot'
        },
        {
          name: 'tSlotDepth',
          label: 'T-Slot Depth',
          type: 'number',
          defaultValue: 6,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Additional depth of the T-shaped part'
        },
        {
          name: 'slotLength',
          label: 'Slot Length',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total length of the slot'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 400,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 200,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging in Z'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 2500,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(T-SLOT MILLING CYCLE)
(DIMENSIONS: ${params.slotLength}x${params.slotWidth}/${params.tSlotWidth}mm, DEPTH: ${params.slotDepth}+${params.tSlotDepth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8

(FIRST STAGE - MAIN SLOT WITH STANDARD END MILL)
(CHANGE TOOL TO CYLINDRICAL END MILL OF APPROPRIATE DIAMETER)
T2 M6
G43 Z50 H2
S${params.spindleSpeed} M3

G00 X${-params.slotLength/2} Y0
G00 Z5
G01 Z-${params.slotDepth} F${params.plungeFeedrate}
G01 X${params.slotLength/2} F${params.feedrate}
G00 Z50

(SECOND STAGE - T-SLOT WIDENING WITH T-SLOT CUTTER)
(CHANGE TOOL TO T-SLOT CUTTER)
T3 M6
G43 Z50 H3
S${params.spindleSpeed} M3

G00 X${-params.slotLength/2} Y0
G00 Z-${params.slotDepth + 2}
G01 Z-${params.slotDepth + params.tSlotDepth} F${params.plungeFeedrate}
G01 X${params.slotLength/2} F${params.feedrate}
G00 Z50
M9
M5`;
        } else {
          return `; T-SLOT MILLING CYCLE
; DIMENSIONS: ${params.slotLength}x${params.slotWidth}/${params.tSlotWidth}mm, DEPTH: ${params.slotDepth}+${params.tSlotDepth}mm
TOOL CALL 1 Z S${params.spindleSpeed} ; CYLINDRICAL END MILL

L Z+50 R0 FMAX
; FIRST STAGE - MAIN SLOT
CYCL DEF 253 SLOT MILLING
  Q215=0                        ; MACHINING TYPE
  Q218=${params.slotLength}     ; SLOT LENGTH
  Q219=${params.slotWidth}      ; SLOT WIDTH
  Q368=0                        ; SIDE ALLOWANCE
  Q374=0                        ; ANGLE OF ROTATION
  Q367=0                        ; SLOT POSITION
  Q207=${params.feedrate}       ; MILLING FEEDRATE
  Q351=+1                       ; MILLING MODE
  Q201=-${params.slotDepth}     ; DEPTH
  Q202=${params.slotDepth}      ; PLUNGING DEPTH
  Q369=0                        ; DEPTH ALLOWANCE
  Q206=${params.plungeFeedrate} ; PLUNGING FEEDRATE
  Q338=0                        ; FINISHING INCREMENT
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q366=0                        ; PLUNGING STRATEGY
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX

; SECOND STAGE - T-SLOT WIDENING
TOOL CALL 2 Z S${params.spindleSpeed} ; T-SLOT CUTTER
L Z+50 R0 FMAX
L X-${params.slotLength/2} Y+0 R0 FMAX
L Z-${params.slotDepth + 2} R0 FMAX
L Z-${params.slotDepth + params.tSlotDepth} F${params.plungeFeedrate}
L X+${params.slotLength/2} F${params.feedrate}
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Center drilling cycle
    {
      id: 'center-drilling',
      name: 'Center Drilling',
      description: 'Center drilling cycle for hole preparation',
      icon: <CenterDrillIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Drill Diameter',
          type: 'number',
          defaultValue: 6,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the center drill'
        },
        {
          name: 'coneAngle',
          label: 'Cone Angle',
          type: 'number',
          defaultValue: 90,
          min: 60,
          max: 120,
          step: 1,
          unit: 'degrees',
          description: 'Angle of the drill point (typically 90° or 60°)'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 3,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Centering depth'
        },
        {
          name: 'chamferDiameter',
          label: 'Chamfer Diameter',
          type: 'number',
          defaultValue: 10,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Top diameter of the chamfer'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 150,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for centering'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 2000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'dwellTime',
          label: 'Dwell Time',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'sec',
          description: 'Dwell time at the bottom (0 for no dwell)'
        }
      ],
      generateCode: (params, controllerType) => {
        // Calculate the depth needed to achieve the desired chamfer diameter
        const tg = Math.tan((params.coneAngle / 2) * Math.PI / 180);
        const calculatedDepth = params.chamferDiameter / (2 * tg);
        const finalDepth = Math.min(params.depth, calculatedDepth); // Use the smaller value between calculated and requested
        
        if (controllerType === 'fanuc') {
          return `(CENTER DRILLING CYCLE)
(CHAMFER DIAMETER: ${params.chamferDiameter}mm, DEPTH: ${finalDepth.toFixed(2)}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z5
G81 R5 Z-${finalDepth.toFixed(2)} F${params.feedrate} P${params.dwellTime * 1000}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z50
M9
M5`;
        } else {
          return `; CENTER DRILLING CYCLE
; CHAMFER DIAMETER: ${params.chamferDiameter}mm, DEPTH: ${finalDepth.toFixed(2)}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 240 CENTERING
  Q200=2                        ; SAFETY DISTANCE
  Q343=0                        ; SELECT DIAM./DEPTH
  Q201=-${finalDepth.toFixed(2)}; DEPTH
  Q344=-${params.chamferDiameter}; DIAMETER
  Q206=${params.feedrate}       ; FEEDRATE FOR PLUNGING
  Q211=${params.dwellTime}      ; DWELL TIME AT BOTTOM
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Chamfering cycle
    {
      id: 'chamfering-cycle',
      name: 'Chamfering',
      description: 'Cycle for milling chamfers',
      icon: <ChamferIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Cutter Diameter',
          type: 'number',
          defaultValue: 12,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the chamfering cutter'
        },
        {
          name: 'chamferWidth',
          label: 'Chamfer Width',
          type: 'number',
          defaultValue: 2,
          min: 0.1,
          max: 50,
          step: 0.1,
          unit: 'mm',
          description: 'Width of the chamfer'
        },
        {
          name: 'chamferAngle',
          label: 'Chamfer Angle',
          type: 'number',
          defaultValue: 45,
          min: 30,
          max: 60,
          step: 1,
          unit: 'degrees',
          description: 'Angle of the chamfer (typically 45°)'
        },
        {
          name: 'contourLength',
          label: 'Contour Length',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Length of the contour to be chamfered'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 400,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for milling'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 3000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'contourType',
          label: 'Contour Type',
          type: 'select',
          defaultValue: 'external',
          options: [
            { value: 'external', label: 'External' },
            { value: 'internal', label: 'Internal' }
          ],
          description: 'Contour type: external or internal'
        }
      ],
      generateCode: (params, controllerType) => {
        // Calculate the chamfer depth based on the angle
        const chamferDepth = params.chamferWidth * Math.tan((90 - params.chamferAngle) * Math.PI / 180);
        
        // Determine the compensation code based on contour type
        const compensationCode = params.contourType === 'external' 
          ? (controllerType === 'fanuc' ? 'G42' : 'RR')
          : (controllerType === 'fanuc' ? 'G41' : 'RL');
        
        if (controllerType === 'fanuc') {
          return `(CHAMFER MILLING CYCLE)
(WIDTH: ${params.chamferWidth}mm, ANGLE: ${params.chamferAngle}°)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X-10 Y0
G00 Z5
G01 Z-${chamferDepth.toFixed(2)} F100
${compensationCode} D1
G01 X0 Y0 F${params.feedrate}
G01 X${params.contourLength}
G01 Y${params.contourLength}
G01 X0
G01 Y0
G40
G00 Z50
M9
M5`;
        } else {
          return `; CHAMFER MILLING CYCLE
; WIDTH: ${params.chamferWidth}mm, ANGLE: ${params.chamferAngle}°
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
; CHAMFER CYCLE DEFINITION
CYCL DEF 275 MILL TROUGH SLOT PROF
  Q215=2                        ; MACHINING TYPE
  Q219=${params.chamferWidth}   ; SLOT WIDTH
  Q368=0                        ; SIDE ALLOWANCE
  Q436=${chamferDepth.toFixed(2)} ; INCREMENT PER REVOLUTION
  Q207=${params.feedrate}       ; MILLING FEEDRATE
  Q351=+1                       ; MILLING MODE
  Q201=-${chamferDepth.toFixed(2)} ; DEPTH
  Q202=${chamferDepth.toFixed(2)} ; PLUNGING DEPTH
  Q206=${params.feedrate}       ; PLUNGING FEEDRATE
  Q338=0                        ; FINISHING STEP
  Q385=${params.feedrate}       ; FINISHING FEEDRATE
  Q200=2                        ; SAFETY DISTANCE
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  Q366=0                        ; PLUNGING STRATEGY
  Q369=0                        ; DEPTH ALLOWANCE
  Q439=0                        ; FEED REFERENCE
; CONTOUR PATH
L X-10 Y+0 R0 FMAX
L Z+5 R0 FMAX
L Z-${chamferDepth.toFixed(2)} F100
L ${compensationCode} R${params.toolDiameter/2}
L X+0 Y+0 F${params.feedrate}
L X+${params.contourLength}
L Y+${params.contourLength}
L X+0
L Y+0
L R0
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Peck drilling cycle (G83)
    {
      id: 'peck-drilling',
      name: 'Peck Drilling',
      description: 'Drilling cycle with full retract for chip clearing',
      icon: <PeckDrillIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'drillDiameter',
          label: 'Drill Diameter',
          type: 'number',
          defaultValue: 12,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the drill bit to use'
        },
        {
          name: 'depth',
          label: 'Total Depth',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the hole'
        },
        {
          name: 'peckDepth',
          label: 'Peck Depth',
          type: 'number',
          defaultValue: 15,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of each peck before retracting'
        },
        {
          name: 'retractHeight',
          label: 'Retract Height',
          type: 'number',
          defaultValue: 5,
          min: 1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Retract height after each peck'
        },
        {
          name: 'feedrate',
          label: 'Feedrate',
          type: 'number',
          defaultValue: 120,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for drilling'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 1000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        },
        {
          name: 'dwellTime',
          label: 'Dwell Time',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'sec',
          description: 'Dwell time at the bottom of each peck'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          return `(PECK DRILLING CYCLE - FULL RETRACT)
(DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm, PECK: ${params.peckDepth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8
G00 X0 Y0
G00 Z${params.retractHeight}
G83 R${params.retractHeight} Z-${params.depth} Q${params.peckDepth} F${params.feedrate} P${params.dwellTime * 1000}
X10 Y10
X20 Y10
X30 Y10
G80
G00 Z50
M9
M5`;
        } else {
          return `; PECK DRILLING CYCLE - FULL RETRACT
; DIAMETER: ${params.drillDiameter}mm, DEPTH: ${params.depth}mm, PECK: ${params.peckDepth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 201 BORING
  Q200=${params.retractHeight}  ; SAFETY DISTANCE
  Q201=-${params.depth}         ; DEPTH
  Q206=${params.feedrate}       ; FEEDRATE FOR PLUNGING
  Q211=${params.dwellTime}      ; DWELL TIME AT BOTTOM
  Q208=500                      ; FEEDRATE FOR RETRACT
  Q203=+0                       ; SURFACE COORDINATE
  Q204=50                       ; 2ND SAFETY DISTANCE
  // Note: Heidenhain CYCL DEF 205 is typically used for pecking
  // Using 201 here might not perform full retract pecking as intended
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L X+10 Y+10 R0 FMAX M99
L X+20 Y+10 R0 FMAX M99
L X+30 Y+10 R0 FMAX M99
L Z+50 R0 FMAX
M5`;
        }
      }
    },
    
    // Plunge Milling cycle
    {
      id: 'plunge-milling',
      name: 'Plunge Milling',
      description: 'Plunge milling cycle for rapid roughing',
      icon: <PlungeMillingIcon />,
      controllerTypes: ['fanuc', 'heidenhain'],
      parameters: [
        {
          name: 'toolDiameter',
          label: 'Cutter Diameter',
          type: 'number',
          defaultValue: 20,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Diameter of the milling cutter to use'
        },
        {
          name: 'pocketWidth',
          label: 'Area Width',
          type: 'number',
          defaultValue: 100,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Width of the area to be roughed'
        },
        {
          name: 'pocketLength',
          label: 'Area Length',
          type: 'number',
          defaultValue: 150,
          min: 1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Length of the area to be roughed'
        },
        {
          name: 'depth',
          label: 'Depth',
          type: 'number',
          defaultValue: 20,
          min: 0.1,
          max: 1000,
          step: 0.1,
          unit: 'mm',
          description: 'Total depth of the operation'
        },
        {
          name: 'stepDown',
          label: 'Z Increment',
          type: 'number',
          defaultValue: 4,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Depth of each plunge'
        },
        {
          name: 'stepOver',
          label: 'Lateral Step',
          type: 'number',
          defaultValue: 15,
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: 'mm',
          description: 'Distance between plunges'
        },
        {
          name: 'plungeFeedrate',
          label: 'Plunge Feedrate',
          type: 'number',
          defaultValue: 250,
          min: 1,
          max: 5000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for plunging'
        },
        {
          name: 'traverseFeedrate',
          label: 'Traverse Feedrate',
          type: 'number',
          defaultValue: 1000,
          min: 1,
          max: 10000,
          step: 1,
          unit: 'mm/min',
          description: 'Feed rate for traversing between plunges'
        },
        {
          name: 'spindleSpeed',
          label: 'Spindle Speed',
          type: 'number',
          defaultValue: 2000,
          min: 1,
          max: 24000,
          step: 100,
          unit: 'RPM',
          description: 'Spindle rotation speed'
        }
      ],
      generateCode: (params, controllerType) => {
        if (controllerType === 'fanuc') {
          // Calculate the number of X and Y steps
          const stepsX = Math.floor((params.pocketWidth - params.toolDiameter) / params.stepOver) + 1;
          const stepsY = Math.floor((params.pocketLength - params.toolDiameter) / params.stepOver) + 1;
          
          // Calculate the number of Z levels
          const zLevels = Math.ceil(params.depth / params.stepDown);
          
          let code = `(PLUNGE MILLING CYCLE)
(AREA: ${params.pocketWidth}x${params.pocketLength}mm, DEPTH: ${params.depth}mm)
G90 G54
G00 X0 Y0
G43 Z50 H1
S${params.spindleSpeed} M3
M8\n`;
          
          for (let z = 0; z < zLevels; z++) {
            const currentDepth = Math.min((z + 1) * params.stepDown, params.depth);
            code += `(Z LEVEL ${z + 1} - DEPTH: ${currentDepth}mm)\n`;
            
            // Zigzag pattern to reduce positioning time
            for (let y = 0; y < stepsY; y++) {
              const yPos = -params.pocketLength/2 + params.toolDiameter/2 + y * params.stepOver;
              
              if (y % 2 === 0) {
                // Positive X direction
                for (let x = 0; x < stepsX; x++) {
                  const xPos = -params.pocketWidth/2 + params.toolDiameter/2 + x * params.stepOver;
                  code += `G00 X${xPos.toFixed(3)} Y${yPos.toFixed(3)}\n`;
                  code += `G00 Z5\n`;
                  code += `G01 Z-${currentDepth.toFixed(3)} F${params.plungeFeedrate}\n`;
                  code += `G01 Z5 F${params.traverseFeedrate}\n`;
                }
              } else {
                // Negative X direction
                for (let x = stepsX - 1; x >= 0; x--) {
                  const xPos = -params.pocketWidth/2 + params.toolDiameter/2 + x * params.stepOver;
                  code += `G00 X${xPos.toFixed(3)} Y${yPos.toFixed(3)}\n`;
                  code += `G00 Z5\n`;
                  code += `G01 Z-${currentDepth.toFixed(3)} F${params.plungeFeedrate}\n`;
                  code += `G01 Z5 F${params.traverseFeedrate}\n`;
                }
              }
            }
          }
          
          code += `G00 Z50\nM9\nM5`;
          return code;
        } else {
          return `; PLUNGE MILLING CYCLE
; AREA: ${params.pocketWidth}x${params.pocketLength}mm, DEPTH: ${params.depth}mm
TOOL CALL 1 Z S${params.spindleSpeed}
L Z+50 R0 FMAX
CYCL DEF 241 DEEP HOLE DRILLING WITH CANNULAS // Using an approximation
  Q200=2                        ; SAFETY DISTANCE
  Q201=-${params.depth}         ; DEPTH
  Q227=0                        ; STARTING POINT X
  Q228=0                        ; STARTING POINT Y
  Q229=${params.pocketWidth}    ; END POINT X
  Q230=${params.pocketLength}   ; END POINT Y
  Q231=${Math.floor((params.pocketWidth - params.toolDiameter) / params.stepOver) + 1} ; NUMBER OF COLUMNS
  Q232=${Math.floor((params.pocketLength - params.toolDiameter) / params.stepOver) + 1} ; NUMBER OF ROWS
  Q233=0                        ; SURFACE HEIGHT
  Q240=${Math.ceil(params.depth / params.stepDown)} ; NUMBER OF APPROACHES
  Q351=1                        ; MILLING TYPE
  Q253=${params.traverseFeedrate} ; PRE-POSITIONING FEED
  Q206=${params.plungeFeedrate} ; PLUNGING FEEDRATE // Q206 is plunge feed
L X+0 Y+0 R0 FMAX M3
CYCL CALL
L Z+50 R0 FMAX
M5`;
        }
      }
    }
  ];

  // Filter cycles based on controller type
  const availableCycles = cycleTemplates.filter(cycle => 
    cycle.controllerTypes.includes(controllerType)
  );

  // Initialize parameters when a new cycle is selected
  const handleCycleSelection = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    
    const selectedCycle = cycleTemplates.find(c => c.id === cycleId);
    if (selectedCycle) {
      // Initialize parameters with default values
      const initialParams: Record<string, any> = {};
      selectedCycle.parameters.forEach(param => {
        initialParams[param.name] = param.defaultValue;
      });
      setCycleParams(initialParams);
      
      // Generate preview code
      const code = selectedCycle.generateCode(initialParams, controllerType);
      setPreviewCode(code);
    }
  };

  // Update parameters and regenerate code
  const handleParamChange = (paramName: string, value: any) => {
    const newParams = { ...cycleParams, [paramName]: value };
    setCycleParams(newParams);
    
    // Regenerate preview code
    const selectedCycle = cycleTemplates.find(c => c.id === selectedCycleId);
    if (selectedCycle) {
      const code = selectedCycle.generateCode(newParams, controllerType);
      setPreviewCode(code);
    }
  };

  // Handle cycle insertion
  const handleInsertCycle = () => {
    if (previewCode) {
      onCycleCodeGenerated(previewCode);
    }
  };

  return (
    <div className="bg-[#F8FBFF] dark:bg-gray-800 dark:text-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600 p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Machining Cycles</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select and configure predefined cycles for {controllerType === 'fanuc' ? 'Fanuc' : 'Heidenhain'}
        </p>
      </div>
      
      <div className="list md:grid-cols-2 gap-4 p-4">
        {/* Cycle selection panel */}
        <div className="border rounded-md overflow-hidden dark:border-gray-600">
          <div className="bg-gray-50 px-4 py-2 border-b dark:bg-gray-700 dark:border-gray-600">
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Available Cycles</h3>
          </div>
          <div className="p-2 max-h-72 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableCycles.map((cycle) => (
                <button
                  key={cycle.id}
                  className={`p-3 rounded-md text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center ${
                    selectedCycleId === cycle.id ? 'bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700' : 'border border-gray-200 dark:border-gray-600'
                  }`}
                  onClick={() => handleCycleSelection(cycle.id)}
                >
                  <div className="w-10 h-10 flex items-center justify-center mb-2 text-gray-600 dark:text-gray-400">
                    {cycle.icon}
                  </div>
                  <span className="text-sm font-medium block text-gray-800 dark:text-gray-200">{cycle.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Configuration and preview panel */}
        <div className="border rounded-md overflow-hidden dark:border-gray-600">
          {selectedCycleId ? (
            <>
              <div className="bg-gray-50 px-4 py-2 border-b dark:bg-gray-700 dark:border-gray-600">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                  {cycleTemplates.find(c => c.id === selectedCycleId)?.name || 'Cycle Configuration'}
                </h3>
              </div>
              <div className="p-4 max-h-72 overflow-y-auto">
                {cycleTemplates.find(c => c.id === selectedCycleId)?.parameters.map((param) => (
                  <div key={param.name} className="mb-3">
                    <label htmlFor={param.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {param.label}
                      {param.unit && <span className="text-gray-500 dark:text-gray-400 ml-1">({param.unit})</span>}
                    </label>
                    
                    {param.type === 'number' && (
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="number"
                          id={param.name}
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={cycleParams[param.name]}
                          onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md sm:text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>
                    )}
                    
                    {param.type === 'select' && (
                      <select
                        id={param.name}
                        value={cycleParams[param.name]}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {param.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {param.type === 'checkbox' && (
                      <div className="mt-1 flex items-center">
                        <input
                          type="checkbox"
                          id={param.name}
                          checked={cycleParams[param.name]}
                          onChange={(e) => handleParamChange(param.name, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                        />
                        <label htmlFor={param.name} className="ml-2 block text-sm text-gray-500 dark:text-gray-400">
                          {param.description}
                        </label>
                      </div>
                    )}
                    
                    {param.type !== 'checkbox' && param.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="my-4">
                <CycleIcon className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p>Select a cycle to configure it</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Code preview */}
      {selectedCycleId && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Code Preview</h3>
            <button
              onClick={handleInsertCycle}
              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-600"
            >
              Insert Cycle
            </button>
          </div>
          <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono overflow-x-auto max-h-60 dark:bg-gray-900 dark:text-gray-300">
            {previewCode}
          </pre>
        </div>
      )}
    </div>
  );
};

// Icon components for cycles
const DrillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M14 4V20M8 4V7M8 12V15M4 4H20M4 20H20M12 12V15" />
  </svg>
);

const PocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </svg>
);

const ContourIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M4 4v16M4 4h16M20 4v8a8 8 0 0 1-8 8H4" />
  </svg>
);

const TapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M8 6h8M8 10h8M10 14h4M7 18h10" />
  </svg>
);

const CycleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="8" />
    <line x1="12" y1="4" x2="12" y2="12" />
    <line x1="12" y1="12" x2="16" y2="16" />
  </svg>
);

// New icons for added cycles
const DeepDrillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M12 2v20M8 4v4M8 10v4M8 16v4M16 4v4M16 10v4M16 16v4M4 7h16M4 13h16M4 19h16" />
  </svg>
);

const SlotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M4 8h16v8H4z" />
    <path d="M2 12h20" />
  </svg>
);

const BoringIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="12" y1="5" x2="12" y2="19" strokeWidth="4" />
  </svg>
);

const BackBoringIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4v16M9 8l6 8M9 16l6-8" />
  </svg>
);

const ThreadMillingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 6v12M12 6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2M12 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2" />
  </svg>
);

const CircularPocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4a8 8 0 0 1 0 16 8 8 0 0 1 0-16z" />
  </svg>
);

const CircularIslandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8a4 4 0 0 1 0 8 4 4 0 0 1 0-8z" />
  </svg>
);

const ChipBreakingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M12 5l-3 3M12 10l-3 3M12 15l-3 3M12 5l3 3M12 10l3 3M12 15l3 3" />
  </svg>
);

const TSlotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M5 12h14M10 7v10M14 7v10M8 9v6M16 9v6" />
  </svg>
);

const CenterDrillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M8 9l4 4 4-4" />
  </svg>
);

const ChamferIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="4" y="4" width="16" height="16" />
    <path d="M4 4l4 4M20 4l-4 4" />
  </svg>
);

const PeckDrillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M12 6l-3 3M12 12l-3 3M12 18l-3 3" />
    <path d="M12 6l3 3M12 12l3 3M12 18l3 3" />
  </svg>
);

const PlungeMillingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="2" />
    <path d="M12 8V4M8 12H4M16 12h4M12 16v4M8 8l-2-2M16 8l2-2M16 16l2 2M8 16l-2 2" />
  </svg>
);

export default MachineCycles;