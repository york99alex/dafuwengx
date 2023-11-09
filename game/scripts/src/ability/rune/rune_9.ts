import { AHMC, IsValid } from "../../utils/amhc";
import { BaseModifier, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { ParaAdjuster } from "../../utils/paraadjuster";
import { TSBaseAbility } from "../tsBaseAbilty";

/**
 * 符文技能：护盾神符
 */
@registerAbility()
export class rune_9 extends TSBaseAbility {

    GetIntrinsicModifierName() {
        return "modifier_" + this.GetAbilityName()
    }
}

/**
 * 符文技能modifier：护盾神符
 */
@registerModifier()
export class modifier_rune_9 extends BaseModifier {
    blockCount: number

    GetTexture(): string {
        return "rune_shield"
    }
    IsPassive() {
        return true
    }
    GetStatusEffectName(): string {
        return "particles/status_fx/status_effect_shield_rune.vpcf"
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
        this.blockCount = oPlayer.m_eHero.GetMaxHealth() * ability.GetSpecialValueFor("shield") * 0.01
        print("===rune_shield===blockCount:", this.blockCount)
        this.SetHasCustomTransmitterData(true)
        ParaAdjuster.ModifyMana(oPlayer.m_eHero)
    }
    /**接受数据 这段代码仅在客户端执行 */
    HandleCustomTransmitterData(data: { blockCount: number }) {
        this.blockCount = data.blockCount
    }
    /**发送数据 这段代码仅在服务端执行 */
    AddCustomTransmitterData(): { blockCount: number } {
        return {
            blockCount: this.blockCount
        }
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.INCOMING_DAMAGE_CONSTANT,  // 金色 全伤害
            ModifierFunction.INCOMING_PHYSICAL_DAMAGE_CONSTANT, // 红色 物理伤害
            ModifierFunction.INCOMING_SPELL_DAMAGE_CONSTANT // 蓝色 魔法
        ]
    }
    GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
        if (event.damage == 0) return this.blockCount    // 没有伤害, 返回护盾值
        if (event.damage > this.blockCount + this.GetParent().GetHealth()) {
            this.blockCount = 0
            if (IsServer()) this.SendBuffRefreshToClients() // 刷新黄条
            return 0    // 伤害足够击杀, 护盾不敌当
        }
        if (event.damage > this.blockCount) {
            const block = this.blockCount
            this.blockCount = 0
            if (IsServer()) {
                this.SendBuffRefreshToClients() // 刷新黄条
                AHMC.RemoveAbilityAndModifier(this.GetParent(), this.GetAbility().GetAbilityName())
            }
            return -block   // 返回多少, 伤害就会加上多少, 返回负值以抵挡伤害
        } else {
            const block = event.damage
            this.blockCount -= block
            if (IsServer()) this.SendBuffRefreshToClients()
            return -block
        }
    }
}