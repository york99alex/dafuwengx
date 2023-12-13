import { Player } from "../../player/player";
import { AMHC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 符文技能：极速神符
 */
@registerAbility()
export class rune_1 extends TSBaseAbility {

    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName()
    }
}

/**
 * 符文技能modifier：极速神符
 */
@registerModifier()
export class modifier_rune_1 extends BaseModifier {

    GetTexture(): string {
        return "rune_haste"
    }
    IsPassive() {
        return true
    }
    GetEffectName(): string {
        return "particles/generic_gameplay/rune_haste_owner.vpcf"
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

        // 监听持续时间回合结束
        const nRoundEnd = GameRules.GameConfig.m_nRound + ability.GetSpecialValueFor("duration") - 1
        GameRules.EventManager.Register("Event_PlayerRoundFinished", (oPlayerFinished: Player) => {
            if (nRoundEnd == GameRules.GameConfig.m_nRound && oPlayerFinished == oPlayer && oPlayer.m_bRoundFinished) {
                // 移除buff
                for (const BZ of oPlayer.m_tabBz) {
                    BZ.RemoveModifierByName(modifier_rune_1.name)
                }
                if (!ability.IsNull()) AMHC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName())
                return true
            }
        })
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_ABSOLUTE
        ]
    }
    GetModifierMoveSpeed_Absolute(): number {
        return 777
    }
}