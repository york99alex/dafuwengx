import { TP_START } from "./gamemessage"

export class Bot {


    constructor(eBot?: CDOTA_BaseNPC_Hero) {
    }

    static init() {
        // 添加机器人测试
        // const eBot1 = GameRules.AddBotPlayerWithEntityScript("npc_dota_hero_bloodseeker", "bloodseeker", DotaTeam.GOODGUYS, null, true)
        const eBot2 = GameRules.AddBotPlayerWithEntityScript("npc_dota_hero_meepo", "meepo", DotaTeam.GOODGUYS, null, true)

        // GameRules.PathManager.moveToPath(eBot1, GameRules.PathManager.getPathByType(TP_START)[0], false, null)
        GameRules.PathManager.moveToPath(eBot2, GameRules.PathManager.getPathByType(TP_START)[0], false, null)

    }
}