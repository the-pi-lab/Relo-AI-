import type { SpintaxNode } from "../types/automations";

/**
 * High-performance recursive Spintax parser and evaluation engine.
 * Supports arbitrary nested brackets: "{Hey|Hello {there|friend}|Hi}"
 */

/**
 * Parses raw spintax string into a structured AST of SpintaxNodes.
 */
export function parseSpintax(input: string): SpintaxNode[] {
  if (!input) return [];

  interface Frame {
    parentOptions: SpintaxNode[][];
    currentOption: SpintaxNode[];
  }

  const rootNodes: SpintaxNode[] = [];
  const stack: Frame[] = [];

  let currentOption: SpintaxNode[] = rootNodes;
  let literalBuffer = "";

  const flushLiteral = () => {
    if (literalBuffer.length > 0) {
      currentOption.push({ type: "literal", value: literalBuffer });
      literalBuffer = "";
    }
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === "{") {
      flushLiteral();
      const newOption: SpintaxNode[] = [];
      stack.push({
        parentOptions: [newOption],
        currentOption: newOption,
      });
      currentOption = newOption;
    } else if (char === "|") {
      flushLiteral();
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        const nextOption: SpintaxNode[] = [];
        top.parentOptions.push(nextOption);
        top.currentOption = nextOption;
        currentOption = nextOption;
      } else {
        // Stray pipe outside brackets treated as literal
        literalBuffer += char;
      }
    } else if (char === "}") {
      flushLiteral();
      if (stack.length > 0) {
        const finishedFrame = stack.pop()!;
        const choiceNode: SpintaxNode = {
          type: "choice",
          options: finishedFrame.parentOptions,
        };

        // Determine destination for this completed choice node
        if (stack.length > 0) {
          currentOption = stack[stack.length - 1].currentOption;
        } else {
          currentOption = rootNodes;
        }
        currentOption.push(choiceNode);
      } else {
        // Stray closing bracket treated as literal
        literalBuffer += char;
      }
    } else {
      literalBuffer += char;
    }
  }

  flushLiteral();

  // If unclosed brackets remained on the stack, collapse them back into root
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    for (const opt of unclosed.parentOptions) {
      rootNodes.push(...opt);
    }
  }

  return rootNodes;
}

/**
 * Evaluates an AST of SpintaxNodes into a single spun string.
 * @param nodes AST nodes
 * @param rng Optional RNG function returning 0 <= n < 1 (default: Math.random)
 */
export function spinAST(
  nodes: SpintaxNode[],
  rng: () => number = Math.random
): string {
  let output = "";

  for (const node of nodes) {
    if (node.type === "literal") {
      output += node.value;
    } else if (node.type === "choice") {
      if (node.options.length === 0) continue;
      const index = Math.floor(rng() * node.options.length);
      const selectedOption = node.options[index] || [];
      output += spinAST(selectedOption, rng);
    }
  }

  return output;
}

/**
 * One-shot helper to spin a raw spintax string directly.
 */
export function spin(text: string, rng: () => number = Math.random): string {
  if (!text.includes("{") || !text.includes("}")) {
    return text;
  }
  const ast = parseSpintax(text);
  return spinAST(ast, rng);
}

/**
 * Calculates the total combinatorial variations possible for an AST.
 * Used to enforce Instagram anti-spam safety heuristics (e.g. min 3 variations).
 */
export function calculateVariations(nodes: SpintaxNode[]): number {
  if (nodes.length === 0) return 1;

  let totalVariations = 1;

  for (const node of nodes) {
    if (node.type === "literal") {
      // Literals contribute a factor of 1
      continue;
    } else if (node.type === "choice") {
      // Sum of variations across all choice options
      let choiceSum = 0;
      for (const option of node.options) {
        choiceSum += calculateVariations(option);
      }
      totalVariations *= Math.max(1, choiceSum);
    }
  }

  return totalVariations;
}

/**
 * Validates a list of reply variations to ensure compliance with
 * Instagram safety guidelines (minimum 3 variations total).
 */
export function validateReplyVariations(
  replies: string[],
  minVariations = 3,
  maxVariations = 8
): {
  isValid: boolean;
  totalVariations: number;
  error?: string;
} {
  if (!Array.isArray(replies) || replies.length === 0) {
    return {
      isValid: false,
      totalVariations: 0,
      error: `At least ${minVariations} reply variations are required to prevent spam flags.`,
    };
  }

  if (replies.length > maxVariations) {
    return {
      isValid: false,
      totalVariations: replies.length,
      error: `Maximum allowed reply templates is ${maxVariations}.`,
    };
  }

  let total = 0;
  for (const reply of replies) {
    const trimmed = reply.trim();
    if (!trimmed) continue;
    const ast = parseSpintax(trimmed);
    total += calculateVariations(ast);
  }

  if (total < minVariations) {
    return {
      isValid: false,
      totalVariations: total,
      error: `Configured replies only provide ${total} unique variations. Minimum required is ${minVariations}.`,
    };
  }

  return {
    isValid: true,
    totalVariations: total,
  };
}

/**
 * Selects a reply variation and spins it with randomized variables.
 */
export function pickCommentReply(
  replies: string[],
  rng: () => number = Math.random
): string {
  if (!replies || replies.length === 0) return "";
  const index = Math.floor(rng() * replies.length);
  const selectedTemplate = replies[index] || "";
  return spin(selectedTemplate, rng);
}
