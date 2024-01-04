import { TP_DOMAIN_4 } from "../../constants/gamemessage";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { AMHC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { ParaAdjuster } from "../../utils/paraadjuster";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 路径技能：夜魇
 */
@registerAbility()
export class path_15 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        print("path==modname:", "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel())
        return "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel()
    }
}

/**
 * 路径技能：夜魇
 */
@registerModifier()
export class modifier_path_15_l1 extends BaseModifier {
    oPlayer: Player
    unUpdateBZBuffByCreate: number
    tEventID: number[]
    gongsu: number
    yisu: number
    IsHidden(): boolean {
        return false
    }
    IsDebuff(): boolean {
        return false
    }
    IsPurgable(): boolean {
        return false
    }
    GetTexture(): string {
        return "path15"
    }
    RemoveOnDeath(): boolean {
        return false
    }
    DestroyOnExpire(): boolean {
        return false
    }
    OnDestroy(): void {
        print("ability=modifier=OnDestroy===name:", this.GetName())
        if (this.oPlayer) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValid(eBZ)) {
                    AMHC.RemoveModifierByName(this.GetName(), eBZ)
                    AMHC.RemoveModifierByName(modifier_path_15_chenmo.name, eBZ)
                }
            }
        }
        if (this.unUpdateBZBuffByCreate) {
            GameRules.EventManager.UnRegisterByID(this.unUpdateBZBuffByCreate, "Event_BZCreate")
        }
        if (this.tEventID) {
            for (const nID of this.tEventID) {
                GameRules.EventManager.UnRegisterByID(nID)
            }
        }
    }
    OnCreated(params: object): void {
        print("ability=modifier=OnCreated===name:", this.GetName(), "Time:", this.GetRemainingTime())
        if (!IsValid(this)) {
            return
        }
        if (!IsValid(this.GetAbility())) {
            return
        }
        this.gongsu = this.GetAbility().GetSpecialValueFor("gongsu")
        this.yisu = this.GetAbility().GetSpecialValueFor("yisu")
        print(this.GetName(), "===this.gongsu", this.gongsu)
        print(this.GetName(), "===this.yisu", this.yisu)
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }
        const oPlayer = this.oPlayer
        const ability = this.GetAbility()
        const buffName = this.GetName()
        // 给玩家兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValid(this) && IsValid(this.GetAbility())) {
                for (const eBZ of this.oPlayer.m_tabBz) {
                    const oBuff = eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                    if (oBuff && 3 == this.GetAbility().GetLevel() && TP_DOMAIN_4 == eBZ.m_path.m_typePath) {
                        oBuff.SetStackCount(2)
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), modifier_path_15_chenmo.name, {})
                    }
                    eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (IsValid(eBZ)) {
                        const oBuff = eBZ.AddNewModifier(oPlayer.m_eHero, ability, buffName, {})
                        if (oBuff && 3 == ability.GetLevel() && TP_DOMAIN_4 == eBZ.m_path.m_typePath) {
                            oBuff.SetStackCount(2)
                            eBZ.AddNewModifier(oPlayer.m_eHero, ability, modifier_path_15_chenmo.name, {})
                        }
                    }
                })
            }
        })
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT
        ]
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.gongsu
    }
    GetModifierMoveSpeedBonus_Constant(): number {
        return this.yisu
    }
}

@registerModifier()
export class modifier_path_15_l2 extends modifier_path_15_l1 { }

@registerModifier()
export class modifier_path_15_l3 extends modifier_path_15_l1 { }

@registerModifier()
export class modifier_path_15_chenmo extends BaseModifier {
    IsDebuff(): boolean {
        return true
    }
    IsPurgable(): boolean {
        return false
    }
    GetTexture(): string {
        return "path15"
    }
}