import type { DocumentOutlineItem } from '@/domain/document/types';
import { useReaderStore } from '@/application/reader/reader-store';

interface OutlinePanelProps {
  onNavigate: (pageNumber: number) => void;
}

function OutlineNodes({
  items,
  depth,
  onNavigate,
}: {
  items: DocumentOutlineItem[];
  depth: number;
  onNavigate: (pageNumber: number) => void;
}) {
  return (
    <ul className="outline-list">
      {items.map((item, index) => (
        <li key={`${depth}-${index}-${item.title}`}>
          <button
            className="outline-item"
            style={{ paddingLeft: 12 + depth * 14 }}
            disabled={item.pageNumber === null}
            onClick={() => item.pageNumber !== null && onNavigate(item.pageNumber)}
          >
            <span className="outline-item__title">{item.title || 'Untitled'}</span>
            {item.pageNumber !== null && (
              <span className="outline-item__page">{item.pageNumber}</span>
            )}
          </button>
          {item.children.length > 0 && (
            <OutlineNodes
              items={item.children}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function OutlinePanel({ onNavigate }: OutlinePanelProps) {
  const outline = useReaderStore((s) => s.outline);

  if (outline.length === 0) {
    return <p className="panel__empty">This document has no table of contents.</p>;
  }
  return <OutlineNodes items={outline} depth={0} onNavigate={onNavigate} />;
}
