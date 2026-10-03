import type { EventConfig, Slot, Round1Question, Round2Problem, Round3Problem, Round4Problem, Round4Config, Participant } from '../types.ts';

export const initialSlots: Slot[] = [
  {
    slotId: "SLOT-01",
    slotName: "SLOT 01 - ALPHA SECTOR (TEST)",
    date: "2026-10-05",
    startTime: "09:00",
    endTime: "09:45",
    maxParticipants: 30,
    status: "scheduled",
    isActiveOverride: true,
    registeredCount: 1,
    computedStatus: "active",
    startISO: "2026-10-05T03:30:00.000Z",
    endISO: "2026-10-05T04:15:00.000Z",
    evaluation: {
      isBefore: false,
      isActive: true,
      isAfter: false,
      statusText: "MISSION ACTIVE",
      formattedMessage: "MISSION ACTIVE (COMMAND OVERRIDE)",
      startTimeIST: "09:00 IST",
      endTimeIST: "09:45 IST",
      dateIST: "2026-10-05"
    }
  },
  {
    slotId: "SLOT-02",
    slotName: "SLOT 02 - BRAVO SECTOR",
    date: "2026-10-05",
    startTime: "10:00",
    endTime: "10:45",
    maxParticipants: 30,
    status: "scheduled",
    registeredCount: 0,
    computedStatus: "upcoming",
    startISO: "2026-10-05T04:30:00.000Z",
    endISO: "2026-10-05T05:15:00.000Z",
    evaluation: {
      isBefore: true,
      isActive: false,
      isAfter: false,
      statusText: "YOUR MISSION STARTS AT [TIME]",
      formattedMessage: "YOUR MISSION STARTS AT 10:00 IST (05 Oct 2026)",
      startTimeIST: "10:00 IST",
      endTimeIST: "10:45 IST",
      dateIST: "2026-10-05"
    }
  },
  {
    slotId: "SLOT-03",
    slotName: "SLOT 03 - CHARLIE SECTOR",
    date: "2026-10-05",
    startTime: "11:00",
    endTime: "11:45",
    maxParticipants: 30,
    status: "scheduled",
    registeredCount: 0,
    computedStatus: "upcoming",
    startISO: "2026-10-05T05:30:00.000Z",
    endISO: "2026-10-05T06:15:00.000Z",
    evaluation: {
      isBefore: true,
      isActive: false,
      isAfter: false,
      statusText: "YOUR MISSION STARTS AT [TIME]",
      formattedMessage: "YOUR MISSION STARTS AT 11:00 IST (05 Oct 2026)",
      startTimeIST: "11:00 IST",
      endTimeIST: "11:45 IST",
      dateIST: "2026-10-05"
    }
  },
  {
    slotId: "SLOT-04",
    slotName: "SLOT 04 - DELTA SECTOR",
    date: "2026-10-05",
    startTime: "12:00",
    endTime: "12:45",
    maxParticipants: 30,
    status: "scheduled",
    registeredCount: 0,
    computedStatus: "upcoming",
    startISO: "2026-10-05T06:30:00.000Z",
    endISO: "2026-10-05T07:15:00.000Z",
    evaluation: {
      isBefore: true,
      isActive: false,
      isAfter: false,
      statusText: "YOUR MISSION STARTS AT [TIME]",
      formattedMessage: "YOUR MISSION STARTS AT 12:00 IST (05 Oct 2026)",
      startTimeIST: "12:00 IST",
      endTimeIST: "12:45 IST",
      dateIST: "2026-10-05"
    }
  }
];

export const initialEventConfig: EventConfig = {
  eventName: "CODE FORCE AWAKEN",
  collegeEvent: "AIKYA",
  round1MinScore: 12,
  round2MinPercent: 40,
  round3MinPercent: 40,
  round2TimerMinutes: 20,
  round3TimerMinutes: 20,
  maxIntegrityViolations: 3,
  leaderboardPublished: false,
  testMode: false
};

export const round1Questions: Round1Question[] = [
  {
    questionId: "q1",
    roundId: "round1",
    challengeType: "OUTPUT_PREDICTION",
    difficulty: "Easy",
    order: 1,
    points: 2,
    questionText: "Analyze the Python snippet and predict the console output accurately.",
    code: "x = 5\ny = 3\nprint(x + y * 2)",
    options: [
      { label: "A", text: "16" },
      { label: "B", text: "11" },
      { label: "C", text: "13" },
      { label: "D", text: "10" }
    ],
    correctAnswer: "B"
  },
  {
    questionId: "q2",
    roundId: "round1",
    challengeType: "OUTPUT_PREDICTION",
    difficulty: "Medium",
    order: 2,
    points: 3,
    questionText: "Determine the terminal value printed by the following conditional block.",
    code: "x = 10\n\nif x % 2 == 0:\n    x = x // 2\nelse:\n    x = x * 2\n\nprint(x + 3)",
    options: [
      { label: "A", text: "8" },
      { label: "B", text: "13" },
      { label: "C", text: "23" },
      { label: "D", text: "5" }
    ],
    correctAnswer: "A"
  },
  {
    questionId: "q3",
    roundId: "round1",
    challengeType: "OUTPUT_PREDICTION",
    difficulty: "Hard",
    order: 3,
    points: 5,
    questionText: "Evaluate the accumulator loop through the coordinate array and predict the final output.",
    code: "a = [2, 4, 6, 8]\nresult = 0\n\nfor i in range(len(a)):\n    if a[i] % 4 == 0:\n        result += a[i]\n    else:\n        result -= 1\n\nprint(result)",
    options: [
      { label: "A", text: "14" },
      { label: "B", text: "11" },
      { label: "C", text: "9" },
      { label: "D", text: "8" }
    ],
    correctAnswer: "A"
  },
  {
    questionId: "q4",
    roundId: "round1",
    challengeType: "CODE_RECONSTRUCTION",
    difficulty: "Easy",
    order: 4,
    points: 2,
    questionText: "Reconstruct the scrambled telemetry computation lines into their correct logical execution order.",
    scrambledLines: [
      { id: "line-A", label: "A", code: "print(square)" },
      { id: "line-B", label: "B", code: "square = n * n" },
      { id: "line-C", label: "C", code: "n = 5" }
    ],
    correctOrder: ["line-C", "line-B", "line-A"],
    expectedOutput: "25"
  },
  {
    questionId: "q5",
    roundId: "round1",
    challengeType: "CODE_RECONSTRUCTION",
    difficulty: "Medium",
    order: 5,
    points: 3,
    questionText: "Arrange the scrambled loop accumulation statements to compute the sum from 1 to 5.",
    scrambledLines: [
      { id: "line-A", label: "A", code: "print(total)" },
      { id: "line-B", label: "B", code: "total = 0" },
      { id: "line-C", label: "C", code: "for i in range(1, 6):" },
      { id: "line-D", label: "D", code: "    total += i" }
    ],
    correctOrder: ["line-B", "line-C", "line-D", "line-A"],
    expectedOutput: "15"
  },
  {
    questionId: "q6",
    roundId: "round1",
    challengeType: "CODE_RECONSTRUCTION",
    difficulty: "Hard",
    order: 6,
    points: 5,
    questionText: "Reorder the factorial calculation logic blocks into valid execution flow.",
    scrambledLines: [
      { id: "line-A", label: "A", code: "print(result)" },
      { id: "line-B", label: "B", code: "result = 1" },
      { id: "line-C", label: "C", code: "for i in range(1, 5):" },
      { id: "line-D", label: "D", code: "    result = result * i" }
    ],
    correctOrder: ["line-B", "line-C", "line-D", "line-A"],
    expectedOutput: "24"
  },
  {
    questionId: "q7",
    roundId: "round1",
    challengeType: "LOGIC_DECODER",
    difficulty: "Easy",
    order: 7,
    points: 2,
    questionText: "Decode the transformation function mapping input values to energy outputs and solve for target input 5.",
    examples: [
      { input: "2", output: "4" },
      { input: "3", output: "9" },
      { input: "4", output: "16" }
    ],
    targetInput: "5",
    options: [
      { label: "A", text: "20" },
      { label: "B", text: "25" },
      { label: "C", text: "15" },
      { label: "D", text: "10" }
    ],
    correctAnswer: "B",
    logicHint: "Function: f(n) = n * n (square of the number)"
  },
  {
    questionId: "q8",
    roundId: "round1",
    challengeType: "LOGIC_DECODER",
    difficulty: "Medium",
    order: 8,
    points: 3,
    questionText: "Identify the celestial encryption key logic and calculate the output for input 456.",
    examples: [
      { input: "123", output: "6" },
      { input: "234", output: "9" },
      { input: "345", output: "12" }
    ],
    targetInput: "456",
    options: [
      { label: "A", text: "14" },
      { label: "B", text: "15" },
      { label: "C", text: "16" },
      { label: "D", text: "18" }
    ],
    correctAnswer: "B",
    logicHint: "Function: sum of digits in the integer string"
  },
  {
    questionId: "q9",
    roundId: "round1",
    challengeType: "LOGIC_DECODER",
    difficulty: "Hard",
    order: 9,
    points: 5,
    questionText: "Decipher the warp manifold progression formula and compute the harmonic value for input 5.",
    examples: [
      { input: "2", output: "6" },
      { input: "3", output: "12" },
      { input: "4", output: "20" }
    ],
    targetInput: "5",
    options: [
      { label: "A", text: "20" },
      { label: "B", text: "30" },
      { label: "C", text: "25" },
      { label: "D", text: "35" }
    ],
    correctAnswer: "B",
    logicHint: "Function: f(n) = n * (n + 1)"
  }
];

export const round2Problems: Round2Problem[] = [
  {
    problemId: "r2-p1",
    title: "EVEN NUMBER CHECK",
    difficulty: "Easy",
    description: "Given an integer N, determine whether the number is even or odd.\n\nPrint:\n- \"EVEN\" if N is even\n- \"ODD\" if N is odd",
    inputFormat: "A single integer N.",
    outputFormat: "Print EVEN or ODD.",
    sampleInput: "4",
    sampleOutput: "EVEN",
    points: 10,
    timeLimitMinutes: 20,
    starterCode: {
      python: "import sys\n\ndef check_even_odd(n):\n    # Write your logic here\n    if n % 2 == 0:\n        return \"EVEN\"\n    else:\n        return \"ODD\"\n\nline = sys.stdin.read().strip()\nif line:\n    print(check_even_odd(int(line)))",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const n = parseInt(input, 10);\n    console.log(n % 2 === 0 ? \"EVEN\" : \"ODD\");\n}"
    },
    visibleTestCases: [
      { id: "r2-p1-tc1", input: "2", expectedOutput: "EVEN" },
      { id: "r2-p1-tc2", input: "7", expectedOutput: "ODD" },
      { id: "r2-p1-tc3", input: "10", expectedOutput: "EVEN" },
      { id: "r2-p1-tc4", input: "15", expectedOutput: "ODD" },
      { id: "r2-p1-tc5", input: "0", expectedOutput: "EVEN" },
      { id: "r2-p1-tc6", input: "24", expectedOutput: "EVEN" },
      { id: "r2-p1-tc7", input: "31", expectedOutput: "ODD" },
      { id: "r2-p1-tc8", input: "100", expectedOutput: "EVEN" },
      { id: "r2-p1-tc9", input: "99", expectedOutput: "ODD" },
      { id: "r2-p1-tc10", input: "-8", expectedOutput: "EVEN" }
    ],
    hiddenTestCases: []
  },
  {
    problemId: "r2-p2",
    title: "SECOND LARGEST NUMBER",
    difficulty: "Medium",
    description: "Given N integers, find the second largest DISTINCT number.\n\nInput Format:\nFirst line contains N.\nSecond line contains N integers.\n\nOutput Format:\nPrint the second largest distinct integer. If fewer than 2 distinct integers exist, print -1.",
    inputFormat: "First line contains N.\nSecond line contains N integers.",
    outputFormat: "Print the second largest distinct integer.",
    sampleInput: "5\n1 2 3 4 5",
    sampleOutput: "4",
    points: 10,
    timeLimitMinutes: 20,
    starterCode: {
      python: "import sys\n\ndef second_largest(arr):\n    # Write your logic here\n    distinct = sorted(list(set(arr)))\n    if len(distinct) < 2:\n        return -1\n    return distinct[-2]\n\nlines = sys.stdin.read().strip().splitlines()\nif len(lines) >= 2:\n    n = int(lines[0].strip())\n    arr = [int(x) for x in lines[1].strip().split()]\n    print(second_largest(arr))",
      javascript: "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\nif (lines.length >= 2) {\n    const arr = lines[1].trim().split(/\\s+/).map(Number);\n    const distinct = Array.from(new Set(arr)).sort((a,b) => a - b);\n    console.log(distinct.length < 2 ? -1 : distinct[distinct.length - 2]);\n}"
    },
    visibleTestCases: [
      { id: "r2-p2-tc1", input: "5\n1 2 3 4 5", expectedOutput: "4" },
      { id: "r2-p2-tc2", input: "4\n10 10 10 10", expectedOutput: "-1" },
      { id: "r2-p2-tc3", input: "6\n5 9 2 9 8 3", expectedOutput: "8" },
      { id: "r2-p2-tc4", input: "2\n100 200", expectedOutput: "100" },
      { id: "r2-p2-tc5", input: "5\n-1 -2 -3 -4 -5", expectedOutput: "-2" },
      { id: "r2-p2-tc6", input: "3\n7 7 3", expectedOutput: "3" },
      { id: "r2-p2-tc7", input: "4\n40 10 20 30", expectedOutput: "30" },
      { id: "r2-p2-tc8", input: "1\n50", expectedOutput: "-1" },
      { id: "r2-p2-tc9", input: "6\n15 22 8 37 37 19", expectedOutput: "22" },
      { id: "r2-p2-tc10", input: "5\n0 -1 -5 -2 -3", expectedOutput: "-1" }
    ],
    hiddenTestCases: []
  },
  {
    problemId: "r2-p3",
    title: "BUBBLE SORT",
    difficulty: "Medium",
    description: "Given N integers, sort the array in ascending order using the Bubble Sort algorithm.\n\nParticipants must implement Bubble Sort themselves.\n\nInput Format:\nFirst line contains N.\nSecond line contains N integers.\n\nOutput Format:\nPrint the sorted array elements separated by single spaces.",
    inputFormat: "First line contains N.\nSecond line contains N integers.",
    outputFormat: "Print the sorted array elements separated by space.",
    sampleInput: "5\n5 1 4 2 8",
    sampleOutput: "1 2 4 5 8",
    points: 10,
    timeLimitMinutes: 20,
    starterCode: {
      python: "import sys\n\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\nlines = sys.stdin.read().strip().splitlines()\nif len(lines) >= 2:\n    n = int(lines[0].strip())\n    arr = [int(x) for x in lines[1].strip().split()]\n    sorted_arr = bubble_sort(arr)\n    print(\" \".join(map(str, sorted_arr)))",
      javascript: "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\nif (lines.length >= 2) {\n    const arr = lines[1].trim().split(/\\s+/).map(Number);\n    const n = arr.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                let temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n    console.log(arr.join(' '));\n}"
    },
    visibleTestCases: [
      { id: "r2-p3-tc1", input: "5\n5 1 4 2 8", expectedOutput: "1 2 4 5 8" },
      { id: "r2-p3-tc2", input: "4\n3 2 1 0", expectedOutput: "0 1 2 3" },
      { id: "r2-p3-tc3", input: "3\n1 2 3", expectedOutput: "1 2 3" },
      { id: "r2-p3-tc4", input: "1\n42", expectedOutput: "42" },
      { id: "r2-p3-tc5", input: "6\n9 3 7 1 2 8", expectedOutput: "1 2 3 7 8 9" },
      { id: "r2-p3-tc6", input: "5\n-5 -1 -3 0 2", expectedOutput: "-5 -3 -1 0 2" },
      { id: "r2-p3-tc7", input: "4\n10 5 10 5", expectedOutput: "5 5 10 10" },
      { id: "r2-p3-tc8", input: "7\n64 34 25 12 22 11 90", expectedOutput: "11 12 22 25 34 64 90" },
      { id: "r2-p3-tc9", input: "5\n100 20 80 40 60", expectedOutput: "20 40 60 80 100" },
      { id: "r2-p3-tc10", input: "4\n-10 -20 10 0", expectedOutput: "-20 -10 0 10" }
    ],
    hiddenTestCases: []
  }
];

export const round3Problems: Round3Problem[] = [
  {
    problemId: "r3-p1",
    title: "Two Sum",
    difficulty: "Medium",
    description: "Given an integer array and a target, return the indices of two different values whose sum equals the target. Return an empty list if no pair exists. Aim for O(N) time using a dictionary.\n\nInput is encoded as comma-separated integers, a semicolon, then the target.",
    missingLogicHint: "For each value, look up the complement already seen before storing the current value's index.",
    points: 15,
    timeLimitMinutes: 20,
    starterCode: {
      python: "def two_sum(nums, target):\n    seen = {}\n    for index, value in enumerate(nums):\n        complement = 0  # FIX ME: calculate the needed value\n        if complement in seen:\n            return [seen[complement], index]\n        seen[value] = 0  # FIX ME: store this value and index\n    return []\n\nimport sys\nraw = sys.stdin.read().strip()\nif raw:\n    parts = raw.split(';')\n    nums = [int(x.strip()) for x in parts[0].split(',') if x.strip()]\n    target = int(parts[1].strip())\n    print(two_sum(nums, target))",
      javascript: "function twoSum(nums, target) {\n    const seen = new Map();\n    for (let index = 0; index < nums.length; index++) {\n        const complement = target - nums[index];\n        if (seen.has(complement)) return [seen.get(complement), index];\n        seen.set(nums[index], index);\n    }\n    return [];\n}"
    },
    visibleTestCases: [
      { id: "tc-v1", input: "2, 7, 11, 15; 9", expectedOutput: "[0, 1]" },
      { id: "tc-v2", input: "3, 2, 4; 6", expectedOutput: "[1, 2]" }
    ],
    hiddenTestCases: [
      { id: "tc-h1", input: "3, 3; 6", expectedOutput: "[0, 1]" },
      { id: "tc-h2", input: "1, 2, 3; 7", expectedOutput: "[]" },
      { id: "tc-h3", input: "-1, -2, -3, -4; -6", expectedOutput: "[1, 3]" }
    ]
  },
  {
    problemId: "r3-p2",
    title: "First Non-Repeating Character",
    difficulty: "Easy",
    description: "Given a string, return the zero-based index of its first character that appears exactly once. Return -1 if every character repeats. Treat uppercase and lowercase letters as different characters.\n\nInput is a single line of text.",
    missingLogicHint: "Count each character first, then scan the string from left to right and return the first index with count 1.",
    points: 15,
    timeLimitMinutes: 20,
    starterCode: {
      python: "def first_unique_index(text):\n    counts = {}\n    for char in text:\n        counts[char] = 0  # FIX ME: increase this character's count\n    for index, char in enumerate(text):\n        if counts[char] == 1:\n            return index\n    return -1\n\ntext = input().rstrip('\\n')\nprint(first_unique_index(text))",
      javascript: "function firstUniqueIndex(text) {\n    const counts = new Map();\n    for (const char of text) counts.set(char, (counts.get(char) || 0) + 1);\n    for (let index = 0; index < text.length; index++) {\n        if (counts.get(text[index]) === 1) return index;\n    }\n    return -1;\n}"
    },
    visibleTestCases: [
      { id: "tc-v1", input: "swiss", expectedOutput: "1" },
      { id: "tc-v2", input: "aabb", expectedOutput: "-1" }
    ],
    hiddenTestCases: [
      { id: "tc-h1", input: "leetcode", expectedOutput: "0" },
      { id: "tc-h2", input: "loveleetcode", expectedOutput: "2" },
      { id: "tc-h3", input: "aabbcc", expectedOutput: "-1" }
    ]
  }
];

export const round4Problems: Round4Problem[] = [
  {
    problemId: "r4-p1",
    title: "Maximum Sum Window",
    difficulty: "Medium",
    description: "Given an integer array and a window size K, find the maximum sum among all consecutive windows of exactly K elements. Use a sliding-window update so the solution runs in O(N).\n\nSample Input:\n6 3\n2 1 5 1 3 2\n\nExpected Output:\n9",
    inputFormat: "First line contains N and K. Second line contains N integers.",
    outputFormat: "Print the maximum sum of any K consecutive elements.",
    sampleInput: "6 3\n2 1 5 1 3 2",
    sampleOutput: "9",
    targetOutputNumber: 9,
    points: 5,
    starterCode: {
      python: "n, k = map(int, input().split())\nnums = list(map(int, input().split()))[:n]\nwindow_sum = sum(nums[:k])\nbest = window_sum\nfor i in range(k, n):\n    # FIX ME: slide the window in O(1)\n    # FIX ME: update the best sum\nprint(best)"
    },
    visibleTestCases: [
      { id: "r4-p1-tc1", input: "6 3\n2 1 5 1 3 2", expectedOutput: "9" },
      { id: "r4-p1-tc2", input: "5 2\n1 4 2 10 2", expectedOutput: "12" },
      { id: "r4-p1-tc3", input: "5 3\n-1 -2 -3 -4 -5", expectedOutput: "-6" },
      { id: "r4-p1-tc4", input: "4 1\n7 -2 5 1", expectedOutput: "7" },
      { id: "r4-p1-tc5", input: "4 4\n1 2 3 4", expectedOutput: "10" }
    ],
    hiddenTestCases: []
  },
  {
    problemId: "r4-p2",
    title: "First Non-Repeating Character",
    difficulty: "Easy",
    description: "Given a lowercase string, find the zero-based index of the first character that occurs exactly once. Return -1 if every character repeats. Count characters first, then scan in original order.\n\nSample Input:\naabbcde\n\nExpected Output:\n4",
    inputFormat: "A single lowercase string.",
    outputFormat: "Print the zero-based index, or -1 if no unique character exists.",
    sampleInput: "aabbcde",
    sampleOutput: "4",
    targetOutputNumber: 4,
    points: 5,
    starterCode: {
      python: "text = input().strip()\ncounts = {}\nfor char in text:\n    # FIX ME: count this character\n    pass\nfor index, char in enumerate(text):\n    if counts[char] == 1:\n        print(index)\n        break\nelse:\n    print(-1)"
    },
    visibleTestCases: [
      { id: "r4-p2-tc1", input: "aabbcde", expectedOutput: "4" },
      { id: "r4-p2-tc2", input: "leetcode", expectedOutput: "0" },
      { id: "r4-p2-tc3", input: "aabb", expectedOutput: "-1" },
      { id: "r4-p2-tc4", input: "loveleetcode", expectedOutput: "2" },
      { id: "r4-p2-tc5", input: "z", expectedOutput: "0" }
    ],
    hiddenTestCases: []
  },
  {
    problemId: "r4-p3",
    title: "Range Sum Queries",
    difficulty: "Medium",
    description: "Given an integer array and one inclusive zero-based range [L, R], return the sum of the values in that range. Build prefix sums so each query is answered in O(1).\n\nSample Input:\n3\n7 11 22\n0 2\n\nExpected Output:\n40",
    inputFormat: "First line contains N. Second line contains N integers. Third line contains L and R.",
    outputFormat: "Print the inclusive range sum from index L through index R.",
    sampleInput: "3\n7 11 22\n0 2",
    sampleOutput: "40",
    targetOutputNumber: 40,
    points: 5,
    starterCode: {
      python: "n = int(input())\nnums = list(map(int, input().split()))[:n]\nprefix = [0] * (n + 1)\nfor i in range(1, n + 1):\n    # FIX ME: build the prefix sum\n    pass\nleft, right = map(int, input().split())\n# FIX ME: answer the inclusive range query\nprint(0)"
    },
    visibleTestCases: [
      { id: "r4-p3-tc1", input: "3\n7 11 22\n0 2", expectedOutput: "40" },
      { id: "r4-p3-tc2", input: "4\n5 1 2 9\n0 2", expectedOutput: "8" },
      { id: "r4-p3-tc3", input: "3\n-2 4 6\n0 1", expectedOutput: "2" },
      { id: "r4-p3-tc4", input: "1\n7\n0 0", expectedOutput: "7" },
      { id: "r4-p3-tc5", input: "5\n1 2 3 4 5\n2 4", expectedOutput: "12" }
    ],
    hiddenTestCases: []
  }
];

export const round4Config: Round4Config = {
  transformationRuleText: "FINAL CODE = (PROGRAM 1 OUTPUT × 10) + PROGRAM 2 OUTPUT + PROGRAM 3 OUTPUT",
  transformationRuleType: "linear_formula",
  expectedIntermediateCode: "9 | 4 | 40",
  expectedFinalKey: "134"
};

export const initialParticipants: Participant[] = [
  {
    participantId: "TEST-001",
    name: "Test Participant",
    rollNumber: "TEST-001",
    college: "Imperial Jedi Academy",
    branch: "Computer Science & Artificial Intelligence",
    year: "3rd Year",
    email: "test.cadet@aikya.edu",
    phone: "",
    slotId: "SLOT-01",
    registrationTime: "2026-10-01T08:00:00.000Z",
    currentRound: 1,
    status: "active",
    integrityViolations: 0,
    round1Status: "not_started",
    round1Score: 0,
    round1CorrectCount: 0,
    round1TimeSeconds: 0,
    round2Status: "not_started",
    round2Score: 0,
    round2SolvedCount: 0,
    round2TimeSeconds: 0,
    round3Status: "not_started",
    round3Score: 0,
    round3SolvedCount: 0,
    round3TimeSeconds: 0,
    round4Status: "not_started",
    round4Score: 0,
    round4TimeSeconds: 0,
    round4SolvedKey: "",
    totalScore: 0,
    totalTimeSeconds: 0
  }
];
