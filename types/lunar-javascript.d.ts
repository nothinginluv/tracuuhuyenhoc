/**
 * `lunar-javascript` không kèm type. Chỉ dùng trong test đối chứng,
 * nên khai báo lỏng là đủ — không để `any` rò vào mã sản phẩm.
 */
declare module 'lunar-javascript' {
  const pkg: any;
  export default pkg;
  export const Solar: any;
  export const Lunar: any;
  export const SolarUtil: any;
  export const LunarUtil: any;
  export const EightChar: any;
}
