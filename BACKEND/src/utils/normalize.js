export function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // [^\p{L}\s] nghĩa là xóa tất cả những gì KHÔNG phải chữ và khoảng trắng (kí tự đặc biệt, số...)
    .replace(/[^\p{L}\s]/gu, " ")   
    .replace(/\s+/g, " ")
    .trim(); //  tránh khoảng trắng thừa ở đầu/cuối 
}