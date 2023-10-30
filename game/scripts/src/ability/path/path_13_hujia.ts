import { Player } from "../../player/player";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { TSBaseAbility } from "../tsBaseAbilty";
import { modifier_ignore_armor } from "../../modifiers/util/modifier_ignore_armor"
import { AbilityManager } from "../abilitymanager";
import { AHMC, IsValid } from "../../utils/amhc";
import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";

/**
 * 路径技能：河道寒流减甲
 */
@registerAbility()
export class path_13_hujia extends TSBaseAbility {
    GetIntrinsicModifierName() {
        print("path==modname:", "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel())
        return "modifier_" + this.GetAbilityName() + "_l" + this.GetLevel()
    }
}

/**
 * 路径技能：河道寒流减甲
 */
@registerModifier()
export class modifier_path_13_hujia_l1 extends BaseModifier {
    oPlayer: Player
    unUpdateBZBuffByCreate: number
    ignore_armor: number
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
    RemoveOnDeath(): boolean {
        return false
    }
    DestroyOnExpire(): boolean {
        return false
    }
    OnDestroy(): void {
        print("ability=modifier=OnDestroy===name:", this.GetName())
        if (IsClient()) {
            return
        }
        AHMC.RemoveModifierByName(modifier_ignore_armor.name, this.GetParent())
        if (this.oPlayer) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValid(eBZ)) {
                    AHMC.RemoveModifierByName(this.GetName(), eBZ)
                }
            }
        }
        if (this.unUpdateBZBuffByCreate) {
            GameRules.EventManager.UnRegisterByID(this.unUpdateBZBuffByCreate, "Event_BZCreate")
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
        this.ignore_armor = this.GetAbility().GetSpecialValueFor("ignore_armor")
        print(this.GetName(), "===this.ignore_armor", this.ignore_armor)
        if (IsServer()) {
            this.GetParent().AddNewModifier(this.GetParent(), this.GetAbility(), modifier_ignore_armor.name, {})
        }
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }
        const ability = this.GetAbility()
        const buffName = this.GetName()
        const oPlayer = this.oPlayer
        // 给玩家全部兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValid(this) && IsValid(this.GetAbility())) {
                for (const eBZ of this.oPlayer.m_tabBz) {
                    eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (IsValid(eBZ)) {
                        eBZ.AddNewModifier(oPlayer.m_eHero, ability, buffName, {})
                    }
                })
            }
        })
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.BONUS_DAY_VISION]
    }
    GetBonusDayVision(): number {
        return this.ignore_armor
    }
}

@registerModifier()
export class modifier_path_13_hujia_l2 extends modifier_path_13_hujia_l1 { }

@registerModifier()
export class modifier_path_13_hujia_l3 extends modifier_path_13_hujia_l1 { }