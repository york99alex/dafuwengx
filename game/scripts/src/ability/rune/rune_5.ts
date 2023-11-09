import { AHMC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 符文技能：赏金神符
 */
@registerAbility()
export class rune_5 extends TSBaseAbility {

    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName()
    }
}

/**
 * 符文技能modifier：赏金神符
 */
@registerModifier()
export class modifier_rune_5 extends BaseModifier {

    GetTexture(): string {
        return "rune_bounty"
    }
    IsPassive() {
        return true
    }
    GetEffectName(): string {
        return "particles/generic_gameplay/rune_bounty_owner.vpcf"
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

        // 设置玩家获得金币
        const nGold = ability.GetSpecialValueFor("gold")
        oPlayer.setGold(nGold)

        // 飘金
        GameRules.GameConfig.showGold(oPlayer, nGold)

        Timers.CreateTimer(0.01, () => { AHMC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName()) })
    }
}