import { KeyValues } from '../kv';
import { modifier_agility } from '../modifiers/hero/modifier_agility';
import { modifier_all } from '../modifiers/hero/modifier_all';
import { modifier_intellect } from '../modifiers/hero/modifier_intellect';
import { modifier_primary_attribute } from '../modifiers/hero/modifier_primary_attribute';
import { modifier_strength } from '../modifiers/hero/modifier_strength';
import { PathDomain } from '../path/pathtype/pathsdomain/pathdomain';
import { IsValid } from '../utils/amhc';

/**
 * TODO: 丑陋，重写！
 */
export interface CDOTA_BaseNPC_BZ extends CDOTA_BaseNPC_Creature {
    primaryAttribute: number;
    strength: number;
    strengthGain: number;
    agility: number;
    agilityGain: number;
    intellect: number;
    intellectGain: number;
    strModifier: CDOTA_Buff;
    agiModifier: CDOTA_Buff;
    intModifier: CDOTA_Buff;
    allModifier: CDOTA_Buff;
    primaryAttributeModifier: CDOTA_Buff;
    ModifyStrength(newStrength: number, bIsBase?: boolean): void;
    ModifyAgility(newAgility: number, bIsBase?: boolean): void;
    ModifyIntellect(newIntellect: number, bIsBase?: boolean): void;
    SetStrength(unit: CDOTA_BaseNPC_BZ, strength: number): void;
    SetAgility(unit: CDOTA_BaseNPC_BZ, agility: number): void;
    SetIntellect(unit: CDOTA_BaseNPC_BZ, intellect: number): void;
    GetStrength(unit: CDOTA_BaseNPC_BZ): number;
    GetAgility(unit: CDOTA_BaseNPC_BZ): number;
    GetIntellect(unit: CDOTA_BaseNPC_BZ): number;

    baseManaRegen: number;

    get06ItemByName(sName: string, itemIgnore?): CDOTA_Item;
    get09ItemByName(sName: string, itemIgnore?): CDOTA_Item;
    setBattleState(bBattle?: boolean): void;
}

const PrimaryAttributes = {
    DOTA_ATTRIBUTE_STRENGTH: Attributes.STRENGTH,
    DOTA_ATTRIBUTE_AGILITY: Attributes.AGILITY,
    DOTA_ATTRIBUTE_INTELLECT: Attributes.INTELLECT,
    DOTA_ATTRIBUTE_ALL: Attributes.ALL,
};
/**自定义兵卒类,继承CDOTA_BaseNPC */
export class CDOTA_BaseNPC_BZ {
    m_path: PathDomain;
    m_eAtkTarget: CDOTA_BaseNPC_Hero;
    m_bAbltBZ: CDOTABaseAbility;
    m_bBattle: boolean;
    m_tabAtker: CDOTA_BaseNPC_Hero[];
    _ctrlBzAtk_thinkID: string;

    init() {
        GameRules.EventManager.Register(
            'Event_BZCreate',
            (event: { entity: CDOTA_BaseNPC_BZ }) => {
                if (!event.entity) return;

                const unit = event.entity;
                const sHeroName = unit.GetUnitName();
                const tData = KeyValues.UnitsKV[sHeroName];
                print('===init_Event_BZCreate===');
                unit.m_bBattle = false;
                unit.setBattleState = (bBattle?: boolean) => {
                    if (bBattle == null) {
                        this.m_bBattle = false;
                        return;
                    }
                    this.m_bBattle = bBattle;
                };

                DeepPrintTable(tData);
                if (tData == null || tData.AttributePrimary == null) {
                    return;
                }
                unit.primaryAttribute = PrimaryAttributes[tData.AttributePrimary] ?? Attributes.INVALID;
                if (unit.primaryAttribute == Attributes.INVALID) return;

                unit.strength = tData.AttributeBaseStrength || 0;
                unit.strengthGain = tData.AttributeStrengthGain || 0;

                unit.agility = tData.AttributeBaseAgility || 0;
                unit.agilityGain = tData.AttributeAgilityGain || 0;

                unit.intellect = tData.AttributeBaseIntelligence || 0;
                unit.intellectGain = tData.AttributeIntelligenceGain || 0;

                unit.strModifier = unit.AddNewModifier(unit, null, modifier_strength.name, { duration: unit.strengthGain });
                unit.agiModifier = unit.AddNewModifier(unit, null, modifier_agility.name, { duration: unit.agilityGain });
                unit.intModifier = unit.AddNewModifier(unit, null, modifier_intellect.name, { duration: unit.intellectGain });
                unit.allModifier = unit.AddNewModifier(unit, null, modifier_all.name, {});

                unit.primaryAttributeModifier = unit.AddNewModifier(unit, null, modifier_primary_attribute.name, null);
                unit.primaryAttributeModifier.SetStackCount(unit.primaryAttribute);

                unit.GetPrimaryAttribute = this.GetPrimaryAttribute;
                unit.updateStrength = this.updateStrength;
                unit.updateAgility = this.updateAgility;
                unit.updateIntellect = this.updateIntellect;
                unit.updateAll = this.updateAll;
                unit.LevelUp = this.LevelUp;
                unit.GetStrengthGain = this.GetStrengthGain;
                unit.GetAgilityGain = this.GetAgilityGain;
                unit.GetIntellectGain = this.GetIntellectGain;
                unit.ModifyStrength = this.ModifyStrength;
                unit.ModifyAgility = this.ModifyAgility;
                unit.ModifyIntellect = this.ModifyIntellect;
                unit.SetStrength = this.SetStrength;
                unit.SetAgility = this.SetAgility;
                unit.SetIntellect = this.SetIntellect;
                unit.GetStrength = this.GetStrength;
                unit.GetAgility = this.GetAgility;
                unit.GetIntellect = this.GetIntellect;

                unit.updateStrength(unit);
                unit.updateAgility(unit);
                unit.updateIntellect(unit);
                unit.updateAll(unit);
            },
            CDOTA_BaseNPC_BZ,
            987654321
        );
    }
    GetPrimaryAttribute() {
        return this.primaryAttribute;
    }
    GetStrength(unit: CDOTA_BaseNPC_BZ) {
        return unit.strength;
    }
    GetStrengthGain(unit: CDOTA_BaseNPC_BZ) {
        return unit.strengthGain;
    }
    ModifyStrength(changedVal: number) {
        this.strength += changedVal;
        this.updateStrength(this);
    }
    SetStrength(unit: CDOTA_BaseNPC_BZ, strength: number) {
        unit.ModifyStrength(strength - unit.strength);
    }
    updateStrength(unit: CDOTA_BaseNPC_BZ) {
        unit.strModifier.SetStackCount(math.max(unit.strength, 0));
    }
    GetAgility(unit: CDOTA_BaseNPC_BZ) {
        return unit.agility;
    }
    GetAgilityGain(unit: CDOTA_BaseNPC_BZ) {
        return unit.agilityGain;
    }
    ModifyAgility(changedVal: number) {
        this.agility += changedVal;
        this.updateAgility(this);
    }
    SetAgility(unit: CDOTA_BaseNPC_BZ, agility: number) {
        unit.ModifyAgility(agility - unit.agility);
    }
    updateAgility(unit: CDOTA_BaseNPC_BZ) {
        unit.agiModifier.SetStackCount(math.max(unit.agility, 0));
    }
    GetIntellect(unit: CDOTA_BaseNPC_BZ) {
        return unit.intellect;
    }
    GetIntellectGain(unit: CDOTA_BaseNPC_BZ) {
        return unit.intellectGain;
    }
    ModifyIntellect(changedVal: number) {
        this.intellect += changedVal;
        this.updateIntellect(this);
    }
    SetIntellect(unit: CDOTA_BaseNPC_BZ, intellect: number) {
        unit.ModifyIntellect(intellect - unit.intellect);
    }
    updateIntellect(unit: CDOTA_BaseNPC_BZ) {
        unit.intModifier.SetStackCount(math.max(unit.intellect, 0));
    }
    updateAll(unit: CDOTA_BaseNPC_BZ) {
        unit.allModifier.SetStackCount(math.max(unit.strength + unit.agility + unit.intellect, 0));
    }

    LevelUp(bPlayEffects: boolean, bDown?: boolean) {
        const nChanged = bDown ? -1 : 1;
        this.ModifyStrength(this.GetStrengthGain(this) * nChanged, true);
        this.ModifyAgility(this.GetAgilityGain(this) * nChanged, true);
        this.ModifyIntellect(this.GetIntellectGain(this) * nChanged, true);
        this.updateAll(this);

        const hAbilities: { index: number; iLevel: number; bAutoCastState: boolean; bToggleState: boolean }[] = [];
        for (let i = 0; i < this.GetAbilityCount(); i++) {
            const ability = this.GetAbilityByIndex(i);
            if (ability) {
                hAbilities.push({
                    index: i,
                    iLevel: ability.GetLevel(),
                    bAutoCastState: ability.GetAutoCastState(),
                    bToggleState: ability.GetToggleState(),
                });
                ability['bNoRefresh'] = true;
            }
        }

        if (this.baseManaRegen == null) {
            this.baseManaRegen = this.GetManaRegen() - this.GetBonusManaRegen();
        }

        const manaPercent = this.GetMana() / this.GetMaxMana();
        const healthPercent = this.GetHealth() / this.GetMaxHealth();
        this.CreatureLevelUp(nChanged);
        this.SetBaseManaRegen(this.baseManaRegen);
        this.SetHealth(healthPercent * this.GetMaxHealth());
        this.SetMana(manaPercent * this.GetMaxMana());

        for (const oAbltData of hAbilities) {
            const oAblt = this.GetAbilityByIndex(oAbltData.index);
            if (oAblt) {
                oAblt.SetLevel(oAbltData.iLevel);
                if (oAblt.GetAutoCastState() != oAbltData.bAutoCastState) oAblt.ToggleAutoCast();
                if (oAblt.GetToggleState() != oAbltData.bToggleState) oAblt.ToggleAbility();

                if (oAbltData.iLevel == 0) {
                    this.RemoveModifierByName(oAblt.GetIntrinsicModifierName() || '');
                }

                oAblt['bNoRefresh'] = false;
            }
        }

        if (bPlayEffects) {
            const particleID = ParticleManager.CreateParticle(
                'particles/generic_hero_status/hero_levelup.vpcf',
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this
            );
            ParticleManager.ReleaseParticleIndex(particleID);
        }
    }

    get09ItemByName(sName: string, itemIgnore) {
        if (IsValid(this)) {
            for (let i = 0; i < 9; i++) {
                const item = this.GetItemInSlot(i);
                if (item && item != itemIgnore && !item.IsNull() && item.GetAbilityName() == sName) {
                    return item;
                }
            }
        }
    }
}
