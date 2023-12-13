import { PS_Invis } from "../../mode/gamemessage";
import { Player } from "../../player/player";
import { AMHC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 符文技能：隐形神符
 */
@registerAbility()
export class rune_3 extends TSBaseAbility {

    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName()
    }
}

/**
 * 符文技能modifier：隐形神符
 */
@registerModifier()
export class modifier_rune_3 extends BaseModifier {

    GetTexture(): string {
        return "rune_invis"
    }
    IsPassive() {
        return true
    }
    GetEffectName(): string {
        return "particles/generic_hero_status/status_invisibility_start.vpcf"
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

        // 添加隐身
        oPlayer.setPlayerState(PS_Invis)

        oPlayer.m_eHero.FindAllModifiers().forEach((oBuff) => {
            print("oPlayer_rune_Invis_OnCreated_", oPlayer.m_nPlayerID, "===heroname:", oPlayer.m_eHero.GetUnitName(), " ===oBuff===name:", oBuff.GetName())
        })

        /**监听隐身结束移除buff */
        function onEvent_PlayerInvisEnd(event: { player: Player; }) {
            if (!ability || ability.IsNull()) return true
            if (event.player == oPlayer) {
                // 移除buff
                AMHC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName())
                return true
            }
        }
        const eID = GameRules.EventManager.Register("Event_PlayerInvisEnd", (event: { player: Player }) => onEvent_PlayerInvisEnd(event))

        // 监听持续时间回合结束
        const nRoundEnd = GameRules.GameConfig.m_nRound + ability.GetSpecialValueFor("duration") - 1
        GameRules.EventManager.Register("Event_PlayerRoundFinished", (oPlayerFinished: Player) => {
            if (!ability || ability.IsNull()) return true
            if (nRoundEnd == GameRules.GameConfig.m_nRound && oPlayerFinished == oPlayer && oPlayer.m_bRoundFinished) {
                // 移除buff
                AMHC.RemoveAbilityAndModifier(oPlayer.m_eHero, ability.GetAbilityName())
                GameRules.EventManager.UnRegisterByID(eID, "Event_PlayerInvisEnd")
                return true
            }
        })
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.IGNORE_INVULNERABLE
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVISIBLE]: true
        }
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.INVISIBILITY_LEVEL,
            ModifierFunction.PERSISTENT_INVISIBILITY
        ]
    }
    GetModifierInvisibilityLevel(): number {
        return 1
    }
    GetModifierPersistentInvisibility(): number {
        return 1
    }
}