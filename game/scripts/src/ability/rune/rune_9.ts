import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { ParaAdjuster } from '../../utils/paraadjuster';
import { TSBaseAbility } from '../tsBaseAbilty';

/**
 * 符文技能：护盾神符
 */
@registerAbility()
export class rune_9 extends TSBaseAbility {
    GetIntrinsicModifierName() {
        return 'modifier_' + this.GetAbilityName();
    }
}

/**
 * 符文技能modifier：护盾神符
 */
@registerModifier()
export class modifier_rune_9 extends BaseModifier {
    /**剩余护盾值 */
    shiledVal: number;
    /**最大护盾值 */
    shieldMax: number;

    GetTexture(): string {
        return 'rune_shield';
    }
    IsPassive() {
        return true;
    }
    GetStatusEffectName(): string {
        return 'particles/status_fx/status_effect_shield_rune.vpcf';
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;

        this.shieldMax = this.GetCaster().GetMaxHealth() * this.GetAbility().GetSpecialValueFor('shield') * 0.01;
        this.shiledVal = this.shieldMax;
        this.SetHasCustomTransmitterData(true);

        if (!IsServer()) return;
        const oPlayer = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        if (!oPlayer) return;
        ParaAdjuster.ModifyMana(oPlayer.m_eHero);
    }
    /**接受数据 这段代码仅在客户端执行 */
    HandleCustomTransmitterData(data: { shiledVal: number }) {
        this.shiledVal = data.shiledVal;
    }
    /**发送数据 这段代码仅在服务端执行 */
    AddCustomTransmitterData(): { shiledVal: number } {
        return {
            shiledVal: this.shiledVal,
        };
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.INCOMING_DAMAGE_CONSTANT, // 金色 全伤害
            // ModifierFunction.INCOMING_PHYSICAL_DAMAGE_CONSTANT, // 红色 物理伤害
            // ModifierFunction.INCOMING_SPELL_DAMAGE_CONSTANT // 蓝色 魔法
        ];
    }
    GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
        if (!IsServer()) {
            if (event.report_max) return this.shieldMax;
            return this.shiledVal;
        } else {
            this.shiledVal -= event.damage; // 扣除伤害
            if (this.shiledVal < 0) {
                const overDamge = this.shiledVal;
                this.shiledVal = 0;
                this.SendBuffRefreshToClients();
                AMHC.RemoveAbilityAndModifier(this.GetParent(), this.GetAbility().GetAbilityName());
                return overDamge; // 返回溢出伤害
            }
            this.SendBuffRefreshToClients();
            return -event.damage; // 返回多少, 参数中的event.damage最后就会加上多少, 返回负值以抵挡伤害
        }
    }
}
