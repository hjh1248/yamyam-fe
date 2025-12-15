/**
 * 영양소 계산 유틸리티 함수
 * (이전 calorie.js에서 확장됨)
 */

/**
 * 음식의 특정 영양소 계산
 * @param {Object} food - 음식 객체 (MealFoodDetailResponse)
 * @param {number} food.quantity - 섭취량
 * @param {string} nutrientKey - 계산할 영양소의 키 (예: 'energyPer100', 'proteinPer100')
 * @returns {number} 계산된 영양소 값 (소수점 첫째 자리 반올림)
 */
export const calculateFoodNutrient = (food, nutrientKey) => {
  if (!food || !food.quantity || food.quantity <= 0 || !food[nutrientKey]) {
    return 0
  }
  // 영양소는 100단위당 값이므로, 섭취량에 비례하여 계산
  return Math.round((food.quantity / 100) * food[nutrientKey])
}

/**
 * 식사(아침/점심/저녁/간식)의 총 영양소 계산
 * @param {Array} foods - 음식 객체 배열 (MealFoodDetailResponse 배열)
 * @param {string} nutrientKey - 계산할 영양소의 키 (예: 'energyPer100', 'proteinPer100')
 * @returns {number} 총 영양소 값
 */
export const calculateMealTotalNutrient = (foods, nutrientKey) => {
  if (!foods || foods.length === 0) return 0

  return foods.reduce((total, food) => {
    return total + calculateFoodNutrient(food, nutrientKey)
  }, 0)
}

/**
 * 하루 전체 영양소 계산
 * @param {Object} dailyDiet - 일일 식단 객체 (DailyDietDetailResponse)
 * @param {string} nutrientKey - 계산할 영양소의 키 (예: 'energyPer100', 'proteinPer100')
 * @returns {number} 하루 총 영양소 값
 */
export const calculateDailyTotalNutrient = (dailyDiet, nutrientKey) => {
  if (!dailyDiet) return 0

  const breakfastTotal = calculateMealTotalNutrient(dailyDiet.breakfast?.mealFoods || [], nutrientKey)
  const lunchTotal = calculateMealTotalNutrient(dailyDiet.lunch?.mealFoods || [], nutrientKey)
  const dinnerTotal = calculateMealTotalNutrient(dailyDiet.dinner?.mealFoods || [], nutrientKey)
  const snackTotal = calculateMealTotalNutrient(dailyDiet.snack?.mealFoods || [], nutrientKey)

  return breakfastTotal + lunchTotal + dinnerTotal + snackTotal
}

// 이전의 calorie 계산 함수들은 이제 calculateFoodNutrient를 사용하도록 변경
export const calculateFoodCalorie = (food) => calculateFoodNutrient(food, 'energyPer100');
export const calculateMealTotalCalorie = (foods) => calculateMealTotalNutrient(foods, 'energyPer100');
export const calculateDailyTotalCalorie = (dailyDiet) => calculateDailyTotalNutrient(dailyDiet, 'energyPer100');

// 추가로 필요한 영양소 계산 함수 (탄단지 등)
export const calculateDailyProtein = (dailyDiet) => calculateDailyTotalNutrient(dailyDiet, 'proteinPer100');
export const calculateDailyFat = (dailyDiet) => calculateDailyTotalNutrient(dailyDiet, 'fatPer100');
export const calculateDailyCarbohydrate = (dailyDiet) => calculateDailyTotalNutrient(dailyDiet, 'carbohydratePer100');

// 다른 상세 영양소도 필요에 따라 여기에 추가할 수 있습니다.
// export const calculateDailySugar = (dailyDiet) => calculateDailyTotalNutrient(dailyDiet, 'sugarPer100');
// export const calculateDailySodium = (dailyDiet) => calculateDailyTotalNutrient(dailyDiet, 'sodiumPer100');