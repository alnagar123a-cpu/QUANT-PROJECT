/* ============================================================
   MODULE 1 — Foundations (levels 1–14)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd001', day: 1, module: 1, minutes: 20,
    title: 'Your First Ticker',
    subtitle: 'Statements, console.log and how a program actually runs.',
    goal: '<b>Goal:</b> write and run your first JavaScript, and print a price to the console the way a trading terminal prints a tick.',
    objectives: [
      'Run a JavaScript statement and see its output',
      'Use <code>console.log()</code> to inspect anything',
      'Write comments that explain <em>why</em>, not <em>what</em>',
      'Recognise why a missing semicolon or bracket stops everything'
    ],
    sections: [
      { h: 'A program is a list of instructions',
        body: '<p>JavaScript reads your file top to bottom and does one thing at a time. Each instruction is a <strong>statement</strong>, and statements usually end with a semicolon.</p>' +
              '<p>Your very first tool is <code>console.log()</code> — it prints whatever you hand it. In real trading code you will use it constantly to answer "what is this value <em>right now</em>?"</p>',
        code: 'console.log("ES");\nconsole.log(5240.25);\nconsole.log("Session open");' },
      { h: 'console.log takes as many arguments as you like',
        body: '<p>Separate them with commas and they print on one line, space-separated. This is how you build a readable tick line.</p>',
        code: 'console.log("ES", 5240.25, "+12.50");\nconsole.log("Contracts:", 2);' },
      { h: 'Comments are notes to your future self',
        body: '<p>Anything after <code>//</code> on a line is ignored by JavaScript. Use comments to record the reasoning a reader cannot infer from the code.</p>' +
              '<div class="note note-tip"><b>Habit worth forming</b>A comment that says <code>// add 1 to i</code> is noise. A comment that says <code>// ES settles at 16:00 ET, so ignore later bars</code> is gold.</div>',
        code: '// ES trades in 0.25 increments — a "tick"\nconsole.log("One tick =", 0.25);\n\n/* Block comments\n   span multiple lines. */\nconsole.log("Done");' },
      { h: 'Errors are information, not failure',
        body: '<p>Delete a closing bracket and JavaScript refuses to run the file at all — a <strong>SyntaxError</strong>. Read the message; it usually names the line. Getting comfortable reading errors is most of learning to code.</p>' +
              '<div class="note note-trade"><b>On the desk</b>A strategy that crashes loudly at 09:31 is far safer than one that silently computes the wrong position size all day.</div>',
        code: 'console.log("this line is fine");\n// console.log("this one is broken";   <- would be a SyntaxError' }
    ],
    parsons: {
      prompt: 'Order these lines so the program prints a header, then the symbol, then the price.',
      lines: [
        '// Print a one-line quote for the E-mini S&P',
        'console.log("--- QUOTE ---");',
        'console.log("Symbol: ES");',
        'console.log("Last: 5240.25");'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Print a quote line', difficulty: 'Warm-up',
        prompt: 'Print exactly three lines to the console:<ul><li><code>ES</code></li><li><code>5240.25</code></li><li><code>2 contracts</code></li></ul>',
        starter: '// Print the three lines below\n',
        solution: 'console.log("ES");\nconsole.log(5240.25);\nconsole.log("2 contracts");',
        hints: [
          'Each line is its own <code>console.log(...)</code> statement.',
          'Text needs quotes around it. Numbers do not: <code>console.log(5240.25)</code>.'
        ],
        tests: { logs: ['ES', '5240.25', '2 contracts'] } },
      { id: 'e2', title: 'One line, several values', difficulty: 'Core',
        prompt: 'Using a <strong>single</strong> <code>console.log</code> call, print:<br><code>ES 5240.25 LONG</code><br>Pass the three values as three separate arguments.',
        starter: '// One console.log, three arguments\n',
        solution: 'console.log("ES", 5240.25, "LONG");',
        hints: [
          'Arguments are separated by commas inside the parentheses.',
          '<code>console.log("A", 1, "B")</code> prints <code>A 1 B</code>.'
        ],
        tests: { logs: ['ES 5240.25 LONG'],
          source: [{ name: 'uses exactly one console.log call',
            fn: function (code) { return (code.match(/console\.log/g) || []).length === 1; },
            why: 'use a single console.log with three arguments' }] } }
    ],
    quiz: [
      { q: 'What does <code>console.log("2 + 2")</code> print?',
        options: ['<code>4</code>', '<code>2 + 2</code>', 'A SyntaxError', '<code>"2 + 2"</code> with the quotes'],
        answer: 1,
        explain: 'The quotes make it text. JavaScript prints the characters exactly; it never does arithmetic inside a string.' },
      { q: 'Which of these is ignored when the program runs?',
        options: ['<code>console.log()</code>', '<code>// note to self</code>', '<code>5240.25</code>', 'A semicolon'],
        answer: 1,
        explain: 'Everything after <code>//</code> on a line is a comment. It exists for humans only.' },
      { q: 'Your file has a missing closing bracket on line 40. What happens to line 1?',
        options: ['It runs, then the program stops at line 40', 'Nothing runs — the whole file fails to parse', 'It runs twice', 'JavaScript guesses the bracket'],
        answer: 1,
        explain: 'A SyntaxError is found before any code executes, so nothing in the file runs. This is why a broken bracket feels so total.' }
    ],
    recap: [
      'A program is statements executed top to bottom.',
      '<code>console.log()</code> prints anything — your primary debugging tool.',
      'Quotes make text; no quotes makes a number.',
      'A SyntaxError stops the entire file, not just the broken line.'
    ],
    vocab: [
      { term: 'Tick', def: 'The smallest price increment a contract can move. ES moves in 0.25-point ticks worth $12.50 each.' },
      { term: 'Quote', def: 'The current market snapshot for a symbol — typically last price, bid, ask and size.' }
    ]
  });

  C.push({
    id: 'd002', day: 2, module: 1, minutes: 25,
    title: 'Variables: Naming the Trade',
    subtitle: 'const, let, and why the difference matters at 09:30.',
    goal: '<b>Goal:</b> store the parts of a trade in named variables and understand when a value is allowed to change.',
    objectives: [
      'Declare values with <code>const</code> and <code>let</code>',
      'Explain why <code>const</code> is the correct default',
      'Reassign a variable and see the effect',
      'Name variables so the code reads like the desk sounds'
    ],
    sections: [
      { h: 'A variable is a label on a value',
        body: '<p>Instead of scattering <code>5240.25</code> through your code, name it once. Now the intent is obvious and there is exactly one place to change it.</p>',
        code: 'const symbol = "ES";\nconst entryPrice = 5240.25;\nconst quantity = 2;\n\nconsole.log("Bought", quantity, symbol, "at", entryPrice);' },
      { h: 'const vs let',
        body: '<p><code>const</code> means <em>this label will never point at a different value</em>. <code>let</code> means it will.</p>' +
              '<table><tr><th>Use</th><th>When</th><th>Trading example</th></tr>' +
              '<tr><td><code>const</code></td><td>The value is fixed for its lifetime</td><td>entry price, contract spec, symbol</td></tr>' +
              '<tr><td><code>let</code></td><td>The value genuinely changes</td><td>running P&amp;L, current price, bar counter</td></tr></table>' +
              '<p>Reach for <code>const</code> first. Switch to <code>let</code> only when the compiler complains — that moment is a useful signal that something in your model is mutable.</p>',
        code: 'const entry = 5240.25;   // never changes once filled\nlet lastPrice = 5240.25; // ticks all session\n\nlastPrice = 5248.75;\nconsole.log("Entry:", entry, "Last:", lastPrice);\n\n// entry = 5300; // TypeError: Assignment to constant variable' },
      { h: 'Reassignment is not declaration',
        body: '<p>You declare a variable once. After that you just assign to it — no <code>let</code> in front.</p>',
        code: 'let unrealised = 0;\n\nunrealised = 12.50;\nconsole.log("After tick 1:", unrealised);\n\nunrealised = 25.00;\nconsole.log("After tick 2:", unrealised);' },
      { h: 'Names are documentation',
        body: '<p>JavaScript convention is <code>camelCase</code>: first word lowercase, later words capitalised. Names may contain letters, digits, <code>_</code> and <code>$</code>, but cannot start with a digit.</p>' +
              '<div class="note note-warn"><b>Bad names cost money</b><code>const x = 2</code> tells you nothing. <code>const contracts = 2</code> tells you the units — and units are exactly what gets confused when a strategy sizes a position wrong.</div>',
        code: 'const stopLossPoints = 8;\nconst takeProfitPoints = 16;\nconst riskRewardRatio = takeProfitPoints / stopLossPoints;\n\nconsole.log("R:R is", riskRewardRatio, "to 1");' }
    ],
    parsons: {
      prompt: 'Arrange a small position record: declare the symbol, the entry, a mutable last price, then print both.',
      lines: [
        'const symbol = "NQ";',
        'const entry = 18420.00;',
        'let last = 18455.25;',
        'console.log(symbol, "entry", entry);',
        'console.log(symbol, "last", last);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Describe a position', difficulty: 'Warm-up',
        prompt: 'Declare four variables describing a trade:<ul>' +
          '<li><code>symbol</code> — the text <code>"ES"</code></li>' +
          '<li><code>side</code> — the text <code>"long"</code></li>' +
          '<li><code>entry</code> — the number <code>5240.25</code></li>' +
          '<li><code>contracts</code> — the number <code>2</code></li></ul>' +
          'None of them change, so all four should be <code>const</code>.',
        starter: '// Declare the four constants below\n',
        solution: 'const symbol = "ES";\nconst side = "long";\nconst entry = 5240.25;\nconst contracts = 2;',
        hints: [
          'The pattern is <code>const name = value;</code>',
          'Text values need quotes; numbers do not.'
        ],
        tests: { checks: [
          CX.val('symbol', 'ES'), CX.val('side', 'long'),
          CX.val('entry', 5240.25), CX.val('contracts', 2)
        ], source: [{ name: 'uses const, not let or var', pattern: /\b(let|var)\s/, forbid: true,
          why: 'none of these values change, so they should all be const' }] } },
      { id: 'e2', title: 'A price that moves', difficulty: 'Core',
        prompt: 'Declare <code>lastPrice</code> as <code>5240.25</code>, then reassign it twice: first to <code>5248.50</code>, then to <code>5255.75</code>. Leave it holding the final value.<br>Because it changes, it must be declared with <code>let</code>.',
        starter: '// Declare lastPrice, then move it twice\n',
        solution: 'let lastPrice = 5240.25;\nlastPrice = 5248.50;\nlastPrice = 5255.75;',
        hints: [
          'Declare once with <code>let</code>, then assign without any keyword.',
          '<code>lastPrice = 5248.50;</code> — no <code>let</code> on the second line.'
        ],
        tests: { checks: [CX.val('lastPrice', 5255.75)],
          source: [{ name: 'declares lastPrice with let', pattern: /let\s+lastPrice/,
            why: 'a value that is reassigned must be declared with let' }] } },
      { id: 'e3', title: 'Derive a value', difficulty: 'Core',
        prompt: 'A trade risks 8 points to make 24. Declare <code>risk</code> (8) and <code>reward</code> (24), then declare <code>ratio</code> computed from them — do not type <code>3</code> directly.',
        starter: 'const risk = 8;\nconst reward = 24;\n// Declare ratio, computed from the two above\n',
        solution: 'const risk = 8;\nconst reward = 24;\nconst ratio = reward / risk;',
        hints: [
          'Division uses <code>/</code>.',
          'The point of deriving is that changing <code>reward</code> changes <code>ratio</code> automatically.'
        ],
        tests: { checks: [CX.val('risk', 8), CX.val('reward', 24), CX.val('ratio', 3)],
          source: [{ name: 'computes ratio instead of hard-coding it', pattern: /ratio\s*=\s*3\s*[;\n]/, forbid: true,
            why: 'derive ratio from risk and reward with division' }] } }
    ],
    quiz: [
      { q: 'Which declaration is correct for a running profit-and-loss figure that updates on every tick?',
        options: ['<code>const pnl = 0;</code>', '<code>let pnl = 0;</code>', '<code>pnl = 0;</code>', 'Either const or let — no difference'],
        answer: 1,
        explain: 'It changes, so it needs <code>let</code>. A <code>const</code> would throw a TypeError the first time the price moved.' },
      { q: 'What happens on the second line?<br><code>const entry = 5240;<br>entry = 5250;</code>',
        options: ['entry becomes 5250', 'entry stays 5240, silently', 'A TypeError is thrown', 'A new variable is created'],
        answer: 2,
        explain: 'Reassigning a <code>const</code> throws <code>TypeError: Assignment to constant variable</code>. The loudness is the feature.' },
      { q: 'Which is the better variable name for the number of contracts in a trade?',
        options: ['<code>n</code>', '<code>qty2</code>', '<code>contracts</code>', '<code>theNumberOfContractsInThisParticularTrade</code>'],
        answer: 2,
        explain: 'Specific but not exhausting. It names the unit, which is what prevents sizing mistakes.' }
    ],
    recap: [
      '<code>const</code> is the default; <code>let</code> is for values that genuinely change.',
      'Declare once, then assign without a keyword.',
      'Reassigning a <code>const</code> throws a TypeError.',
      'Derive values from other variables instead of hard-coding the answer.'
    ],
    vocab: [
      { term: 'Entry', def: 'The price at which a position was opened. Fixed for the life of the trade.' },
      { term: 'R:R (risk/reward)', def: 'Reward divided by risk. Risking 8 points to make 24 is 3:1 — you can be right one time in four and break even.' }
    ]
  });

  C.push({
    id: 'd003', day: 3, module: 1, minutes: 25,
    title: 'Numbers and P&L Arithmetic',
    subtitle: 'Operators, precedence, rounding, and the floating-point trap.',
    goal: '<b>Goal:</b> turn an entry price, an exit price and a contract spec into a dollar profit-and-loss figure.',
    objectives: [
      'Use <code>+ - * / %</code> and control precedence with parentheses',
      'Convert points into dollars using a contract multiplier',
      'Round for display with <code>toFixed</code> and <code>Math.round</code>',
      'Avoid the classic floating-point equality bug'
    ],
    sections: [
      { h: 'The five arithmetic operators',
        body: '<p><code>+</code> add, <code>-</code> subtract, <code>*</code> multiply, <code>/</code> divide, <code>%</code> remainder. Precedence follows normal maths: <code>*</code> and <code>/</code> bind tighter than <code>+</code> and <code>-</code>. Parentheses override everything.</p>',
        code: 'const entry = 5240.25;\nconst exit  = 5252.75;\n\nconsole.log("Points:", exit - entry);\nconsole.log("Wrong :", exit - entry * 50);      // * happens first\nconsole.log("Right :", (exit - entry) * 50);   // parentheses fix it' },
      { h: 'Points into dollars',
        body: '<p>A futures contract has a <strong>point value</strong> — the dollars gained per 1.00 of price movement, per contract. ES is $50. The whole P&amp;L formula for a long is:</p>' +
              '<p class="mono" style="color:var(--fg)">(exit − entry) × quantity × pointValue</p>' +
              '<p>For a short, the subtraction flips: <code>(entry − exit)</code>. That single sign is the most common bug in beginner backtests.</p>',
        code: 'const entry = 5240.25, exit = 5252.75;\nconst qty = 2, pointValue = 50;\n\nconst points = exit - entry;\nconst dollars = points * qty * pointValue;\n\nconsole.log(points, "points =", dollars, "dollars");' },
      { h: 'The remainder operator earns its keep',
        body: '<p><code>%</code> gives what is left after division. In trading it answers "is this price on a valid tick?" — ES only trades in 0.25 increments, so a price whose remainder is not zero is invalid.</p>',
        code: 'console.log(5240.25 % 0.25);  // 0    -> valid ES price\nconsole.log(5240.30 % 0.25);  // not 0 -> invalid\nconsole.log(17 % 5);          // 2\nconsole.log(10 % 2);          // 0    -> 10 is even' },
      { h: 'Rounding, and why 0.1 + 0.2 is not 0.3',
        body: '<p>Computers store decimals in binary, and some decimals have no exact binary form — exactly like 1/3 has no exact decimal form. So tiny errors accumulate.</p>' +
              '<p><code>toFixed(n)</code> returns a <strong>string</strong> rounded for display. <code>Math.round(x * 100) / 100</code> returns a <strong>number</strong>. Use <code>toFixed</code> when printing, the other when still computing.</p>' +
              '<div class="note note-warn"><b>Never compare money with ===</b>Compare the difference against a tolerance instead: <code>Math.abs(a - b) < 0.005</code>.</div>',
        code: 'console.log(0.1 + 0.2);              // 0.30000000000000004\nconsole.log(0.1 + 0.2 === 0.3);      // false!\nconsole.log((0.1 + 0.2).toFixed(2)); // "0.30"  (a string)\nconsole.log(Math.round((0.1 + 0.2) * 100) / 100); // 0.3 (a number)' }
    ],
    parsons: {
      prompt: 'Build a short-side P&L calculation in dollars.',
      lines: [
        'const entry = 18470.00;',
        'const exit = 18401.50;',
        'const qty = 1;',
        'const points = entry - exit;',
        'const dollars = points * qty * 20;',
        'console.log("Short P&L:", dollars);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Long trade P&L', difficulty: 'Core',
        prompt: 'A long ES trade: entry <code>5240.25</code>, exit <code>5252.75</code>, <code>2</code> contracts, point value <code>50</code>.<br>Declare <code>points</code> and <code>dollars</code>. Do not type the answers as literals — compute them.',
        starter: 'const entry = 5240.25;\nconst exit = 5252.75;\nconst qty = 2;\nconst pointValue = 50;\n\n// Declare points and dollars\n',
        solution: 'const entry = 5240.25;\nconst exit = 5252.75;\nconst qty = 2;\nconst pointValue = 50;\nconst points = exit - entry;\nconst dollars = points * qty * pointValue;',
        hints: [
          'Points is just <code>exit - entry</code> for a long.',
          'Dollars multiplies points by both the quantity and the point value.'
        ],
        tests: { checks: [CX.near('points', 12.5, 1e-9), CX.near('dollars', 1250, 1e-9)] } },
      { id: 'e2', title: 'Short trade P&L', difficulty: 'Core',
        prompt: 'A <strong>short</strong> NQ trade: entry <code>18470.00</code>, exit <code>18401.50</code>, <code>1</code> contract, point value <code>20</code>.<br>Declare <code>points</code> and <code>dollars</code>. Remember the sign flips for shorts — a profitable short means the price <em>fell</em>.',
        starter: 'const entry = 18470.00;\nconst exit = 18401.50;\nconst qty = 1;\nconst pointValue = 20;\n\n// Declare points and dollars (short side!)\n',
        solution: 'const entry = 18470.00;\nconst exit = 18401.50;\nconst qty = 1;\nconst pointValue = 20;\nconst points = entry - exit;\nconst dollars = points * qty * pointValue;',
        hints: [
          'For a short you profit when exit is <em>below</em> entry.',
          'So the subtraction is <code>entry - exit</code>, not the other way round.'
        ],
        tests: { checks: [CX.near('points', 68.5, 1e-9), CX.near('dollars', 1370, 1e-9)] } },
      { id: 'e3', title: 'Round for the statement', difficulty: 'Stretch',
        prompt: 'A trade made <code>1287.4499999</code> dollars (floating-point noise from a longer calculation).<br>Declare <code>rounded</code> as that value rounded to <strong>2 decimal places, still a number</strong> — <code>1287.45</code>, not the string <code>"1287.45"</code>.',
        starter: 'const raw = 1287.4499999;\n// Declare rounded: a NUMBER with 2 decimals\n',
        solution: 'const raw = 1287.4499999;\nconst rounded = Math.round(raw * 100) / 100;',
        hints: [
          '<code>toFixed(2)</code> gives a string — the test wants a number.',
          'Multiply by 100, <code>Math.round</code>, divide by 100.'
        ],
        tests: { checks: [
          CX.val('rounded', 1287.45),
          CX.type('rounded', 'number')
        ] } }
    ],
    quiz: [
      { q: 'What does <code>(5252.75 - 5240.25) * 2 * 50</code> evaluate to?',
        options: ['625', '1250', '12.5', '2500'],
        answer: 1,
        explain: '12.5 points × 2 contracts × $50 = $1,250. The parentheses force the subtraction first.' },
      { q: 'A short is entered at 100 and covered at 90. What is the P&L in points?',
        options: ['−10', '+10', '0', '190'],
        answer: 1,
        explain: 'Shorts profit when price falls: <code>entry − exit</code> = 100 − 90 = +10 points.' },
      { q: 'Why does <code>0.1 + 0.2 === 0.3</code> return false?',
        options: ['A JavaScript bug', 'Some decimals cannot be stored exactly in binary', 'You must use <code>==</code> instead', '<code>+</code> does not work on decimals'],
        answer: 1,
        explain: 'Binary floating point cannot represent 0.1 or 0.2 exactly, so the sum is 0.30000000000000004. Every language with IEEE-754 floats does this.' }
    ],
    recap: [
      'Long P&L = (exit − entry) × qty × pointValue; short flips the subtraction.',
      'Parentheses beat precedence — use them when intent matters.',
      '<code>toFixed()</code> returns a string; <code>Math.round(x*100)/100</code> returns a number.',
      'Never compare decimals with <code>===</code>. Use a tolerance.'
    ],
    vocab: [
      { term: 'Point value', def: 'Dollars per 1.00 of price move, per contract. ES $50, NQ $20, CL $1,000.' },
      { term: 'Tick size', def: 'The minimum legal price increment. ES is 0.25; a price of 5240.30 could never print.' }
    ]
  });

  C.push({
    id: 'd004', day: 4, module: 1, minutes: 25,
    title: 'Strings and the Trade Ticket',
    subtitle: 'Template literals, concatenation and formatting output humans read.',
    goal: '<b>Goal:</b> build a formatted trade ticket line from separate values, using template literals.',
    objectives: [
      'Build strings with template literals and <code>${}</code>',
      'Use <code>toUpperCase</code>, <code>padStart</code>, <code>slice</code> and <code>length</code>',
      'Understand that numbers and strings are different types',
      'Format a fixed-width report line'
    ],
    sections: [
      { h: 'Template literals beat concatenation',
        body: '<p>Backtick strings let you drop values straight in with <code>${...}</code>. Anything inside the braces is a full JavaScript expression.</p>',
        code: 'const symbol = "ES";\nconst qty = 2;\nconst price = 5240.25;\n\n// The clumsy way\nconsole.log("BUY " + qty + " " + symbol + " @ " + price);\n\n// The readable way\nconsole.log(`BUY ${qty} ${symbol} @ ${price}`);\n\n// Expressions work too\nconsole.log(`Notional: $${(qty * price * 50).toFixed(2)}`);' },
      { h: 'Useful string methods',
        body: '<p>Strings carry methods that return <em>new</em> strings — the original is never modified.</p>',
        code: 'const sym = "es";\nconsole.log(sym.toUpperCase());      // "ES"\nconsole.log(sym.length);             // 2\n\nconst side = "long";\nconsole.log(side.slice(0, 1).toUpperCase()); // "L"\n\n// padStart / padEnd build aligned columns\nconsole.log("ES".padEnd(6) + "5240.25".padStart(10));\nconsole.log("NQ".padEnd(6) + "18420.00".padStart(10));' },
      { h: 'Strings and numbers are not the same',
        body: '<p><code>+</code> means "add" for numbers and "join" for strings. Mix them and JavaScript quietly converts the number to text — a classic source of wrong totals.</p>' +
              '<div class="note note-warn"><b>The bug</b>Data arriving from an API is often text. <code>"10" + 5</code> is <code>"105"</code>, not 15. Convert first with <code>Number(x)</code> or <code>parseFloat(x)</code>.</div>',
        code: 'console.log(10 + 5);        // 15\nconsole.log("10" + 5);      // "105"  <- string join\nconsole.log(Number("10") + 5); // 15\nconsole.log("10" * 5);      // 50   <- * has no string meaning, so it converts' },
      { h: 'Multi-line output',
        body: '<p>Template literals keep line breaks exactly as you type them, which makes short reports easy.</p>',
        code: 'const sym = "ES", entry = 5240.25, exit = 5252.75;\n\nconsole.log(`--- TICKET ---\nSymbol : ${sym}\nEntry  : ${entry}\nExit   : ${exit}\nPoints : ${(exit - entry).toFixed(2)}`);' }
    ],
    parsons: {
      prompt: 'Build and print a single formatted ticket line.',
      lines: [
        'const symbol = "NQ";',
        'const side = "SHORT";',
        'const qty = 1;',
        'const price = 18470;',
        'const ticket = `${side} ${qty} ${symbol} @ ${price}`;',
        'console.log(ticket);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Build a ticket string', difficulty: 'Core',
        prompt: 'Given the variables in the starter, declare <code>ticket</code> holding exactly:<br><code>BUY 2 ES @ 5240.25</code><br>Use a template literal — do not type the finished sentence as one literal string.',
        starter: 'const action = "BUY";\nconst qty = 2;\nconst symbol = "ES";\nconst price = 5240.25;\n\n// Declare ticket using a template literal\n',
        solution: 'const action = "BUY";\nconst qty = 2;\nconst symbol = "ES";\nconst price = 5240.25;\nconst ticket = `${action} ${qty} ${symbol} @ ${price}`;',
        hints: [
          'Template literals use backticks, not quotes.',
          'The shape is <code>`${action} ${qty} ${symbol} @ ${price}`</code>.'
        ],
        tests: { checks: [CX.val('ticket', 'BUY 2 ES @ 5240.25')],
          source: [{ name: 'uses a template literal', pattern: /`[^`]*\$\{/,
            why: 'build the string with backticks and ${} rather than one hard-coded literal' }] } },
      { id: 'e2', title: 'Normalise a symbol', difficulty: 'Core',
        prompt: 'Feeds send symbols inconsistently. Given <code>raw = "  es  "</code>, declare <code>clean</code> holding <code>"ES"</code> — trimmed of spaces and uppercased.',
        starter: 'const raw = "  es  ";\n// Declare clean\n',
        solution: 'const raw = "  es  ";\nconst clean = raw.trim().toUpperCase();',
        hints: [
          '<code>.trim()</code> removes whitespace from both ends.',
          'Methods chain: <code>raw.trim().toUpperCase()</code>.'
        ],
        tests: { checks: [CX.val('clean', 'ES')] } },
      { id: 'e3', title: 'An aligned report row', difficulty: 'Stretch',
        prompt: 'Build <code>row</code>: the symbol padded to 6 characters wide on the right, then the price as a 2-decimal string padded to 10 characters wide on the left.<br>For <code>"ES"</code> and <code>5240.25</code> that is exactly:<br><code style="white-space:pre">ES       5240.25</code><br>(6 chars for <code>ES&nbsp;&nbsp;&nbsp;&nbsp;</code>, then 10 for <code>&nbsp;&nbsp;&nbsp;5240.25</code>.)',
        starter: 'const symbol = "ES";\nconst price = 5240.25;\n// Declare row\n',
        solution: 'const symbol = "ES";\nconst price = 5240.25;\nconst row = symbol.padEnd(6) + price.toFixed(2).padStart(10);',
        hints: [
          '<code>padEnd(6)</code> adds spaces on the right; <code>padStart(10)</code> adds them on the left.',
          '<code>price.toFixed(2)</code> gives the string <code>"5240.25"</code>, which you then pad.'
        ],
        tests: { checks: [
          CX.check('row is 16 characters wide', ['row'], function (s) {
            if (typeof s.row !== 'string') return 'row should be a string';
            return s.row.length === 16 ? true : 'expected length 16, got ' + s.row.length;
          }),
          CX.val('row', 'ES       5240.25')
        ] } }
    ],
    quiz: [
      { q: 'What does <code>"5" + 3</code> produce?',
        options: ['<code>8</code>', '<code>"53"</code>', '<code>NaN</code>', 'A TypeError'],
        answer: 1,
        explain: 'When either side of <code>+</code> is a string, JavaScript joins instead of adding. This is why API numbers must be converted first.' },
      { q: 'Which builds the string <code>ES @ 5240.25</code> most readably?',
        options: ['<code>"ES" + " @ " + price</code>', '<code>`${sym} @ ${price}`</code>', '<code>"ES @ price"</code>', '<code>[sym, price].join()</code>'],
        answer: 1,
        explain: 'Template literals put the values where they appear in the output, so the code looks like the result.' },
      { q: 'After <code>const s = "es"; s.toUpperCase();</code>, what is <code>s</code>?',
        options: ['<code>"ES"</code>', '<code>"es"</code>', '<code>undefined</code>', 'A TypeError — s is const'],
        answer: 1,
        explain: 'String methods return a new string; they never modify the original. You have to capture the return value.' }
    ],
    recap: [
      'Template literals (backticks + <code>${}</code>) are the default way to build strings.',
      '<code>+</code> joins when either operand is a string.',
      'String methods return new strings — capture the result.',
      '<code>padStart</code>/<code>padEnd</code> build aligned, readable reports.'
    ],
    vocab: [
      { term: 'Trade ticket', def: 'The record of an order: side, quantity, symbol, price and time. What gets sent to the broker.' },
      { term: 'Notional', def: 'The full market value a position controls — price × multiplier × contracts — as opposed to the margin actually posted.' }
    ]
  });

  C.push({
    id: 'd005', day: 5, module: 1, minutes: 25,
    title: 'Booleans: Was It a Winner?',
    subtitle: 'Comparison operators, truthiness and the === rule.',
    goal: '<b>Goal:</b> ask precise yes/no questions about a trade and get reliable answers.',
    objectives: [
      'Use <code>&gt; &lt; &gt;= &lt;= === !==</code> to compare values',
      'Explain why <code>===</code> is safer than <code>==</code>',
      'Store the result of a comparison in a variable',
      'Recognise which values are falsy'
    ],
    sections: [
      { h: 'A comparison produces a boolean',
        body: '<p>There are exactly two boolean values: <code>true</code> and <code>false</code>. Every comparison evaluates to one of them, and you can store that result like any other value.</p>',
        code: 'const entry = 5240.25;\nconst exit  = 5252.75;\n\nconst isWinner = exit > entry;\nconsole.log("Winner?", isWinner);\n\nconst hitTarget = exit >= 5250;\nconsole.log("Hit target?", hitTarget);' },
      { h: 'Always use === and !==',
        body: '<p><code>==</code> converts types before comparing, which produces genuinely surprising results. <code>===</code> compares value <em>and</em> type. There is no good reason to use <code>==</code> in new code.</p>',
        code: 'console.log(5240 == "5240");   // true  <- converted\nconsole.log(5240 === "5240");  // false <- different types\nconsole.log(0 == "");          // true  (!)\nconsole.log(0 === "");         // false\n\nconsole.log(5 !== 3);          // true' },
      { h: 'Falsy values',
        body: '<p>When a non-boolean is used where a boolean is expected, JavaScript coerces it. Exactly six values are <strong>falsy</strong>:</p>' +
              '<p class="mono" style="color:var(--fg)">false · 0 · "" · null · undefined · NaN</p>' +
              '<p>Everything else — including <code>"0"</code>, <code>[]</code> and <code>{}</code> — is truthy.</p>' +
              '<div class="note note-warn"><b>The zero trap</b>A position size of <code>0</code> is falsy. <code>if (qty)</code> silently skips flat positions. Write <code>if (qty !== 0)</code> when zero is a meaningful value.</div>',
        code: 'console.log(Boolean(0));      // false\nconsole.log(Boolean(""));     // false\nconsole.log(Boolean("0"));    // true  <- a non-empty string\nconsole.log(Boolean([]));     // true  <- an empty array is truthy\nconsole.log(Boolean(NaN));    // false' },
      { h: 'Naming boolean variables',
        body: '<p>Prefix them so the name reads as a question: <code>isWinner</code>, <code>hasPosition</code>, <code>canEnter</code>, <code>shouldExit</code>. Code that reads <code>if (shouldExit)</code> explains itself.</p>',
        code: 'const pnl = -125;\nconst position = 2;\n\nconst isLosing = pnl < 0;\nconst hasPosition = position !== 0;\nconst shouldFlatten = isLosing && hasPosition;\n\nconsole.log({ isLosing, hasPosition, shouldFlatten });' }
    ],
    parsons: {
      prompt: 'Work out whether a long trade beat its target.',
      lines: [
        'const entry = 5240.25;',
        'const exit = 5252.75;',
        'const target = 5250.00;',
        'const points = exit - entry;',
        'const hitTarget = exit >= target;',
        'console.log(points, hitTarget);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Winner or loser', difficulty: 'Warm-up',
        prompt: 'Given a long trade with <code>entry = 5240.25</code> and <code>exit = 5231.00</code>, declare:<ul>' +
          '<li><code>isWinner</code> — true when the exit is above the entry</li>' +
          '<li><code>isLoser</code> — true when the exit is below the entry</li></ul>' +
          'Use comparisons, not hard-coded <code>true</code>/<code>false</code>.',
        starter: 'const entry = 5240.25;\nconst exit = 5231.00;\n// Declare isWinner and isLoser\n',
        solution: 'const entry = 5240.25;\nconst exit = 5231.00;\nconst isWinner = exit > entry;\nconst isLoser = exit < entry;',
        hints: [
          'A comparison like <code>exit &gt; entry</code> already produces true or false.',
          'Assign it straight into the variable — no <code>if</code> needed.'
        ],
        tests: { checks: [CX.val('isWinner', false), CX.val('isLoser', true)],
          source: [{ name: 'derives the answers by comparison', pattern: /=\s*(true|false)\s*;/, forbid: true,
            why: 'compute the booleans from entry and exit rather than typing true/false' }] } },
      { id: 'e2', title: 'Risk checks', difficulty: 'Core',
        prompt: 'A position is <code>3</code> contracts with an open loss of <code>-410</code> dollars. The desk limits are: max 2 contracts, max $500 loss.<br>Declare:<ul>' +
          '<li><code>overSize</code> — true if contracts exceed the limit</li>' +
          '<li><code>overLoss</code> — true if the loss is worse than −500</li>' +
          '<li><code>isFlat</code> — true only if contracts equals exactly 0</li></ul>',
        starter: 'const contracts = 3;\nconst openPnl = -410;\nconst maxContracts = 2;\nconst maxLoss = -500;\n\n// Declare overSize, overLoss and isFlat\n',
        solution: 'const contracts = 3;\nconst openPnl = -410;\nconst maxContracts = 2;\nconst maxLoss = -500;\nconst overSize = contracts > maxContracts;\nconst overLoss = openPnl < maxLoss;\nconst isFlat = contracts === 0;',
        hints: [
          '"Worse than −500" means <em>more negative</em>, so use <code>&lt;</code>.',
          'For exact equality always use <code>===</code>.'
        ],
        tests: { checks: [CX.val('overSize', true), CX.val('overLoss', false), CX.val('isFlat', false)] } },
      { id: 'e3', title: 'Spot the type mismatch', difficulty: 'Stretch',
        prompt: 'A feed delivered the quantity as the <em>text</em> <code>"2"</code>. Declare:<ul>' +
          '<li><code>looseMatch</code> — the result of comparing it to the number 2 with <code>==</code></li>' +
          '<li><code>strictMatch</code> — the same comparison with <code>===</code></li>' +
          '<li><code>fixedMatch</code> — a strict comparison that correctly returns true, by converting the feed value to a number first</li></ul>',
        starter: 'const feedQty = "2";\nconst expected = 2;\n// Declare looseMatch, strictMatch and fixedMatch\n',
        solution: 'const feedQty = "2";\nconst expected = 2;\nconst looseMatch = feedQty == expected;\nconst strictMatch = feedQty === expected;\nconst fixedMatch = Number(feedQty) === expected;',
        hints: [
          '<code>==</code> converts before comparing; <code>===</code> does not.',
          '<code>Number("2")</code> gives the number <code>2</code>.'
        ],
        tests: { checks: [CX.val('looseMatch', true), CX.val('strictMatch', false), CX.val('fixedMatch', true)] } }
    ],
    quiz: [
      { q: 'What is <code>"2" === 2</code>?',
        options: ['<code>true</code>', '<code>false</code>', '<code>NaN</code>', 'A TypeError'],
        answer: 1,
        explain: 'Strict equality compares type as well as value. A string is never strictly equal to a number.' },
      { q: 'Which of these is <strong>truthy</strong>?',
        options: ['<code>0</code>', '<code>""</code>', '<code>"0"</code>', '<code>NaN</code>'],
        answer: 2,
        explain: 'Only the empty string is falsy. <code>"0"</code> has a character in it, so it is truthy — a very common source of parsing bugs.' },
      { q: 'A short position is open with 2 contracts. Why is <code>if (contracts)</code> risky as a "do I have a position?" test?',
        options: ['It is fine', 'Because 0 contracts is falsy, so a deliberate flat state is skipped', 'Because contracts is a string', 'Because it needs <code>==</code>'],
        answer: 1,
        explain: 'When 0 is a meaningful value rather than "missing", test it explicitly with <code>contracts !== 0</code>.' }
    ],
    recap: [
      'Comparisons produce booleans you can store and reuse.',
      'Use <code>===</code> and <code>!==</code>; <code>==</code> converts types behind your back.',
      'The six falsy values: <code>false, 0, "", null, undefined, NaN</code>.',
      'Name booleans as questions: <code>isWinner</code>, <code>hasPosition</code>.'
    ],
    vocab: [
      { term: 'Flat', def: 'Holding no position at all. Being flat is a position too — it is the only one with zero risk.' },
      { term: 'Open P&L', def: 'Unrealised profit or loss on a position still held, marked at the current price.' }
    ]
  });

  C.push({
    id: 'd006', day: 6, module: 1, minutes: 30,
    title: 'if / else: The Entry Decision',
    subtitle: 'Branching, blocks and the shape of a trading rule.',
    goal: '<b>Goal:</b> write a rule that decides long, short or flat and stores the decision.',
    objectives: [
      'Write <code>if</code>, <code>else if</code> and <code>else</code> branches',
      'Understand that only the first matching branch runs',
      'Assign different values on different branches',
      'Order conditions so the most specific comes first'
    ],
    sections: [
      { h: 'The basic branch',
        body: '<p>An <code>if</code> runs its block only when the condition is truthy. The braces define the block — everything inside runs together.</p>',
        code: 'const price = 5252.75;\nconst movingAverage = 5240.00;\n\nif (price > movingAverage) {\n  console.log("Price above the average — bullish");\n}\n\nif (price < movingAverage) {\n  console.log("Price below the average — bearish");\n}' },
      { h: 'else if chains: exactly one branch wins',
        body: '<p>JavaScript tests each condition in order and runs the <strong>first</strong> one that is true, then skips the rest. Order matters enormously.</p>',
        code: 'const momentum = 0.42;\n\nlet signal;\nif (momentum > 0.5)       signal = "strong long";\nelse if (momentum > 0)    signal = "weak long";\nelse if (momentum < -0.5) signal = "strong short";\nelse if (momentum < 0)    signal = "weak short";\nelse                      signal = "flat";\n\nconsole.log(momentum, "->", signal);' },
      { h: 'Order the specific before the general',
        body: '<p>If you test <code>momentum > 0</code> before <code>momentum > 0.5</code>, the strong case can never be reached — <code>0.9</code> matches the loose test first and stops there. This class of bug is silent: the code runs perfectly and produces the wrong signal.</p>',
        code: '// BROKEN: the general test shadows the specific one\nconst m = 0.9;\nlet s;\nif (m > 0)        s = "weak long";     // 0.9 matches here...\nelse if (m > 0.5) s = "strong long";   // ...so this is unreachable\nconsole.log("Broken gives:", s);' },
      { h: 'Declare outside, assign inside',
        body: '<p>A variable declared with <code>let</code> inside a block only exists inside that block. To use the result afterwards, declare it before the <code>if</code> and assign within.</p>' +
              '<div class="note note-trade"><b>On the desk</b>Almost every strategy reduces to this shape: gather conditions, branch once, produce a single <code>signal</code> value. Keep the branching in one place and the rest of your code stays testable.</div>',
        code: 'const rsi = 71;\n\nlet zone;              // declared out here\nif (rsi >= 70) {\n  zone = "overbought"; // assigned in here\n} else if (rsi <= 30) {\n  zone = "oversold";\n} else {\n  zone = "neutral";\n}\nconsole.log("RSI", rsi, "is", zone);' }
    ],
    parsons: {
      prompt: 'Assemble a three-way signal from a momentum reading.',
      lines: [
        'const momentum = -0.8;',
        'let signal;',
        'if (momentum > 0.25) {',
        '  signal = "long";',
        '} else if (momentum < -0.25) {',
        '  signal = "short";',
        '} else {',
        '  signal = "flat";',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Three-way signal', difficulty: 'Core',
        prompt: 'Given <code>momentum = -0.8</code>, declare <code>signal</code> using an if/else if/else chain:<ul>' +
          '<li>above <code>0.25</code> → <code>"long"</code></li>' +
          '<li>below <code>-0.25</code> → <code>"short"</code></li>' +
          '<li>anything else → <code>"flat"</code></li></ul>',
        starter: 'const momentum = -0.8;\nlet signal;\n// Branch here\n',
        solution: 'const momentum = -0.8;\nlet signal;\nif (momentum > 0.25) signal = "long";\nelse if (momentum < -0.25) signal = "short";\nelse signal = "flat";',
        hints: [
          'Declare <code>signal</code> with <code>let</code> before the <code>if</code> so it survives the block.',
          'The chain is <code>if (...) ... else if (...) ... else ...</code>.'
        ],
        tests: { checks: [CX.val('signal', 'short')],
          source: [{ name: 'uses an if statement', pattern: /\bif\s*\(/, why: 'branch with if / else if / else' }] } },
      { id: 'e2', title: 'RSI zones', difficulty: 'Core',
        prompt: 'RSI runs 0–100. Given <code>rsi = 22</code>, declare <code>zone</code>:<ul>' +
          '<li><code>&gt;= 70</code> → <code>"overbought"</code></li>' +
          '<li><code>&lt;= 30</code> → <code>"oversold"</code></li>' +
          '<li>otherwise → <code>"neutral"</code></li></ul>',
        starter: 'const rsi = 22;\nlet zone;\n// Branch here\n',
        solution: 'const rsi = 22;\nlet zone;\nif (rsi >= 70) zone = "overbought";\nelse if (rsi <= 30) zone = "oversold";\nelse zone = "neutral";',
        hints: [
          'Watch the boundaries: 70 and 30 are <em>inclusive</em>, so use <code>&gt;=</code> and <code>&lt;=</code>.',
          '22 is at or below 30, so the answer is <code>"oversold"</code>.'
        ],
        tests: { checks: [CX.val('zone', 'oversold')] } },
      { id: 'e3', title: 'Position size ladder', difficulty: 'Stretch',
        prompt: 'Size the trade by account equity. Given <code>equity = 47000</code>, declare <code>contracts</code>:<ul>' +
          '<li>equity below <code>10000</code> → <code>0</code> (do not trade)</li>' +
          '<li>below <code>25000</code> → <code>1</code></li>' +
          '<li>below <code>100000</code> → <code>2</code></li>' +
          '<li><code>100000</code> or more → <code>4</code></li></ul>' +
          'Order the branches so each range is reachable.',
        starter: 'const equity = 47000;\nlet contracts;\n// Branch here\n',
        solution: 'const equity = 47000;\nlet contracts;\nif (equity < 10000) contracts = 0;\nelse if (equity < 25000) contracts = 1;\nelse if (equity < 100000) contracts = 2;\nelse contracts = 4;',
        hints: [
          'Going from smallest threshold upward means each <code>else if</code> only sees values that failed the previous test.',
          '47000 fails <code>&lt; 10000</code> and <code>&lt; 25000</code>, but passes <code>&lt; 100000</code>.'
        ],
        tests: { checks: [CX.val('contracts', 2)] } }
    ],
    quiz: [
      { q: 'How many branches of an if / else if / else chain can run in a single pass?',
        options: ['All that match', 'Exactly one', 'At most two', 'None — you need a switch'],
        answer: 1,
        explain: 'The first matching branch runs and the rest are skipped entirely. That is what makes ordering critical.' },
      { q: 'Why is this broken?<br><code>if (m &gt; 0) s = "weak";<br>else if (m &gt; 0.5) s = "strong";</code>',
        options: ['<code>s</code> is not declared', 'The second branch can never run', 'It needs a final else', '<code>&gt;</code> should be <code>&gt;=</code>'],
        answer: 1,
        explain: 'Any value above 0.5 is also above 0, so it matches the first branch and stops. Test the most specific condition first.' },
      { q: 'Where should you declare a variable that is assigned inside an if block and read afterwards?',
        options: ['Inside the if block with let', 'Before the if, with let', 'Inside with const', 'It does not matter'],
        answer: 1,
        explain: 'A <code>let</code> inside braces only exists inside those braces. Declare before, assign inside.' }
    ],
    recap: [
      'Only the first matching branch of a chain runs.',
      'Order conditions specific → general or the specific ones become unreachable.',
      'Declare before the branch, assign inside it.',
      'Most strategies collapse to a single branch producing one signal value.'
    ],
    vocab: [
      { term: 'RSI', def: 'Relative Strength Index, 0–100. Above 70 is conventionally "overbought", below 30 "oversold" — though in a strong trend it can pin at an extreme for hours.' },
      { term: 'Signal', def: 'The output of a strategy rule: what to do right now — long, short or flat.' }
    ]
  });

  C.push({
    id: 'd007', day: 7, module: 1, minutes: 30,
    title: 'Logical Operators: Stacking Filters',
    subtitle: '&&, ||, ! and short-circuit evaluation.',
    goal: '<b>Goal:</b> combine several conditions into one entry filter, the way a real strategy gates its trades.',
    objectives: [
      'Combine conditions with <code>&amp;&amp;</code> and <code>||</code>',
      'Negate with <code>!</code>',
      'Use short-circuiting deliberately',
      'Build a multi-condition entry filter'
    ],
    sections: [
      { h: 'AND requires everything; OR requires anything',
        body: '<p><code>&amp;&amp;</code> is true only when <em>both</em> sides are true. <code>||</code> is true when <em>either</em> side is. Real entry rules are almost always an AND of several filters.</p>',
        code: 'const aboveTrend = true;\nconst volatilityOk = true;\nconst inSession = false;\n\nconsole.log(aboveTrend && volatilityOk);              // true\nconsole.log(aboveTrend && volatilityOk && inSession); // false\nconsole.log(inSession || aboveTrend);                // true' },
      { h: 'NOT flips a boolean',
        body: '<p><code>!</code> turns true into false and back. <code>!!x</code> is the idiomatic way to force any value into a real boolean.</p>',
        code: 'const halted = false;\nconsole.log(!halted);        // true — safe to trade\n\nconsole.log(!!"ES");         // true\nconsole.log(!!0);            // false' },
      { h: 'Precedence: ! then && then ||',
        body: '<p><code>&amp;&amp;</code> binds tighter than <code>||</code>, so <code>a || b &amp;&amp; c</code> means <code>a || (b &amp;&amp; c)</code>. Do not rely on that — add parentheses and let the reader see your intent.</p>',
        code: 'const trendUp = false, momentum = true, breakout = true;\n\nconsole.log(trendUp || momentum && breakout);     // true, but ambiguous\nconsole.log((trendUp || momentum) && breakout);   // true, and obvious\nconsole.log(trendUp || (momentum && breakout));   // true, and obvious' },
      { h: 'Short-circuiting',
        body: '<p><code>&amp;&amp;</code> stops as soon as it hits a false — the right-hand side is never evaluated. <code>||</code> stops at the first truthy value. This is how you guard an expensive or unsafe operation.</p>' +
              '<div class="note note-trade"><b>On the desk</b>A live entry filter usually reads: session is open <em>and</em> not halted <em>and</em> trend agrees <em>and</em> volatility is sufficient <em>and</em> risk budget remains. Any single false blocks the trade — which is exactly what <code>&amp;&amp;</code> gives you for free.</div>',
        code: 'const inSession = false;\n\nfunction expensiveCheck() {\n  console.log("...running the expensive check");\n  return true;\n}\n\n// expensiveCheck never runs, because inSession is already false\nconst canTrade = inSession && expensiveCheck();\nconsole.log("canTrade:", canTrade);' }
    ],
    parsons: {
      prompt: 'Build an entry filter that requires the session to be open, the trend to agree, and volatility to be sufficient.',
      lines: [
        'const inSession = true;',
        'const trendUp = true;',
        'const atr = 9.4;',
        'const volatilityOk = atr > 6;',
        'const canGoLong = inSession && trendUp && volatilityOk;',
        'console.log("Long allowed:", canGoLong);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'The entry gate', difficulty: 'Core',
        prompt: 'Declare <code>canGoLong</code>, true only when <strong>all</strong> of these hold:<ul>' +
          '<li><code>inSession</code> is true</li><li><code>trendUp</code> is true</li>' +
          '<li><code>atr</code> is greater than <code>6</code></li><li><code>halted</code> is <strong>false</strong></li></ul>',
        starter: 'const inSession = true;\nconst trendUp = true;\nconst atr = 9.4;\nconst halted = false;\n\n// Declare canGoLong\n',
        solution: 'const inSession = true;\nconst trendUp = true;\nconst atr = 9.4;\nconst halted = false;\nconst canGoLong = inSession && trendUp && atr > 6 && !halted;',
        hints: [
          'Chain every requirement with <code>&amp;&amp;</code>.',
          '"halted is false" is written <code>!halted</code>.'
        ],
        tests: { checks: [CX.val('canGoLong', true)],
          source: [{ name: 'uses && to combine conditions', pattern: /&&/, why: 'combine the filters with &&' },
                   { name: 'negates halted with !', pattern: /!\s*halted/, why: 'use !halted rather than comparing to false' }] } },
      { id: 'e2', title: 'Either exit fires', difficulty: 'Core',
        prompt: 'A position exits when <strong>any</strong> of these is true. Declare <code>shouldExit</code>:<ul>' +
          '<li><code>hitStop</code> is true</li><li><code>hitTarget</code> is true</li>' +
          '<li><code>minutesHeld</code> is at least <code>60</code></li></ul>',
        starter: 'const hitStop = false;\nconst hitTarget = false;\nconst minutesHeld = 74;\n\n// Declare shouldExit\n',
        solution: 'const hitStop = false;\nconst hitTarget = false;\nconst minutesHeld = 74;\nconst shouldExit = hitStop || hitTarget || minutesHeld >= 60;',
        hints: [
          '"Any of these" is <code>||</code>.',
          '"At least 60" is <code>&gt;= 60</code>.'
        ],
        tests: { checks: [CX.val('shouldExit', true)],
          source: [{ name: 'uses || to combine exits', pattern: /\|\|/, why: 'any one condition should trigger the exit' }] } },
      { id: 'e3', title: 'Long, short or stand aside', difficulty: 'Stretch',
        prompt: 'Combine both directions. Declare <code>decision</code>:<ul>' +
          '<li><code>"long"</code> when the session is open, not halted, and <code>momentum &gt; 0.3</code></li>' +
          '<li><code>"short"</code> when the session is open, not halted, and <code>momentum &lt; -0.3</code></li>' +
          '<li><code>"stand aside"</code> in every other case</li></ul>',
        starter: 'const inSession = true;\nconst halted = false;\nconst momentum = -0.55;\n\nlet decision;\n// Branch here\n',
        solution: 'const inSession = true;\nconst halted = false;\nconst momentum = -0.55;\nlet decision;\nconst tradeable = inSession && !halted;\nif (tradeable && momentum > 0.3) decision = "long";\nelse if (tradeable && momentum < -0.3) decision = "short";\nelse decision = "stand aside";',
        hints: [
          'Pull the shared part out first: <code>const tradeable = inSession &amp;&amp; !halted;</code>',
          'Then each branch is just <code>tradeable &amp;&amp; momentum ...</code>.'
        ],
        tests: { checks: [CX.val('decision', 'short')] } }
    ],
    quiz: [
      { q: 'What is <code>true && false || true</code>?',
        options: ['<code>false</code>', '<code>true</code>', 'A SyntaxError', 'Depends on the browser'],
        answer: 1,
        explain: '<code>&amp;&amp;</code> binds tighter, so this is <code>(true &amp;&amp; false) || true</code> → <code>false || true</code> → <code>true</code>.' },
      { q: 'In <code>inSession && expensiveCheck()</code> with <code>inSession = false</code>, how many times does <code>expensiveCheck</code> run?',
        options: ['Once', 'Zero times', 'Twice', 'Once per condition'],
        answer: 1,
        explain: '<code>&amp;&amp;</code> short-circuits: once the left side is false the result is already known, so the right side is never evaluated.' },
      { q: 'Your entry needs five filters that must <em>all</em> pass. Which operator?',
        options: ['<code>||</code> between each', '<code>&amp;&amp;</code> between each', '<code>!</code> before each', 'A separate <code>if</code> per filter'],
        answer: 1,
        explain: '"All must pass" is AND. Any single false blocks the trade, which is the behaviour you want from a risk gate.' }
    ],
    recap: [
      '<code>&amp;&amp;</code> = all must be true; <code>||</code> = any may be true; <code>!</code> flips.',
      '<code>&amp;&amp;</code> binds tighter than <code>||</code> — but write the parentheses anyway.',
      'Short-circuiting skips the right side once the answer is settled.',
      'Extract the shared part of several conditions into its own named boolean.'
    ],
    vocab: [
      { term: 'ATR', def: 'Average True Range — the average size of recent bars. A crude but effective volatility filter: too low and there is no room to make the target.' },
      { term: 'Filter', def: 'A condition that must pass before a signal is allowed to become a trade. Filters cut trade count and usually raise win rate.' }
    ]
  });


  C.push({
    id: 'd008', day: 8, module: 1, minutes: 25,
    title: 'Ternary and switch',
    subtitle: 'Compact decisions for labels, tiers and symbol lookups.',
    goal: '<b>Goal:</b> replace short if/else chains with expressions that fit on one line — without making them unreadable.',
    objectives: [
      'Use the ternary operator <code>cond ? a : b</code>',
      'Know when a ternary hurts more than it helps',
      'Write a <code>switch</code> with <code>case</code>, <code>break</code> and <code>default</code>',
      'Use deliberate fall-through to group cases'
    ],
    sections: [
      { h: 'The ternary operator',
        body: '<p>An <code>if</code> is a <em>statement</em> — it does something. A ternary is an <em>expression</em> — it produces a value, so you can assign it directly.</p>',
        code: 'const pnl = -240;\n\n// if version\nlet label1;\nif (pnl >= 0) label1 = "WIN"; else label1 = "LOSS";\n\n// ternary version\nconst label2 = pnl >= 0 ? "WIN" : "LOSS";\n\nconsole.log(label1, label2);\nconsole.log(`Trade closed ${pnl >= 0 ? "up" : "down"} ${Math.abs(pnl)}`);' },
      { h: 'Chained ternaries: use sparingly',
        body: '<p>Ternaries can chain, and for a short ladder of thresholds that reads well. Beyond three branches, go back to <code>if/else if</code> — cleverness is not a virtue in risk code.</p>',
        code: 'const rsi = 55;\n\nconst zone = rsi >= 70 ? "overbought"\n           : rsi <= 30 ? "oversold"\n           : "neutral";\n\nconsole.log(zone);' },
      { h: 'switch for one value against many cases',
        body: '<p>When you are comparing <em>one</em> value against a list of exact matches — a symbol, an order type, a state name — <code>switch</code> is clearer than a chain.</p>' +
              '<div class="note note-warn"><b>Do not forget break</b>Without <code>break</code>, execution falls through into the next case and keeps going. That is occasionally what you want, and much more often a bug.</div>',
        code: 'const symbol = "NQ";\n\nlet pointValue;\nswitch (symbol) {\n  case "ES":\n    pointValue = 50;\n    break;\n  case "NQ":\n    pointValue = 20;\n    break;\n  case "CL":\n    pointValue = 1000;\n    break;\n  default:\n    pointValue = 0;\n}\nconsole.log(symbol, "is worth $" + pointValue + " per point");' },
      { h: 'Deliberate fall-through groups cases',
        body: '<p>Stacked <code>case</code> labels with no code between them share a body. This is the clean way to say "any of these".</p>',
        code: 'const orderType = "stop-limit";\n\nlet needsPrice;\nswitch (orderType) {\n  case "limit":\n  case "stop-limit":\n    needsPrice = true;\n    break;\n  case "market":\n  case "stop":\n    needsPrice = false;\n    break;\n  default:\n    needsPrice = false;\n}\nconsole.log(orderType, "needs a price?", needsPrice);' }
    ],
    parsons: {
      prompt: 'Look up a contract multiplier with a switch.',
      lines: [
        'const symbol = "CL";',
        'let multiplier;',
        'switch (symbol) {',
        '  case "ES": multiplier = 50; break;',
        '  case "CL": multiplier = 1000; break;',
        '  default: multiplier = 0;',
        '}',
        'console.log(multiplier);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Label the trade', difficulty: 'Warm-up',
        prompt: 'Given <code>pnl = -240</code>, declare <code>label</code> as <code>"WIN"</code> when the P&L is zero or better and <code>"LOSS"</code> otherwise. Use a ternary, not an <code>if</code>.',
        starter: 'const pnl = -240;\n// Declare label with a ternary\n',
        solution: 'const pnl = -240;\nconst label = pnl >= 0 ? "WIN" : "LOSS";',
        hints: ['The shape is <code>condition ? valueIfTrue : valueIfFalse</code>.',
                '"Zero or better" is <code>pnl &gt;= 0</code>.'],
        tests: { checks: [CX.val('label', 'LOSS')],
          source: [{ name: 'uses a ternary', pattern: /\?[^:]*:/, why: 'use cond ? a : b rather than an if statement' },
                   { name: 'no if statement', pattern: /\bif\s*\(/, forbid: true, why: 'this one is a ternary exercise' }] } },
      { id: 'e2', title: 'Volatility tier', difficulty: 'Core',
        prompt: 'Given <code>atr = 11.2</code>, declare <code>tier</code> with a chained ternary:<ul>' +
          '<li><code>15</code> or more → <code>"high"</code></li>' +
          '<li><code>7</code> or more → <code>"normal"</code></li>' +
          '<li>otherwise → <code>"low"</code></li></ul>',
        starter: 'const atr = 11.2;\n// Declare tier with a chained ternary\n',
        solution: 'const atr = 11.2;\nconst tier = atr >= 15 ? "high" : atr >= 7 ? "normal" : "low";',
        hints: ['Chain by putting a second ternary in the "else" slot.',
                '<code>a >= 15 ? "high" : (a >= 7 ? "normal" : "low")</code>'],
        tests: { checks: [CX.val('tier', 'normal')],
          source: [{ name: 'uses ternaries', pattern: /\?[^:]*:/, why: 'chain two ternaries' }] } },
      { id: 'e3', title: 'Contract multiplier', difficulty: 'Core',
        prompt: 'Given <code>symbol = "CL"</code>, declare <code>pointValue</code> with a <code>switch</code>:<br>' +
          '<code>ES</code> → 50, <code>NQ</code> → 20, <code>RTY</code> → 50, <code>CL</code> → 1000, <code>GC</code> → 100, anything else → 0.<br>' +
          'Group ES and RTY with a shared fall-through since both are 50.',
        starter: 'const symbol = "CL";\nlet pointValue;\n// switch here\n',
        solution: 'const symbol = "CL";\nlet pointValue;\nswitch (symbol) {\n  case "ES":\n  case "RTY": pointValue = 50; break;\n  case "NQ": pointValue = 20; break;\n  case "CL": pointValue = 1000; break;\n  case "GC": pointValue = 100; break;\n  default: pointValue = 0;\n}',
        hints: ['Stack <code>case "ES":</code> and <code>case "RTY":</code> with nothing between them.',
                'Every branch that sets a value needs its own <code>break</code>.'],
        tests: { checks: [CX.val('pointValue', 1000)],
          source: [{ name: 'uses a switch statement', pattern: /switch\s*\(/, why: 'this exercise is about switch' },
                   { name: 'has a default case', pattern: /default\s*:/, why: 'unknown symbols must fall to 0' }] } }
    ],
    quiz: [
      { q: 'What does <code>const s = qty > 0 ? "long" : "flat";</code> assign when <code>qty</code> is 0?',
        options: ['<code>"long"</code>', '<code>"flat"</code>', '<code>undefined</code>', 'A SyntaxError'],
        answer: 1,
        explain: '0 is not greater than 0, so the condition is false and the value after the colon is used.' },
      { q: 'A <code>case</code> body has no <code>break</code>. What happens?',
        options: ['The switch ends', 'Execution falls through into the next case body', 'A SyntaxError', 'The default runs instead'],
        answer: 1,
        explain: 'Without <code>break</code>, control continues into the following case — occasionally useful for grouping, usually a bug.' },
      { q: 'When is <code>switch</code> a better fit than <code>if/else if</code>?',
        options: ['When comparing ranges of numbers', 'When testing one value against many exact matches', 'When you need <code>&amp;&amp;</code>', 'It is always better'],
        answer: 1,
        explain: '<code>switch</code> compares one expression against fixed values with <code>===</code>. Ranges and compound conditions belong in an if-chain.' }
    ],
    recap: [
      'A ternary is an expression: it produces a value you can assign.',
      'Chain at most two or three; beyond that use <code>if/else if</code>.',
      '<code>switch</code> matches one value against exact cases with <code>===</code>.',
      'Always <code>break</code> unless you mean to fall through.'
    ],
    vocab: [
      { term: 'Order type', def: 'How an order interacts with the book: market (fill now, any price), limit (this price or better), stop (become a market order when touched).' }
    ]
  });

  C.push({
    id: 'd009', day: 9, module: 1, minutes: 30,
    title: 'for Loops: Walking the Bars',
    subtitle: 'Iteration, accumulators and the running high.',
    goal: '<b>Goal:</b> walk a whole session of prices one bar at a time and accumulate a result.',
    objectives: [
      'Write a classic <code>for</code> loop with index, condition and step',
      'Accumulate a running total inside a loop',
      'Track a running maximum or minimum',
      'Use <code>for...of</code> when the index is irrelevant'
    ],
    sections: [
      { h: 'The three-part for loop',
        body: '<p><code>for (start; keep going while; after each pass)</code>. The index <code>i</code> gives you the position, which matters the moment you need to compare a bar with the one before it.</p>',
        code: 'const closes = [5240.5, 5238.25, 5244.0, 5251.75];\n\nfor (let i = 0; i < closes.length; i++) {\n  console.log(`bar ${i}: ${closes[i]}`);\n}' },
      { h: 'Accumulators: declare outside, update inside',
        body: '<p>The pattern behind nearly every statistic: a variable declared <em>before</em> the loop that the loop keeps updating.</p>',
        code: 'const closes = [5240.5, 5238.25, 5244.0, 5251.75];\n\nlet sum = 0;\nfor (let i = 0; i < closes.length; i++) {\n  sum = sum + closes[i];   // or: sum += closes[i]\n}\nconsole.log("Sum:", sum);\nconsole.log("Average:", (sum / closes.length).toFixed(2));' },
      { h: 'Running highs and lows',
        body: '<p>Same shape, different update rule. Seed the accumulator with the first value — seeding with <code>0</code> would make every low look like 0.</p>' +
              '<div class="note note-warn"><b>Seed carefully</b>Seeding a running minimum with <code>0</code> is a classic bug: no price is below zero, so the answer is always 0.</div>',
        code: 'const closes = [5240.5, 5238.25, 5244.0, 5251.75];\n\nlet high = closes[0];\nlet low = closes[0];\nfor (let i = 1; i < closes.length; i++) {\n  if (closes[i] > high) high = closes[i];\n  if (closes[i] < low) low = closes[i];\n}\nconsole.log("High:", high, "Low:", low);' },
      { h: 'for...of when you do not need the index',
        body: '<p>If the loop body never uses <code>i</code>, <code>for...of</code> says so and removes three chances to make an off-by-one error.</p>',
        code: '// The real sample session is available as `bars`\nlet green = 0;\nfor (const bar of bars) {\n  if (bar.close > bar.open) green++;\n}\nconsole.log(`${green} green bars out of ${bars.length}`);' }
    ],
    parsons: {
      prompt: 'Total up an array of closes and print the average.',
      lines: [
        'const prices = [10, 12, 11, 15];',
        'let sum = 0;',
        'for (let i = 0; i < prices.length; i++) {',
        '  sum += prices[i];',
        '}',
        'console.log(sum / prices.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Sum the session', difficulty: 'Core',
        prompt: 'Using a <code>for</code> loop over the built-in <code>closes</code> array, declare <code>total</code> as the sum of every close, and <code>average</code> as the mean.<br>' +
          '<span class="muted">(<code>closes</code> holds 78 five-minute ES closes and is already in scope.)</span>',
        starter: 'let total = 0;\n// Loop over closes and build up total\n\n// Then declare average\n',
        solution: 'let total = 0;\nfor (let i = 0; i < closes.length; i++) {\n  total += closes[i];\n}\nconst average = total / closes.length;',
        hints: ['Start <code>total</code> at 0 <em>before</em> the loop.',
                '<code>total += closes[i];</code> is shorthand for <code>total = total + closes[i];</code>'],
        tests: { checks: [
          CX.check('total is the sum of all 78 closes', ['total'], function (s, h) {
            var want = MARKET.closes.reduce(function (a, b) { return a + b; }, 0);
            if (typeof s.total !== 'number') return 'total should be a number';
            return Math.abs(s.total - want) < 0.01 ? true : 'expected about ' + want.toFixed(2) + ', got ' + s.total;
          }),
          CX.check('average is total / 78', ['average'], function (s) {
            var want = MARKET.closes.reduce(function (a, b) { return a + b; }, 0) / MARKET.closes.length;
            return Math.abs(s.average - want) < 0.01 ? true : 'expected about ' + want.toFixed(2) + ', got ' + s.average;
          })
        ] } },
      { id: 'e2', title: 'Session high and low', difficulty: 'Core',
        prompt: 'Loop over <code>closes</code> and declare <code>highest</code> and <code>lowest</code> — the largest and smallest close of the session.<br>Seed both from the first element, not from 0.',
        starter: 'let highest = closes[0];\nlet lowest = closes[0];\n// Loop and update both\n',
        solution: 'let highest = closes[0];\nlet lowest = closes[0];\nfor (let i = 1; i < closes.length; i++) {\n  if (closes[i] > highest) highest = closes[i];\n  if (closes[i] < lowest) lowest = closes[i];\n}',
        hints: ['Start the loop at <code>i = 1</code> — element 0 is already the seed.',
                'Two <code>if</code> statements inside the loop, one for each direction.'],
        tests: { checks: [
          CX.check('highest is the session high close', ['highest'], function (s) {
            var w = Math.max.apply(null, MARKET.closes);
            return s.highest === w ? true : 'expected ' + w + ', got ' + s.highest;
          }),
          CX.check('lowest is the session low close', ['lowest'], function (s) {
            var w = Math.min.apply(null, MARKET.closes);
            return s.lowest === w ? true : 'expected ' + w + ', got ' + s.lowest;
          })
        ] } },
      { id: 'e3', title: 'Count the green bars', difficulty: 'Stretch',
        prompt: 'A bar is <strong>green</strong> when its close is above its open. Using <code>for...of</code> over <code>bars</code>, declare:<ul>' +
          '<li><code>greenCount</code> — bars closing above their open</li>' +
          '<li><code>redCount</code> — bars closing below their open</li></ul>' +
          'Bars that close exactly at their open count as neither.',
        starter: 'let greenCount = 0;\nlet redCount = 0;\n// for (const bar of bars) { ... }\n',
        solution: 'let greenCount = 0;\nlet redCount = 0;\nfor (const bar of bars) {\n  if (bar.close > bar.open) greenCount++;\n  else if (bar.close < bar.open) redCount++;\n}',
        hints: ['<code>for (const bar of bars) { ... }</code> hands you each bar object directly.',
                'Use <code>else if</code> so an unchanged bar is counted in neither bucket.'],
        tests: { checks: [
          CX.check('greenCount matches the data', ['greenCount'], function (s) {
            var w = MARKET.bars.filter(function (b) { return b.close > b.open; }).length;
            return s.greenCount === w ? true : 'expected ' + w + ', got ' + s.greenCount;
          }),
          CX.check('redCount matches the data', ['redCount'], function (s) {
            var w = MARKET.bars.filter(function (b) { return b.close < b.open; }).length;
            return s.redCount === w ? true : 'expected ' + w + ', got ' + s.redCount;
          })
        ] } }
    ],
    quiz: [
      { q: 'How many times does <code>for (let i = 0; i &lt; 5; i++)</code> run its body?',
        options: ['4', '5', '6', 'Depends on the body'],
        answer: 1,
        explain: 'i takes the values 0,1,2,3,4 — five passes. At i = 5 the condition fails and the loop ends.' },
      { q: 'Why seed a running minimum with <code>prices[0]</code> instead of <code>0</code>?',
        options: ['It is faster', 'Because no price is below 0, so the answer would always be 0', 'Because 0 is falsy', 'It makes no difference'],
        answer: 1,
        explain: 'Seeding with 0 means the comparison <code>price &lt; min</code> is never true, and the loop reports a minimum of 0 that never traded.' },
      { q: 'When should you prefer <code>for...of</code> over an indexed <code>for</code>?',
        options: ['Always', 'When the body never needs the index', 'When the array is large', 'When you need to compare each item to the previous one'],
        answer: 1,
        explain: 'If you need <code>i</code> — for example to look at <code>arr[i-1]</code> — you need the indexed form. Otherwise <code>for...of</code> is safer.' }
    ],
    recap: [
      'A <code>for</code> loop is start / condition / step.',
      'Accumulators are declared before the loop and updated inside it.',
      'Seed running highs and lows with the first element.',
      '<code>for...of</code> when the index is not needed.'
    ],
    vocab: [
      { term: 'Bar (candle)', def: 'One time slice of trading summarised as open, high, low, close and volume. A 5-minute bar covers five minutes of ticks.' },
      { term: 'Green / red bar', def: 'A bar that closed above (green) or below (red) its open. The simplest possible read on a bar.' }
    ]
  });

  C.push({
    id: 'd010', day: 10, module: 1, minutes: 30, boss: true,
    title: 'Boss: The Session Report',
    subtitle: 'Everything from days 1–9, applied to a real session of data.',
    goal: '<b>Goal:</b> produce a complete end-of-day report from raw bars — no new syntax, just everything you already know, working together.',
    objectives: [
      'Extract summary statistics from an array of bars',
      'Combine loops, conditions and arithmetic into one result',
      'Format numbers and build a multi-line report',
      'Debug your own logic when a number looks wrong'
    ],
    sections: [
      { h: 'What a session report contains',
        body: '<p>At 16:00 every desk produces the same handful of numbers. You now know enough to compute all of them:</p>' +
              '<ul><li><strong>Open / close</strong> — first and last price</li>' +
              '<li><strong>High / low</strong> — the session extremes</li>' +
              '<li><strong>Range</strong> — high minus low, the day\'s opportunity</li>' +
              '<li><strong>Net change</strong> — close minus open, in points and percent</li>' +
              '<li><strong>Breadth</strong> — how many bars were green vs red</li></ul>' +
              '<p>No new syntax appears in this level. If something does not work, the bug is in your reasoning, not in a feature you have not met — which is exactly the skill this level trains.</p>' },
      { h: 'Percent change',
        body: '<p>Percent change is <code>(new − old) / old × 100</code>. Note the denominator is the <em>old</em> value; dividing by the new one is a common and very quiet error.</p>',
        code: 'const open = 5240.00;\nconst close = 5199.33;\n\nconst points = close - open;\nconst percent = (points / open) * 100;\n\nconsole.log(points.toFixed(2), "points");\nconsole.log(percent.toFixed(2) + "%");' },
      { h: 'Debugging a wrong number',
        body: '<p>When a figure looks wrong, print the inputs, not the output. Nine times out of ten the loop bounds or the seed value are the culprit.</p>',
        code: 'const closes = [10, 12, 11, 15];\n\nlet high = 0;              // <- the bug\nfor (let i = 0; i < closes.length; i++) {\n  console.log("checking", closes[i], "against", high);\n  if (closes[i] > high) high = closes[i];\n}\nconsole.log("high =", high);  // right by luck here, wrong for negatives' }
    ],
    parsons: {
      prompt: 'Assemble the core of a session report.',
      lines: [
        'const open = bars[0].open;',
        'const close = bars[bars.length - 1].close;',
        'const net = close - open;',
        'const percent = (net / open) * 100;',
        'console.log(`Net ${net.toFixed(2)} (${percent.toFixed(2)}%)`);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Session extremes', difficulty: 'Boss · part 1',
        prompt: 'From the <code>bars</code> array declare four values:<ul>' +
          '<li><code>sessionOpen</code> — the <code>open</code> of the first bar</li>' +
          '<li><code>sessionClose</code> — the <code>close</code> of the last bar</li>' +
          '<li><code>sessionHigh</code> — the highest <code>high</code> of any bar</li>' +
          '<li><code>sessionLow</code> — the lowest <code>low</code> of any bar</li></ul>' +
          'Note that the high and low come from the <code>high</code>/<code>low</code> fields, not the closes.',
        starter: 'const sessionOpen = bars[0].open;\nconst sessionClose = bars[bars.length - 1].close;\n\nlet sessionHigh = bars[0].high;\nlet sessionLow = bars[0].low;\n// Loop over bars and update the two extremes\n',
        solution: 'const sessionOpen = bars[0].open;\nconst sessionClose = bars[bars.length - 1].close;\nlet sessionHigh = bars[0].high;\nlet sessionLow = bars[0].low;\nfor (const b of bars) {\n  if (b.high > sessionHigh) sessionHigh = b.high;\n  if (b.low < sessionLow) sessionLow = b.low;\n}',
        hints: ['<code>bars[bars.length - 1]</code> is the last bar.',
                'Inside the loop compare <code>b.high</code> to <code>sessionHigh</code> and <code>b.low</code> to <code>sessionLow</code>.'],
        tests: { checks: [
          CX.check('sessionOpen is the first bar open', ['sessionOpen'], function (s) {
            return s.sessionOpen === MARKET.bars[0].open ? true : 'expected ' + MARKET.bars[0].open + ', got ' + s.sessionOpen;
          }),
          CX.check('sessionClose is the last bar close', ['sessionClose'], function (s) {
            var w = MARKET.bars[MARKET.bars.length - 1].close;
            return s.sessionClose === w ? true : 'expected ' + w + ', got ' + s.sessionClose;
          }),
          CX.check('sessionHigh is the highest high', ['sessionHigh'], function (s) {
            var w = Math.max.apply(null, MARKET.highs);
            return s.sessionHigh === w ? true : 'expected ' + w + ', got ' + s.sessionHigh;
          }),
          CX.check('sessionLow is the lowest low', ['sessionLow'], function (s) {
            var w = Math.min.apply(null, MARKET.lows);
            return s.sessionLow === w ? true : 'expected ' + w + ', got ' + s.sessionLow;
          })
        ] } },
      { id: 'e2', title: 'Change and breadth', difficulty: 'Boss · part 2',
        prompt: 'Declare four more values from <code>bars</code>:<ul>' +
          '<li><code>netPoints</code> — last close minus first open</li>' +
          '<li><code>netPercent</code> — that change as a percentage of the first open</li>' +
          '<li><code>upBars</code> — count of bars closing above their open</li>' +
          '<li><code>downBars</code> — count of bars closing below their open</li></ul>',
        starter: '// Declare netPoints, netPercent, upBars and downBars\n',
        solution: 'const netPoints = bars[bars.length - 1].close - bars[0].open;\nconst netPercent = (netPoints / bars[0].open) * 100;\nlet upBars = 0, downBars = 0;\nfor (const b of bars) {\n  if (b.close > b.open) upBars++;\n  else if (b.close < b.open) downBars++;\n}',
        hints: ['Percent change divides by the <em>starting</em> value: <code>(net / open) * 100</code>.',
                'You can declare two counters on one line: <code>let upBars = 0, downBars = 0;</code>'],
        tests: { checks: [
          CX.check('netPoints is close − open', ['netPoints'], function (s) {
            var w = MARKET.bars[MARKET.bars.length - 1].close - MARKET.bars[0].open;
            return Math.abs(s.netPoints - w) < 0.001 ? true : 'expected about ' + w.toFixed(2) + ', got ' + s.netPoints;
          }),
          CX.check('netPercent is a percentage of the open', ['netPercent'], function (s) {
            var w = (MARKET.bars[MARKET.bars.length - 1].close - MARKET.bars[0].open) / MARKET.bars[0].open * 100;
            return Math.abs(s.netPercent - w) < 0.001 ? true : 'expected about ' + w.toFixed(4) + ', got ' + s.netPercent;
          }),
          CX.check('upBars counts green bars', ['upBars'], function (s) {
            var w = MARKET.bars.filter(function (b) { return b.close > b.open; }).length;
            return s.upBars === w ? true : 'expected ' + w + ', got ' + s.upBars;
          }),
          CX.check('downBars counts red bars', ['downBars'], function (s) {
            var w = MARKET.bars.filter(function (b) { return b.close < b.open; }).length;
            return s.downBars === w ? true : 'expected ' + w + ', got ' + s.downBars;
          })
        ] } },
      { id: 'e3', title: 'Print the report', difficulty: 'Boss · final',
        prompt: 'Put it together. Declare <code>report</code> as a multi-line string with exactly these six lines, each number fixed to <strong>2 decimals</strong>:' +
          '<pre style="background:var(--bg-3);padding:10px;border-radius:8px;font-size:.8rem;margin:8px 0">ES SESSION REPORT\nOpen   5240.00\nClose  5199.33\nHigh   5243.16\nLow    5197.06\nRange  46.10</pre>' +
          'The label occupies 7 characters (label plus padding), then the number. Use <code>padEnd(7)</code> on each label.<br>' +
          'Then <code>console.log(report)</code>.',
        starter: 'const o = bars[0].open;\nconst c = bars[bars.length - 1].close;\nlet hi = bars[0].high, lo = bars[0].low;\nfor (const b of bars) {\n  if (b.high > hi) hi = b.high;\n  if (b.low < lo) lo = b.low;\n}\n\n// Build `report`, then log it\n',
        solution: 'const o = bars[0].open;\nconst c = bars[bars.length - 1].close;\nlet hi = bars[0].high, lo = bars[0].low;\nfor (const b of bars) {\n  if (b.high > hi) hi = b.high;\n  if (b.low < lo) lo = b.low;\n}\nconst report = "ES SESSION REPORT\\n" +\n  "Open".padEnd(7) + o.toFixed(2) + "\\n" +\n  "Close".padEnd(7) + c.toFixed(2) + "\\n" +\n  "High".padEnd(7) + hi.toFixed(2) + "\\n" +\n  "Low".padEnd(7) + lo.toFixed(2) + "\\n" +\n  "Range".padEnd(7) + (hi - lo).toFixed(2);\nconsole.log(report);',
        hints: ['<code>"\\n"</code> inside a normal string is a line break; a template literal can just contain real line breaks.',
                '<code>"Open".padEnd(7)</code> gives <code>"Open   "</code> — four letters plus three spaces.',
                'Range is <code>hi - lo</code>, computed, not typed.'],
        tests: { checks: [
          CX.check('report has six lines', ['report'], function (s) {
            if (typeof s.report !== 'string') return 'report should be a string';
            var n = s.report.split('\n').length;
            return n === 6 ? true : 'expected 6 lines, got ' + n;
          }),
          CX.check('report matches the required layout', ['report'], function (s) {
            var B = MARKET.bars;
            var o = B[0].open, c = B[B.length - 1].close;
            var hi = Math.max.apply(null, MARKET.highs), lo = Math.min.apply(null, MARKET.lows);
            var want = 'ES SESSION REPORT\n' +
              'Open'.padEnd(7) + o.toFixed(2) + '\n' +
              'Close'.padEnd(7) + c.toFixed(2) + '\n' +
              'High'.padEnd(7) + hi.toFixed(2) + '\n' +
              'Low'.padEnd(7) + lo.toFixed(2) + '\n' +
              'Range'.padEnd(7) + (hi - lo).toFixed(2);
            return s.report === want ? true : 'expected:\n' + want + '\n\ngot:\n' + s.report;
          })
        ] } }
    ],
    quiz: [
      { q: 'Percent change from 5240 to 5199 is computed as…',
        options: ['<code>(5199 - 5240) / 5199 * 100</code>', '<code>(5199 - 5240) / 5240 * 100</code>', '<code>5199 / 5240 * 100</code>', '<code>(5240 - 5199) / 5240 * 100</code>'],
        answer: 1,
        explain: 'Always divide the change by the <em>starting</em> value. Dividing by the new value gives a subtly different number that looks plausible.' },
      { q: 'Why should the session high come from <code>bar.high</code> rather than <code>bar.close</code>?',
        options: ['They are always equal', 'Price can trade above the close within the bar', '<code>close</code> is a string', 'It is faster'],
        answer: 1,
        explain: 'A bar records the extremes reached during the period. A stop placed between the close and the high would have been hit — using closes alone hides that.' },
      { q: 'Your running low reports 0 for a session of ES prices. What is the most likely cause?',
        options: ['The data is corrupt', 'The accumulator was seeded with 0', 'The loop runs backwards', '<code>Math.min</code> is broken'],
        answer: 1,
        explain: 'No ES price is below zero, so <code>price &lt; 0</code> is never true and the seed survives to the end.' }
    ],
    recap: [
      'A session report is loops + conditions + arithmetic — nothing more.',
      'Percent change divides by the starting value.',
      'Highs and lows live in the <code>high</code>/<code>low</code> fields, not the closes.',
      'When a number looks wrong, print the inputs.'
    ],
    vocab: [
      { term: 'Range', def: 'Session high minus session low. A rough measure of how much opportunity the day offered.' },
      { term: 'Breadth', def: 'How participation is spread — here, the split between green and red bars.' }
    ]
  });

  C.push({
    id: 'd011', day: 11, module: 1, minutes: 25,
    title: 'while, break and continue',
    subtitle: 'Loops that run until something happens rather than a fixed number of times.',
    goal: '<b>Goal:</b> loop until a condition is met — a stop is hit, a drawdown limit is breached, a retry succeeds.',
    objectives: [
      'Write a <code>while</code> loop and guarantee it terminates',
      'Use <code>do...while</code> when the body must run at least once',
      'Exit early with <code>break</code> and skip a pass with <code>continue</code>',
      'Recognise and avoid the infinite loop'
    ],
    sections: [
      { h: 'while: repeat until the condition fails',
        body: '<p>Use <code>for</code> when you know the count. Use <code>while</code> when you do not — "keep going until the stop is hit" has no fixed number of passes.</p>' +
              '<div class="note note-warn"><b>Something inside must change</b>Every <code>while</code> needs its condition to eventually become false. If nothing in the body moves it, the loop never ends. This page stops runaway loops after 3 seconds, but production code has no such mercy.</div>',
        code: 'let price = 5240;\nlet bars = 0;\nconst stop = 5232;\n\nwhile (price > stop && bars < 100) {\n  price -= 1.75;   // the market drifts down\n  bars++;\n}\nconsole.log(`Stop hit after ${bars} bars at ${price.toFixed(2)}`);' },
      { h: 'do...while runs the body first',
        body: '<p>The condition is checked <em>after</em> each pass, so the body always executes at least once. Useful for "try, then decide whether to try again".</p>',
        code: 'let attempt = 0;\nlet connected = false;\n\ndo {\n  attempt++;\n  connected = attempt >= 3;   // pretend the third try works\n  console.log("Connection attempt", attempt, connected ? "OK" : "failed");\n} while (!connected && attempt < 5);' },
      { h: 'break exits, continue skips',
        body: '<p><code>break</code> leaves the loop immediately. <code>continue</code> abandons the current pass and starts the next one. Both work in <code>for</code> and <code>while</code>.</p>',
        code: 'let firstRedIndex = -1;\n\nfor (let i = 0; i < bars.length; i++) {\n  if (bars[i].close >= bars[i].open) continue;  // skip green bars\n  firstRedIndex = i;\n  break;                                        // found it, stop looking\n}\nconsole.log("First red bar is index", firstRedIndex);' },
      { h: 'A drawdown walk',
        body: '<p>Here is the shape you will reuse constantly in module 6: walk an equity curve and stop the moment a rule is broken.</p>',
        code: 'const equity = [10000, 10250, 10100, 9800, 9600, 9900];\nconst limit = 9700;\n\nlet i = 0;\nwhile (i < equity.length && equity[i] >= limit) i++;\n\nif (i < equity.length) console.log("Limit breached at index", i, "->", equity[i]);\nelse console.log("Never breached");' }
    ],
    parsons: {
      prompt: 'Walk a price down until it hits a stop, counting the bars.',
      lines: [
        'let price = 5240;',
        'let steps = 0;',
        'while (price > 5232 && steps < 50) {',
        '  price -= 1.75;',
        '  steps++;',
        '}',
        'console.log(steps, price);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Bars until the stop', difficulty: 'Core',
        prompt: 'Price starts at <code>5240</code> and falls <code>1.75</code> per bar. The stop is <code>5232</code>.<br>' +
          'Using a <code>while</code> loop, declare <code>barsToStop</code> — how many bars pass before the price is at or below the stop.<br>' +
          '<span class="muted">Include a safety bound so the loop cannot run forever.</span>',
        starter: 'let price = 5240;\nlet barsToStop = 0;\n// while loop here\n',
        solution: 'let price = 5240;\nlet barsToStop = 0;\nwhile (price > 5232 && barsToStop < 1000) {\n  price -= 1.75;\n  barsToStop++;\n}',
        hints: ['The condition is <code>price &gt; 5232</code> — keep falling while it is still above the stop.',
                '5240 − 5232 = 8 points, and each bar is 1.75.'],
        tests: { checks: [CX.val('barsToStop', 5)] } },
      { id: 'e2', title: 'Find the first losing trade', difficulty: 'Core',
        prompt: 'The built-in <code>trades</code> array holds 8 trades, each with <code>side</code>, <code>entry</code> and <code>exit</code>.<br>' +
          'A long loses when <code>exit &lt; entry</code>; a short loses when <code>exit &gt; entry</code>.<br>' +
          'Loop over them and declare <code>firstLoserId</code> — the <code>id</code> of the first losing trade — using <code>break</code> once you find it. If none lose, leave it as <code>-1</code>.',
        starter: 'let firstLoserId = -1;\n// Loop over trades, break on the first loser\n',
        solution: 'let firstLoserId = -1;\nfor (const t of trades) {\n  const loss = t.side === "long" ? t.exit < t.entry : t.exit > t.entry;\n  if (loss) { firstLoserId = t.id; break; }\n}',
        hints: ['The losing test depends on the side — a ternary handles it in one line.',
                'Assign the id then <code>break</code> so later losers do not overwrite it.'],
        tests: { checks: [
          CX.check('firstLoserId is the first losing trade id', ['firstLoserId'], function (s) {
            var want = -1;
            for (var i = 0; i < MARKET.trades.length; i++) {
              var t = MARKET.trades[i];
              var loss = t.side === 'long' ? t.exit < t.entry : t.exit > t.entry;
              if (loss) { want = t.id; break; }
            }
            return s.firstLoserId === want ? true : 'expected ' + want + ', got ' + s.firstLoserId;
          })
        ] } },
      { id: 'e3', title: 'Retry with backoff', difficulty: 'Stretch',
        prompt: 'A data feed connects on the 4th attempt. Using <code>do...while</code>, declare:<ul>' +
          '<li><code>attempts</code> — how many attempts were made (should be 4)</li>' +
          '<li><code>waited</code> — total milliseconds waited, where attempt <em>n</em> waits <code>n * 250</code> ms <strong>after</strong> a failure only</li></ul>' +
          'So attempts 1, 2 and 3 fail and wait; attempt 4 succeeds and waits nothing.',
        starter: 'let attempts = 0;\nlet waited = 0;\nlet connected = false;\n// do { ... } while (...)\n',
        solution: 'let attempts = 0;\nlet waited = 0;\nlet connected = false;\ndo {\n  attempts++;\n  connected = attempts >= 4;\n  if (!connected) waited += attempts * 250;\n} while (!connected && attempts < 10);',
        hints: ['The body always runs once, so increment <code>attempts</code> at the top of it.',
                'Only add to <code>waited</code> when the attempt failed.'],
        tests: { checks: [CX.val('attempts', 4), CX.val('waited', 1500)] } }
    ],
    quiz: [
      { q: 'What is the difference between <code>while</code> and <code>do...while</code>?',
        options: ['None', '<code>do...while</code> always runs its body at least once', '<code>while</code> is faster', '<code>do...while</code> cannot use break'],
        answer: 1,
        explain: '<code>do...while</code> checks the condition after the body, so the body runs before the condition is ever evaluated.' },
      { q: 'Inside a loop, what does <code>continue</code> do?',
        options: ['Exits the loop', 'Skips the rest of this pass and starts the next', 'Restarts the loop from zero', 'Pauses execution'],
        answer: 1,
        explain: '<code>continue</code> jumps to the next iteration. <code>break</code> is the one that exits.' },
      { q: 'Why does <code>while (price > stop) { console.log(price); }</code> never end?',
        options: ['<code>console.log</code> is slow', 'Nothing in the body changes <code>price</code>', '<code>stop</code> is undefined', 'It needs a semicolon'],
        answer: 1,
        explain: 'A while loop only ends when its condition becomes false. If the body never moves the condition, it never will.' }
    ],
    recap: [
      '<code>while</code> for an unknown number of passes; <code>for</code> for a known count.',
      '<code>do...while</code> runs the body before testing.',
      '<code>break</code> exits; <code>continue</code> skips to the next pass.',
      'Every <code>while</code> needs something in the body that moves the condition.'
    ],
    vocab: [
      { term: 'Stop loss', def: 'A resting order that closes a position once price reaches a level, capping the loss on that trade.' },
      { term: 'Drawdown', def: 'The drop from an equity peak to a later trough. The number that decides whether a strategy is survivable.' }
    ]
  });

  C.push({
    id: 'd012', day: 12, module: 1, minutes: 30,
    title: 'Functions: Reusable Rules',
    subtitle: 'Parameters, return values and the discipline of pure functions.',
    goal: '<b>Goal:</b> package the P&L calculation into a function you can call for any trade, and understand why that makes it testable.',
    objectives: [
      'Declare functions three ways and know when each is used',
      'Pass parameters and return a value',
      'Give parameters sensible defaults',
      'Write pure functions — same inputs, same output, no side effects'
    ],
    sections: [
      { h: 'A function is a named, reusable block',
        body: '<p>Everything before this level computed one answer for one set of numbers. A function computes the answer for <em>any</em> numbers.</p>',
        code: 'function tradePnl(entry, exit, qty, pointValue) {\n  return (exit - entry) * qty * pointValue;\n}\n\nconsole.log(tradePnl(5240.25, 5252.75, 2, 50));\nconsole.log(tradePnl(5240.25, 5231.00, 1, 50));' },
      { h: 'return ends the function immediately',
        body: '<p>Whatever follows <code>return</code> never runs. That makes <strong>guard clauses</strong> possible: handle the bad case first and leave, so the rest of the body deals only with valid input.</p>',
        code: 'function riskReward(risk, reward) {\n  if (risk <= 0) return 0;      // guard: bail out early\n  return reward / risk;\n}\n\nconsole.log(riskReward(8, 24));  // 3\nconsole.log(riskReward(0, 24));  // 0, not Infinity' },
      { h: 'Three ways to write one',
        body: '<p>Declarations are <em>hoisted</em> — usable before the line they appear on. Expressions and arrows are not. Arrows are the compact modern default for short helpers.</p>',
        code: '// declaration — hoisted\nfunction points(entry, exit) { return exit - entry; }\n\n// expression\nconst points2 = function (entry, exit) { return exit - entry; };\n\n// arrow, with an implicit return\nconst points3 = (entry, exit) => exit - entry;\n\nconsole.log(points(100, 110), points2(100, 110), points3(100, 110));' },
      { h: 'Default parameters and purity',
        body: '<p>A default fills in when an argument is missing. And a <strong>pure</strong> function — one that only reads its parameters and only returns a value — is the kind you can test, reuse and trust.</p>' +
              '<div class="note note-trade"><b>Why purity matters here</b>A pure <code>tradePnl</code> can be checked against a hand-worked example. A version that reaches out to a global position, mutates it, and logs to a file cannot be checked at all — and strategy code that cannot be checked is strategy code that loses money quietly.</div>',
        code: 'function pnl(entry, exit, qty = 1, pointValue = 50) {\n  return (exit - entry) * qty * pointValue;\n}\n\nconsole.log(pnl(5240, 5250));           // qty 1, ES multiplier\nconsole.log(pnl(5240, 5250, 3));        // 3 contracts\nconsole.log(pnl(18400, 18450, 1, 20));  // NQ' }
    ],
    parsons: {
      prompt: 'Write a function that returns the points gained on a long trade.',
      lines: [
        'function longPoints(entry, exit) {',
        '  return exit - entry;',
        '}',
        '',
        'console.log(longPoints(5240.25, 5252.75));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'pnl()', difficulty: 'Core',
        prompt: 'Write <code>pnl(entry, exit, qty, pointValue)</code> returning the dollar profit of a <strong>long</strong> trade.<br>' +
          '<code>qty</code> should default to <code>1</code> and <code>pointValue</code> to <code>50</code>.',
        starter: 'function pnl(entry, exit, qty, pointValue) {\n  // return the dollar P&L\n}\n',
        solution: 'function pnl(entry, exit, qty = 1, pointValue = 50) {\n  return (exit - entry) * qty * pointValue;\n}',
        hints: ['Defaults go in the parameter list: <code>qty = 1</code>.',
                'The body is a single <code>return</code> of <code>(exit - entry) * qty * pointValue</code>.'],
        tests: { fn: 'pnl', approx: 1e-9, cases: [
          { args: [5240.25, 5252.75, 2, 50], expect: 1250 },
          { args: [5240.25, 5231.00, 1, 50], expect: -462.5 },
          { args: [18400, 18450, 1, 20], expect: 1000 },
          { args: [5240, 5250], expect: 500, name: 'pnl(5240, 5250) uses the defaults qty=1, pointValue=50' }
        ] } },
      { id: 'e2', title: 'tradeResult()', difficulty: 'Core',
        prompt: 'Write <code>tradeResult(side, entry, exit)</code> returning the string <code>"WIN"</code>, <code>"LOSS"</code> or <code>"FLAT"</code>.<ul>' +
          '<li>A <code>"long"</code> wins when the exit is above the entry.</li>' +
          '<li>A <code>"short"</code> wins when the exit is below the entry.</li>' +
          '<li>Equal prices are <code>"FLAT"</code> for either side.</li></ul>',
        starter: 'function tradeResult(side, entry, exit) {\n  // return "WIN", "LOSS" or "FLAT"\n}\n',
        solution: 'function tradeResult(side, entry, exit) {\n  if (exit === entry) return "FLAT";\n  const up = exit > entry;\n  return (side === "long") === up ? "WIN" : "LOSS";\n}',
        hints: ['Handle the FLAT case first with a guard clause and return early.',
                'After that, a long wins when price rose and a short wins when it fell.'],
        tests: { fn: 'tradeResult', cases: [
          { args: ['long', 5240, 5250], expect: 'WIN' },
          { args: ['long', 5240, 5230], expect: 'LOSS' },
          { args: ['short', 5240, 5230], expect: 'WIN' },
          { args: ['short', 5240, 5250], expect: 'LOSS' },
          { args: ['long', 5240, 5240], expect: 'FLAT' },
          { args: ['short', 5240, 5240], expect: 'FLAT' }
        ] } },
      { id: 'e3', title: 'positionSize()', difficulty: 'Stretch',
        prompt: 'Write <code>positionSize(equity, riskPercent, stopPoints, pointValue)</code> returning how many whole contracts to trade.<br>' +
          'Risk in dollars is <code>equity × riskPercent / 100</code>. Dollar risk per contract is <code>stopPoints × pointValue</code>. ' +
          'Divide, round <strong>down</strong>, and never return less than 0.<br>' +
          'If <code>stopPoints</code> or <code>pointValue</code> is 0 or less, return <code>0</code> rather than dividing by zero.',
        starter: 'function positionSize(equity, riskPercent, stopPoints, pointValue) {\n  // return a whole number of contracts\n}\n',
        solution: 'function positionSize(equity, riskPercent, stopPoints, pointValue) {\n  if (stopPoints <= 0 || pointValue <= 0) return 0;\n  const riskDollars = equity * riskPercent / 100;\n  const perContract = stopPoints * pointValue;\n  return Math.max(0, Math.floor(riskDollars / perContract));\n}',
        hints: ['Guard the invalid inputs first and <code>return 0</code>.',
                '<code>Math.floor</code> rounds down; <code>Math.max(0, n)</code> clamps negatives away.'],
        tests: { fn: 'positionSize', cases: [
          { args: [50000, 1, 8, 50], expect: 1, name: '$50k, 1% risk, 8-point stop on ES → 1 contract' },
          { args: [100000, 1, 8, 50], expect: 2 },
          { args: [100000, 2, 10, 50], expect: 4 },
          { args: [25000, 1, 8, 50], expect: 0, name: 'too small to risk even one contract → 0' },
          { args: [50000, 1, 0, 50], expect: 0, name: 'a zero stop returns 0 instead of Infinity' },
          { args: [-1000, 1, 8, 50], expect: 0, name: 'negative equity never returns a negative size' }
        ] } }
    ],
    quiz: [
      { q: 'What does a function return if it has no <code>return</code> statement?',
        options: ['<code>0</code>', '<code>null</code>', '<code>undefined</code>', 'The last expression'],
        answer: 2,
        explain: 'JavaScript returns <code>undefined</code> by default — a common cause of "why is my P&L NaN?".' },
      { q: 'What makes a function <em>pure</em>?',
        options: ['It is short', 'Same inputs always give the same output, with no side effects', 'It uses arrow syntax', 'It has no parameters'],
        answer: 1,
        explain: 'Purity is what makes a function testable: you can assert on it in isolation without setting up the rest of the world.' },
      { q: 'Why put <code>if (risk &lt;= 0) return 0;</code> at the top of a function?',
        options: ['Style preference', 'A guard clause handles the bad case early so the rest assumes valid input', 'It is faster', 'To avoid using else'],
        answer: 1,
        explain: 'Guard clauses flatten the function: after them, the remaining body only deals with the normal case.' }
    ],
    recap: [
      'Functions turn a one-off calculation into a reusable rule.',
      '<code>return</code> exits immediately — use guard clauses for bad input.',
      'Default parameters fill in missing arguments.',
      'Pure functions are the ones you can actually test.'
    ],
    vocab: [
      { term: 'Position sizing', def: 'Deciding how many contracts to trade so that a stop-out costs a fixed, survivable fraction of the account.' },
      { term: 'Risk per trade', def: 'The dollars lost if the stop is hit. Most systematic traders cap this at 0.5–2% of equity.' }
    ]
  });

  C.push({
    id: 'd013', day: 13, module: 1, minutes: 30,
    title: 'Arrays: A Series of Prices',
    subtitle: 'Indexing, length, adding, removing and slicing windows.',
    goal: '<b>Goal:</b> handle a price series — read any bar, take the last N, and add new prices as they arrive.',
    objectives: [
      'Read and write array elements by index',
      'Use <code>length</code>, <code>at</code>, <code>includes</code> and <code>indexOf</code>',
      'Add and remove with <code>push</code>, <code>pop</code>, <code>shift</code>, <code>unshift</code>',
      'Take a window with <code>slice</code> without destroying the original'
    ],
    sections: [
      { h: 'Indexes start at zero',
        body: '<p>An array is an ordered list. The first element is <code>[0]</code> and the last is <code>[length - 1]</code>. <code>at(-1)</code> is the modern shorthand for the last element.</p>',
        code: 'const closes = [5240.5, 5238.25, 5244.0, 5251.75];\n\nconsole.log(closes[0]);              // first\nconsole.log(closes[closes.length - 1]); // last, the long way\nconsole.log(closes.at(-1));          // last, the short way\nconsole.log(closes.at(-2));          // second from the end\nconsole.log(closes.length, "bars");' },
      { h: 'Adding and removing',
        body: '<p>These four <strong>mutate</strong> the array — they change it in place rather than returning a copy.</p>' +
              '<table><tr><th>Method</th><th>Does</th><th>Returns</th></tr>' +
              '<tr><td><code>push(x)</code></td><td>add to the end</td><td>new length</td></tr>' +
              '<tr><td><code>pop()</code></td><td>remove from the end</td><td>the removed item</td></tr>' +
              '<tr><td><code>unshift(x)</code></td><td>add to the front</td><td>new length</td></tr>' +
              '<tr><td><code>shift()</code></td><td>remove from the front</td><td>the removed item</td></tr></table>',
        code: 'const closes = [5240.5, 5238.25];\n\ncloses.push(5244.0);        // a new bar closed\nconsole.log(closes);\n\nconst oldest = closes.shift(); // drop the oldest to keep a fixed window\nconsole.log("dropped", oldest, "->", closes);' },
      { h: 'slice takes a window and leaves the original alone',
        body: '<p><code>slice(start, end)</code> copies from <code>start</code> up to <em>but not including</em> <code>end</code>. Negative numbers count from the end — <code>slice(-20)</code> is "the last 20", which is exactly what every moving average needs.</p>' +
              '<div class="note note-warn"><b>slice vs splice</b><code>slice</code> copies and leaves the original intact. <code>splice</code> cuts the original apart. One letter, completely different consequences.</div>',
        code: 'const closes = [10, 11, 12, 13, 14, 15];\n\nconsole.log(closes.slice(0, 3));  // [10, 11, 12]\nconsole.log(closes.slice(-2));    // [14, 15]  last two\nconsole.log(closes);              // unchanged\n\n// The rolling window every indicator uses:\nconst n = 3;\nconsole.log("last 3:", closes.slice(-n));' },
      { h: 'Searching',
        body: '<p><code>includes</code> answers yes/no; <code>indexOf</code> gives the position, or <code>-1</code> when absent.</p>',
        code: 'const watchlist = ["ES", "NQ", "CL", "GC"];\n\nconsole.log(watchlist.includes("NQ"));  // true\nconsole.log(watchlist.indexOf("CL"));   // 2\nconsole.log(watchlist.indexOf("ZB"));   // -1 = not found' }
    ],
    parsons: {
      prompt: 'Keep a rolling window of the last three closes.',
      lines: [
        'const closes = [10, 11, 12, 13, 14];',
        'const window = closes.slice(-3);',
        'let sum = 0;',
        'for (const c of window) sum += c;',
        'console.log(sum / window.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'lastN()', difficulty: 'Core',
        prompt: 'Write <code>lastN(series, n)</code> returning the last <code>n</code> elements as a <strong>new</strong> array, leaving the input untouched.<br>' +
          'If <code>n</code> is bigger than the array, return a copy of the whole thing. If <code>n</code> is 0 or less, return an empty array.',
        starter: 'function lastN(series, n) {\n  // return the last n elements\n}\n',
        solution: 'function lastN(series, n) {\n  if (n <= 0) return [];\n  return series.slice(-n);\n}',
        hints: ['<code>slice(-n)</code> takes the last n elements — and copes with n larger than the array by itself.',
                'Guard <code>n &lt;= 0</code> first: <code>slice(-0)</code> is <code>slice(0)</code>, which returns everything.'],
        tests: { fn: 'lastN', cases: [
          { args: [[1, 2, 3, 4, 5], 2], expect: [4, 5] },
          { args: [[1, 2, 3], 10], expect: [1, 2, 3], name: 'n larger than the array returns everything' },
          { args: [[1, 2, 3], 0], expect: [], name: 'n = 0 returns an empty array' },
          { args: [[1, 2, 3], -1], expect: [], name: 'a negative n returns an empty array' }
        ], checks: [{
          name: 'does not modify the array it was given',
          expose: ['lastN'],
          run: function (scope) {
            var src = [1, 2, 3, 4];
            scope.lastN(src, 2);
            return (src.length === 4 && src[0] === 1) ? true : 'the input array was mutated — use slice, not splice';
          }
        }] } },
      { id: 'e2', title: 'range()', difficulty: 'Core',
        prompt: 'Write <code>range(series)</code> returning the highest value minus the lowest.<br>' +
          'Return <code>0</code> for an empty array.',
        starter: 'function range(series) {\n  // highest - lowest\n}\n',
        solution: 'function range(series) {\n  if (!series.length) return 0;\n  return Math.max(...series) - Math.min(...series);\n}',
        hints: ['<code>Math.max(...series)</code> spreads the array into separate arguments.',
                'Guard the empty case — <code>Math.max()</code> with no arguments returns <code>-Infinity</code>.'],
        tests: { fn: 'range', approx: 1e-9, cases: [
          { args: [[10, 14, 11, 9]], expect: 5 },
          { args: [[5240.5, 5238.25, 5244]], expect: 5.75 },
          { args: [[7]], expect: 0 },
          { args: [[]], expect: 0, name: 'an empty series has a range of 0, not -Infinity' }
        ] } },
      { id: 'e3', title: 'addBar()', difficulty: 'Stretch',
        prompt: 'A live chart keeps only the most recent <code>maxLength</code> prices.<br>' +
          'Write <code>addBar(series, price, maxLength)</code> that appends <code>price</code> and, if the array is now longer than <code>maxLength</code>, drops elements from the <em>front</em> until it fits. Return the array.<br>' +
          'Modify and return the same array — this one is deliberately mutating, the way a live buffer works.',
        starter: 'function addBar(series, price, maxLength) {\n  // append, trim from the front, return series\n}\n',
        solution: 'function addBar(series, price, maxLength) {\n  series.push(price);\n  while (series.length > maxLength) series.shift();\n  return series;\n}',
        hints: ['<code>push</code> to add at the end, <code>shift</code> to remove from the front.',
                'A <code>while</code> handles the case where the array started over-length.'],
        tests: { fn: 'addBar', cases: [
          { args: [[1, 2, 3], 4, 5], expect: [1, 2, 3, 4], name: 'under the cap, nothing is dropped' },
          { args: [[1, 2, 3, 4, 5], 6, 5], expect: [2, 3, 4, 5, 6], name: 'at the cap, the oldest is dropped' },
          { args: [[1, 2, 3, 4, 5, 6, 7], 8, 3], expect: [6, 7, 8], name: 'over the cap, trims down to size' }
        ], checks: [{
          name: 'mutates and returns the same array',
          expose: ['addBar'],
          run: function (scope) {
            var a = [1, 2, 3];
            var r = scope.addBar(a, 4, 5);
            return r === a ? true : 'return the array you were given, not a copy';
          }
        }] } }
    ],
    quiz: [
      { q: 'For an array of length 78, what is the index of the last element?',
        options: ['78', '77', '-1', 'length'],
        answer: 1,
        explain: 'Indexes run 0 to length−1. <code>arr.at(-1)</code> avoids the arithmetic entirely.' },
      { q: 'What does <code>closes.slice(-20)</code> return?',
        options: ['The first 20 elements', 'The last 20 elements', 'An error', 'Everything except the last 20'],
        answer: 1,
        explain: 'A negative start counts back from the end. This is the standard way to take a rolling indicator window.' },
      { q: 'Which of these changes the original array?',
        options: ['<code>slice</code>', '<code>splice</code>', '<code>includes</code>', '<code>indexOf</code>'],
        answer: 1,
        explain: '<code>splice</code> mutates in place; <code>slice</code> returns a copy. Mixing them up silently corrupts your price series.' }
    ],
    recap: [
      'Indexes are zero-based; <code>at(-1)</code> is the last element.',
      '<code>push</code>/<code>pop</code>/<code>shift</code>/<code>unshift</code> mutate the array.',
      '<code>slice</code> copies a window; <code>splice</code> cuts the original.',
      '<code>slice(-n)</code> is the rolling window every indicator needs.'
    ],
    vocab: [
      { term: 'Price series', def: 'An ordered array of prices, oldest first. Nearly every indicator is a function from a series to another series.' },
      { term: 'Lookback', def: 'How many bars an indicator considers. A 20-period SMA has a lookback of 20.' }
    ]
  });

  C.push({
    id: 'd014', day: 14, module: 1, minutes: 30,
    title: 'Objects: Describing a Bar',
    subtitle: 'Keys, values, nesting and the shape of market data.',
    goal: '<b>Goal:</b> model a candle and a position as objects, and read fields out of them safely.',
    objectives: [
      'Create object literals and read fields with dot and bracket notation',
      'Add, update and delete keys',
      'Nest objects and reach into them',
      'List keys and values with <code>Object.keys</code> / <code>values</code> / <code>entries</code>'
    ],
    sections: [
      { h: 'An object groups named fields',
        body: '<p>An array is "several of the same thing in order". An object is "one thing with named parts". A candle is the perfect example — five different numbers that belong together.</p>',
        code: 'const bar = {\n  time: "09:30",\n  open: 5240.00,\n  high: 5243.16,\n  low: 5238.54,\n  close: 5240.83,\n  volume: 1716\n};\n\nconsole.log(bar.close);\nconsole.log(bar["close"]);          // same thing\nconsole.log(bar.high - bar.low, "point range");' },
      { h: 'Dot vs bracket',
        body: '<p>Use dot notation when you know the key as you type. Use brackets when the key is in a variable, or is not a valid identifier.</p>',
        code: 'const specs = {\n  ES: { pointValue: 50, tick: 0.25 },\n  NQ: { pointValue: 20, tick: 0.25 }\n};\n\nconst symbol = "NQ";\nconsole.log(specs.NQ.pointValue);      // known at typing time\nconsole.log(specs[symbol].pointValue); // key from a variable' },
      { h: 'Adding, changing, deleting',
        body: '<p>Objects declared with <code>const</code> can still have their contents changed — <code>const</code> freezes the <em>binding</em>, not the object.</p>',
        code: 'const position = { symbol: "ES", qty: 2, entry: 5240.25 };\n\nposition.stop = 5232.00;      // add\nposition.qty = 3;             // update\ndelete position.entry;        // remove\n\nconsole.log(position);\nconsole.log("has stop?", "stop" in position);' },
      { h: 'Walking an object',
        body: '<p><code>Object.keys</code>, <code>Object.values</code> and <code>Object.entries</code> turn an object into arrays you can loop over.</p>',
        code: 'const pnlBySymbol = { ES: 1250, NQ: -430, CL: 620 };\n\nconsole.log(Object.keys(pnlBySymbol));    // ["ES","NQ","CL"]\nconsole.log(Object.values(pnlBySymbol));  // [1250,-430,620]\n\nlet total = 0;\nfor (const [sym, pnl] of Object.entries(pnlBySymbol)) {\n  console.log(sym.padEnd(4), pnl);\n  total += pnl;\n}\nconsole.log("Total:", total);' }
    ],
    parsons: {
      prompt: 'Build a bar object and report its range.',
      lines: [
        'const bar = {',
        '  open: 5240.00,',
        '  high: 5243.16,',
        '  low: 5238.54,',
        '  close: 5240.83',
        '};',
        'const range = bar.high - bar.low;',
        'console.log(range.toFixed(2));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeTrade()', difficulty: 'Core',
        prompt: 'Write <code>makeTrade(symbol, side, entry, qty)</code> returning an object with exactly those four keys, plus <code>open: true</code>.<br>' +
          'Example: <code>makeTrade("ES", "long", 5240.25, 2)</code> → <code>{symbol:"ES", side:"long", entry:5240.25, qty:2, open:true}</code>',
        starter: 'function makeTrade(symbol, side, entry, qty) {\n  // return the trade object\n}\n',
        solution: 'function makeTrade(symbol, side, entry, qty) {\n  return { symbol, side, entry, qty, open: true };\n}',
        hints: ['Return an object literal: <code>{ symbol: symbol, side: side, ... }</code>.',
                'When the key and the variable share a name you can write just <code>{ symbol, side }</code> — shorthand properties.'],
        tests: { fn: 'makeTrade', cases: [
          { args: ['ES', 'long', 5240.25, 2], expect: { symbol: 'ES', side: 'long', entry: 5240.25, qty: 2, open: true } },
          { args: ['NQ', 'short', 18470, 1], expect: { symbol: 'NQ', side: 'short', entry: 18470, qty: 1, open: true } }
        ] } },
      { id: 'e2', title: 'barRange()', difficulty: 'Core',
        prompt: 'Write <code>barRange(bar)</code> returning the bar\'s high minus its low.<br>' +
          'If the argument is missing, or has no <code>high</code>/<code>low</code>, return <code>0</code> rather than <code>NaN</code>.',
        starter: 'function barRange(bar) {\n  // high - low, or 0 if the bar is unusable\n}\n',
        solution: 'function barRange(bar) {\n  if (!bar || typeof bar.high !== "number" || typeof bar.low !== "number") return 0;\n  return bar.high - bar.low;\n}',
        hints: ['Guard first: <code>if (!bar) return 0;</code>',
                'Check the fields are actually numbers with <code>typeof bar.high !== "number"</code>.'],
        tests: { fn: 'barRange', approx: 1e-9, cases: [
          { args: [{ high: 5243.16, low: 5238.54 }], expect: 4.62 },
          { args: [{ open: 1, close: 2 }], expect: 0, name: 'a bar with no high/low returns 0' },
          { args: [undefined], expect: 0, name: 'a missing bar returns 0' },
          { args: [{ high: 10, low: 10 }], expect: 0 }
        ] } },
      { id: 'e3', title: 'notional()', difficulty: 'Stretch',
        prompt: 'Write <code>notional(position, specs)</code> returning the dollar value the position controls: <code>entry × qty × pointValue</code>, where the point value is looked up in <code>specs</code> by the position\'s symbol.<br>' +
          'If the symbol is not in <code>specs</code>, return <code>0</code>.<br>' +
          '<span class="muted">Called as <code>notional({symbol:"ES", qty:2, entry:5240}, {ES:{pointValue:50}})</code> → <code>524000</code>.</span>',
        starter: 'function notional(position, specs) {\n  // entry * qty * pointValue, looked up by symbol\n}\n',
        solution: 'function notional(position, specs) {\n  const spec = specs[position.symbol];\n  if (!spec) return 0;\n  return position.entry * position.qty * spec.pointValue;\n}',
        hints: ['Look the spec up with bracket notation: <code>specs[position.symbol]</code>.',
                'A missing key gives <code>undefined</code> — guard it before reading <code>.pointValue</code>.'],
        tests: { fn: 'notional', approx: 1e-6, cases: [
          { args: [{ symbol: 'ES', qty: 2, entry: 5240 }, { ES: { pointValue: 50 } }], expect: 524000 },
          { args: [{ symbol: 'NQ', qty: 1, entry: 18400 }, { ES: { pointValue: 50 }, NQ: { pointValue: 20 } }], expect: 368000 },
          { args: [{ symbol: 'ZB', qty: 1, entry: 100 }, { ES: { pointValue: 50 } }], expect: 0, name: 'an unknown symbol returns 0, not a crash' }
        ] } }
    ],
    quiz: [
      { q: 'When must you use bracket notation instead of a dot?',
        options: ['Never — they are identical', 'When the key is held in a variable', 'When the value is a number', 'When the object is const'],
        answer: 1,
        explain: '<code>obj.symbol</code> looks for a key literally called "symbol"; <code>obj[symbol]</code> uses whatever the variable holds.' },
      { q: 'What does <code>position.stop = 5232</code> do when <code>position</code> was declared with <code>const</code>?',
        options: ['Throws a TypeError', 'Adds the key — const freezes the binding, not the contents', 'Silently does nothing', 'Creates a copy'],
        answer: 1,
        explain: '<code>const</code> prevents pointing the name at a <em>different</em> object. The object itself stays mutable.' },
      { q: 'What does reading a key that does not exist give you?',
        options: ['<code>null</code>', '<code>undefined</code>', '<code>0</code>', 'A ReferenceError'],
        answer: 1,
        explain: 'You get <code>undefined</code>, and reading a field <em>of</em> that undefined throws — which is why lookups need a guard.' }
    ],
    recap: [
      'Objects group named fields; arrays hold ordered items.',
      'Dot for known keys, brackets for keys in variables.',
      '<code>const</code> objects can still be modified inside.',
      '<code>Object.entries</code> turns an object into loopable pairs.'
    ],
    vocab: [
      { term: 'OHLCV', def: 'Open, High, Low, Close, Volume — the five fields that summarise a bar, and the universal shape of market data.' },
      { term: 'Contract spec', def: 'The exchange-defined rules for an instrument: tick size, point value, trading hours, margin.' }
    ]
  });

})();
