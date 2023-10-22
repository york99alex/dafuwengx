import { PS_AtkMonster } from "../../mode/gamemessage";
import { PathManager } from "../../path/PathManager";
import { Player, player_info } from "../../player/player";
import { AHMC } from "../../utils/amhc";
import { registerAbility } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";


/**
 * 	"DOTA_Tooltip_ability_Ability_lina_dragon_slave"					"龙破斩"
    "DOTA_Tooltip_ability_Ability_lina_dragon_slave_Description"		"莉娜引导龙的吐息，放出一波火焰，烧焦前方全部敌人。"
    "DOTA_Tooltip_ability_Ability_lina_dragon_slave_Lore"			"在纷争之国的荒焦之地，为了娱乐，莉娜学会了操控沙漠龙的火焰吐息。"
    "DOTA_Tooltip_ability_Ability_lina_dragon_slave_dragon_slave_damage"			"伤害 :"
 */
@registerAbility()
export class Ability_lina_dragon_slave extends TSBaseAbility {

    /**定义技能的施法距离 */
    GetCastRange(location: Vector, target: CDOTA_BaseNPC): number {
        const tabPlayerInfo = CustomNetTables.GetTableValue("GamingTable", "player_info_" + this.GetCaster().GetPlayerOwnerID() as player_info)
        if (!tabPlayerInfo)
            return
        const [nPathIDQ,] = PathManager.getVertexPathID(tabPlayerInfo.nPathCurID)
        const tabPathID = [nPathIDQ]
        let nPathID = PathManager.getNextPathID(tabPlayerInfo.nPathCurID, 1)
        while (nPathID != nPathIDQ) {
            tabPathID.push(nPathID)
            nPathID = PathManager.getNextPathID(nPathID, 1)
        }
        AbilityManager.showAbltMark(this, this.GetCaster(), tabPathID)
        return 0
    }

    /**选择无目标时 */
    CastFilterResult(): UnitFilterResult {
        if (!this.isCanCast()) {
            return UnitFilterResult.FAIL_CUSTOM
        }
        return UnitFilterResult.SUCCESS
    }

    /**开始技能效果 */
    OnSpellStart() {
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID())

        // 特效
        const nPtclID = AHMC.CreateParticle("particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf"
            , ParticleAttachment.POINT, false, oPlayer.m_eHero, 3)
        const [pathQ,] = GameRules.PathManager.getVertexPath(oPlayer.m_pathCur)
        const v3 = (pathQ.m_entity.GetAbsOrigin() - oPlayer.m_pathCur.m_entity.GetAbsOrigin() as Vector).Normalized()
        const nSpeed = this.GetSpecialValueFor("dragon_slave_speed")
        ParticleManager.SetParticleControl(nPtclID, 0, oPlayer.m_pathCur.m_entity.GetAbsOrigin())
        ParticleManager.SetParticleControl(nPtclID, 1, v3 * nSpeed as Vector)
        EmitGlobalSound("Hero_Lina.DragonSlave")

        // 伤害作用格数内的玩家
        let pathTarger = oPlayer.m_pathCur
        Timers.CreateTimer(() => {
            pathTarger = GameRules.PathManager.getNextPath(pathTarger, 1)
            let tabPlayer: Player[] = []
            GameRules.PlayerManager.findRangePlayer(tabPlayer, pathTarger, 1, 0, (player: Player) => {
                if (player == oPlayer
                    || !this.checkTarget(player.m_eHero)
                    || 0 < bit.band(PS_AtkMonster, player.m_nPlayerState)) {
                    return false
                }
                return true
            })
            // 对玩家造成伤害
            if (tabPlayer.length > 0) {
                for (const v of tabPlayer) {
                    AHMC.Damage(this.GetCaster(), v.m_eHero, this.GetSpecialValueFor("dragon_slave_damage"), this.GetAbilityDamageType(), this)
                }
            }
            if (pathTarger != pathQ) {
                return 0.17
            }
        })

        // 触发耗蓝
        GameRules.EventManager.FireEvent("Event_HeroManaChange", { player: oPlayer, oAblt: this })
        // 设置冷却
        AbilityManager.setRoundCD(oPlayer, this)
    }
}