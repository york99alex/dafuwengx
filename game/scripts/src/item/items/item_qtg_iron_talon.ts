import { AbilityManager } from '../../ability/abilitymanager';
import { TSBaseItem } from '../tsBaseItem';
import { IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';

/**
 * 猎野爪，（原寒铁钢爪）,1000块，10攻速，2甲，五回合获得一张打野卡
 */
@registerAbility()
export class item_qtg_iron_talon extends TSBaseItem {
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }

    OnSpellStart(): void {
        const player = GameRules.PlayerManager.getPlayer(this.GetCaster().GetPlayerOwnerID());
        if (!player) return;

        // 刷牌
        GameRules.CardManager.onItem_getCard(this, player, 'MONSTER');
        // 设置冷却
        AbilityManager.setRoundCD(player, this);
    }

    isCanCastAtk(): boolean {
        return true;
    }

    isCanCastHeroAtk(): boolean {
        return true;
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
        this.StartIntervalThink(0.1);
    }
    OnIntervalThink(): void {
        if (!this.GetAbility().IsFullyCastable()) return;
        if (this.GetCaster().IsSilenced()) return;

        // TODO: 测试 isCanCast
        if ((this.GetAbility() as TSBaseItem).isCanCast()) {
            this.GetCaster().CastAbilityNoTarget(this.GetAbility(), this.GetCaster().GetPlayerOwnerID());
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
