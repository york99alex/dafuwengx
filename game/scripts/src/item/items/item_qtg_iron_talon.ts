import { AbilityManager } from '../../ability/abilitymanager';
import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

/**
 * 猎野爪，（原寒铁钢爪）,1000块，10攻速，2甲，五回合获得一张打野卡
 */
@registerAbility()
export class item_qtg_iron_talon extends TSBaseItem {
    thinkName: string;
    IsPassive(): boolean {
        return true;
    }

    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }

    OnSpellStart(): void {
        if (!this.IsCooldownReady()) return;
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        // TODO: if (!this.isCanCast()) return
        if (!player) return;
        const result = GameRules.ItemManager.isSameItemCD(this, player);
        if (typeof result === 'number') {
            AbilityManager.setRoundCD(player, this, result);
            return;
        }

        // 刷牌
        GameRules.CardManager.onItem_getCard(this, player, 'MONSTER');

        let nCD = this.GetCooldown(0) - player.m_nCDSub;
        if (nCD < 1) nCD = 1;
        AbilityManager.setRoundCD(player, this, nCD);
    }
}

@registerModifier()
export class item_qtg_iron_talon_modifier extends BaseModifier {
    bonus_attack_speed: number;
    bonus_armor: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) {
            return;
        }
        if (!IsValid(this.GetAbility())) {
            return;
        }
        this.bonus_attack_speed = this.GetAbility().GetSpecialValueFor('bonus_attack_speed');
        this.bonus_armor = this.GetAbility().GetSpecialValueFor('bonus_armor');
        if (IsClient() || !this.GetParent().IsRealHero()) return;

        if (this.GetAbility()['thinkName']) return;
        this.GetAbility()['thinkName'] = Timers.CreateTimer(0, () => {
            if (!IsValid(this)) return;
            if (this.GetAbility().IsCooldownReady()) {
                this.GetAbility().OnSpellStart();
            }
            return 0.9;
        });
    }
    OnDestroy(): void {
        if (this.GetAbility()['thinkName']) {
            Timers.RemoveTimer(this.GetAbility()['thinkName']);
            this.GetAbility()['thinkName'] = null;
        }
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }
    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonus_attack_speed;
    }
    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.bonus_armor;
    }
}
