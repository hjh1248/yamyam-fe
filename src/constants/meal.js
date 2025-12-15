/**
 * 식사 타입 상수
 */
export const MEAL_TYPES = {
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  SNACK: 'SNACK'
}

/**
 * 식사 타입 한글 레이블
 */
export const MEAL_TYPE_LABELS = {
  [MEAL_TYPES.BREAKFAST]: '아침',
  [MEAL_TYPES.LUNCH]: '점심',
  [MEAL_TYPES.DINNER]: '저녁',
  [MEAL_TYPES.SNACK]: '간식'
}

/**
 * 식사 타입 목록
 */
export const MEAL_TYPE_LIST = [
  { value: MEAL_TYPES.BREAKFAST, label: MEAL_TYPE_LABELS[MEAL_TYPES.BREAKFAST] },
  { value: MEAL_TYPES.LUNCH, label: MEAL_TYPE_LABELS[MEAL_TYPES.LUNCH] },
  { value: MEAL_TYPES.DINNER, label: MEAL_TYPE_LABELS[MEAL_TYPES.DINNER] },
  { value: MEAL_TYPES.SNACK, label: MEAL_TYPE_LABELS[MEAL_TYPES.SNACK] }
]

/**
 * 음식 단위
 */
export const FOOD_UNITS = {
  GRAM: 'g',
  MILLILITER: 'ml'
}

/**
 * 음식 단위 목록
 */
export const FOOD_UNIT_LIST = [
  { value: FOOD_UNITS.GRAM, label: 'g' },
  { value: FOOD_UNITS.MILLILITER, label: 'ml' }
]
