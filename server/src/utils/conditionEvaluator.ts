import { IQuestion, IConditionRule } from '../models/Survey.js';

/**
 * Checks if a single condition rule is satisfied against current respondent answers
 */
export const isConditionSatisfied = (
  rule: IConditionRule,
  answers: Record<string, any> | Map<string, any>
): boolean => {
  const getVal = (qid: string) => {
    if (!answers) return undefined;
    if (answers instanceof Map) {
      return answers.get(qid);
    }
    return answers[qid];
  };

  const currentVal = getVal(rule.dependsOnQuestionId);

  // If question was never answered or is undefined/null
  if (currentVal === undefined || currentVal === null || currentVal === '') {
    return false;
  }

  const targetVal = rule.value;

  switch (rule.operator) {
    case 'equals':
      if (Array.isArray(currentVal)) {
        return currentVal.includes(targetVal);
      }
      return String(currentVal).trim().toLowerCase() === String(targetVal).trim().toLowerCase();

    case 'not_equals':
      if (Array.isArray(currentVal)) {
        return !currentVal.includes(targetVal);
      }
      return String(currentVal).trim().toLowerCase() !== String(targetVal).trim().toLowerCase();

    case 'contains':
      if (Array.isArray(currentVal)) {
        return currentVal.some((item) =>
          String(item).toLowerCase().includes(String(targetVal).toLowerCase())
        );
      }
      return String(currentVal).toLowerCase().includes(String(targetVal).toLowerCase());

    case 'greater_than':
      return Number(currentVal) > Number(targetVal);

    case 'less_than':
      return Number(currentVal) < Number(targetVal);

    default:
      return true;
  }
};

/**
 * Determines whether a question should be shown based on all its conditional rules.
 * All rules must be satisfied (AND logic). If no rules exist, returns true.
 */
export const shouldShowQuestion = (
  question: IQuestion,
  answers: Record<string, any> | Map<string, any>
): boolean => {
  if (!question.conditions || question.conditions.length === 0) {
    return true;
  }

  // All condition rules must match
  return question.conditions.every((rule) => isConditionSatisfied(rule, answers));
};
