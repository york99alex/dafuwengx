
export class Bot {
    constructor(eBot?: CDOTA_BaseNPC_Hero) {}

    static init() {
        // 添加机器人测试
        const eBot1 = GameRules.AddBotPlayerWithEntityScript('npc_dota_hero_zuus', 'zuus', DotaTeam.GOODGUYS, null, false);
        const eBot2 = GameRules.AddBotPlayerWithEntityScript('npc_dota_hero_meepo', 'meepo', DotaTeam.GOODGUYS, null, false);

        // eBot1.AddItemByName('item_qtg_rapier');
        // eBot2.AddItemByName('item_qtg_rapier');

        // FindClearSpaceForUnit(eBot1, GameRules.PathManager.getPathByType(TP_START)[0].getNilPos(eBot1), true);
        // FindClearSpaceForUnit(eBot2, GameRules.PathManager.getPathByType(TP_START)[0].getNilPos(eBot2), true);
    }
}
