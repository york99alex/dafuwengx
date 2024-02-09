import { TSBaseItem } from '../tsBaseItem';
import { AMHC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';

/**
 * 恐鳌之心，4000，1000球+2500+500卷轴，10%回血
 * bonus_strength 30	bonus_health 300
 * health_regen_hero 10	health_regen_bz 10
 * 溢出的生命回复会制造最多为单位20%最大生命值的护盾，转换效率为50%
 * shield_pct 20	shield_eff 50
 */
@registerAbility()
export class item_qtg_heart extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_heart_modifier extends BaseModifier {
    bonus_strength: number;
    bonus_health: number;
    health_regen_hero: number;
    health_regen_bz: number;
    shield_eff: number;
    shield_pct: number;
    eventID: number;
    /**当前护盾值 */
    shiledVal: number;
    /**最大护盾值 */
    shieldMax: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.bonus_strength = this.GetAbility().GetSpecialValueFor('bonus_strength');
        this.bonus_health = this.GetAbility().GetSpecialValueFor('bonus_health');
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');

        this.shieldMax = this.GetCaster().GetMaxHealth() * this.shield_pct * 0.01;
        this.shiledVal = 0;
        this.shield_eff = this.GetAbility().GetSpecialValueFor('shield_eff');
        this.shield_pct = this.GetAbility().GetSpecialValueFor('shield_pct');
        this.SetHasCustomTransmitterData(true);

        if (!IsServer()) return;
        if (this.GetParent().IsRealHero()) {
            // 英雄回血
            this.eventID = GameRules.EventManager.Register(
                'Event_ItemHuiXueByRound',
                (event: { entity: CDOTA_BaseNPC_Hero; nHuiXue: number }) => {
                    print(this.GetParent().GetUnitName(), '0==nHuiXue:', event.nHuiXue);
                    if (event.entity == this.GetCaster()) {
                        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                        event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_hero / 100);
                        // 溢出的生命回复转换为护盾
                        if (event.entity.GetHealth() + event.nHuiXue >= event.entity.GetMaxHealth()) {
                            const overHeal = event.entity.GetHealth() + event.nHuiXue - event.entity.GetMaxHealth();
                            this.shiledVal += (overHeal * this.shield_eff) / 100;
                            this.shieldMax = event.entity.GetMaxHealth() * this.shield_pct * 0.01;
                            if (this.shiledVal > this.shieldMax) this.shiledVal = this.shieldMax;
                            this.SendBuffRefreshToClients();
                        }
                    }
                },
                this,
                -10000
            );
        } else {
            // 兵卒回血
            this.eventID = GameRules.EventManager.Register(
                'Event_ItemHuiXueByRound',
                (event: { entity: CDOTA_BaseNPC_BZ; nHuiXue: number }) => {
                    if (event.entity == this.GetCaster()) {
                        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                        event.nHuiXue += event.entity.GetMaxHealth() * (this.health_regen_bz / 100);
                        // 溢出的生命回复转换为护盾
                        if (event.entity.GetHealth() + event.nHuiXue >= event.entity.GetMaxHealth()) {
                            const overHeal = event.entity.GetHealth() + event.nHuiXue - event.entity.GetMaxHealth();
                            this.shiledVal += (overHeal * this.shield_eff) / 100;
                            this.shieldMax = event.entity.GetMaxHealth() * this.shield_pct * 0.01;
                            if (this.shiledVal > this.shieldMax) this.shiledVal = this.shieldMax;
                            this.SendBuffRefreshToClients();
                        }
                    }
                },
                this,
                -10000
            );
        }
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.INCOMING_DAMAGE_CONSTANT, // 金色 全伤害
            ModifierFunction.ON_HEAL_RECEIVED,
        ];
    }
    GetModifierBonusStats_Strength(): number {
        return this.bonus_strength;
    }
    GetModifierHealthBonus(): number {
        return this.bonus_health;
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
    GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
        if (!IsServer()) {
            return this.shiledVal;
        } else {
            if (event.damage == 0) return this.shiledVal;
            this.shiledVal -= event.damage; // 扣除伤害
            if (this.shiledVal < 0) {
                const overDamge = this.shiledVal;
                this.shiledVal = 0;
                this.SendBuffRefreshToClients();
                return overDamge; // 返回溢出伤害
            }
            this.SendBuffRefreshToClients();
            return -event.damage; // 返回多少, 参数中的event.damage最后就会加上多少, 返回负值以抵挡伤害
        }
    }
    OnHealReceived(event: ModifierHealEvent): void {
        if (!IsServer()) return;
        if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return;
        if (event.unit != this.GetParent()) return;

        // 溢出的生命回复转换为护盾
        if (event.unit.GetHealth() + event.gain >= event.unit.GetMaxHealth()) {
            const overHeal = event.unit.GetHealth() + event.gain - event.unit.GetMaxHealth();
            this.shiledVal += (overHeal * this.shield_eff) / 100;
            this.shieldMax = event.unit.GetMaxHealth() * this.shield_pct * 0.01;
            if (this.shiledVal > this.shieldMax) this.shiledVal = this.shieldMax;
            this.SendBuffRefreshToClients();
        }
    }
}
