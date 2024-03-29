import { BZ_Ability } from '../hud/mode/constant';

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

/**通过本地化名字获得英雄名 */
export function getHeroName(localName: string): string {
    switch (localName) {
        case '幻影刺客':
        case 'Phantom Assassin':
            return 'npc_dota_hero_phantom_assassin';
        case '米波':
        case 'Meepo':
            return 'npc_dota_hero_meepo';
        case '帕吉':
        case 'Pudge':
            return 'npc_dota_hero_pudge';
        case '莉娜':
        case 'Lina':
            return 'npc_dota_hero_lina';
        case '宙斯':
        case 'Zeus':
            return 'npc_dota_hero_zuus';
        case '斧王':
        case 'Axe':
            return 'npc_dota_hero_axe';
        case '血魔':
        case 'Bloodseeker':
            return 'npc_dota_hero_bloodseeker';
        case '工程师':
        case 'Techies':
            return 'npc_dota_hero_techies';
        case '龙骑士':
        case 'Dragon Knight':
            return 'npc_dota_hero_dragon_knight';
        case '不朽尸王':
        case 'Undying':
            return 'npc_dota_hero_undying';
        case '噬魂鬼':
        case 'Lifestealer':
            return 'npc_dota_hero_life_stealer';
        case '熊战士':
        case 'Ursa':
            return 'npc_dota_hero_ursa';
        default:
            return '';
    }
}

export function getHeroBZAbility(localName: string) {
    return BZ_Ability[getHeroName(localName)];
}
