import { CDOTA_BaseNPC_BZ } from "../../player/CDOTA_BaseNPC_BZ";
import { Player } from "../../player/player";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { AbilityManager } from "../abilitymanager";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 路径技能：天辉
 */
@registerAbility()
export class path_12 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName() + "_L" + this.GetLevel()
    }
}

/**
 * 路径技能：天辉
 */
@registerModifier()
export class modifier_path_12_L1 extends BaseModifier {
    oPlayer: Player
    sBuffName: string
    unUpdateBZBuffByCreate: Function
    hujia: number
    mokang: number
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
        return "path12"
    }
    OnDestroy(): void {
        if (this.oPlayer && this.sBuffName) {
            for (const eBZ of this.oPlayer.m_tabBz) {
                if (IsValidEntity(eBZ)) {
                    eBZ.RemoveModifierByName(this.sBuffName)
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
        this.hujia = this.GetAbility().GetSpecialValueFor("hujia")
        this.mokang = this.GetAbility().GetSpecialValueFor("mokang")
        if (IsClient() || !this.GetParent().IsRealHero()) {
            return
        }
        this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
        if (!this.oPlayer) {
            return
        }
        // 给玩家全部兵卒buff
        Timers.CreateTimer(0.1, () => {
            if (IsValidEntity(this) && IsValidEntity(this.GetAbility())) {
                this.sBuffName = this.GetName()
                for (const eBZ of this.oPlayer.m_tabBz) {
                    eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                }
                this.unUpdateBZBuffByCreate = AbilityManager.updateBZBuffByCreate(this.oPlayer, this.GetAbility(), (eBZ: CDOTA_BaseNPC_BZ) => {
                    if (IsValidEntity(eBZ)) {
                        eBZ.AddNewModifier(this.oPlayer.m_eHero, this.GetAbility(), this.GetName(), {})
                    }
                })
            }
        })
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS
        ]
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.hujia
    }
    GetModifierMagicalResistanceBonus(event: ModifierAttackEvent): number {
        return this.mokang
    }
}

@registerModifier()
export class modifier_path_12_L2 extends modifier_path_12_L1 {

}

@registerModifier()
export class modifier_path_12_L3 extends modifier_path_12_L1 {
    tEventID: number[]
    // OnCreated(params: object): void {
    //     super.OnCreated(params)
    //     if (IsClient()) {
    //         return
    //     }

    //     this.oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID())
    //     if (!this.oPlayer) {
    //         return
    //     }
    //     const tPaths = GameRules.PathManager.getPathByType(GameMessage.TP_DOMAIN_1) as PathDomain[]
    //     if (tPaths.length != 3 || this.GetParent() != tPaths[1].m_tabENPC[0]) {
    //         return
    //     }

    //     this.tEventID = []
    //     const oPlayer = this.oPlayer
    //     // 合体兵卒
    //     function setBZ321() {
    //         if (!IsValidEntity(tPaths[1].m_tabENPC[0])) {
    //             return
    //         }
    //         // 移除边上2个兵卒
    //         if (tPaths[0].m_tabENPC[0]) {
    //             oPlayer.removeBz(tPaths[0].m_tabENPC[0])
    //         }
    //         if (tPaths[2].m_tabENPC[0]) {
    //             oPlayer.removeBz(tPaths[2].m_tabENPC[0])
    //         }
    //         // 成长中间的兵卒
    //         this.eBZ = tPaths[1].m_tabENPC[0]
    //         tPaths[0].m_tabENPC.push(this.eBZ)
    //         tPaths[2].m_tabENPC.push(this.eBZ)
    //         // 变大
    //         this.eBZ.SetModelScale(2)
    //         // 等级翻倍
    //         for (let i = this.eBZ.GetLevel(); i >= 1; i--) {
    //             this.eBZ.LevelUp(false)
    //         }
    //     }
    // }
}