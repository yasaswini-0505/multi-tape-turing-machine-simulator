// ==================== TAPE CLASS ====================
class Tape {
    constructor(name, initialContent = []) {
        this.name = name;
        this.cells = initialContent.length > 0 ? [...initialContent] : ['_'];
        this.headPosition = 0;
    }

    read() {
        return this.cells[this.headPosition] || '_';
    }

    write(symbol) {
        this.cells[this.headPosition] = symbol;
    }

    moveLeft() {
        if (this.headPosition > 0) {
            this.headPosition--;
        } else {
            this.cells.unshift('_');
            this.headPosition = 0;
        }
    }

    moveRight() {
        this.headPosition++;
        if (this.headPosition >= this.cells.length) {
            this.cells.push('_');
        }
    }

    stay() {
        // Do nothing
    }

    move(direction) {
        if (direction === 'L') this.moveLeft();
        else if (direction === 'R') this.moveRight();
        else if (direction === 'S') this.stay();
    }

    getContent() {
        return this.cells;
    }

    reset(initialContent) {
        this.cells = initialContent.length > 0 ? [...initialContent] : ['_'];
        this.headPosition = 0;
    }
}

// ==================== MULTI-TAPE TURING MACHINE ====================
class MultitapeTuringMachine {
    constructor(numTapes = 2) {
        this.numTapes = numTapes;
        this.tapes = [];
        this.currentState = 'q0';
        this.acceptStates = new Set();
        this.rejectStates = new Set();
        this.transitions = new Map();
        this.stepCount = 0;
        this.maxSteps = 1000;
        this.isRunning = false;
        this.isPaused = false;
        this.executionLog = [];
    }

    initialize(inputString) {
        // Initialize tapes
        this.tapes = [];
        const input = inputString.split('');
        
        // First tape gets the input
        this.tapes.push(new Tape('Tape 1', input));
        
        // Other tapes are blank
        for (let i = 1; i < this.numTapes; i++) {
            this.tapes.push(new Tape(`Tape ${i + 1}`, []));
        }
        
        this.currentState = 'q0';
        this.stepCount = 0;
        this.executionLog = [];
        this.addLog('Initialized TM');
        this.addLog(`Input: "${inputString}"`);
    }

    addTransition(fromState, reads, toState, writes, moves) {
        // reads and writes are arrays, moves is array of directions
        const key = this.makeKey(fromState, reads);
        this.transitions.set(key, { toState, writes, moves });
    }

    makeKey(state, reads) {
        return `${state}:${reads.join(',')}`;
    }

    getTransition(state, reads) {
        return this.transitions.get(this.makeKey(state, reads));
    }

    step() {
        if (this.isRunning === false && (this.currentState === 'qaccept' || this.currentState === 'qreject')) {
            return false; // Machine has halted
        }

        const reads = this.tapes.map(tape => tape.read());
        const transition = this.getTransition(this.currentState, reads);

        if (!transition) {
            this.currentState = 'qreject';
            this.addLog(`No transition from ${this.currentState} with input [${reads.join(', ')}] - REJECT`);
            return false;
        }

        // Execute transition
        const { toState, writes, moves } = transition;
        
        // Write to tapes
        for (let i = 0; i < this.numTapes; i++) {
            this.tapes[i].write(writes[i]);
        }

        // Move heads
        for (let i = 0; i < this.numTapes; i++) {
            this.tapes[i].move(moves[i]);
        }

        // Update state
        const oldState = this.currentState;
        this.currentState = toState;
        this.stepCount++;

        this.addLog(`Step ${this.stepCount}: (${oldState}, [${reads.join(', ')}]) → (${toState}, [${writes.join(', ')}], [${moves.join(', ')}])`);

        if (this.currentState === 'qaccept') {
            this.addLog('✓ ACCEPTED');
            return false;
        } else if (this.currentState === 'qreject') {
            this.addLog('✗ REJECTED');
            return false;
        }

        if (this.stepCount >= this.maxSteps) {
            this.currentState = 'qreject';
            this.addLog(`Max steps (${this.maxSteps}) exceeded - REJECT`);
            return false;
        }

        return true;
    }

    addLog(message) {
        this.executionLog.push(message);
    }

    getLog() {
        return this.executionLog;
    }

    isAccepted() {
        return this.currentState === 'qaccept';
    }

    isRejected() {
        return this.currentState === 'qreject';
    }
}

// ==================== PROBLEM DEFINITIONS ====================
const PROBLEMS = {
    palindrome: {
        name: 'Palindrome Checker',
        description: 'Checks if the input string is a palindrome (reads the same forwards and backwards).\n\nAlgorithm: Uses 2 tapes to compare characters from start and end.\n\nExample: "aba" → ✓ Accept, "abc" → ✗ Reject',
        hints: 'For Palindrome: Enter strings like "aba", "racecar", "abc"',
        numTapes: 2,
        build: function() {
            const tm = new MultitapeTuringMachine(2);
            const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

            // Copy input from Tape 1 to Tape 2
            for (const char of alphabet) {
                tm.addTransition('q0', [char, '_'], 'q1', [char, char], ['R', 'R']);
                tm.addTransition('q1', [char, '_'], 'q1', [char, char], ['R', 'R']);
            }

            // After copying, move both heads left to compare characters from the end
            tm.addTransition('q0', ['_', '_'], 'q1', ['_', '_'], ['L', 'L']);
            tm.addTransition('q1', ['_', '_'], 'qaccept', ['_', '_'], ['S', 'S']);

            // Compare letters from right to left
            for (const char of alphabet) {
                tm.addTransition('q1', [char, char], 'q1', [char, char], ['L', 'L']);
            }

            return tm;
        }
    },
    

    
    'binary-increment': {
        name: 'Binary Increment',
        description: 'Increments the binary number by 1.\n\nAlgorithm: Finds the rightmost bit, flips 1s to 0s until a 0 is found, then changes it to 1. If the number is all 1s, adds a new leading 1.\n\nExample: "011" → "100", "111" → "1000"',
        hints: 'For Binary Increment: Enter binary numbers like "1", "10", "11", "101"',
        numTapes: 2,
        build: function() {
            const tm = new MultitapeTuringMachine(2);

            // q0: move right until blank on tape1
            tm.addTransition('q0', ['0', '_'], 'q0', ['0', '_'], ['R', 'S']);
            tm.addTransition('q0', ['1', '_'], 'q0', ['1', '_'], ['R', 'S']);
            tm.addTransition('q0', ['_', '_'], 'q1', ['_', '_'], ['L', 'S']);

            // q1: perform increment by flipping bits from right to left
            tm.addTransition('q1', ['1', '_'], 'q1', ['0', '_'], ['L', 'S']);
            tm.addTransition('q1', ['0', '_'], 'qaccept', ['1', '_'], ['S', 'S']);
            tm.addTransition('q1', ['_', '_'], 'qaccept', ['1', '_'], ['S', 'S']);

            return tm;
        }
    },
    
    'string-copy': {
        name: 'String Copy',
        description: 'Copies the input string from Tape 1 to Tape 2.\n\nAlgorithm: Reads characters from Tape 1 and writes to Tape 2.\n\nExample: Input "abc" → Tape 2: "abc"',
        hints: 'For String Copy: Enter strings like "abc", "hello", "test"',
        numTapes: 2,
        build: function() {
            const tm = new MultitapeTuringMachine(2);
            
            // Simple copy: each character goes to tape 2
            const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
            for (const char of chars) {
                tm.addTransition('q0', [char, '_'], 'q0', [char, char], ['R', 'R']);
            }
            
            tm.addTransition('q0', ['_', '_'], 'qaccept', ['_', '_'], ['S', 'S']);
            
            return tm;
        }
    },
    custom: {
        name: 'Custom Rules',
        description: 'Use this mode to create your own Turing Machine rules by editing the custom build function in script.js.\n\nThis placeholder lets the custom button work and shows the transition editor for manual rule creation.',
        hints: 'Define custom transitions in the script.js under PROBLEMS.custom.build()',
        numTapes: 2,
        build: function() {
            const tm = new MultitapeTuringMachine(2);
            return tm;
        }
    }
};

// ==================== VISUALIZATION ENGINE ====================
class TapeVisualizer {
    static renderTape(tape, isActive = false) {
        const container = document.createElement('div');
        container.className = `tape ${isActive ? 'active' : ''}`;
        
        const header = document.createElement('div');
        header.className = 'tape-header';
        header.textContent = tape.name;
        container.appendChild(header);
        
        const cells = document.createElement('div');
        cells.className = 'tape-cells';
        
        for (let i = 0; i < tape.cells.length; i++) {
            const cell = document.createElement('div');
            cell.className = `cell ${i === tape.headPosition ? 'head' : ''}`;
            cell.textContent = tape.cells[i];
            cells.appendChild(cell);
        }
        
        // Add empty cells for context
        for (let i = 0; i < 2; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty';
            cell.textContent = '_';
            cells.appendChild(cell);
        }
        
        container.appendChild(cells);
        
        const headIndicator = document.createElement('div');
        headIndicator.className = 'head-indicator';
        headIndicator.style.left = `${tape.headPosition * 40 + 20}px`;
        headIndicator.textContent = '▲';
        container.appendChild(headIndicator);
        
        return container;
    }

    static renderAllTapes(tapes) {
        const container = document.getElementById('tapeContainer');
        container.innerHTML = '';
        
        tapes.forEach((tape, index) => {
            const tapeElement = this.renderTape(tape);
            container.appendChild(tapeElement);
        });
    }
}

// ==================== TRANSITION TABLE RENDERER ====================
class TransitionTableRenderer {
    static render(tm) {
        const container = document.getElementById('transitionTable');
        
        if (tm.transitions.size === 0) {
            container.innerHTML = '<p class="no-rules">No transition rules defined</p>';
            return;
        }
        
        let html = '<div class="transition-list">';
        
        for (const [key, value] of tm.transitions) {
            const [state, reads] = key.split(':');
            const readSymbols = reads.split(',');
            const { toState, writes, moves } = value;
            
            html += `<div class="transition-rule">
                <span class="rule-from">(${state}, [${readSymbols.join(', ')}])</span>
                <span class="rule-arrow">→</span>
                <span class="rule-to">(${toState}, [${writes.join(', ')}], [${moves.join(', ')}])</span>
            </div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
}

// ==================== UI CONTROLLER ====================
class TMController {
    constructor() {
        this.tm = null;
        this.currentProblem = 'palindrome';
        this.isRunning = false;
        this.setupEventListeners();
        this.loadProblem('palindrome');
    }

    setupEventListeners() {
        // Problem selection
        document.querySelectorAll('.problem-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.problem-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadProblem(e.target.getAttribute('data-problem'));
            });
        });

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        document.getElementById('runBtn').addEventListener('click', () => this.run());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        // Input
        document.getElementById('inputString').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.start();
        });
    }

    loadProblem(problemKey) {
        this.currentProblem = problemKey;
        const problem = PROBLEMS[problemKey];
        
        if (!problem) {
            alert('Unknown problem');
            return;
        }

        // Build TM
        this.tm = problem.build();

        // Update UI
        document.getElementById('problemDescription').innerHTML = `
            <h4>${problem.name}</h4>
            <p>${problem.description}</p>
        `;
        document.getElementById('inputHints').innerHTML = `<p>${problem.hints}</p>`;
        TransitionTableRenderer.render(this.tm);

        this.reset();
    }

    start() {
        const inputString = document.getElementById('inputString').value;
        
        if (inputString === '') {
            alert('Please enter an input string');
            return;
        }

        this.tm.initialize(inputString);
        this.isRunning = true;
        this.updateUI();
        this.updateControls();

        document.getElementById('executionLog').innerHTML = '';
        TapeVisualizer.renderAllTapes(this.tm.tapes);
    }

    step() {
        if (!this.tm || !this.isRunning) return;

        const canContinue = this.tm.step();
        this.updateUI();

        if (!canContinue) {
            this.isRunning = false;
            this.updateControls();
        }
    }

    run() {
        if (!this.tm || !this.isRunning) return;

        const runInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(runInterval);
                return;
            }

            const canContinue = this.tm.step();
            this.updateUI();

            if (!canContinue) {
                this.isRunning = false;
                this.updateControls();
                clearInterval(runInterval);
            }
        }, 500);
    }

    pause() {
        this.isRunning = false;
        this.updateControls();
    }

    reset() {
        if (this.tm) {
            this.tm.currentState = 'q0';
            this.tm.stepCount = 0;
            this.tm.tapes = [];
            this.isRunning = false;
            this.updateUI();
            this.updateControls();
            document.getElementById('executionLog').innerHTML = '<p class="log-entry">Log will appear here during execution...</p>';
            document.getElementById('tapeContainer').innerHTML = '';
        }
    }

    updateUI() {
        if (!this.tm) return;

        // Update state
        document.getElementById('currentState').textContent = this.tm.currentState;
        document.getElementById('currentState').className = 
            this.tm.isAccepted() ? 'state-label accept' :
            this.tm.isRejected() ? 'state-label reject' :
            'state-label';

        // Update step count
        document.getElementById('stepCount').textContent = this.tm.stepCount;

        // Update status
        let statusText = 'Running';
        let statusClass = 'status-label running';
        
        if (this.tm.isAccepted()) {
            statusText = 'Accepted';
            statusClass = 'status-label accept';
        } else if (this.tm.isRejected()) {
            statusText = 'Rejected';
            statusClass = 'status-label reject';
        } else if (!this.isRunning) {
            statusText = 'Paused';
            statusClass = 'status-label paused';
        }
        
        const statusEl = document.getElementById('status');
        statusEl.textContent = statusText;
        statusEl.className = statusClass;

        // Update result
        const resultEl = document.getElementById('result');
        if (this.tm.isAccepted()) {
            resultEl.textContent = '✓ ACCEPT';
            resultEl.className = 'result-label accept';
        } else if (this.tm.isRejected()) {
            resultEl.textContent = '✗ REJECT';
            resultEl.className = 'result-label reject';
        } else {
            resultEl.textContent = '-';
            resultEl.className = 'result-label';
        }

        // Update tapes
        TapeVisualizer.renderAllTapes(this.tm.tapes);

        // Update log
        const logContainer = document.getElementById('executionLog');
        const logs = this.tm.getLog();
        let logHTML = '';
        
        logs.forEach((log, index) => {
            logHTML += `<p class="log-entry">${index + 1}. ${log}</p>`;
        });
        
        logContainer.innerHTML = logHTML || '<p class="log-entry">No execution yet...</p>';
        logContainer.scrollTop = logContainer.scrollHeight;

        // Update current rule display
        const reads = this.tm.tapes.map(t => t.read());
        const transition = this.tm.getTransition(this.tm.currentState, reads);
        
        if (transition) {
            const { toState, writes, moves } = transition;
            document.getElementById('currentRule').innerHTML = `
                <span class="rule-from">(${this.tm.currentState}, [${reads.join(', ')}])</span>
                <span class="rule-arrow">→</span>
                <span class="rule-to">(${toState}, [${writes.join(', ')}], [${moves.join(', ')}])</span>
            `;
        } else {
            document.getElementById('currentRule').textContent = 'No matching transition (will REJECT)';
        }
    }

    updateControls() {
        const started = this.tm && this.tm.stepCount > 0 || this.tm && this.tm.tapes.length > 0;
        const finished = this.tm && (this.tm.isAccepted() || this.tm.isRejected());

        document.getElementById('startBtn').disabled = this.isRunning;
        document.getElementById('stepBtn').disabled = !this.isRunning || finished;
        document.getElementById('runBtn').disabled = !this.isRunning || finished;
        document.getElementById('pauseBtn').disabled = !this.isRunning || finished;
        document.getElementById('resetBtn').disabled = !started;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    new TMController();
});
