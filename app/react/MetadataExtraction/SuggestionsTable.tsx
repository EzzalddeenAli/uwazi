/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/no-multi-comp */
import React, { ReactNode } from 'react';
import _ from 'lodash';
import {
  Column,
  Row,
  useFilters,
  usePagination,
  useRowSelect,
  useRowState,
  useTable,
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import { t, Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { propertyValueFormatter } from 'app/Metadata/helpers/formater';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { PropertySchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';
import ModalTips from 'app/App/ModalTips';

const suggestionsTable = (
  reviewedProperty: PropertySchema,
  suggestions: EntitySuggestionType[],
  totalPages: number,
  actionsCell: (data: { row: Row<EntitySuggestionType> }) => React.ReactElement,
  segmentCell: (data: { row: Row<EntitySuggestionType> }) => React.ReactElement
) => {
  const formatValue = (value: PropertyValueSchema | undefined) => {
    if (!value) return '-';
    if (reviewedProperty.type === 'date' && _.isNumber(value)) {
      return propertyValueFormatter.date(value);
    }
    return value;
  };

  const currentValueCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const propertyValue = row.values.currentValue || row.original.currentValue;
    const currentValue: ReactNode = formatValue(propertyValue) as ReactNode;
    return (
      <div>
        <p className="current-value">{currentValue}</p>
      </div>
    );
  };

  const suggestionCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const suggestion = row.original;
    const suggestedValue: ReactNode = formatValue(suggestion.suggestedValue) as ReactNode;
    return (
      <div>
        <p className="suggested-value">{suggestedValue}</p>
      </div>
    );
  };

  const columns: Column<EntitySuggestionType>[] = React.useMemo(
    () => [
      {
        accessor: 'segment' as const,
        Header: () => <Translate>Context</Translate>,
        className: reviewedProperty.label === 'Title' ? 'long-segment' : 'segment',
        Cell: segmentCell,
      },
      {
        id: 'suggestion',
        Header: () => <Translate>Suggestion</Translate>,
        Cell: suggestionCell,
        className: 'suggestion',
      },
      {
        id: 'action',
        Header: () => <div />,
        Cell: actionsCell,
        className: 'action',
      },
      {
        id: 'currentValue',
        Header: () => <Translate>Current value</Translate>,
        Cell: currentValueCell,
        className: 'current',
      },
      {
        id: 'entityTitle',
        accessor: 'entityTitle' as const,
        Header: () => <Translate>Title</Translate>,
        className: 'title',
      },
      {
        accessor: 'language' as const,
        Header: () => <Translate>Language</Translate>,
        className: 'language',
        Cell: ({ row }: { row: Row<EntitySuggestionType> }) => (
          <Translate>{row.original.language}</Translate>
        ),
      },
      {
        accessor: 'state' as const,
        Header: () => (
          <>
            <Translate>State</Translate>
            <ModalTips
              label={<Icon icon="question-circle" />}
              title={t('System', 'State Legend', 'State Legend', false)}
            >
              <h5>{t('System', SuggestionState.labelMatch, SuggestionState.labelMatch, false)}</h5>
              <div>
                <Translate translationKey="labelMatchDesc">
                  It has a current value and a text selection matching with the model suggested
                  value and selection. It will be used as a training sample.
                </Translate>
              </div>
              <h5>
                {t('System', SuggestionState.labelMismatch, SuggestionState.labelMismatch, false)}
              </h5>
              <div>
                <Translate translationKey="labelMismatchDesc">
                  It has a current value and text selection but they do not match the model
                  prediction. Accepting the suggestion will replace the current value and text
                  selection with the suggested ones becoming a "match / labeled". If the labeled
                  data is correct and the suggestion is wrong no action is needed. It will be used
                  as a training sample.
                </Translate>
              </div>
              <h5>{t('System', SuggestionState.labelEmpty, SuggestionState.labelEmpty, false)}</h5>
              <div>
                <Translate translationKey="labelEmptyDesc">
                  Accepting is not available since there is no suggestion. If the value is correct
                  and the suggestion is wrong no action is needed. It will be used as a training
                  sample.
                </Translate>
              </div>
              <h5>{t('System', SuggestionState.valueMatch, SuggestionState.valueMatch, false)}</h5>
              <div>
                <Translate translationKey="valueMatchDesc">
                  It has a current value that matches the suggestion, but it doesn't have a text
                  selection. Accepting will keep the value as it is and enrich it with the suggested
                  text selection becoming a "match / label" that can be used as a training sample.
                </Translate>
              </div>
              <h5>
                {t('System', SuggestionState.valueMismatch, SuggestionState.valueMismatch, false)}
              </h5>
              <div>
                <Translate translationKey="valueMismatchDesc">
                  Accepting the suggestion will replace the current value and text selection with
                  the suggested ones becoming a "match / label" that will be used as a training
                  sample. If the current value is correct, you can still click to fill the text
                  selection so it becomes a "mismatch / label" that will be used as a training
                  sample.
                </Translate>
              </div>
              <h5>
                {t('System', SuggestionState.emptyMismatch, SuggestionState.emptyMismatch, false)}
              </h5>
              <div>
                <Translate translationKey="emptyMismatchDesc">
                  There is no current value and the model is suggesting a value. Accepting the
                  suggestion will replace the current (empty) value and text selection with the
                  suggested ones becoming a "match / label" that will be used as a training sample.
                  Alternatively you can ignore the suggestion and click to fill the text selection
                  so it becomes a "mismatch / label" that will be used as a training sample.
                </Translate>
              </div>
              <h5>{t('System', SuggestionState.valueEmpty, SuggestionState.valueEmpty, false)}</h5>
              <div>
                <Translate translationKey="valueEmptyDesc">
                  Accepting is not available since there is no suggestion. If the current value is
                  correct, you can click to fill the text selection so it becomes a "empty / label"
                  that will be used as a training sample.
                </Translate>
              </div>
              <h5>{t('System', SuggestionState.empty, SuggestionState.empty, false)}</h5>
              <div>
                <Translate translationKey="emptyDesc">
                  Both the current value and the suggestion are empty. You can click to fill the
                  value and text selection so it becomes a "empty / label" that will be used as a
                  training sample.
                </Translate>
              </div>
              <h5>{t('System', SuggestionState.obsolete, SuggestionState.obsolete, false)}</h5>
              <div>
                <Translate translationKey="obsoleteDesc">
                  A new model is training and processing suggestions. This suggestion was created by
                  a previous model so no actions are possible until the new suggestion is received.
                </Translate>
              </div>
            </ModalTips>
          </>
        ),
        Cell: ({ row }: { row: Row<EntitySuggestionType> }) => {
          const dirtyState = row.original.state !== row.values.state;
          return (
            <div className={dirtyState ? 'new-state' : ''}>
              <Translate>{row.values.state}</Translate>
            </div>
          );
        },
        className: 'state',
      },
    ],
    []
  );
  const hiddenColumns = reviewedProperty.label === 'Title' ? ['entityTitle'] : [];

  return useTable(
    {
      columns,
      data: suggestions,
      manualPagination: true,
      manualFilters: true,
      initialState: {
        hiddenColumns,
        pageIndex: 0,
        pageSize: 100,
      },
      pageCount: totalPages,
      autoResetPage: false,
      autoResetFilters: false,
    },
    useFilters,
    usePagination,
    useRowSelect,
    useRowState,
    useSticky
  );
};

export { suggestionsTable };
