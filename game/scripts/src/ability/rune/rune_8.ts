import { AMHC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 符文技能：智慧神符
 */
@registerAbility()
export class rune_8 extends TSBaseAbility {

    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName()
    }
}

/**
 * 符文技能modifier：智慧神符
 */
@registerModifier()
export class modifier_rune_8 extends BaseModifier {

    GetTexture(): string {
        return "rune_wisdom"
    }
    IsPassive() {
        return true
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

        // 设置玩家获得经验
        const nExp = ability.GetSpecialValueFor("exp")
        oPlayer.setExpAdd(nExp)

        Timers.CreateTimer(0.01, () => { AMHC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName()) })
    }
}