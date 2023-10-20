import { Player } from "../../player/player";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";
import { modifier_ignore_armor } from "../../modifiers/util/modifier_ignore_armor"
import { AbilityManager } from "../abilitymanager";
import { AHMC } from "../../utils/amhc";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { SetIgnoreMagicResistanceValue } from "../common";

/**
 * 路径技能：河道寒流减魔抗
 */
@registerAbility()
export class path_13_mokang extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName() + "_L" + this.GetLevel()
    }
}

/**
 * 路径技能：河道寒流减魔抗
 */
@registerModifier()
export class modifier_path_13_mokang_L1 extends BaseModifier {
    oPlayer: Player
    unUpdateBZBuffByCreate: Function
    key: string
    ignore_resistance: number
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
        return "path13"
    }
    OnDestroy(): void {
        if (IsClient()) {
            return
        }
        if (this.key) {
            SetIgnoreMagicResistanceValue(this.GetParent(), null, this.key)
        }
        this.GetParent().RemoveModifierByName("modifier_ignore_armor")
        if (this.oPlayer) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValidEntity(eBZ)) {
                    eBZ.RemoveModifierByName(this.GetName())
                }
            }
        }
        if (this.unUpdateBZBuffByCreate) {
            this.unUpdateBZBuffByCreate()
        }
    }
    OnCreated(params: object): void {
        if (!IsValidEntity(this)) {
            return
        }
        if (!IsValidEntity(this.GetAbility())) {
            return
        }
        this.ignore_resistance = this.GetAbility().GetSpecialValueFor("ignore_resistance")
        this.key = SetIgnoreMagicResistanceValue(this.GetParent(), this.ignore_resistance * 0.01)
        if (IsServer() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }
        // 给玩家全部兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValidEntity(this) && IsValidEntity(this.GetAbility())) {
                for (const eBZ of this.oPlayer.m_tabBz) {
                    eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (AHMC.IsValid(eBZ)) {
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                    }
                })
            }
        })
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.BONUS_DAY_VISION]
    }
    GetBonusDayVision(): number {
        return this.ignore_resistance
    }
}

@registerModifier()
export class modifier_path_13_hujia_L2 extends modifier_path_13_mokang_L1 { }

@registerModifier()
export class modifier_path_13_hujia_L3 extends modifier_path_13_mokang_L1 { }