/**如果没有本地化结果，返回空串 */
export function SafeLocalize(text: string) {
    let result = $.Localize(text);
    if (result.startsWith('#')) return '';
    else return result;
}
