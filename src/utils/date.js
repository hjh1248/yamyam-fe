/**
 * 날짜 포맷팅 유틸리티 함수
 */

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} YYYY-MM-DD 형식의 문자열
 */
export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Date 객체를 M/D 형식으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} M/D 형식의 문자열
 */
export const formatDateDisplay = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}/${day}`
}

/**
 * Date 객체를 YYYY년 M월 D일 (요일) 형식으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} YYYY년 M월 D일 (요일) 형식의 문자열
 */
export const formatDateFull = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[d.getDay()]
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

/**
 * Date 객체를 YYYY.M.D 형식으로 변환
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} YYYY.M.D 형식의 문자열
 */
export const formatDateDot = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}.${month}.${day}`
}

/**
 * 요일 가져오기
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 요일 (한글)
 */
export const getWeekday = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return weekdays[d.getDay()]
}

/**
 * 두 날짜 사이의 일수 계산
 * @param {Date|string} startDate - 시작 날짜
 * @param {Date|string} endDate - 종료 날짜
 * @returns {number} 일수 (시작일과 종료일 포함)
 */
export const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

/**
 * 시작일부터 종료일까지의 날짜 배열 생성
 * @param {Date|string} startDate - 시작 날짜
 * @param {Date|string} endDate - 종료 날짜
 * @returns {Date[]} 날짜 배열
 */
export const generateDateRange = (startDate, endDate) => {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }

  return dates
}
