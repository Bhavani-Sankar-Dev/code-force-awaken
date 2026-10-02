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
    title: "Shield Resonance Frequency (Binary Search Debug)",
    difficulty: "Medium",
    description: "The vessel's deflector shield frequency calibration module has corrupted lines in its binary search subroutine. Currently, edge queries loop infinitely or return incorrect partition indexes.\n\nTask: Given a sorted array of distinct integers and a target frequency, return the index if the target is found. If not, return the index where it would be if it were inserted in order.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    missingLogicHint: "Fix boundary updates: mid + 1 and mid - 1. When target is not found, low pointer represents the exact insertion index.",
    points: 15,
    timeLimitMinutes: 20,
    starterCode: {
      python: "def search_insert_position(nums, target):\n    # BUGGY CODE TO FIX:\n    low = 0\n    high = len(nums) - 1\n    \n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            # FIX ME: Correct boundary shift\n            low = mid\n        else:\n            # FIX ME: Correct boundary shift\n            high = mid\n            \n    return low\n\nimport sys\nraw = sys.stdin.read().strip()\nif raw:\n    parts = raw.split(';')\n    nums = [int(x.strip()) for x in parts[0].split(',') if x.strip()]\n    target = int(parts[1].strip())\n    print(search_insert_position(nums, target))",
      javascript: "function searchInsertPosition(nums, target) {\n    let low = 0;\n    let high = nums.length - 1;\n    \n    while (low <= high) {\n        let mid = Math.floor((low + high) / 2);\n        if (nums[mid] === target) {\n            return mid;\n        } else if (nums[mid] < target) {\n            low = mid;\n        } else {\n            high = mid;\n        }\n    }\n    return low;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const parts = input.split(';');\n    const nums = parts[0].split(',').map(s => parseInt(s.trim(), 10));\n    const target = parseInt(parts[1].trim(), 10);\n    console.log(searchInsertPosition(nums, target));\n}"
    },
    visibleTestCases: [
      { id: "tc-v1", input: "1, 3, 5, 6; 5", expectedOutput: "2" },
      { id: "tc-v2", input: "1, 3, 5, 6; 2", expectedOutput: "1" }
    ],
    hiddenTestCases: [
      { id: "tc-h1", input: "1, 3, 5, 6; 7", expectedOutput: "4" },
      { id: "tc-h2", input: "1, 3, 5, 6; 0", expectedOutput: "0" },
      { id: "tc-h3", input: "1; 0", expectedOutput: "0" }
    ]
  },
  {
    problemId: "r3-p2",
    title: "Asteroid Field Maximum Energy Surge",
    difficulty: "Hard",
    description: "While steering through the Kyber asteroid belt, sensors record fluctuating energy differentials (positive and negative integers). The sub-routine must find the maximum sum of any non-empty contiguous subarray of energy nodes (Kadane's theorem).\n\nThe provided implementation fails on negative numbers and doesn't reset negative running sums correctly. Complete and fix the logic.",
    missingLogicHint: "When all numbers are negative, max sum must be the largest single negative element, not 0. Current sum should take max(num, current_sum + num).",
    points: 15,
    timeLimitMinutes: 20,
    starterCode: {
      python: "def max_energy_surge(nums):\n    if not nums:\n        return 0\n    # MISSING / BUGGY INITIALIZATION & LOOP\n    max_so_far = 0\n    current_max = 0\n    \n    for i in range(len(nums)):\n        # FIX ME: Complete missing logic for current_max\n        current_max = max(0, current_max + nums[i])\n        max_so_far = max(max_so_far, current_max)\n        \n    return max_so_far\n\nimport sys\nraw = sys.stdin.read().strip()\nif raw:\n    nums = [int(x.strip()) for x in raw.split(',') if x.strip()]\n    print(max_energy_surge(nums))",
      javascript: "function maxEnergySurge(nums) {\n    if (!nums || nums.length === 0) return 0;\n    let maxSoFar = 0;\n    let currentMax = 0;\n    \n    for (let i = 0; i < nums.length; i++) {\n        // FIX ME: Complete missing logic\n        currentMax = Math.max(0, currentMax + nums[i]);\n        maxSoFar = Math.max(maxSoFar, currentMax);\n    }\n    return maxSoFar;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const nums = input.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));\n    console.log(maxEnergySurge(nums));\n}"
    },
    visibleTestCases: [
      { id: "tc-v1", input: "-2, 1, -3, 4, -1, 2, 1, -5, 4", expectedOutput: "6" },
      { id: "tc-v2", input: "1", expectedOutput: "1" }
    ],
    hiddenTestCases: [
      { id: "tc-h1", input: "5, 4, -1, 7, 8", expectedOutput: "23" },
      { id: "tc-h2", input: "-5, -3, -8, -1", expectedOutput: "-1" },
      { id: "tc-h3", input: "-1, -2, -3", expectedOutput: "-1" }
    ]
  }
];

export const round4Problems: Round4Problem[] = [
  {
    problemId: "r4-p1",
    title: "COUNT POSITIVE NUMBERS",
    difficulty: "Easy",
    description: "Given N integers, count how many numbers are positive (strictly greater than zero).\n\nSample Input:\n5\n-2 4 7 -1 3\n\nExpected Output:\n3",
    inputFormat: "First line contains N.\nSecond line contains N integers separated by space.",
    outputFormat: "Print the count of positive numbers.",
    sampleInput: "5\n-2 4 7 -1 3",
    sampleOutput: "3",
    targetOutputNumber: 3,
    points: 5,
    starterCode: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n\n# Count positive numbers\ncount = sum(1 for x in arr if x > 0)\nprint(count)",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length > 1) {\n  const n = parseInt(input[0], 10);\n  const arr = input.slice(1, n + 1).map(Number);\n  const count = arr.filter(x => x > 0).length;\n  console.log(count);\n}",
      c: "#include <stdio.h>\n\nint main() {\n    int n, count = 0, val;\n    if (scanf(\"%d\", &n) == 1) {\n        for (int i = 0; i < n; i++) {\n            if (scanf(\"%d\", &val) == 1 && val > 0) count++;\n        }\n        printf(\"%d\\n\", count);\n    }\n    return 0;\n}",
      java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int count = 0;\n            for (int i = 0; i < n; i++) {\n                if (sc.nextInt() > 0) count++;\n            }\n            System.out.println(count);\n        }\n    }\n}"
    },
    visibleTestCases: [
      { id: "r4-p1-tc1", input: "5\n-2 4 7 -1 3", expectedOutput: "3" },
      { id: "r4-p1-tc2", input: "4\n1 2 -3 5", expectedOutput: "3" },
      { id: "r4-p1-tc3", input: "6\n-1 -2 -3 4 5 6", expectedOutput: "3" },
      { id: "r4-p1-tc4", input: "5\n-5 -4 -3 -2 -1", expectedOutput: "0" },
      { id: "r4-p1-tc5", input: "5\n10 20 30 40 50", expectedOutput: "5" }
    ],
    hiddenTestCases: []
  },
  {
    problemId: "r4-p2",
    title: "FIND FIRST CHARACTER",
    difficulty: "Easy",
    description: "Given a string and a character, find the first position/index of that character in the string.\n\nUse 1-based position.\n\nSample Input:\nPROGRAMMING\nG\n\nExpected Output:\n4",
    inputFormat: "First line contains a string.\nSecond line contains a character.",
    outputFormat: "Print the 1-based position of the first occurrence of the character.",
    sampleInput: "PROGRAMMING\nG",
    sampleOutput: "4",
    targetOutputNumber: 4,
    points: 5,
    starterCode: {
      python: "s = input().strip()\nch = input().strip()\n\n# 1-based index\nidx = s.find(ch)\nprint(idx + 1 if idx != -1 else -1)",
      javascript: "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\nif (lines.length >= 2) {\n  const s = lines[0].trim();\n  const ch = lines[1].trim();\n  const idx = s.indexOf(ch);\n  console.log(idx >= 0 ? idx + 1 : -1);\n}",
      c: "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[1000];\n    char ch[10];\n    if (scanf(\"%s\", s) == 1 && scanf(\"%s\", ch) == 1) {\n        char *pos = strchr(s, ch[0]);\n        if (pos) printf(\"%ld\\n\", pos - s + 1);\n        else printf(\"-1\\n\");\n    }\n    return 0;\n}",
      java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next().trim();\n            String ch = sc.hasNext() ? sc.next().trim() : \"\";\n            int idx = s.indexOf(ch);\n            System.out.println(idx >= 0 ? idx + 1 : -1);\n        }\n    }\n}"
    },
    visibleTestCases: [
      { id: "r4-p2-tc1", input: "PROGRAMMING\nG", expectedOutput: "4" },
      { id: "r4-p2-tc2", input: "FORCE\nF", expectedOutput: "1" },
      { id: "r4-p2-tc3", input: "GALAXY\nL", expectedOutput: "3" },
      { id: "r4-p2-tc4", input: "JEDI\nI", expectedOutput: "4" },
      { id: "r4-p2-tc5", input: "BANANA\nN", expectedOutput: "3" }
    ],
    hiddenTestCases: []
  },
  {
    problemId: "r4-p3",
    title: "SIMPLE INTEREST",
    difficulty: "Easy",
    description: "Calculate Simple Interest using the formula:\n\nSI = (P × R × T) / 100\n\nWhere P = Principal, R = Rate of Interest, T = Time in years.\n\nSample Input:\n1000 5 2\n\nExpected Output:\n100",
    inputFormat: "Three space-separated numbers: P R T.",
    outputFormat: "Print the Simple Interest as an integer or rounded number.",
    sampleInput: "1000 5 2",
    sampleOutput: "100",
    targetOutputNumber: 100,
    points: 5,
    starterCode: {
      python: "p, r, t = map(float, input().split())\n\n# Calculate Simple Interest\nsi = (p * r * t) / 100.0\nprint(int(round(si)))",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nif (input.length >= 3) {\n  const [p, r, t] = input;\n  const si = (p * r * t) / 100;\n  console.log(Math.round(si));\n}",
      c: "#include <stdio.h>\n#include <math.h>\n\nint main() {\n    double p, r, t;\n    if (scanf(\"%lf %lf %lf\", &p, &r, &t) == 3) {\n        double si = (p * r * t) / 100.0;\n        printf(\"%d\\n\", (int)round(si));\n    }\n    return 0;\n}",
      java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextDouble()) {\n            double p = sc.nextDouble();\n            double r = sc.nextDouble();\n            double t = sc.nextDouble();\n            System.out.println(Math.round((p * r * t) / 100.0));\n        }\n    }\n}"
    },
    visibleTestCases: [
      { id: "r4-p3-tc1", input: "1000 5 2", expectedOutput: "100" },
      { id: "r4-p3-tc2", input: "2000 10 2", expectedOutput: "400" },
      { id: "r4-p3-tc3", input: "5000 6 3", expectedOutput: "900" },
      { id: "r4-p3-tc4", input: "100 5 1", expectedOutput: "5" },
      { id: "r4-p3-tc5", input: "15000 8 5", expectedOutput: "6000" }
    ],
    hiddenTestCases: []
  }
];

export const round4Config: Round4Config = {
  transformationRuleText: "FINAL CODE = (PROGRAM 1 OUTPUT × 10) + PROGRAM 2 OUTPUT + PROGRAM 3 OUTPUT",
  transformationRuleType: "linear_formula",
  expectedIntermediateCode: "3 | 4 | 100",
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
