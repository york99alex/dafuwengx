import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AHMC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 符文技能：奥术神符
 */
@registerAbility()
export class rune_6 extends TSBaseAbility {

    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName()
    }
}

/**
 * 符文技能modifier：奥术神符
 */
@registerModifier()
export class modifier_rune_6 extends BaseModifier {

    GetTexture(): string {
        return "rune_arcane"
    }
    IsPassive() {
        return true
    }
    GetEffectName(): string {
        return "particles/generic_gameplay/rune_arcane_owner.vpcf"
    }
    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return
        if (!IsValid(this.GetAbility())) return
        if (IsClient()) return
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!oPlayer) {
            return
        }
        const ability = this.GetAbility()

        // 给玩家单位奥术buff
        if (IsValid(this) && IsValid(ability)) {
            for (const eBZ of oPlayer.m_tabBz) {
                eBZ.AddNewModifier(eBZ, ability, modifier_rune_6.name, {})
            }
            AbilityManager.updateBZBuffByCreate(oPlayer, ability, (eBZ: CDOTA_BaseNPC_BZ) => {
                if (IsValid(eBZ)) {
                    eBZ.AddNewModifier(eBZ, ability, modifier_rune_6.name, {})
                }
            })
        }

        // 设置冷却减缩
        const nCDSub = ability.GetSpecialValueFor("cdsub")
        oPlayer.setCDSub(oPlayer.m_nCDSub + nCDSub)
        // 设置魔法减缩
        const nManaSub = ability.GetSpecialValueFor("manasub")
        oPlayer.setManaSub(oPlayer.m_nCDSub + nManaSub)


        // 监听持续时间回合结束
        const nRoundEnd = GameRules.GameConfig.m_nRound + ability.GetSpecialValueFor("duration") - 1
        GameRules.EventManager.Register("Event_PlayerRoundFinished", (oPlayerFinished: Player) => {
            if (nRoundEnd == GameRules.GameConfig.m_nRound && oPlayerFinished == oPlayer && oPlayer.m_bRoundFinished) {
                // 移除buff
                for (const BZ of oPlayer.m_tabBz) {
                    BZ.RemoveModifierByName(modifier_rune_6.name)
                }
                if (!ability.IsNull()) AHMC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName())
                oPlayer.setCDSub(oPlayer.m_nCDSub - nCDSub)
                oPlayer.setManaSub(oPlayer.m_nCDSub - nManaSub)
                return true
            }
        })
    }
}