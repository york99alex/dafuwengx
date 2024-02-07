/**如果没有本地化结果，返回空串 */
export function SafeLocalize(text: string) {
    let result = $.Localize(text);
    if (result.startsWith('#')) return '';
    else return result;
}

export function SetHotKey(key: string, down_cb: (name?: string, ...args: string[]) => void, up_cb: (name?: string, ...args: string[]) => void) {
    const command = `On${key}${Date.now()}`;
    Game.CreateCustomKeyBind(key, `+${command}`);
    Game.AddCommand(
        `+${command}`,
        () => {
            if (down_cb) down_cb();
        },
        ``,
        1 << 32
    );
    Game.AddCommand(
        `-${command}`,
        () => {
            if (up_cb) up_cb();
        },
        ``,
        1 << 32
    );
}


