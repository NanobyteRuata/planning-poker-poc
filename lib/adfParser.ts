interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
}

interface AdfDocument {
  type: 'doc';
  version: number;
  content: AdfNode[];
}

export function parseAdfToPlainText(adf: AdfDocument | string): string {
  let parsedAdf: AdfDocument;
  
  if (typeof adf === 'string') {
    try {
      parsedAdf = JSON.parse(adf);
    } catch {
      return adf;
    }
  } else {
    parsedAdf = adf;
  }

  if (!parsedAdf || typeof parsedAdf !== 'object' || !parsedAdf.content) {
    return '';
  }

  return parseNodes(parsedAdf.content).trim();
}

function parseNodes(nodes: AdfNode[], depth = 0): string {
  if (!Array.isArray(nodes)) return '';

  return nodes
    .map((node) => parseNode(node, depth))
    .filter(Boolean)
    .join('\n');
}

function parseNode(node: AdfNode, depth = 0): string {
  if (!node || !node.type) return '';

  switch (node.type) {
    case 'text':
      return node.text || '';

    case 'paragraph':
      return node.content ? parseNodes(node.content, depth) : '';

    case 'heading':
      const headingText = node.content ? parseNodes(node.content, depth) : '';
      const level = (node.attrs?.level as number) || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${headingText}`;

    case 'bulletList':
    case 'orderedList':
      return node.content
        ? node.content
            .map((item, index) => {
              const bullet = node.type === 'orderedList' ? `${index + 1}.` : '-';
              const indent = '  '.repeat(depth);
              const itemText = parseNode(item, depth + 1);
              return `${indent}${bullet} ${itemText}`;
            })
            .join('\n')
        : '';

    case 'listItem':
      return node.content ? parseNodes(node.content, depth).replace(/\n/g, ' ') : '';

    case 'hardBreak':
      return '\n';

    case 'codeBlock':
      const code = node.content ? parseNodes(node.content, depth) : '';
      return `\`\`\`\n${code}\n\`\`\``;

    case 'blockquote':
      const quote = node.content ? parseNodes(node.content, depth) : '';
      return quote
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');

    case 'mediaSingle':
    case 'media':
      const alt = (node.attrs?.alt as string) || 'image';
      return `[Image: ${alt}]`;

    case 'mention':
      const mentionText = (node.attrs?.text as string) || '@user';
      return mentionText;

    case 'emoji':
      const emojiText = (node.attrs?.shortName as string) || '';
      return emojiText ? `:${emojiText}:` : '';

    case 'table':
    case 'tableRow':
    case 'tableCell':
    case 'tableHeader':
      return node.content ? parseNodes(node.content, depth) : '';

    case 'rule':
      return '---';

    default:
      return node.content ? parseNodes(node.content, depth) : '';
  }
}
