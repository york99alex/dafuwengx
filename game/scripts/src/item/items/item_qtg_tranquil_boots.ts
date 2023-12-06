import { TSBaseItem } from '../tsBaseItem';
import { AHMC, IsValid } from '../../utils/amhc';
import { BaseModifier, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { CDOTA_BaseNPC_BZ } from '../../player/CDOTA_BaseNPC_BZ';

/**
 * 静谧之鞋，1000，500鞋子+500回复戒指，每回合5%回血，如果单位上回合没有受到伤害或造成伤害，额外回血10%
 * health_regen_hero 5	health_regen_bz 5	bonus_regen 10
 */
@registerAbility()
export class item_qtg_tranquil_boots extends TSBaseItem {
    IsPassive(): boolean {
        return true;
    }
    GetIntrinsicModifierName() {
        return this.GetAbilityName() + '_modifier';
    }
}

@registerModifier()
export class item_qtg_tranquil_boots_modifier extends BaseModifier {
    health_regen_hero: number;
    health_regen_bz: number;
    bonus_regen: number;
    bonus_movement_speed: number;
    eventID: number;
    IsHidden(): boolean {
        return true;
    }
    OnCreated(params: object): void {
        if (!IsValid(this)) return;
        if (!IsValid(this.GetAbility())) return;
        this.health_regen_hero = this.GetAbility().GetSpecialValueFor('health_regen_hero');
        this.health_regen_bz = this.GetAbility().GetSpecialValueFor('health_regen_bz');
        this.bonus_regen = this.GetAbility().GetSpecialValueFor('bonus_regen');
        this.bonus_movement_speed = this.GetAbility().GetSpecialValueFor('bonus_movement_speed');

        this.StartIntervalThink(0.1);
        if (!IsServer()) return;
        // TODO: 处理装备共享
        const player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        let extra_regen = 0;
        if (this.GetParent().IsRealHero()) {
            // 英雄回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_Hero; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    if (player.m_nRoundDamage == 0) extra_regen = this.bonus_regen;
                    else extra_regen = 0;
                    print('===item_qtg_tranquil_boots_modifier===m_nRoundDamage:', player.m_nRoundDamage);
                    print('===item_qtg_tranquil_boots_modifier===extra_regen:', extra_regen);
                    event.nHuiXue += event.entity.GetMaxHealth() * ((this.health_regen_hero + extra_regen) / 100);
                }
            });
        } else {
            // 兵卒回血
            this.eventID = GameRules.EventManager.Register('Event_ItemHuiXueByRound', (event: { entity: CDOTA_BaseNPC_BZ; nHuiXue: number }) => {
                if (event.entity == this.GetCaster()) {
                    if (!this.GetAbility() || !IsValid(this) || !IsValid(this.GetAbility())) return true;
                    if (player.m_nRoundDamage == 0) extra_regen = this.bonus_regen;
                    else extra_regen = 0;
                    print('===item_qtg_tranquil_boots_modifier===m_nRoundDamage:', player.m_nRoundDamage);
                    print('===item_qtg_tranquil_boots_modifier===extra_regen:', extra_regen);
                    event.nHuiXue += event.entity.GetMaxHealth() * ((this.health_regen_bz + extra_regen) / 100);
                }
            });
        }
    }
    OnIntervalThink(): void {
        if (!IsServer()) return;
        const player = GameRules.PlayerManager.getPlayer(this.GetParent().GetPlayerOwnerID());
        const oldBuff = player.m_eHero.FindModifierByName(modifier_item_qtg_tranquil_boots_bonus_regen.name);

        if (!oldBuff && !IsValid(oldBuff) && player.m_nRoundDamage == 0)
            AHMC.AddNewModifier(this.GetParent(), this.GetParent(), this.GetAbility(), modifier_item_qtg_tranquil_boots_bonus_regen.name, {});
        else if (oldBuff && IsValid(oldBuff) && player.m_nRoundDamage != 0)
            AHMC.RemoveModifierByName(modifier_item_qtg_tranquil_boots_bonus_regen.name, this.GetParent());
    }
    OnDestroy(): void {
        if (!IsServer()) return;
        GameRules.EventManager.UnRegisterByID(this.eventID);
        this.eventID = null;
        // AHMC.RemoveModifierByName(modifier_item_qtg_tranquil_boots_bonus_regen.name, this.GetParent());
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_UNIQUE];
    }
    GetModifierMoveSpeedBonus_Special_Boots(): number {
        return this.bonus_movement_speed;
    }
}

@registerModifier()
export class modifier_item_qtg_tranquil_boots_bonus_regen extends BaseModifier {
    GetTexture(): string {
        return 'item_tranquil_boots';
    }
}
