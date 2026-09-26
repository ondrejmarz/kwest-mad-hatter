import type { RuleBlock } from '../../i18n/rules/types';

/** A rule's detail as readable text: paragraphs, bullet lists, numbered steps and examples. */
export function RuleBlocks({ blocks }: { blocks: readonly RuleBlock[] }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-content">
      {blocks.map((block, index) => (
        // The blocks are static text in a fixed order, so the index is a stable key.
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: RuleBlock }) {
  if (typeof block === 'string') return <p>{block}</p>;
  if ('steps' in block) {
    return (
      <ol className="flex list-decimal flex-col gap-1 pl-5">
        {block.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    );
  }
  if ('example' in block) {
    return <p className="rounded-lg bg-surface px-3 py-2 text-content-muted">{block.example}</p>;
  }
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5">
      {block.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
