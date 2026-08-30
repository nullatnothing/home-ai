import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";

type MarkdownRenderOptions = {
  baseStyle?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
  italicStyle?: StyleProp<TextStyle>;
  codeStyle?: StyleProp<TextStyle>;
  listStyle?: StyleProp<TextStyle>;
  headingStyle?: StyleProp<TextStyle>;
};

const defaultOptions: Required<MarkdownRenderOptions> = {
  baseStyle: null,
  boldStyle: { fontWeight: "700" },
  italicStyle: { fontStyle: "italic" },
  codeStyle: {
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: "monospace",
  },
  listStyle: { marginTop: 2 },
  headingStyle: {
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
};

function renderInlineMarkdown(
  value: string,
  options: Required<MarkdownRenderOptions>,
): React.ReactNode[] {
  if (!value) return [];

  const pattern =
    /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|https?:\/\/[^\s]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    const token = match[0];

    if (start > lastIndex) {
      nodes.push(value.slice(lastIndex, start));
    }

    const cleaned = token
      .replace(/^(`|\*\*|__|\*|_)/, "")
      .replace(/(`|\*\*|__|\*|_)$/, "");

    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <Text key={`code-${start}`} style={options.codeStyle}>
          {cleaned}
        </Text>,
      );
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      nodes.push(
        <Text key={`bold-${start}`} style={options.boldStyle}>
          {renderInlineMarkdown(cleaned, options)}
        </Text>,
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      nodes.push(
        <Text key={`italic-${start}`} style={options.italicStyle}>
          {renderInlineMarkdown(cleaned, options)}
        </Text>,
      );
    } else if (/^https?:\/\//.test(token)) {
      nodes.push(
        <Text
          key={`link-${start}`}
          style={[options.baseStyle, { textDecorationLine: "underline" }]}
        >
          {token}
        </Text>,
      );
    } else {
      nodes.push(token);
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes;
}

function renderMarkdownBlock(
  block: string,
  options: Required<MarkdownRenderOptions>,
  index: number,
): React.ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("```")) {
    const lines = trimmed.split(/\n/);
    const opening = lines[0].trim();
    const codeLines = lines.slice(1);
    const closingIndex = codeLines.findIndex((line) => line.trim().startsWith("```"));
    const content =
      closingIndex >= 0
        ? codeLines.slice(0, closingIndex).join("\n")
        : codeLines.join("\n");

    return (
      <Text
        key={`code-block-${index}`}
        style={[
          options.codeStyle,
          {
            marginTop: 8,
            marginBottom: 8,
            padding: 8,
          },
        ]}
      >
        {content || opening}
      </Text>
    );
  }

  if (isHorizontalRule(trimmed)) {
    return (
      <Text
        key={`rule-${index}`}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "rgba(15, 23, 42, 0.2)",
          marginVertical: 10,
        }}
      >
        {" "}
      </Text>
    );
  }

  if (/^#{1,6}\s+/.test(trimmed)) {
    const level = trimmed.match(/^#+/)?.[0].length ?? 1;
    const title = trimmed.replace(/^#{1,6}\s+/, "");
    return (
      <Text
        key={`heading-${index}`}
        style={[
          options.headingStyle,
          { fontSize: 16 + (6 - level) * 1.5 },
        ]}
      >
        {renderInlineMarkdown(title, options)}
      </Text>
    );
  }

  const listLines = trimmed
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (
    listLines.length > 0 &&
    listLines.every(
      (line) => /^[-*+]\s+/.test(line) || /^\d+\.\s+/.test(line),
    )
  ) {
    return (
      <Text key={`list-${index}`} style={options.listStyle}>
        {listLines.map((line, lineIndex) => {
          const isOrdered = /^\d+\.\s+/.test(line);
          const marker = isOrdered ? `${line.match(/^\d+/)?.[0] ?? 1}. ` : "• ";
          const content = line.replace(/^(?:[-*+]\s+|\d+\.\s+)/, "");

          return (
            <Text key={`${index}-${lineIndex}`}>
              <Text>{marker}</Text>
              <Text>{renderInlineMarkdown(content, options)}</Text>
              {lineIndex < listLines.length - 1 ? "\n" : null}
            </Text>
          );
        })}
      </Text>
    );
  }

  return (
    <Text key={`paragraph-${index}`} style={options.baseStyle}>
      {trimmed.split(/\n/).map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          <Text>{renderInlineMarkdown(line, options)}</Text>
          {lineIndex < trimmed.split(/\n/).length - 1 ? "\n" : null}
        </React.Fragment>
      ))}
    </Text>
  );
}

function isHorizontalRule(value: string): boolean {
  return /^-{3,}\s*$|^\*{3,}\s*$|^_{3,}\s*$/.test(value.trim());
}

function isListItem(value: string): boolean {
  return /^([-*+]\s+|\d+\.\s+)/.test(value.trim());
}

function isHeading(value: string): boolean {
  return /^#{1,6}\s+/.test(value.trim());
}

function isCodeFence(value: string): boolean {
  return /^```/.test(value.trim());
}

function normalizeMarkdownSpacing(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== "") {
        normalized.push("");
      }
      continue;
    }

    const previousTrimmed = normalized[normalized.length - 1]?.trim() ?? "";
    const nextTrimmed = lines[index + 1]?.trim() ?? "";

    const isBlockLine =
      isHeading(trimmed) ||
      isListItem(trimmed) ||
      isHorizontalRule(trimmed) ||
      isCodeFence(trimmed);

    const needsLeadingBlankLine =
      previousTrimmed.length > 0 &&
      isBlockLine &&
      !isHeading(previousTrimmed) &&
      !isListItem(previousTrimmed) &&
      !isHorizontalRule(previousTrimmed) &&
      !isCodeFence(previousTrimmed);

    if (needsLeadingBlankLine) {
      normalized.push("");
    }

    normalized.push(rawLine);

    const shouldAddTrailingBlankLine =
      isBlockLine &&
      nextTrimmed.length > 0 &&
      !isHeading(nextTrimmed) &&
      !isListItem(nextTrimmed) &&
      !isHorizontalRule(nextTrimmed) &&
      !isCodeFence(nextTrimmed);

    if (shouldAddTrailingBlankLine) {
      normalized.push("");
    }
  }

  return normalized.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function formatMarkdownSeparators(text: string) {
  return normalizeMarkdownSpacing(text)
    .replace(/```/g, "\n```\n")
    .replace(/(^|\n)\s*---\s*(?=\n|$)/g, "$1\n---\n")
    .replace(/(?:\n){3,}/g, "\n\n")
    .trim();
}

function splitMarkdownBlocks(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let current = "";

  const flushCurrent = () => {
    if (!current.trim()) return;
    blocks.push(current.trim());
    current = "";
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushCurrent();
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushCurrent();
      const codeLines = [rawLine];

      while (index + 1 < lines.length && !lines[index + 1].trim().startsWith("```")) {
        index += 1;
        codeLines.push(lines[index]);
      }

      if (index + 1 < lines.length) {
        index += 1;
        codeLines.push(lines[index]);
      }

      blocks.push(codeLines.join("\n").trim());
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushCurrent();
      blocks.push(trimmed);
      continue;
    }

    if (current.trim() && /^#{1,6}\s+/.test(current.trim())) {
      flushCurrent();
    }

    current = current ? `${current}\n${rawLine}` : rawLine;
  }

  flushCurrent();
  return blocks.filter(Boolean);
}

function replaceLatexArrows(value: string): string {
  return value.replace(/\$?\\rightarrow\$?/g, "→").replace(/\$?\\leftarrow\$?/g, "←");
}

export function renderMarkdownText(
  text: string,
  overrides: MarkdownRenderOptions = {},
): React.ReactNode {
  const options = { ...defaultOptions, ...overrides } as Required<MarkdownRenderOptions>;
  const normalizedText = replaceLatexArrows(formatMarkdownSeparators(text));
  const blocks = splitMarkdownBlocks(normalizedText)
    .map((block, index) => renderMarkdownBlock(block, options, index))
    .filter(Boolean) as React.ReactNode[];

  if (!blocks.length) {
    return null;
  }

  return blocks.flatMap((block, index) => {
    if (index === 0) {
      return [block];
    }

    return ["\n\n", block];
  });
}
