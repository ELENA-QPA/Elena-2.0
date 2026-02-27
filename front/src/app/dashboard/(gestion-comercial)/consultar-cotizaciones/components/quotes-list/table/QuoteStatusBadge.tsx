import {
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
} from '../../../../_shared/types/quotes.constants';
import type { QuoteStatus } from '../../../../_shared/types/quotes.types';

export const QuoteStatusBadge = ({ status }: { status: QuoteStatus }) => {
  const colors = QUOTE_STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
};
