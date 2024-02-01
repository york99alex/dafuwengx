/**解析从网表获取的boolean类型数据
 * 获取的数据为 0 | 1 | undefined
 * 返回的数据为 boolean
 *  */
export function judgeNetBoolean(data: number | undefined): boolean {
    if (data === 0) {
        return false;
    } else if (data === 1) {
        return true;
    } else {
        return false;
    }
}
