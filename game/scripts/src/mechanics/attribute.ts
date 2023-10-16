import { KeyValues } from "../kv"
import { CDOTA_BaseNPC_BZ } from "../player/CDOTA_BaseNPC_BZ"

const tPrimaryAttributes = {
    DOTA_ATTRIBUTE_STRENGTH: Attributes.STRENGTH,
    DOTA_ATTRIBUTE_AGILITY: Attributes.AGILITY,
    DOTA_ATTRIBUTE_INTELLECT: Attributes.INTELLECT,
    DOTA_ATTRIBUTE_ALL: Attributes.ALL
}

export class Attribute {

    static init() {
        GameRules.EventManager.Register("Event_BZCreate", (event) => Attribute.OnNPCFirstSpawned(event), Attribute, 987654321)
    }
    static OnNPCFirstSpawned(event) {
        if (event.entity) {
            this.Register(event.entity)
        }
    }

    static Register(hUnit: CDOTA_BaseNPC_BZ) {
        const sHereName = hUnit.GetUnitName()
        const tData = KeyValues.UnitsKv[sHereName]

        if (tData == null || tData.AttributePrimary == null) {
            return
        }

        hUnit.nPrimaryAttribute = tPrimaryAttributes[tData.AttributePrimary] ?? Attributes.INVALID
        if (hUnit.nPrimaryAttribute == Attributes.INVALID) {
            return
        }

        hUnit.fBaseStrength = tData.AttributeBaseStrength ?? 0
        hUnit.fStrength = hUnit.fBaseStrength
        hUnit.fStrengthGain = tData.AttributeStrengthGain ?? 0

        hUnit.fBaseAgility = tData.AttributeBaseAgility ?? 0
        hUnit.fAgility = hUnit.fBaseAgility
        hUnit.fAgilityGain = tData.AttributeAgilityGain ?? 0

        hUnit.fBaseIntellect = tData.AttributeBaseIntelligence ?? 0
        hUnit.fIntellect = hUnit.fBaseIntellect
        hUnit.fIntellectGain = tData.AttributeIntelligenceGain ?? 0

        hUnit.hStrModifier = hUnit.AddNewModifier(hUnit, null, "modifier_strength", { duration: hUnit.fStrengthGain })
        hUnit.hAgiModifier = hUnit.AddNewModifier(hUnit, null, "modifier_agility", { duration: hUnit.fAgilityGain })
        hUnit.hIntModifier = hUnit.AddNewModifier(hUnit, null, "modifier_intellect", { duration: hUnit.fIntellectGain })

        hUnit.hBaseStrModifier = hUnit.AddNewModifier(hUnit, null, "modifier_base_strength", null)
        hUnit.hBaseAgiModifier = hUnit.AddNewModifier(hUnit, null, "modifier_base_agility", null)
        hUnit.hBaseIntModifier = hUnit.AddNewModifier(hUnit, null, "modifier_base_intellect", null)

        hUnit.hPrimaryAttributeModifier = hUnit.AddNewModifier(hUnit, null, "modifier_primary_attribute", null)
        hUnit.hPrimaryAttributeModifier.SetStackCount(hUnit.nPrimaryAttribute)

        hUnit.GetPrimaryAttribute = function (this) {
            return this.nPrimaryAttribute
        }

        hUnit.GetBaseStrength = function (this) {
            return this.fBaseStrength
        }

        hUnit.GetStrength = function (this) {
            return this.fStrength
        }

        hUnit.GetStrengthGain = function (this) {
            return this.fStrengthGain
        }

        hUnit.ModifyStrength = function (this, fChanged, bIsBase) {
            this.fStrength += fChanged
            if (bIsBase != null || bIsBase == true) {
                this.fBaseStrength += fChanged
            }
            this._updateStrength()
        }

        hUnit._updateStrength = function (this) {
            this.hStrModifier.SetStackCount(math.max(this.fStrength, 0))
            this.hBaseStrModifier.SetStackCount(math.max(this.fBaseStrength, 0))
        }

        hUnit.GetBaseAgility = function (this) {
            return this.fBaseAgility
        }

        hUnit.GetAgility = function (this) {
            return this.fAgility
        }

        hUnit.GetAgilityGain = function (this) {
            return this.fAgilityGain
        }

        hUnit.ModifyAgility = function (this, fChanged, bIsBase) {
            this.fAgility += fChanged
            if (bIsBase != null || bIsBase == true) {
                this.fBaseAgility += fChanged
            }
            this._updateAgility()
        }

        hUnit._updateAgility = function (this) {
            this.hAgiModifier.SetStackCount(math.max(this.fAgility, 0))
            this.hBaseAgiModifier.SetStackCount(math.max(this.fBaseAgility, 0))
        }

        hUnit.GetBaseIntellect = function (this) {
            return this.fBaseIntellect
        }

        hUnit.GetIntellect = function (this) {
            return this.fIntellect
        }

        hUnit.GetIntellectGain = function (this) {
            return this.fIntellectGain
        }

        hUnit.ModifyIntellect = function (this, fChanged, bIsBase) {
            this.fIntellect += fChanged
            if (bIsBase != null || bIsBase == true) {
                this.fIntellect += fChanged
            }
            this._updateIntellect()
        }

        hUnit._updateIntellect = function (this) {
            this.hIntModifier.SetStackCount(math.max(this.fIntellect, 0))
            this.hBaseIntModifier.SetStackCount(math.max(this.fBaseIntellect, 0))
        }

        hUnit.LevelUp = function (this, bPlayEffects, bLevelDown) {
            const nChanged = bLevelDown ? -1 : 1
            this.ModifyStrength(this.GetStrengthGain() * nChanged, true)
            this.ModifyAgility(this.GetAgilityGain() * nChanged, true)
            this.ModifyIntellect(this.GetIntellectGain() * nChanged, true)

            const hAbilities = []
            for (let i = 0; i < this.GetAbilityCount().length - 1; i++) {
                let hAbility = this.GetAbilityByIndex(i)
                if (hAbility) {
                    hAbilities[i] = {
                        nLevel: hAbility.GetLevel(),
                        bAutoCastState: hAbility.GetAutoCastState(),
                        bToggleState: hAbility.GetToggleState()
                    }
                    // hAbility.bNoRefresh = true
                }
            }

            if (this.fBaseManaRegen == null) {
                this.fBaseManaRegen = this.GetManaRegen() - this.GetBonusManaRegen()
            }

            const fManaPercent = this.GetMana() / this.GetMaxMana()
            const fHealthPercent = this.GetHealth() / this.GetMaxHealth()
            this.CreatureLevelUp()
            this.SetBaseManaRegen(this.fBaseManaRegen)
            this.SetHealth(fHealthPercent * this.GetMaxHealth())
            this.SetMana(fManaPercent * this.GetMaxMana())

            for (let i = 0; i < hAbilities.length; i++) {
                const hAbilityData = hAbilities[i]
                const hAbility = this.GetAbilityByIndex(i)
                if (hAbility) {
                    hAbility.SetLevel(hAbilityData.nLevel)
                    if (hAbility.GetAutoCastState() != hAbilityData.bAutoCastState)
                        hAbility.ToggleAutoCast()
                    if (hAbility.GetToggleState() != hAbilityData.bToggleState)
                        hAbility.ToggleAbility()

                    if (hAbilityData.nLevel == 0) {
                        this.RemoveModifierByName(hAbility.GetIntrinsicModifierName() ?? "")
                    }

                    // hAbility.bNoRefresh = false
                }
            }

            if (bPlayEffects) {
                const particleID = ParticleManager.CreateParticle("particles/generic_hero_status/hero_levelup.vpcf", ParticleAttachment.ABSORIGIN_FOLLOW, this)
                ParticleManager.ReleaseParticleIndex(particleID)
            }

            hUnit._updateStrength()
            hUnit._updateAgility()
            hUnit._updateIntellect()
        }
    }


}
